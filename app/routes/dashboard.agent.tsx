import { useState, useEffect } from "react";
import { Bot, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useWalletStore } from "~/providers/wallet-store-provider";
import { useNetworkStore } from "~/stores/network-store";
import toast from "react-hot-toast";

export interface AgentStrategy {
  id: string;
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  estimatedAPY: number;
  allocation: { vesuLending: number; vesuRe7: number; ekuboLP: number };
}

export default function AgentPage() {
  const wallet = useWalletStore((state) => state.wallet);
  const isConnected = useWalletStore((state) => state.isConnected);
  const totalBalance = useWalletStore((state) => state.totalBalance);
  const vesuBalance = useWalletStore((state) => state.vesuBalance);
  const ekuboBalance = useWalletStore((state) => state.ekuboBalance);
  const agentROI = useWalletStore((state) => state.agentROI);
  const currentNetwork = useNetworkStore((state) => state.currentNetwork);

  const [isAgentActive, setIsAgentActive] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<AgentStrategy | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [strategies, setStrategies] = useState<AgentStrategy[]>([]);

  useEffect(() => {
    setStrategies([
      {
        id: "balanced",
        name: "Balanced",
        description: "Diversified allocation across all protocols for steady returns",
        riskLevel: "low",
        estimatedAPY: 0,
        allocation: { vesuLending: 40, vesuRe7: 30, ekuboLP: 30 },
      },
      {
        id: "aggressive",
        name: "Aggressive",
        description: "Higher allocation to high-yield protocols for maximum returns",
        riskLevel: "high",
        estimatedAPY: 0,
        allocation: { vesuLending: 20, vesuRe7: 50, ekuboLP: 30 },
      },
      {
        id: "conservative",
        name: "Conservative",
        description: "Focus on stable lending protocols with lower risk",
        riskLevel: "low",
        estimatedAPY: 0,
        allocation: { vesuLending: 60, vesuRe7: 20, ekuboLP: 20 },
      },
    ]);
  }, [currentNetwork]);

  const handleActivateAgent = async () => {
    if (!isConnected || !wallet) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!selectedStrategy) {
      toast.error("Please select a strategy");
      return;
    }
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      setIsAgentActive(true);
      toast.success("Agent activated! Your wBTC is now spread across protocols.");
      setDepositAmount("");
    } catch {
      toast.error("Failed to activate agent");
    } finally {
      setLoading(false);
    }
  };

  const handleRebalance = async () => {
    if (!isAgentActive) {
      toast.error("Agent is not active");
      return;
    }
    setLoading(true);
    try {
      toast.success("Rebalancing in progress...");
    } catch {
      toast.error("Rebalancing failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-medium text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to use the AI agent</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#101D22] rounded-4xl p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-[#97FCE4] to-[#8B5CF6] rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-white">AI Yield Agent</h1>
            <p className="text-gray-400">
              Automatically spread your wBTC across protocols for optimal yield
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#101D22] rounded-4xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium text-white mb-2">Agent Status</h2>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isAgentActive ? "bg-green-500 animate-pulse" : "bg-gray-500"
                }`}
              />
              <span className="text-gray-400">
                {isAgentActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          {isAgentActive && (
            <button
              onClick={handleRebalance}
              disabled={loading}
              className="px-4 py-2 bg-[#97FCE4] text-black font-medium rounded-lg hover:bg-[#85E6D1] transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Rebalance</span>
            </button>
          )}
        </div>

        {isAgentActive && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#0F1A1F] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Vesu Lending</p>
              <p className="text-2xl font-bold text-white">{vesuBalance.toFixed(8)} wBTC</p>
            </div>
            <div className="bg-[#0F1A1F] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Vesu Re7</p>
              <p className="text-2xl font-bold text-white">0.00000000 wBTC</p>
            </div>
            <div className="bg-[#0F1A1F] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Ekubo LP</p>
              <p className="text-2xl font-bold text-white">{ekuboBalance.toFixed(8)} wBTC</p>
            </div>
          </div>
        )}

        {isAgentActive && (
          <div className="bg-[#0F1A1F] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total ROI</p>
                <p className="text-2xl font-bold text-[#97FCE4]">{agentROI.toFixed(2)}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Total Managed</p>
                <p className="text-2xl font-bold text-white">{totalBalance.toFixed(8)} wBTC</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isAgentActive && (
        <>
          <div className="bg-[#101D22] rounded-4xl p-6">
            <h2 className="text-xl font-medium text-white mb-6">Select Strategy</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {strategies.map((strategy) => (
                <motion.div
                  key={strategy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedStrategy(strategy)}
                  className={`bg-[#0F1A1F] rounded-xl p-6 cursor-pointer transition-all border-2 ${
                    selectedStrategy?.id === strategy.id
                      ? "border-[#97FCE4] shadow-lg shadow-[#97FCE4]/20"
                      : "border-transparent hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">{strategy.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        strategy.riskLevel === "low"
                          ? "bg-green-500/20 text-green-400"
                          : strategy.riskLevel === "medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {strategy.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">{strategy.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Est. APY</span>
                      <span className="text-lg font-bold text-[#97FCE4]">
                        {strategy.estimatedAPY.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {selectedStrategy && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#101D22] rounded-4xl p-6"
            >
              <h2 className="text-xl font-medium text-white mb-6">Activate Agent</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-gray-400">Deposit Amount (wBTC)</label>
                    <button
                      onClick={() => setDepositAmount(totalBalance.toFixed(8))}
                      className="text-sm text-[#97FCE4] hover:underline"
                    >
                      Max: {totalBalance.toFixed(8)}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-[#0F1A1F] text-white text-xl px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#97FCE4]"
                    step="0.00000001"
                  />
                </div>
                <button
                  onClick={handleActivateAgent}
                  disabled={
                    loading || !depositAmount || parseFloat(depositAmount) <= 0
                  }
                  className="w-full py-4 bg-[#97FCE4] text-black font-medium rounded-xl hover:bg-[#85E6D1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5" />
                      <span>Activate Agent</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
