/**
 * CDN-delivered Layerswap swap widget via `@layerswap/widget-js`.
 *
 * Uses the vanilla mount (not `@layerswap/widget-react`) so the remote owns
 * its own React root. Sharing this app's React with the federated bundle
 * crashes: the CDN widget is built on React 19.2.3 and this app is on 19.2.4
 * (React error #527, then "Cannot access 'sn' before initialization").
 *
 * Docs: https://docs.layerswap.io/widget/vanilla-js
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ManifestError,
  mountWidget,
  type ThemeData,
  type WalletProviderId,
  type WidgetHandle,
  type WidgetProps,
} from "@layerswap/widget-js";
import { BRIDGE_CONFIG } from "~/lib/config";
import {
  getBridgeInitialValues,
  getBridgeWalletConnectConfigs,
  type BridgeDirection,
  type LayerswapCompletedSwap,
} from "~/lib/services/btcBridge";

const YIELDSTARK_THEME: ThemeData = {
  buttonTextColor: "10, 18, 21",
  tertiary: "107, 114, 128",
  borderRadius: "extraLarge",
  enablePortal: true,
  enableWideVersion: true,
  header: { hideMenu: true, hideTabs: true },
  cardBackgroundStyle: { backgroundColor: "transparent" },
  primary: {
    DEFAULT: "151, 252, 228",
    100: "232, 254, 249",
    200: "208, 253, 243",
    300: "184, 253, 238",
    400: "165, 252, 232",
    500: "151, 252, 228",
    600: "111, 217, 192",
    700: "79, 179, 156",
    800: "46, 122, 105",
    900: "22, 64, 55",
    text: "255, 255, 255",
  },
  secondary: {
    DEFAULT: "16, 29, 34",
    100: "44, 74, 84",
    200: "38, 65, 74",
    300: "33, 54, 62",
    400: "27, 46, 53",
    500: "22, 39, 45",
    600: "19, 34, 39",
    700: "16, 29, 34",
    800: "12, 22, 26",
    900: "7, 15, 18",
    text: "148, 163, 184",
  },
  warning: { Foreground: "251, 191, 36", Background: "47, 43, 29" },
  error: { Foreground: "255, 97, 97", Background: "46, 27, 27" },
  success: { Foreground: "89, 224, 125", Background: "14, 43, 22" },
};

const WALLET_PROVIDERS_CONFIG: { include: WalletProviderId[] } = {
  include: ["evm", "starknet"],
};

const WALLET_DEFAULTS = {
  walletConnect: getBridgeWalletConnectConfigs(),
};

interface LayerswapBridgeWidgetProps {
  direction: BridgeDirection;
  starknetAddress?: string;
  onSwapComplete: (swap: LayerswapCompletedSwap) => void;
}

function formatLoaderError(error: unknown): string {
  if (error instanceof ManifestError) {
    return `Layerswap CDN load failed (${error.reason}): ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Layerswap allows only one widget root per page. React Strict Mode (and
 * `key` remounts) start a second `mountWidget` before the first handle
 * exists, so cleanup cannot `destroy()` yet. Serialize through this queue
 * and always tear down the live handle first.
 */
let liveHandle: WidgetHandle | null = null;
let mountQueue: Promise<void> = Promise.resolve();

function enqueueExclusiveMount(
  target: HTMLElement,
  props: WidgetProps
): Promise<WidgetHandle> {
  const run = mountQueue.then(async () => {
    liveHandle?.destroy();
    liveHandle = null;
    const handle = await mountWidget(target, props);
    liveHandle = handle;
    return handle;
  });
  mountQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function releaseHandle(handle: WidgetHandle) {
  handle.destroy();
  if (liveHandle === handle) {
    liveHandle = null;
  }
}

export default function LayerswapBridgeWidget({
  direction,
  starknetAddress,
  onSwapComplete,
}: LayerswapBridgeWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<WidgetHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const initialValues = useMemo(
    () => getBridgeInitialValues(direction, starknetAddress),
    [direction, starknetAddress]
  );

  const widgetProps: WidgetProps = useMemo(
    () => ({
      config: {
        apiKey: BRIDGE_CONFIG.LAYERSWAP_API_KEY_MAINNET || undefined,
        version: "mainnet" as const,
        initialValues,
        theme: YIELDSTARK_THEME,
      },
      callbacks: {
        onSwapComplete: (swapData: unknown) => {
          onSwapComplete(swapData as LayerswapCompletedSwap);
        },
        onError: (event: unknown) => {
          console.error("[bridge] Layerswap widget error", event);
        },
      },
      walletProvidersConfig: WALLET_PROVIDERS_CONFIG,
      walletDefaults: WALLET_DEFAULTS,
    }),
    [initialValues, onSwapComplete]
  );

  const widgetPropsRef = useRef(widgetProps);
  widgetPropsRef.current = widgetProps;

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    let cancelled = false;
    let handle: WidgetHandle | null = null;

    setReady(false);
    setLoadError(null);

    enqueueExclusiveMount(target, widgetPropsRef.current)
      .then((mounted) => {
        if (cancelled) {
          releaseHandle(mounted);
          return;
        }
        handle = mounted;
        handleRef.current = mounted;
        mounted.update(widgetPropsRef.current);
        setReady(true);
      })
      .catch((error) => {
        console.error("[bridge] Layerswap mount failed", error);
        if (!cancelled) setLoadError(formatLoaderError(error));
      });

    return () => {
      cancelled = true;
      if (handle) releaseHandle(handle);
      handleRef.current = null;
    };
  }, [retryCount]);

  useEffect(() => {
    handleRef.current?.update(widgetProps);
  }, [widgetProps]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      {loadError ? (
        <div className="rounded-2xl border border-red-500/30 bg-[#0F1A1F] p-6 text-sm text-gray-300">
          <p className="mb-2 font-medium text-white">Bridge failed to load</p>
          <p className="break-words text-red-300">{loadError}</p>
          <p className="mt-3 text-gray-500">
            The widget is fetched from Layerswap&apos;s CDN. Confirm
            VITE_LAYERSWAP_API_KEY_MAINNET is set and check the browser
            console.
          </p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-4 rounded-xl bg-[#97FCE4] px-4 py-2 text-sm font-medium text-[#0A1215]"
          >
            Try again
          </button>
        </div>
      ) : (
        !ready && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            Loading bridge…
          </div>
        )
      )}
      <div
        ref={containerRef}
        className={ready && !loadError ? "overflow-visible" : "hidden"}
      />
    </div>
  );
}
