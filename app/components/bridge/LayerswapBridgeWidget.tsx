/**
 * Wraps the actual Layerswap widget. Kept in its own module and always
 * loaded via `React.lazy()` from `dashboard.bridge.tsx` so its heavy
 * EVM/Starknet wallet stack (and non-standard ESM package layout) is never
 * pulled into the server module graph — only the client bundle imports it.
 */
import { useMemo } from "react";
import { LayerswapProvider, Swap } from "@layerswap/widget";
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
      apiKey: BRIDGE_CONFIG.LAYERSWAP_API_KEY_MAINNET || undefined,
      version: "mainnet" as const,
      initialValues,
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
