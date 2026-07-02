import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { fetchTokenBalance } from "~/lib/utils/fetchTokenBalance";
import { approveToken, checkAllowance, MAX_UINT256 } from "~/lib/utils/tokenApproval";
import { useNetworkStore } from "~/stores/network-store";
import { useWalletStore } from "~/providers/wallet-store-provider";
import {
  type VesuXbtcCollateralOption,
  computeRepayDebtDelta,
  fetchVesuPoolPairs,
  getVesuLoanPosition,
  modifyVesuPosition,
} from "~/lib/services/vesu";
import { saveLocalTransaction, type Transaction } from "~/lib/utils/transactionHistory";
import { recordLoan } from "~/lib/utils/recordTransaction";
import VesuPrimeBorrowModal from "~/components/ui/VesuPrimeBorrowModal";
import VesuLoanManageModal from "~/components/ui/VesuLoanManageModal";

const VESU_POOL_APR_POLL_MS = 60_000;

interface Re7XbtcBorrowMarketProps {
  title: string;
  description: string;
  poolAddress: string;
  debtAsset: string;
  debtSymbol: string;
  debtDecimals: number;
  collateralOptions: VesuXbtcCollateralOption[];
  refreshNonce?: number;
  onTxComplete?: () => void;
}

/**
 * Self-contained borrow market card for the Re7 xBTC pool where the debt asset is
 * a BTCfi token (LBTC / tBTC / SolvBTC). Users supply an xBTC collateral and borrow
 * the configured debt asset. Mirrors the inline Re7 xBTC / WBTC borrow flow.
 */
