/**
 * Wraps the actual Layerswap widget. Kept in its own module and always
 * loaded via `React.lazy()` from `dashboard.bridge.tsx` so its heavy
 * EVM/Starknet wallet stack (and non-standard ESM package layout) is never
 * pulled into the server module graph — only the client bundle imports it.
 */
import "~/lib/buffer-polyfill";
import { useMemo } from "react";
import { LayerswapProvider, Swap, type ThemeData } from "@layerswap/widget";
import { createEVMProvider } from "@layerswap/wallet-evm";
import { createStarknetProvider } from "@layerswap/wallet-starknet";
import "@layerswap/widget/index.css";
import { BRIDGE_CONFIG } from "~/lib/config";
import {
  getBridgeInitialValues,
  getBridgeWalletConnectConfigs,
  type BridgeDirection,
  type LayerswapCompletedSwap,
} from "~/lib/services/btcBridge";

/**
 * YieldStark-branded Layerswap theme.
 *
 * Colors are comma-separated RGB channels (the widget injects them into CSS
 * vars like `--ls-colors-primary`). Maps the widget onto the app palette:
 *   - primary  → mint accent (#97FCE4) used across CTAs/links/highlights
 *   - secondary → dark-teal surface family (#101D22 / #0F1A1F / #0A1215)
 * `enablePortal`/`enableWideVersion` make the chain & token pickers open as a
 * roomy, centered modal instead of the default narrow in-widget overlay.
 */
const YIELDSTARK_THEME: ThemeData = {
  buttonTextColor: "10, 18, 21", // near-black text on mint CTAs (matches app)
  tertiary: "107, 114, 128", // muted placeholder text (gray-500)
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
    // Main body text (token names, headers) — must be light on dark surfaces.
    // Text that sits ON the mint buttons is controlled by `buttonTextColor`.
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

interface LayerswapBridgeWidgetProps {
  direction: BridgeDirection;
  starknetAddress?: string;
  onSwapComplete: (swap: LayerswapCompletedSwap) => void;
}

export default function LayerswapBridgeWidget({
  direction,
  starknetAddress,
  onSwapComplete,
}: LayerswapBridgeWidgetProps) {
  const walletConnectConfigs = useMemo(() => getBridgeWalletConnectConfigs(), []);
  const walletProviders = useMemo(
    () => [
      // EVM chains connect via WalletConnect + injected wallets (MetaMask etc.)
      createEVMProvider({ walletConnectConfigs }),
      // Starknet wallets (ArgentX/Braavos) connect via browser injection only
      createStarknetProvider(),
    ],
    [walletConnectConfigs]
  );

  const initialValues = useMemo(
    () => getBridgeInitialValues(direction, starknetAddress),
    [direction, starknetAddress]
  );

  const config = useMemo(
    () => ({
      // Partner key is optional (used for dashboard tracking). If it's missing
      // or empty in the Vercel build, omit it so the widget uses its built-in
      // mainnet key — passing "" makes every Layerswap request throw
      // "Api key is not provided" and the widget shows the red error modal.
      apiKey: BRIDGE_CONFIG.LAYERSWAP_API_KEY_MAINNET || undefined,
      version: "mainnet" as const,
      initialValues,
      theme: YIELDSTARK_THEME,
    }),
    [initialValues]
  );

  const callbacks = useMemo(
    () => ({
      onSwapComplete,
    }),
    [onSwapComplete]
  );

  return (
    <LayerswapProvider
      config={config}
      walletProviders={walletProviders}
      callbacks={callbacks}
    >
      <Swap />
    </LayerswapProvider>
  );
}
