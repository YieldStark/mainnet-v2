import { useState, useEffect } from "react";
import { TrendingUp, Info, RefreshCw } from "lucide-react";
import { 
  VESU_LENDING_POOLS, 
  type VesuPool, 
  depositToVesu, 
  withdrawFromVesu,
  getVTokenBalance,
  convertSharesToAssets 
} from "~/lib/services/vesu";
import VesuLendModal from "~/components/ui/VesuLendModal";
import VesuPositions from "~/components/dashboard/VesuPositions";
import { useWalletStore } from "~/providers/wallet-store-provider";
import toast from "react-hot-toast";
import { useVesuPoolData } from "~/hooks/useVesuPoolData";
import { useNetworkStore } from "~/stores/network-store";
import { fetchTokenBalance } from "~/lib/utils/fetchTokenBalance";
import { approveToken, checkAllowance, MAX_UINT256 } from "~/lib/utils/tokenApproval";

export default function YieldPage() {
  const [selectedPool, setSelectedPool] = useState<VesuPool | null>(null);
  const [isLendModalOpen, setIsLendModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"deposit" | "withdraw">("deposit");
  const wallet = useWalletStore((state) => state.wallet);
  const vaultAddress = useWalletStore((state) => state.vaultAddress);
  const isConnected = useWalletStore((state) => state.isConnected);
  const { poolsData, isLoading, error } = useVesuPoolData();
  const currentNetwork = useNetworkStore((state) => state.currentNetwork);
  
  // Use vaultAddress from wallet store as the primary address source
  const address = vaultAddress;
  // Use wallet from wallet store as the account for transactions
  const account = wallet as any;
  
  // User token balances
  const [balances, setBalances] = useState({
    WBTC: "0.0",
    USDC: "0.0",
  });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  
  // User deposited balances (for withdraw)
  const [depositedBalances, setDepositedBalances] = useState<Record<string, string>>({});
  const [refreshPositions, setRefreshPositions] = useState(0);

  // Fetch user token balances and deposited amounts
  useEffect(() => {
    const fetchBalances = async () => {
      console.log("Wallet status:", { 
        vaultAddress, 
        address, 
        isConnected,
        hasWallet: !!wallet,
        hasAccount: !!account 
      });
      
      if (!address) {
        console.log("No wallet address available - skipping balance fetch");
        setBalances({ WBTC: "0.0", USDC: "0.0" });
        setDepositedBalances({});
        return;
      }

      console.log("Fetching balances for address:", address);
      setIsLoadingBalances(true);
      try {
        const rpcUrl = currentNetwork.rpcUrl;
        
        const wbtcTokenAddress = VESU_LENDING_POOLS.find(p => p.asset === "WBTC")!.assetAddress;
        const usdcTokenAddress = VESU_LENDING_POOLS.find(p => p.asset === "USDC")!.assetAddress;
        
        console.log("=== BALANCE FETCH DEBUG ===");
        console.log("Your wallet address:", address);
        console.log("USDC token address we're querying:", usdcTokenAddress);
        console.log("WBTC token address we're querying:", wbtcTokenAddress);
        console.log("RPC URL:", rpcUrl);
        console.log("========================");
        
        // Fetch WBTC and USDC balances in parallel
        const [wbtcBalance, usdcBalance] = await Promise.all([
          fetchTokenBalance(
            rpcUrl,
            wbtcTokenAddress,
            address,
            8 // WBTC decimals
          ),
          fetchTokenBalance(
            rpcUrl,
            usdcTokenAddress,
            address,
            6 // USDC decimals
          ),
        ]);

        console.log("Fetched balances:", { wbtcBalance, usdcBalance });

        setBalances({
          WBTC: wbtcBalance,
          USDC: usdcBalance,
        });

        // Fetch deposited amounts (vToken balances converted to assets)
        const depositedAmounts: Record<string, string> = {};
        for (const pool of VESU_LENDING_POOLS) {
          try {
            const vTokenBalance = await getVTokenBalance(
              rpcUrl,
              pool.vTokenAddress,
              address
            );
            
            if (vTokenBalance > 0n) {
              const assetAmount = await convertSharesToAssets(
                rpcUrl,
                pool.vTokenAddress,
                vTokenBalance
              );
              
              const decimals = pool.asset === "WBTC" ? 8 : 6;
              depositedAmounts[pool.id] = (Number(assetAmount) / 10 ** decimals).toFixed(decimals);
            } else {
              depositedAmounts[pool.id] = "0";
            }
          } catch (err) {
            depositedAmounts[pool.id] = "0";
          }
        }
        setDepositedBalances(depositedAmounts);
      } catch (error) {
        console.error("Failed to fetch token balances:", error);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [address, currentNetwork.rpcUrl, refreshPositions]);

  // Merge static pool config with dynamic data
  const getEnrichedPools = () => {
    return VESU_LENDING_POOLS.map((pool) => {
      const liveData = poolsData.find((p) => 
        pool.poolAddress.toLowerCase() === p.poolAddress.toLowerCase()
      );
      
      return {
        ...pool,
        apy: liveData?.apy || pool.apy,
        tvl: liveData?.tvl || pool.tvl,
        utilization: liveData?.utilization,
        supplyAPY: liveData?.supplyAPY,
        borrowAPY: liveData?.borrowAPY,
      };
    });
  };

  const enrichedPools = getEnrichedPools();

  const handleOpenLendModal = (pool: VesuPool, mode: "deposit" | "withdraw" = "deposit") => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    setSelectedPool(pool);
    setModalMode(mode);
    setIsLendModalOpen(true);
  };

  const handleDeposit = async (poolId: string, amount: string) => {
    if (!account || !address) {
      throw new Error("Wallet not connected");
    }

    const pool = VESU_LENDING_POOLS.find((p) => p.id === poolId);
    if (!pool) {
      throw new Error("Pool not found");
    }

    try {
      // Parse amount to smallest unit (wei)
      const decimals = pool.asset === "WBTC" ? 8 : 6;
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));

      if (amountBigInt <= 0n) {
        throw new Error("Invalid amount");
      }

      // Step 1: Check allowance
      toast.loading("Checking token approval...", { id: "deposit-status" });
      const rpcUrl = currentNetwork.rpcUrl;
      const currentAllowance = await checkAllowance(
        rpcUrl,
        pool.assetAddress,
        address,
        pool.vTokenAddress
      );

      // Step 2: Request approval if insufficient
      if (currentAllowance < amountBigInt) {
        toast.loading("Requesting token approval...", { id: "deposit-status" });
        
        const approveTxHash = await approveToken(
          account,
          pool.assetAddress,
          pool.vTokenAddress,
          MAX_UINT256 // Unlimited approval for better UX
        );

        toast.loading(
          <div>
            <div>Waiting for approval confirmation...</div>
            <div className="text-xs mt-1">This may take 30-60 seconds</div>
          </div>, 
          { id: "deposit-status" }
        );
        
        // Wait for approval transaction (with longer timeout)
        try {
          await account.waitForTransaction(approveTxHash, {
            retryInterval: 3000,
            successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          });
          toast.success("Token approval confirmed!", { id: "deposit-status" });
        } catch (error: any) {
          // If timeout, still proceed but warn user
          if (error?.message?.includes("timeout")) {
            toast.loading("Approval pending, proceeding with deposit...", { id: "deposit-status" });
          } else {
            throw error;
          }
        }
      }

      // Step 3: Execute deposit
      toast.loading("Executing deposit...", { id: "deposit-status" });
      
      const depositTxHash = await depositToVesu(
        account,
        pool.vTokenAddress,
        amountBigInt,
        address // Receiver address (self)
      );

      toast.loading(
        <div>
          <div>Waiting for deposit confirmation...</div>
          <div className="text-xs mt-1">This may take 1-2 minutes on Starknet</div>
          <a
            href={`${currentNetwork.explorerUrl}/tx/${depositTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline text-blue-400 mt-1 block"
          >
            Track on Explorer →
          </a>
        </div>,
        { id: "deposit-status" }
      );

      // Wait for deposit transaction (with longer timeout and better error handling)
      try {
        await account.waitForTransaction(depositTxHash, {
          retryInterval: 5000, // Check every 5 seconds
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        });
      } catch (error: any) {
        // If timeout, show partial success message
        if (error?.message?.includes("timeout")) {
          toast.success(
            <div>
              <div className="font-medium">Deposit submitted!</div>
              <div className="text-xs mt-1">Transaction is processing on Starknet</div>
              <a
                href={`${currentNetwork.explorerUrl}/tx/${depositTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline block mt-1"
              >
                Track status on Explorer →
              </a>
            </div>,
            { id: "deposit-status", duration: 10000 }
          );
          // Don't refresh balances yet, just return
          return;
        }
        throw error;
      }

      // Step 4: Success!
      toast.success(
        <div>
          <div className="font-medium">Deposit successful!</div>
          <a
            href={`${currentNetwork.explorerUrl}/tx/${depositTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
          >
            View on Explorer
          </a>
        </div>,
        { id: "deposit-status", duration: 5000 }
      );

      // Wait a moment for blockchain to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh balances (reuse rpcUrl from line 190)
      const [wbtcBalance, usdcBalance] = await Promise.all([
        fetchTokenBalance(
          rpcUrl,
          VESU_LENDING_POOLS.find(p => p.asset === "WBTC")!.assetAddress,
          address,
          8
        ),
        fetchTokenBalance(
          rpcUrl,
          VESU_LENDING_POOLS.find(p => p.asset === "USDC")!.assetAddress,
          address,
          6
        ),
      ]);

      setBalances({
        WBTC: wbtcBalance,
        USDC: usdcBalance,
      });

      // Trigger position refresh
      setRefreshPositions((prev) => prev + 1);
    } catch (error: any) {
      console.error("Deposit error:", error);
      
      // User rejection
      if (error?.message?.includes("User abort") || error?.message?.includes("User rejected")) {
        toast.error("Transaction cancelled by user", { id: "deposit-status" });
        throw new Error("Transaction cancelled by user");
      }
      
      // Insufficient balance
      if (error?.message?.includes("balance")) {
        toast.error("Insufficient balance", { id: "deposit-status" });
        throw new Error("Insufficient balance");
      }

      // Generic error
      const errorMsg = error?.message || "Transaction failed";
      toast.error(errorMsg, { id: "deposit-status" });
      throw error;
    }
  };

  const handleWithdraw = async (poolId: string, amount: string) => {
    if (!account || !address) {
      throw new Error("Wallet not connected");
    }

    const pool = VESU_LENDING_POOLS.find((p) => p.id === poolId);
    if (!pool) {
      throw new Error("Pool not found");
    }

    try {
      // Parse amount to smallest unit (wei)
      const decimals = pool.asset === "WBTC" ? 8 : 6;
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));

      if (amountBigInt <= 0n) {
        throw new Error("Invalid amount");
      }

      // Execute withdraw
      toast.loading("Executing withdrawal...", { id: "withdraw-status" });
      
      const withdrawTxHash = await withdrawFromVesu(
        account,
        pool.vTokenAddress,
        amountBigInt,
        address, // Receiver address (self)
        address  // Owner address (self)
      );

      toast.loading(
        <div>
          <div>Waiting for withdrawal confirmation...</div>
          <div className="text-xs mt-1">This may take 1-2 minutes on Starknet</div>
          <a
            href={`${currentNetwork.explorerUrl}/tx/${withdrawTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline text-blue-400 mt-1 block"
          >
            Track on Explorer →
          </a>
        </div>,
        { id: "withdraw-status" }
      );

      // Wait for withdraw transaction (with longer timeout and better error handling)
      try {
        await account.waitForTransaction(withdrawTxHash, {
          retryInterval: 5000, // Check every 5 seconds
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        });
      } catch (error: any) {
        // If timeout, show partial success message
        if (error?.message?.includes("timeout")) {
          toast.success(
            <div>
              <div className="font-medium">Withdrawal submitted!</div>
              <div className="text-xs mt-1">Transaction is processing on Starknet</div>
              <a
                href={`${currentNetwork.explorerUrl}/tx/${withdrawTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline block mt-1"
              >
                Track status on Explorer →
              </a>
            </div>,
            { id: "withdraw-status", duration: 10000 }
          );
          // Don't refresh balances yet, just return
          return;
        }
        throw error;
      }

      // Success!
      toast.success(
        <div>
          <div className="font-medium">Withdrawal successful!</div>
          <a
            href={`${currentNetwork.explorerUrl}/tx/${withdrawTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
          >
            View on Explorer
          </a>
        </div>,
        { id: "withdraw-status", duration: 5000 }
      );

      // Wait a moment for blockchain to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh balances
      const rpcUrl = currentNetwork.rpcUrl;
      const [wbtcBalance, usdcBalance] = await Promise.all([
        fetchTokenBalance(
          rpcUrl,
          VESU_LENDING_POOLS.find(p => p.asset === "WBTC")!.assetAddress,
          address,
          8
        ),
        fetchTokenBalance(
          rpcUrl,
          VESU_LENDING_POOLS.find(p => p.asset === "USDC")!.assetAddress,
          address,
          6
        ),
      ]);

      setBalances({
        WBTC: wbtcBalance,
        USDC: usdcBalance,
      });

      // Trigger position refresh
      setRefreshPositions((prev) => prev + 1);
    } catch (error: any) {
      console.error("Withdraw error:", error);
      
      // User rejection
      if (error?.message?.includes("User abort") || error?.message?.includes("User rejected")) {
        toast.error("Transaction cancelled by user", { id: "withdraw-status" });
        throw new Error("Transaction cancelled by user");
      }
      
      // Insufficient balance
      if (error?.message?.includes("balance")) {
        toast.error("Insufficient deposited balance", { id: "withdraw-status" });
        throw new Error("Insufficient deposited balance");
      }

      // Generic error
      const errorMsg = error?.message || "Withdrawal failed";
      toast.error(errorMsg, { id: "withdraw-status" });
      throw error;
    }
  };

  const wbtcPools = enrichedPools.filter((pool) => pool.asset === "WBTC");
  const usdcPools = enrichedPools.filter((pool) => pool.asset === "USDC");

  return (
    <div className="space-y-6">
      {/* User Positions Widget */}
      {address && (
        <VesuPositions 
          key={refreshPositions}
          onManagePosition={handleOpenLendModal} 
        />
      )}

      {/* Header */}
      <div className="bg-[#101D22] rounded-4xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-medium text-white mb-2">Yield</h1>
            <p className="text-gray-400">
              Earn yield by lending your assets to Vesu protocol pools
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <RefreshCw className="animate-spin text-[#97FCE4]" size={20} />
            )}
            {!isLoading && poolsData.length > 0 && (
              <span className="text-sm text-[#97FCE4]">● Live TVL</span>
            )}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-[#97FCE4]/10 border border-[#97FCE4]/20 rounded-3xl p-4">
        <div className="flex items-start gap-3">
          <Info className="text-[#97FCE4] mt-0.5" size={20} />
          <div>
            <h3 className="text-[#97FCE4] font-medium mb-1">
              About Vesu Lending
            </h3>
            <p className="text-sm text-gray-300">
              Vesu is Starknet's most trusted lending market. TVL data is fetched live from blockchain.
              APY rates are estimates based on typical pool performance. Deposit your assets to earn yield
              from borrowers while maintaining liquidity through vTokens (ERC-4626 vault tokens).
            </p>
          </div>
        </div>
      </div>

      {/* WBTC Pools Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-medium text-white">WBTC Pools</h2>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {wbtcPools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onDeposit={() => handleOpenLendModal(pool)}
            />
          ))}
        </div>
      </div>

      {/* USDC Pools Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-medium text-white">USDC Pools</h2>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usdcPools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onDeposit={() => handleOpenLendModal(pool)}
            />
          ))}
        </div>
      </div>

      {/* Lend Modal */}
      <VesuLendModal
        isOpen={isLendModalOpen}
        onClose={() => setIsLendModalOpen(false)}
        pool={selectedPool}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        userBalance={selectedPool ? balances[selectedPool.asset] : "0"}
        depositedBalance={selectedPool ? depositedBalances[selectedPool.id] || "0" : "0"}
        mode={modalMode}
      />
    </div>
  );
}

interface PoolCardProps {
  pool: VesuPool;
  onDeposit: () => void;
}

function PoolCard({ pool, onDeposit }: PoolCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "High":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="bg-[#101D22] rounded-3xl p-6 border border-gray-800 hover:border-[#97FCE4]/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-medium text-white mb-1">{pool.name}</h3>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(
              pool.riskLevel
            )}`}
          >
            {pool.riskLevel} Risk
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#97FCE4] flex items-center gap-1">
            <TrendingUp size={20} />
            {pool.apy}
          </div>
          <span className="text-xs text-gray-400">APY</span>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">{pool.description}</p>

      <div className="space-y-2 mb-4 pb-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Total Value Locked</span>
          <span className="text-sm font-medium text-white">{pool.tvl}</span>
        </div>
        {pool.utilization && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Utilization</span>
            <span className="text-sm font-medium text-white">{pool.utilization}</span>
          </div>
        )}
      </div>

      <button
        onClick={onDeposit}
        className="w-full px-6 py-3 bg-[#97FCE4] text-black font-medium rounded-full hover:bg-[#85E6D1] transition-colors"
      >
        Lend {pool.asset}
      </button>
    </div>
  );
}
