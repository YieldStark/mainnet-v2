import { lazy, Suspense, useState } from "react";
import { useWalletStore } from "~/providers/wallet-store-provider";
import { recordDeposit, recordWithdrawal } from "~/lib/utils/recordTransaction";
import { saveLocalTransaction } from "~/lib/utils/transactionHistory";
import {
  isDepositSwap,
  type BridgeDirection,
  type LayerswapCompletedSwap,
} from "~/lib/services/btcBridge";

// Lazy-loaded so the Layerswap widget (EVM/Starknet wallet stack) is only
// ever imported on the client, never pulled into the server module graph.
const LayerswapBridgeWidget = lazy(() => import("~/components/bridge/LayerswapBridgeWidget"));

const DIRECTIONS: { id: BridgeDirection; label: string; description: string }[] = [
  {
    id: "deposit",
    label: "Deposit",
    description: "Bring WBTC from Arbitrum into your Starknet wallet",
  },
  {
    id: "withdraw",
    label: "Withdraw",
    description: "Send WBTC from your Starknet wallet to Arbitrum",
  },
];

export default function BridgePage() {
  const [direction, setDirection] = useState<BridgeDirection>("deposit");
  const vaultAddress = useWalletStore((state) => state.vaultAddress);
  const isConnected = useWalletStore((state) => state.isConnected);

  const handleSwapComplete = ({ swap }: LayerswapCompletedSwap) => {
    const outputTx = swap.transactions.find((tx) => tx.type === "output");
    const inputTx = swap.transactions.find((tx) => tx.type === "input");
    const isDeposit = isDepositSwap(swap);
    const record = isDeposit ? recordDeposit : recordWithdrawal;

    record({
      transactionHash: outputTx?.transaction_hash ?? inputTx?.transaction_hash ?? swap.id,
      userAddress: swap.destination_address,
      tokenAddress: "WBTC",
      tokenSymbol: "WBTC",
      amountRaw: String(swap.requested_amount),
      decimals: 8,
      amountWbtc: swap.requested_amount,
      status: "completed",
      poolAddress: "layerswap",
    });

    if (inputTx?.transaction_hash) {
      saveLocalTransaction({
        hash: inputTx.transaction_hash,
        timestamp: Math.floor(Date.now() / 1000),
        type: isDeposit ? "deposit" : "withdraw",
        amount: String(swap.requested_amount),
        from: inputTx.from,
        to: swap.destination_address,
        status: "success",
        blockNumber: 0,
        contractLabel: "Layerswap Bridge (WBTC)",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#101D22] rounded-4xl p-6">
        <h1 className="text-3xl font-medium text-white mb-2">Bridge</h1>
        <p className="text-gray-400">
          Move WBTC between Arbitrum and Starknet. Non-custodial via{" "}
          <a
            href="https://layerswap.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#97FCE4] hover:underline"
          >
            Layerswap
          </a>
          — you sign every transfer, and funds always land directly in your own wallet.
        </p>
      </div>

      <div className="bg-[#101D22] rounded-4xl p-6 space-y-6">
        <div className="flex gap-2">
          {DIRECTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDirection(d.id)}
              className={`flex-1 rounded-2xl px-4 py-3 text-left transition-all border ${
                direction === d.id
                  ? "bg-[#97FCE4] text-black border-[#97FCE4]"
                  : "bg-transparent text-white border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="font-medium">{d.label}</div>
              <div
                className={`text-sm ${
                  direction === d.id ? "text-black/70" : "text-gray-400"
                }`}
              >
                {d.description}
              </div>
            </button>
          ))}
        </div>

        {!isConnected && direction === "deposit" && (
          <p className="text-sm text-amber-400">
            Connect your Starknet wallet first so the destination address is prefilled
            automatically.
          </p>
        )}

        <div className="rounded-2xl overflow-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-16 text-gray-400">
                Loading bridge…
              </div>
            }
          >
            <LayerswapBridgeWidget
              direction={direction}
              starknetAddress={isConnected ? vaultAddress ?? undefined : undefined}
              onSwapComplete={handleSwapComplete}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
