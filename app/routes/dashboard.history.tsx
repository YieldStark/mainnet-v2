import { useEffect, useState } from "react";
import { ExternalLink, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from "lucide-react";
import { useWalletStore } from "~/providers/wallet-store-provider";
import { useNetworkStore } from "~/stores/network-store";
import {
  fetchUserTransactionHistory,
  saveLocalTransaction,
  type Transaction,
} from "~/lib/utils/transactionHistory";
import { formatDistanceToNow } from "date-fns";

export default function HistoryPage() {
  const vaultAddress = useWalletStore((state) => state.vaultAddress);
  const { explorerUrl } = useNetworkStore((state) => state.currentNetwork);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!vaultAddress) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetchUserTransactionHistory(vaultAddress)
      .then((txs) => {
        if (!cancelled) setTransactions(txs);
      })
      .catch(() => {
        if (!cancelled) setTransactions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vaultAddress]);

  const getTypeIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft size={16} className="text-green-400" />;
      case "withdraw":
        return <ArrowUpRight size={16} className="text-amber-400" />;
      case "borrow":
        return <ArrowDownLeft size={16} className="text-cyan-400" />;
      case "repay":
        return <ArrowUpRight size={16} className="text-blue-400" />;
      case "withdraw_collateral":
        return <ArrowUpRight size={16} className="text-orange-400" />;
      default:
        return <ArrowRightLeft size={16} className="text-gray-400" />;
    }
  };

  const getTypeLabel = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return "Deposit";
      case "withdraw":
        return "Withdraw";
      case "borrow":
        return "Borrow";
      case "repay":
        return "Repay";
      case "withdraw_collateral":
        return "Withdraw Collateral";
      default:
        return "Transfer";
    }
  };

  const getTypeBadgeClass = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "withdraw":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "borrow":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "repay":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "withdraw_collateral":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#101D22] rounded-4xl p-6">
        <h1 className="text-3xl font-medium text-white mb-2">
          Transaction History
        </h1>
        <p className="text-gray-400">
          Your deposits, withdrawals, transfers, borrows, and repays
        </p>
      </div>

      {!vaultAddress && (
        <div className="bg-[#101D22] rounded-4xl p-8 text-center">
          <p className="text-gray-400">Connect your wallet to see transaction history.</p>
        </div>
      )}

      {vaultAddress && isLoading && (
        <div className="bg-[#101D22] rounded-4xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#97FCE4] mx-auto" />
          <p className="text-gray-400 mt-4">Loading history...</p>
        </div>
      )}

      {vaultAddress && !isLoading && transactions.length === 0 && (
        <div className="bg-[#101D22] rounded-4xl p-8 text-center">
          <p className="text-gray-400 mb-2">No transactions yet</p>
          <p className="text-sm text-gray-500">
            Deposits, withdrawals, transfers, and loan actions will appear here
          </p>
        </div>
      )}

      {vaultAddress && !isLoading && transactions.length > 0 && (
        <div className="bg-[#101D22] rounded-4xl p-6">
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#0A1215] border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800 shrink-0">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeClass(
                          tx.type
                        )}`}
                      >
                        {getTypeLabel(tx.type)}
                      </span>
                      {tx.contractLabel && (
                        <span className="text-gray-400 text-xs">
                          {tx.contractLabel}
                        </span>
                      )}
                      {tx.amount && (tx.amount.includes("/") || parseFloat(tx.amount) > 0) && (
                        <span className="text-white font-medium">
                          {tx.amount.includes("/") ? tx.amount : `${tx.amount} WBTC`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {typeof tx.timestamp === "number"
                        ? formatDistanceToNow(new Date(tx.timestamp * 1000), {
                            addSuffix: true,
                          })
                        : "—"}
                    </p>
                  </div>
                </div>
                <a
                  href={`${explorerUrl}/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-[#97FCE4] hover:underline shrink-0"
                >
                  View
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