export default function Re7XbtcBorrowMarket({
  title,
  description,
  poolAddress,
  debtAsset,
  debtSymbol,
  debtDecimals,
  collateralOptions,
  refreshNonce = 0,
  onTxComplete,
}: Re7XbtcBorrowMarketProps) {
  const wallet = useWalletStore((state) => state.wallet) as any;
  const address = useWalletStore((state) => state.vaultAddress);
  const currentNetwork = useNetworkStore((state) => state.currentNetwork);

  const [selectedCollateral, setSelectedCollateral] = useState(collateralOptions[0].address);
  const hasUserSelectedRef = useRef(false);
  const [collateralBalance, setCollateralBalance] = useState("0");
  const [pairs, setPairs] = useState<Awaited<ReturnType<typeof fetchVesuPoolPairs>>>([]);
  const [loanPosition, setLoanPosition] = useState<Awaited<
    ReturnType<typeof getVesuLoanPosition>
  > | null>(null);
  const [borrowApr, setBorrowApr] = useState("—");
  const [supplyAprByAsset, setSupplyAprByAsset] = useState<Record<string, string>>({});
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [localNonce, setLocalNonce] = useState(0);

  const selectedOption = useMemo(
    () =>
      collateralOptions.find(
        (option) => option.address.toLowerCase() === selectedCollateral.toLowerCase()
      ) || collateralOptions[0],
    [collateralOptions, selectedCollateral]
  );

  const selectedPair = useMemo(() => {
    return pairs.find(
      (pair) =>
        pair.collateralAssetAddress.toLowerCase() === selectedOption.address.toLowerCase() &&
        pair.debtAssetAddress.toLowerCase() === debtAsset.toLowerCase()
    );
  }, [pairs, selectedOption.address, debtAsset]);

  const selectedSupplyApr = useMemo(() => {
    return supplyAprByAsset[selectedOption.address.toLowerCase()] || "—";
  }, [supplyAprByAsset, selectedOption.address]);

  const saveHistory = (
    hash: string,
    type: Transaction["type"],
    amount: string
  ) => {
    if (!wallet?.address) return;
    saveLocalTransaction({
      hash,
      timestamp: Math.floor(Date.now() / 1000),
      type,
      amount,
      from: wallet.address,
      to: poolAddress,
      status: "success",
      blockNumber: 0,
      contractLabel: title,
    });

    if (type === "borrow" || type === "repay" || type === "withdraw_collateral") {
      recordLoan({
        transactionHash: hash,
        timestamp: Math.floor(Date.now() / 1000),
        userAddress: wallet.address,
        action: type,
        poolAddress,
        poolLabel: title,
        collateralSymbol: selectedOption.symbol,
        debtSymbol,
        amount,
        status: "completed",
      }).catch((err) => console.error("Failed to record loan:", err));
    }
  };

  const triggerRefresh = () => {
    setLocalNonce((v) => v + 1);
    onTxComplete?.();
  };

  // Auto-select the collateral pair the user already has a position in.
  useEffect(() => {
    const run = async () => {
      if (!address || hasUserSelectedRef.current) return;
      try {
        const positions = await Promise.all(
          collateralOptions.map(async (option) => {
            const position = await getVesuLoanPosition(
              currentNetwork.rpcUrl,
              poolAddress,
              option.address,
              debtAsset,
              address,
              option.decimals,
              debtDecimals
            );
            return { optionAddress: option.address, position };
          })
        );
        const active = positions.find(
          ({ position }) => position.collateralRaw > 0n || position.debtRaw > 0n
        );
        if (active) setSelectedCollateral(active.optionAddress);
      } catch (error) {
        console.error(`Failed to determine active ${debtSymbol} collateral pair:`, error);
      }
    };
    void run();
  }, [address, currentNetwork.rpcUrl, refreshNonce, localNonce, poolAddress, debtAsset, debtDecimals, debtSymbol, collateralOptions]);

  // Poll pool pairs + APRs from the Vesu REST API.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const pairList = await fetchVesuPoolPairs(poolAddress);
        if (cancelled) return;
        setPairs(pairList);

        const res = await fetch(`https://api.vesu.xyz/pools/${poolAddress}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setBorrowApr("—");
          return;
        }
        const payload = await res.json();
        if (cancelled) return;
        const assets = Array.isArray(payload?.data?.assets) ? payload.data.assets : [];

        const supplyMap: Record<string, string> = {};
        for (const asset of assets) {
          const addr = String(asset?.address || "").toLowerCase();
          if (!addr) continue;
          const preferredSupplyStat =
            asset?.stats?.btcFiSupplyApr || asset?.stats?.lstApr || asset?.stats?.supplyApy;
          const supplyRaw = Number(preferredSupplyStat?.value || 0);
          const supplyDecimals = Number(preferredSupplyStat?.decimals || 18);
          const supplyPct = (supplyRaw / 10 ** supplyDecimals) * 100;
          supplyMap[addr] = Number.isFinite(supplyPct) ? `${supplyPct.toFixed(2)}%` : "—";
        }
        if (!cancelled) setSupplyAprByAsset(supplyMap);

        const debt = assets.find(
          (asset: any) => String(asset?.address || "").toLowerCase() === debtAsset.toLowerCase()
        );
        const borrowRaw = Number(debt?.stats?.borrowApr?.value || 0);
        const borrowDecimals = Number(debt?.stats?.borrowApr?.decimals || 18);
        const borrowPct = (borrowRaw / 10 ** borrowDecimals) * 100;
        if (!cancelled) {
          setBorrowApr(Number.isFinite(borrowPct) ? `${borrowPct.toFixed(2)}%` : "—");
        }
      } catch (error) {
        if (!cancelled) {
          console.error(`Failed to fetch ${debtSymbol} pool pair/APR data:`, error);
          setBorrowApr("—");
        }
      }
    };

    void run();
    const pollId = window.setInterval(() => void run(), VESU_POOL_APR_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
  }, [poolAddress, debtAsset, debtSymbol, refreshNonce, localNonce]);

  // Fetch balance + position for the selected collateral.
  useEffect(() => {
    const run = async () => {
      if (!address) {
        setCollateralBalance("0");
        setLoanPosition(null);
        return;
      }
      try {
        const [balance, position] = await Promise.all([
          fetchTokenBalance(
            currentNetwork.rpcUrl,
            selectedOption.address,
            address,
            selectedOption.decimals
          ),
          getVesuLoanPosition(
            currentNetwork.rpcUrl,
            poolAddress,
            selectedOption.address,
            debtAsset,
            address,
            selectedOption.decimals,
            debtDecimals
          ),
        ]);
        setCollateralBalance(balance);
        setLoanPosition(position);
      } catch (error) {
        console.error(`Failed to fetch ${debtSymbol} position:`, error);
      }
    };
    run();
  }, [
    address,
    currentNetwork.rpcUrl,
    refreshNonce,
    localNonce,
    selectedOption.address,
    selectedOption.decimals,
    poolAddress,
    debtAsset,
    debtDecimals,
    debtSymbol,
  ]);

  const handleSelectCollateral = (collateralAddress: string) => {
    hasUserSelectedRef.current = true;
    setSelectedCollateral(collateralAddress);
  };

  const handleBorrow = async (collateralAmount: string, borrowAmount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");

    const collateralRaw = BigInt(
      Math.floor((parseFloat(collateralAmount || "0") || 0) * 10 ** selectedOption.decimals)
    );
    const borrowRaw = BigInt(
      Math.floor((parseFloat(borrowAmount || "0") || 0) * 10 ** debtDecimals)
    );
    if (collateralRaw <= 0n && borrowRaw <= 0n) {
      throw new Error("Enter collateral and/or borrow amount");
    }

    const statusId = `xbtc-${debtSymbol}-borrow-status`;
    if (collateralRaw > 0n) {
      toast.loading(`Checking ${selectedOption.symbol} approval...`, { id: statusId });
      const allowance = await checkAllowance(
        currentNetwork.rpcUrl,
        selectedOption.address,
        wallet.address,
        poolAddress
      );
      if (allowance < collateralRaw) {
        toast.loading(`Approving ${selectedOption.symbol} collateral...`, { id: statusId });
        const approveTx = await approveToken(
          wallet,
          selectedOption.address,
          poolAddress,
          MAX_UINT256
        );
        await wallet.waitForTransaction(approveTx, {
          retryInterval: 3000,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          timeout: 180000,
        });
      }
    }

    toast.loading(`Submitting ${debtSymbol} borrow transaction...`, { id: statusId });
    const txHash = await modifyVesuPosition(
      wallet,
      poolAddress,
      selectedOption.address,
      debtAsset,
      wallet.address,
      collateralRaw,
      borrowRaw
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveHistory(
      txHash,
      "borrow",
      `${collateralAmount || "0"} ${selectedOption.symbol} / ${borrowAmount || "0"} ${debtSymbol}`
    );
    toast.success(`${title} position updated`, { id: statusId });
    triggerRefresh();
  };

  const handleRepay = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const repayRaw = BigInt(Math.floor((parseFloat(amount || "0") || 0) * 10 ** debtDecimals));
    if (repayRaw <= 0n) throw new Error("Invalid repay amount");

    const statusId = `xbtc-${debtSymbol}-repay-status`;
    toast.loading(`Checking ${debtSymbol} approval for repay...`, { id: statusId });
    const allowance = await checkAllowance(
      currentNetwork.rpcUrl,
      debtAsset,
      wallet.address,
      poolAddress
    );
    if (allowance < repayRaw) {
      toast.loading(`Approving ${debtSymbol} for repay...`, { id: statusId });
      const approveTx = await approveToken(wallet, debtAsset, poolAddress, MAX_UINT256);
      await wallet.waitForTransaction(approveTx, {
        retryInterval: 3000,
        successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        timeout: 180000,
      });
    }

    toast.loading(`Submitting ${debtSymbol} repay transaction...`, { id: statusId });
    const { debtDelta, debtDenomination } = computeRepayDebtDelta(loanPosition, repayRaw);
    const txHash = await modifyVesuPosition(
      wallet,
      poolAddress,
      selectedOption.address,
      debtAsset,
      wallet.address,
      0n,
      debtDelta,
      debtDenomination
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveHistory(txHash, "repay", `${amount || "0"} ${debtSymbol}`);
    toast.success(`${title} repay successful`, { id: statusId });
    triggerRefresh();
  };

  const handleWithdrawCollateral = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const withdrawRaw = BigInt(
      Math.floor((parseFloat(amount || "0") || 0) * 10 ** selectedOption.decimals)
    );
    if (withdrawRaw <= 0n) throw new Error("Invalid withdraw amount");

    const statusId = `xbtc-${debtSymbol}-withdraw-status`;
    toast.loading(`Submitting ${selectedOption.symbol} collateral withdraw...`, { id: statusId });
    const txHash = await modifyVesuPosition(
      wallet,
      poolAddress,
      selectedOption.address,
      debtAsset,
      wallet.address,
      -withdrawRaw,
      0n
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveHistory(txHash, "withdraw_collateral", `${amount || "0"} ${selectedOption.symbol}`);
    toast.success(`${title} collateral withdrawn`, { id: statusId });
    triggerRefresh();
  };

  return (
    <div className="rounded-3xl border border-gray-800 bg-[#101D22] p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-medium text-white">{title}</h2>
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Supply APR</div>
          <div className="text-xl font-semibold text-[#97FCE4]">{selectedSupplyApr}</div>
          <div className="mt-1 text-sm text-gray-400">Borrow APR</div>
          <div className="text-xl font-semibold text-[#97FCE4]">{borrowApr}</div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-[#0F1A1F] p-4">
        <div className="mb-2 text-sm font-medium text-gray-300">Collateral Asset</div>
        <select
          value={selectedOption.address}
          onChange={(e) => handleSelectCollateral(e.target.value)}
          className="w-full rounded-xl border border-[#97FCE4]/40 bg-[#101D22] px-4 py-3 text-base font-semibold text-white outline-none transition-colors focus:border-[#97FCE4] focus:ring-2 focus:ring-[#97FCE4]/30 md:w-64"
        >
          {collateralOptions.map((option) => (
            <option key={option.address} value={option.address}>
              {option.symbol}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
        <div className="rounded-2xl bg-[#0F1A1F] p-4">
          <div className="text-gray-400">Selected pair</div>
          <div className="mt-1 text-white">
            {selectedOption.symbol} / {debtSymbol}
          </div>
        </div>
        <div className="rounded-2xl bg-[#0F1A1F] p-4">
          <div className="text-gray-400">Max LTV</div>
          <div className="mt-1 text-white">
            {selectedPair ? `${(selectedPair.maxLtv * 100).toFixed(2)}%` : "—"}
          </div>
        </div>
        <div className="rounded-2xl bg-[#0F1A1F] p-4">
          <div className="text-gray-400">Liquidation LTV</div>
          <div className="mt-1 text-white">
            {selectedPair ? `${(selectedPair.liquidationLtv * 100).toFixed(2)}%` : "—"}
          </div>
        </div>
        <div className="rounded-2xl bg-[#0F1A1F] p-4">
          <div className="text-gray-400">Liquidation bonus</div>
          <div className="mt-1 text-white">
            {selectedPair ? `${selectedPair.liquidationBonus.toFixed(2)}%` : "—"}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
        <div className="rounded-2xl bg-[#0F1A1F] p-4">
          <div className="mb-1 text-gray-400">Supplied Collateral</div>
          <div className="text-white">
            {loanPosition?.collateralAmount?.toFixed(6) || "0.000000"} {selectedOption.symbol}
          </div>
        </div>
        <div className="rounded-2xl bg-[#0F1A1F] p-4">
          <div className="text-gray-400">Borrowed Debt</div>
          <div className="mt-1 text-white">
            {loanPosition?.debtAmount?.toFixed(8) || "0.00000000"} {debtSymbol}
          </div>
        </div>
        <div className="rounded-2xl bg-[#0F1A1F] p-4">
          <div className="text-gray-400">Current LTV</div>
          <div className="mt-1 text-white">
            {loanPosition ? `${(loanPosition.currentLtv * 100).toFixed(2)}%` : "0.00%"}
          </div>
          <div className="text-xs text-gray-500">
            Max {(selectedPair?.maxLtv ? selectedPair.maxLtv * 100 : 0).toFixed(2)}%
          </div>
        </div>
        <div className="rounded-2xl bg-[#0F1A1F] p-4">
          <div className="text-gray-400">Liquidation Price ({debtSymbol})</div>
          <div className="mt-1 text-white">
            $
            {loanPosition?.liquidationPriceUsd
              ? loanPosition.liquidationPriceUsd.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })
              : "0"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            if (!address) {
              toast.error("Please connect your wallet first");
              return;
            }
            setIsBorrowOpen(true);
          }}
          className="rounded-full bg-[#97FCE4] px-6 py-3 font-medium text-black transition-colors hover:bg-[#85E6D1]"
        >
          Borrow / Supply
        </button>
        <button
          type="button"
          onClick={() => setIsRepayOpen(true)}
          className="rounded-full bg-[#101D22] px-6 py-3 font-medium text-white ring-1 ring-gray-700 transition-colors hover:bg-[#15242b]"
          disabled={!loanPosition || loanPosition.debtRaw <= 0n}
        >
          Repay
        </button>
        <button
          type="button"
          onClick={() => setIsWithdrawOpen(true)}
          className="rounded-full bg-[#101D22] px-6 py-3 font-medium text-white ring-1 ring-gray-700 transition-colors hover:bg-[#15242b]"
          disabled={!loanPosition || loanPosition.collateralRaw <= 0n}
        >
          Withdraw Collateral
        </button>
      </div>

      <VesuPrimeBorrowModal
        isOpen={isBorrowOpen}
        onClose={() => setIsBorrowOpen(false)}
        title={title}
        pairOptions={collateralOptions}
        selectedCollateral={selectedOption.address}
        onSelectCollateral={handleSelectCollateral}
        collateralBalance={collateralBalance}
        currentBorrowApr={borrowApr}
        currentSupplyApr={selectedSupplyApr}
        debtSymbol={debtSymbol}
        pairStats={selectedPair}
        existingCollateralAmount={loanPosition?.collateralAmount || 0}
        existingDebtAmount={loanPosition?.debtAmount || 0}
        collateralPriceUsd={loanPosition?.collateralPriceUsd || 0}
        debtPriceUsd={loanPosition?.debtPriceUsd || 0}
        onSubmit={handleBorrow}
      />

      <VesuLoanManageModal
        isOpen={isRepayOpen}
        onClose={() => setIsRepayOpen(false)}
        mode="repay"
        onSubmit={handleRepay}
        maxAmount={loanPosition?.debtAmount?.toString() || "0"}
        assetSymbol={debtSymbol}
      />

      <VesuLoanManageModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        mode="withdraw"
        onSubmit={handleWithdrawCollateral}
        maxAmount={loanPosition?.collateralAmount?.toString() || "0"}
        assetSymbol={selectedOption.symbol}
      />
    </div>
  );
}
