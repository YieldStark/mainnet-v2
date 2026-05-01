import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { fetchTokenBalance } from "~/lib/utils/fetchTokenBalance";
import { approveToken, checkAllowance, MAX_UINT256 } from "~/lib/utils/tokenApproval";
import { useNetworkStore } from "~/stores/network-store";
import { useWalletStore } from "~/providers/wallet-store-provider";
import { useVesuPoolData } from "~/hooks/useVesuPoolData";
import {
  VESU_RE7_USDC_CORE_BORROW,
  VESU_PRIME_WBTC_USDT_BORROW,
  VESU_RE7_USDC_PRIME_BORROW,
  VESU_PRIME_COLLATERAL_OPTIONS,
  VESU_PRIME_POOL,
  VESU_RE7_XBTC_POOL,
  VESU_XBTC_COLLATERAL_OPTIONS,
  fetchVesuPoolPairs,
  getVesuLoanPosition,
  VESU_VTOKENS,
  getRe7WbtcUsdcLoanPosition,
  modifyVesuPosition,
  openRe7WbtcUsdcBorrowPosition,
} from "~/lib/services/vesu";
import { saveLocalTransaction, type Transaction } from "~/lib/utils/transactionHistory";
import VesuBorrowModal from "~/components/ui/VesuBorrowModal";
import VesuLoanManageModal from "~/components/ui/VesuLoanManageModal";
import VesuPrimeBorrowModal from "~/components/ui/VesuPrimeBorrowModal";

const WBTC_DECIMALS = 8;
const USDC_DECIMALS = 6;
const USDT_DECIMALS = 6;
type LoanViewMode = "borrow-btc" | "borrow-other";
/** Vesu REST pool payload (pairs + asset APRs); polled so Prime / xBTC headers stay current. */
const VESU_POOL_APR_POLL_MS = 60_000;

export default function LoansPage() {
  const wallet = useWalletStore((state) => state.wallet) as any;
  const address = useWalletStore((state) => state.vaultAddress);
  const currentNetwork = useNetworkStore((state) => state.currentNetwork);
  const { poolsData, isLoading } = useVesuPoolData();

  const [wbtcBalance, setWbtcBalance] = useState("0");
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [loanPosition, setLoanPosition] = useState<Awaited<
    ReturnType<typeof getRe7WbtcUsdcLoanPosition>
  > | null>(null);
  const [primePairs, setPrimePairs] = useState<Awaited<ReturnType<typeof fetchVesuPoolPairs>>>([]);
  const [selectedPrimeCollateral, setSelectedPrimeCollateral] = useState(
    VESU_PRIME_COLLATERAL_OPTIONS[0].address
  );
  const [primeCollateralBalance, setPrimeCollateralBalance] = useState("0");
  const [primeLoanPosition, setPrimeLoanPosition] = useState<Awaited<
    ReturnType<typeof getVesuLoanPosition>
  > | null>(null);
  const [primeBorrowApr, setPrimeBorrowApr] = useState("—");
  const [primeSupplyAprByAsset, setPrimeSupplyAprByAsset] = useState<Record<string, string>>({});
  const [xbtcPairs, setXbtcPairs] = useState<Awaited<ReturnType<typeof fetchVesuPoolPairs>>>([]);
  const [selectedXbtcCollateral, setSelectedXbtcCollateral] = useState(
    VESU_XBTC_COLLATERAL_OPTIONS[0].address
  );
  const hasUserSelectedPrimeCollateralRef = useRef(false);
  const hasUserSelectedXbtcCollateralRef = useRef(false);
  const [xbtcCollateralBalance, setXbtcCollateralBalance] = useState("0");
  const [xbtcLoanPosition, setXbtcLoanPosition] = useState<Awaited<
    ReturnType<typeof getVesuLoanPosition>
  > | null>(null);
  const [xbtcBorrowApr, setXbtcBorrowApr] = useState("—");
  const [xbtcSupplyAprByAsset, setXbtcSupplyAprByAsset] = useState<Record<string, string>>({});
  const [primeWbtcUsdtCollateralBalance, setPrimeWbtcUsdtCollateralBalance] = useState("0");
  const [primeWbtcUsdtDebtBalance, setPrimeWbtcUsdtDebtBalance] = useState("0");
  const [primeWbtcUsdtPosition, setPrimeWbtcUsdtPosition] = useState<Awaited<
    ReturnType<typeof getVesuLoanPosition>
  > | null>(null);
  const [primeWbtcUsdtSupplyApr, setPrimeWbtcUsdtSupplyApr] = useState("—");
  const [primeWbtcUsdtBorrowApr, setPrimeWbtcUsdtBorrowApr] = useState("—");
  const [primeWbtcUsdtUtilization, setPrimeWbtcUsdtUtilization] = useState("—");
  const [re7UsdcPrimeCollateralBalance, setRe7UsdcPrimeCollateralBalance] = useState("0");
  const [re7UsdcPrimeDebtBalance, setRe7UsdcPrimeDebtBalance] = useState("0");
  const [re7UsdcPrimePosition, setRe7UsdcPrimePosition] = useState<Awaited<
    ReturnType<typeof getVesuLoanPosition>
  > | null>(null);
  const [re7UsdcPrimeSupplyApr, setRe7UsdcPrimeSupplyApr] = useState("—");
  const [re7UsdcPrimeBorrowApr, setRe7UsdcPrimeBorrowApr] = useState("—");
  const [re7UsdcPrimeUtilization, setRe7UsdcPrimeUtilization] = useState("—");
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [isPrimeWbtcUsdtBorrowOpen, setIsPrimeWbtcUsdtBorrowOpen] = useState(false);
  const [isRe7UsdcPrimeBorrowOpen, setIsRe7UsdcPrimeBorrowOpen] = useState(false);
  const [isPrimeBorrowOpen, setIsPrimeBorrowOpen] = useState(false);
  const [isXbtcBorrowOpen, setIsXbtcBorrowOpen] = useState(false);
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isPrimeWbtcUsdtRepayOpen, setIsPrimeWbtcUsdtRepayOpen] = useState(false);
  const [isPrimeWbtcUsdtWithdrawOpen, setIsPrimeWbtcUsdtWithdrawOpen] = useState(false);
  const [isRe7UsdcPrimeRepayOpen, setIsRe7UsdcPrimeRepayOpen] = useState(false);
  const [isRe7UsdcPrimeWithdrawOpen, setIsRe7UsdcPrimeWithdrawOpen] = useState(false);
  const [isPrimeRepayOpen, setIsPrimeRepayOpen] = useState(false);
  const [isPrimeWithdrawOpen, setIsPrimeWithdrawOpen] = useState(false);
  const [isXbtcRepayOpen, setIsXbtcRepayOpen] = useState(false);
  const [isXbtcWithdrawOpen, setIsXbtcWithdrawOpen] = useState(false);
  const [loanViewMode, setLoanViewMode] = useState<LoanViewMode>("borrow-btc");
  const [refreshNonce, setRefreshNonce] = useState(0);

  const marketData = useMemo(() => {
    const exact = poolsData.find(
      (pool) =>
        pool.poolAddress.toLowerCase() === VESU_RE7_USDC_CORE_BORROW.poolAddress.toLowerCase() &&
        pool.vTokenAddress.toLowerCase() === VESU_VTOKENS.WBTC_CORE.toLowerCase()
    );
    if (exact) return exact;
    return poolsData.find(
      (pool) => pool.poolAddress.toLowerCase() === VESU_RE7_USDC_CORE_BORROW.poolAddress.toLowerCase()
    );
  }, [poolsData]);

  const debtMarketData = useMemo(() => {
    const exact = poolsData.find(
      (pool) =>
        pool.poolAddress.toLowerCase() === VESU_RE7_USDC_CORE_BORROW.poolAddress.toLowerCase() &&
        pool.vTokenAddress.toLowerCase() === VESU_VTOKENS.USDC_CORE.toLowerCase()
    );
    if (exact) return exact;
    return marketData;
  }, [poolsData, marketData]);

  const selectedPrimeOption = useMemo(
    () =>
      VESU_PRIME_COLLATERAL_OPTIONS.find(
        (option) => option.address.toLowerCase() === selectedPrimeCollateral.toLowerCase()
      ) || VESU_PRIME_COLLATERAL_OPTIONS[0],
    [selectedPrimeCollateral]
  );

  const selectedPrimePair = useMemo(() => {
    return primePairs.find(
      (pair) =>
        pair.collateralAssetAddress.toLowerCase() ===
          selectedPrimeOption.address.toLowerCase() &&
        pair.debtAssetAddress.toLowerCase() === VESU_PRIME_POOL.debtAsset.toLowerCase()
    );
  }, [primePairs, selectedPrimeOption.address]);

  const selectedPrimeSupplyApr = useMemo(() => {
    return primeSupplyAprByAsset[selectedPrimeOption.address.toLowerCase()] || "—";
  }, [primeSupplyAprByAsset, selectedPrimeOption.address]);

  const selectedXbtcOption = useMemo(
    () =>
      VESU_XBTC_COLLATERAL_OPTIONS.find(
        (option) => option.address.toLowerCase() === selectedXbtcCollateral.toLowerCase()
      ) || VESU_XBTC_COLLATERAL_OPTIONS[0],
    [selectedXbtcCollateral]
  );

  const selectedXbtcPair = useMemo(() => {
    return xbtcPairs.find(
      (pair) =>
        pair.collateralAssetAddress.toLowerCase() ===
          selectedXbtcOption.address.toLowerCase() &&
        pair.debtAssetAddress.toLowerCase() === VESU_RE7_XBTC_POOL.debtAsset.toLowerCase()
    );
  }, [xbtcPairs, selectedXbtcOption.address]);

  const selectedXbtcSupplyApr = useMemo(() => {
    return xbtcSupplyAprByAsset[selectedXbtcOption.address.toLowerCase()] || "—";
  }, [xbtcSupplyAprByAsset, selectedXbtcOption.address]);

  const saveLoanHistory = (
    hash: string,
    type: Transaction["type"],
    amount: string,
    contractLabel: string,
    to: string
  ) => {
    if (!wallet?.address) return;
    saveLocalTransaction({
      hash,
      timestamp: Math.floor(Date.now() / 1000),
      type,
      amount,
      from: wallet.address,
      to,
      status: "success",
      blockNumber: 0,
      contractLabel,
    });
  };

  useEffect(() => {
    const run = async () => {
      if (!address || hasUserSelectedPrimeCollateralRef.current) return;
      try {
        const positions = await Promise.all(
          VESU_PRIME_COLLATERAL_OPTIONS.map(async (option) => {
            const position = await getVesuLoanPosition(
              currentNetwork.rpcUrl,
              VESU_PRIME_POOL.poolAddress,
              option.address,
              VESU_PRIME_POOL.debtAsset,
              address,
              option.decimals,
              WBTC_DECIMALS
            );
            return { optionAddress: option.address, position };
          })
        );
        const active = positions.find(
          ({ position }) => position.collateralRaw > 0n || position.debtRaw > 0n
        );
        if (active) {
          setSelectedPrimeCollateral(active.optionAddress);
        }
      } catch (error) {
        console.error("Failed to determine active Prime collateral pair:", error);
      }
    };
    void run();
  }, [address, currentNetwork.rpcUrl, refreshNonce]);

  useEffect(() => {
    const run = async () => {
      if (!address || hasUserSelectedXbtcCollateralRef.current) return;
      try {
        const positions = await Promise.all(
          VESU_XBTC_COLLATERAL_OPTIONS.map(async (option) => {
            const position = await getVesuLoanPosition(
              currentNetwork.rpcUrl,
              VESU_RE7_XBTC_POOL.poolAddress,
              option.address,
              VESU_RE7_XBTC_POOL.debtAsset,
              address,
              option.decimals,
              WBTC_DECIMALS
            );
            return { optionAddress: option.address, position };
          })
        );
        const active = positions.find(
          ({ position }) => position.collateralRaw > 0n || position.debtRaw > 0n
        );
        if (active) {
          setSelectedXbtcCollateral(active.optionAddress);
        }
      } catch (error) {
        console.error("Failed to determine active Re7 xBTC collateral pair:", error);
      }
    };
    void run();
  }, [address, currentNetwork.rpcUrl, refreshNonce]);

  useEffect(() => {
    const run = async () => {
      if (!address) {
        setWbtcBalance("0");
        setUsdcBalance("0");
        setPrimeWbtcUsdtCollateralBalance("0");
        setPrimeWbtcUsdtDebtBalance("0");
        setPrimeWbtcUsdtPosition(null);
        setRe7UsdcPrimeCollateralBalance("0");
        setRe7UsdcPrimeDebtBalance("0");
        setRe7UsdcPrimePosition(null);
        return;
      }
      try {
        const [
          wbtc,
          usdc,
          position,
          primeCollateral,
          primeDebt,
          primePosition,
          re7PrimeCollateral,
          re7PrimeDebt,
          re7PrimePosition,
        ] = await Promise.all([
          fetchTokenBalance(
            currentNetwork.rpcUrl,
            VESU_RE7_USDC_CORE_BORROW.collateralAsset,
            address,
            WBTC_DECIMALS
          ),
          fetchTokenBalance(
            currentNetwork.rpcUrl,
            VESU_RE7_USDC_CORE_BORROW.debtAsset,
            address,
            USDC_DECIMALS
          ),
          getRe7WbtcUsdcLoanPosition(currentNetwork.rpcUrl, address),
          fetchTokenBalance(
            currentNetwork.rpcUrl,
            VESU_PRIME_WBTC_USDT_BORROW.collateralAsset,
            address,
            WBTC_DECIMALS
          ),
          fetchTokenBalance(
            currentNetwork.rpcUrl,
            VESU_PRIME_WBTC_USDT_BORROW.debtAsset,
            address,
            USDT_DECIMALS
          ),
          getVesuLoanPosition(
            currentNetwork.rpcUrl,
            VESU_PRIME_WBTC_USDT_BORROW.poolAddress,
            VESU_PRIME_WBTC_USDT_BORROW.collateralAsset,
            VESU_PRIME_WBTC_USDT_BORROW.debtAsset,
            address,
            WBTC_DECIMALS,
            USDT_DECIMALS
          ),
          fetchTokenBalance(
            currentNetwork.rpcUrl,
            VESU_RE7_USDC_PRIME_BORROW.collateralAsset,
            address,
            WBTC_DECIMALS
          ),
          fetchTokenBalance(
            currentNetwork.rpcUrl,
            VESU_RE7_USDC_PRIME_BORROW.debtAsset,
            address,
            USDC_DECIMALS
          ),
          getVesuLoanPosition(
            currentNetwork.rpcUrl,
            VESU_RE7_USDC_PRIME_BORROW.poolAddress,
            VESU_RE7_USDC_PRIME_BORROW.collateralAsset,
            VESU_RE7_USDC_PRIME_BORROW.debtAsset,
            address,
            WBTC_DECIMALS,
            USDC_DECIMALS
          ),
        ]);
        setWbtcBalance(wbtc);
        setUsdcBalance(usdc);
        setLoanPosition(position);
        setPrimeWbtcUsdtCollateralBalance(primeCollateral);
        setPrimeWbtcUsdtDebtBalance(primeDebt);
        setPrimeWbtcUsdtPosition(primePosition);
        setRe7UsdcPrimeCollateralBalance(re7PrimeCollateral);
        setRe7UsdcPrimeDebtBalance(re7PrimeDebt);
        setRe7UsdcPrimePosition(re7PrimePosition);
      } catch (error) {
        console.error("Failed to fetch loan balances:", error);
      }
    };
    run();
  }, [address, currentNetwork.rpcUrl, refreshNonce]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const [primePairList, xbtcPairList] = await Promise.all([
          fetchVesuPoolPairs(VESU_PRIME_POOL.poolAddress),
          fetchVesuPoolPairs(VESU_RE7_XBTC_POOL.poolAddress),
        ]);
        if (cancelled) return;
        setPrimePairs(primePairList);
        setXbtcPairs(xbtcPairList);

        const fetchOpts = { cache: "no-store" as const };
        const [primePoolRes, xbtcPoolRes, re7UsdcPrimePoolRes] = await Promise.all([
          fetch(`https://api.vesu.xyz/pools/${VESU_PRIME_POOL.poolAddress}`, fetchOpts),
          fetch(`https://api.vesu.xyz/pools/${VESU_RE7_XBTC_POOL.poolAddress}`, fetchOpts),
          fetch(`https://api.vesu.xyz/pools/${VESU_RE7_USDC_PRIME_BORROW.poolAddress}`, fetchOpts),
        ]);
        if (cancelled) return;
        const primePoolResForUsdt = primePoolRes.clone();
        const re7UsdcPrimePoolResForBorrow = re7UsdcPrimePoolRes.clone();

        const parsePoolAprs = async (
          res: Response,
          debtAddress: string,
          setSupplyMap: (m: Record<string, string>) => void,
          setBorrowApr: (s: string) => void
        ) => {
          if (!res.ok) {
            if (!cancelled) setBorrowApr("—");
            return;
          }
          const poolPayload = await res.json();
          if (cancelled) return;
          const assets = Array.isArray(poolPayload?.data?.assets) ? poolPayload.data.assets : [];

          const supplyAprMap: Record<string, string> = {};
          for (const asset of assets) {
            const addr = String(asset?.address || "").toLowerCase();
            if (!addr) continue;
            // Match Vesu UI semantics: prefer BTCfi APR, then LST APR, then base supply APY.
            const preferredSupplyStat =
              asset?.stats?.btcFiSupplyApr || asset?.stats?.lstApr || asset?.stats?.supplyApy;
            const supplyRaw = Number(preferredSupplyStat?.value || 0);
            const supplyDecimals = Number(preferredSupplyStat?.decimals || 18);
            const supplyPct = (supplyRaw / 10 ** supplyDecimals) * 100;
            supplyAprMap[addr] = Number.isFinite(supplyPct) ? `${supplyPct.toFixed(2)}%` : "—";
          }
          if (!cancelled) setSupplyMap(supplyAprMap);

          const debtAsset = assets.find(
            (asset: any) =>
              String(asset?.address || "").toLowerCase() === debtAddress.toLowerCase()
          );
          const borrowAprRaw = Number(debtAsset?.stats?.borrowApr?.value || 0);
          const borrowAprDecimals = Number(debtAsset?.stats?.borrowApr?.decimals || 18);
          const borrowAprPct = (borrowAprRaw / 10 ** borrowAprDecimals) * 100;
          if (!cancelled) {
            setBorrowApr(Number.isFinite(borrowAprPct) ? `${borrowAprPct.toFixed(2)}%` : "—");
          }
        };

        await Promise.all([
          parsePoolAprs(primePoolRes, VESU_PRIME_POOL.debtAsset, setPrimeSupplyAprByAsset, setPrimeBorrowApr),
          parsePoolAprs(xbtcPoolRes, VESU_RE7_XBTC_POOL.debtAsset, setXbtcSupplyAprByAsset, setXbtcBorrowApr),
        ]);

        if (primePoolResForUsdt.ok) {
          const primePayload = await primePoolResForUsdt.json();
          if (!cancelled) {
            const assets = Array.isArray(primePayload?.data?.assets) ? primePayload.data.assets : [];
            const collateralAsset = assets.find(
              (asset: any) =>
                String(asset?.address || "").toLowerCase() ===
                VESU_PRIME_WBTC_USDT_BORROW.collateralAsset.toLowerCase()
            );
            const debtAsset = assets.find(
              (asset: any) =>
                String(asset?.address || "").toLowerCase() ===
                VESU_PRIME_WBTC_USDT_BORROW.debtAsset.toLowerCase()
            );
            const usdtBorrowPair = (primePayload?.data?.pairs || []).find(
              (pair: any) =>
                String(pair?.collateralAssetAddress || "").toLowerCase() ===
                  VESU_PRIME_WBTC_USDT_BORROW.collateralAsset.toLowerCase() &&
                String(pair?.debtAssetAddress || "").toLowerCase() ===
                  VESU_PRIME_WBTC_USDT_BORROW.debtAsset.toLowerCase()
            );
            const preferredSupplyStat =
              collateralAsset?.stats?.btcFiSupplyApr ||
              collateralAsset?.stats?.lstApr ||
              collateralAsset?.stats?.supplyApy;
            const supplyRaw = Number(preferredSupplyStat?.value || 0);
            const supplyDecimals = Number(preferredSupplyStat?.decimals || 18);
            const supplyPct = (supplyRaw / 10 ** supplyDecimals) * 100;
            setPrimeWbtcUsdtSupplyApr(Number.isFinite(supplyPct) ? `${supplyPct.toFixed(2)}%` : "—");

            const borrowRaw = Number(debtAsset?.stats?.borrowApr?.value || 0);
            const borrowDecimals = Number(debtAsset?.stats?.borrowApr?.decimals || 18);
            const btcFiBorrowRaw = Number(usdtBorrowPair?.btcFiBorrowApr?.value || 0);
            const btcFiBorrowDecimals = Number(usdtBorrowPair?.btcFiBorrowApr?.decimals || 18);
            const borrowPct =
              (borrowRaw / 10 ** borrowDecimals) * 100 -
              (btcFiBorrowRaw / 10 ** btcFiBorrowDecimals) * 100;
            setPrimeWbtcUsdtBorrowApr(Number.isFinite(borrowPct) ? `${borrowPct.toFixed(2)}%` : "—");

            const utilizationRaw = Number(debtAsset?.stats?.currentUtilization?.value || 0);
            const utilizationDecimals = Number(debtAsset?.stats?.currentUtilization?.decimals || 18);
            const utilizationPct = (utilizationRaw / 10 ** utilizationDecimals) * 100;
            setPrimeWbtcUsdtUtilization(
              Number.isFinite(utilizationPct) ? `${utilizationPct.toFixed(2)}%` : "—"
            );
          }
        }

        if (re7UsdcPrimePoolResForBorrow.ok) {
          const re7Payload = await re7UsdcPrimePoolResForBorrow.json();
          if (!cancelled) {
            const assets = Array.isArray(re7Payload?.data?.assets) ? re7Payload.data.assets : [];
            const collateralAsset = assets.find(
              (asset: any) =>
                String(asset?.address || "").toLowerCase() ===
                VESU_RE7_USDC_PRIME_BORROW.collateralAsset.toLowerCase()
            );
            const debtAsset = assets.find(
              (asset: any) =>
                String(asset?.address || "").toLowerCase() ===
                VESU_RE7_USDC_PRIME_BORROW.debtAsset.toLowerCase()
            );
            const usdcBorrowPair = (re7Payload?.data?.pairs || []).find(
              (pair: any) =>
                String(pair?.collateralAssetAddress || "").toLowerCase() ===
                  VESU_RE7_USDC_PRIME_BORROW.collateralAsset.toLowerCase() &&
                String(pair?.debtAssetAddress || "").toLowerCase() ===
                  VESU_RE7_USDC_PRIME_BORROW.debtAsset.toLowerCase()
            );
            const preferredSupplyStat =
              collateralAsset?.stats?.btcFiSupplyApr ||
              collateralAsset?.stats?.lstApr ||
              collateralAsset?.stats?.supplyApy;
            const supplyRaw = Number(preferredSupplyStat?.value || 0);
            const supplyDecimals = Number(preferredSupplyStat?.decimals || 18);
            const supplyPct = (supplyRaw / 10 ** supplyDecimals) * 100;
            setRe7UsdcPrimeSupplyApr(Number.isFinite(supplyPct) ? `${supplyPct.toFixed(2)}%` : "—");

            const borrowRaw = Number(debtAsset?.stats?.borrowApr?.value || 0);
            const borrowDecimals = Number(debtAsset?.stats?.borrowApr?.decimals || 18);
            const btcFiBorrowRaw = Number(usdcBorrowPair?.btcFiBorrowApr?.value || 0);
            const btcFiBorrowDecimals = Number(usdcBorrowPair?.btcFiBorrowApr?.decimals || 18);
            const borrowPct =
              (borrowRaw / 10 ** borrowDecimals) * 100 -
              (btcFiBorrowRaw / 10 ** btcFiBorrowDecimals) * 100;
            setRe7UsdcPrimeBorrowApr(Number.isFinite(borrowPct) ? `${borrowPct.toFixed(2)}%` : "—");

            const utilizationRaw = Number(debtAsset?.stats?.currentUtilization?.value || 0);
            const utilizationDecimals = Number(debtAsset?.stats?.currentUtilization?.decimals || 18);
            const utilizationPct = (utilizationRaw / 10 ** utilizationDecimals) * 100;
            setRe7UsdcPrimeUtilization(
              Number.isFinite(utilizationPct) ? `${utilizationPct.toFixed(2)}%` : "—"
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch Vesu pool pair/APR data:", error);
          setPrimeBorrowApr("—");
          setXbtcBorrowApr("—");
          setPrimeWbtcUsdtBorrowApr("—");
          setPrimeWbtcUsdtSupplyApr("—");
          setPrimeWbtcUsdtUtilization("—");
          setRe7UsdcPrimeBorrowApr("—");
          setRe7UsdcPrimeSupplyApr("—");
          setRe7UsdcPrimeUtilization("—");
        }
      }
    };

    void run();
    const pollId = window.setInterval(() => void run(), VESU_POOL_APR_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
  }, [refreshNonce]);

  useEffect(() => {
    const run = async () => {
      if (!address) {
        setPrimeCollateralBalance("0");
        setPrimeLoanPosition(null);
        return;
      }
      try {
        const [balance, position] = await Promise.all([
          fetchTokenBalance(
            currentNetwork.rpcUrl,
            selectedPrimeOption.address,
            address,
            selectedPrimeOption.decimals
          ),
          getVesuLoanPosition(
            currentNetwork.rpcUrl,
            VESU_PRIME_POOL.poolAddress,
            selectedPrimeOption.address,
            VESU_PRIME_POOL.debtAsset,
            address,
            selectedPrimeOption.decimals,
            8
          ),
        ]);
        setPrimeCollateralBalance(balance);
        setPrimeLoanPosition(position);
      } catch (error) {
        console.error("Failed to fetch prime position:", error);
      }
    };
    run();
  }, [address, currentNetwork.rpcUrl, refreshNonce, selectedPrimeOption.address, selectedPrimeOption.decimals]);

  useEffect(() => {
    const run = async () => {
      if (!address) {
        setXbtcCollateralBalance("0");
        setXbtcLoanPosition(null);
        return;
      }
      try {
        const [balance, position] = await Promise.all([
          fetchTokenBalance(
            currentNetwork.rpcUrl,
            selectedXbtcOption.address,
            address,
            selectedXbtcOption.decimals
          ),
          getVesuLoanPosition(
            currentNetwork.rpcUrl,
            VESU_RE7_XBTC_POOL.poolAddress,
            selectedXbtcOption.address,
            VESU_RE7_XBTC_POOL.debtAsset,
            address,
            selectedXbtcOption.decimals,
            WBTC_DECIMALS
          ),
        ]);
        setXbtcCollateralBalance(balance);
        setXbtcLoanPosition(position);
      } catch (error) {
        console.error("Failed to fetch Re7 xBTC position:", error);
      }
    };
    run();
  }, [address, currentNetwork.rpcUrl, refreshNonce, selectedXbtcOption.address, selectedXbtcOption.decimals]);

  const handleBorrow = async (collateralAmount: string, borrowAmount: string) => {
    if (!wallet || !address) {
      throw new Error("Wallet not connected");
    }

    const collateralRaw = BigInt(
      Math.floor((parseFloat(collateralAmount || "0") || 0) * 10 ** WBTC_DECIMALS)
    );
    const borrowRaw = BigInt(
      Math.floor((parseFloat(borrowAmount || "0") || 0) * 10 ** USDC_DECIMALS)
    );

    if (collateralRaw <= 0n && borrowRaw <= 0n) {
      throw new Error("Enter collateral and/or borrow amount");
    }

    if (collateralRaw > 0n) {
      toast.loading("Checking WBTC approval...", { id: "borrow-status" });
      const allowance = await checkAllowance(
        currentNetwork.rpcUrl,
        VESU_RE7_USDC_CORE_BORROW.collateralAsset,
        wallet.address,
        VESU_RE7_USDC_CORE_BORROW.poolAddress
      );

      if (allowance < collateralRaw) {
        toast.loading("Approving WBTC collateral...", { id: "borrow-status" });
        const approveTx = await approveToken(
          wallet,
          VESU_RE7_USDC_CORE_BORROW.collateralAsset,
          VESU_RE7_USDC_CORE_BORROW.poolAddress,
          MAX_UINT256
        );
        await wallet.waitForTransaction(approveTx, {
          retryInterval: 3000,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          timeout: 180000,
        });
      }
    }

    toast.loading("Submitting borrow position transaction...", { id: "borrow-status" });
    const txHash = await openRe7WbtcUsdcBorrowPosition(
      wallet,
      wallet.address,
      collateralRaw,
      borrowRaw
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "borrow",
      `${collateralAmount || "0"} WBTC / ${borrowAmount || "0"} USDC`,
      "Vesu Re7 USDC Core",
      VESU_RE7_USDC_CORE_BORROW.poolAddress
    );

    toast.success("Borrow position updated successfully", { id: "borrow-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handlePrimeWbtcUsdtBorrow = async (collateralAmount: string, borrowAmount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");

    const collateralRaw = BigInt(
      Math.floor((parseFloat(collateralAmount || "0") || 0) * 10 ** WBTC_DECIMALS)
    );
    const borrowRaw = BigInt(
      Math.floor((parseFloat(borrowAmount || "0") || 0) * 10 ** USDT_DECIMALS)
    );
    if (collateralRaw <= 0n && borrowRaw <= 0n) {
      throw new Error("Enter collateral and/or borrow amount");
    }

    if (collateralRaw > 0n) {
      toast.loading("Checking WBTC approval...", { id: "prime-usdt-borrow-status" });
      const allowance = await checkAllowance(
        currentNetwork.rpcUrl,
        VESU_PRIME_WBTC_USDT_BORROW.collateralAsset,
        wallet.address,
        VESU_PRIME_WBTC_USDT_BORROW.poolAddress
      );
      if (allowance < collateralRaw) {
        toast.loading("Approving WBTC collateral...", { id: "prime-usdt-borrow-status" });
        const approveTx = await approveToken(
          wallet,
          VESU_PRIME_WBTC_USDT_BORROW.collateralAsset,
          VESU_PRIME_WBTC_USDT_BORROW.poolAddress,
          MAX_UINT256
        );
        await wallet.waitForTransaction(approveTx, {
          retryInterval: 3000,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          timeout: 180000,
        });
      }
    }

    toast.loading("Submitting Prime WBTC/USDT borrow transaction...", {
      id: "prime-usdt-borrow-status",
    });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_PRIME_WBTC_USDT_BORROW.poolAddress,
      VESU_PRIME_WBTC_USDT_BORROW.collateralAsset,
      VESU_PRIME_WBTC_USDT_BORROW.debtAsset,
      wallet.address,
      collateralRaw,
      borrowRaw
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "borrow",
      `${collateralAmount || "0"} WBTC / ${borrowAmount || "0"} USDT`,
      "Vesu Prime WBTC/USDT",
      VESU_PRIME_WBTC_USDT_BORROW.poolAddress
    );
    toast.success("Prime WBTC/USDT position updated", { id: "prime-usdt-borrow-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handlePrimeWbtcUsdtRepay = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const repayRaw = BigInt(Math.floor((parseFloat(amount || "0") || 0) * 10 ** USDT_DECIMALS));
    if (repayRaw <= 0n) throw new Error("Invalid repay amount");

    toast.loading("Checking USDT approval...", { id: "prime-usdt-repay-status" });
    const allowance = await checkAllowance(
      currentNetwork.rpcUrl,
      VESU_PRIME_WBTC_USDT_BORROW.debtAsset,
      wallet.address,
      VESU_PRIME_WBTC_USDT_BORROW.poolAddress
    );
    if (allowance < repayRaw) {
      toast.loading("Approving USDT for repay...", { id: "prime-usdt-repay-status" });
      const approveTx = await approveToken(
        wallet,
        VESU_PRIME_WBTC_USDT_BORROW.debtAsset,
        VESU_PRIME_WBTC_USDT_BORROW.poolAddress,
        MAX_UINT256
      );
      await wallet.waitForTransaction(approveTx, {
        retryInterval: 3000,
        successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        timeout: 180000,
      });
    }

    toast.loading("Submitting Prime WBTC/USDT repay transaction...", {
      id: "prime-usdt-repay-status",
    });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_PRIME_WBTC_USDT_BORROW.poolAddress,
      VESU_PRIME_WBTC_USDT_BORROW.collateralAsset,
      VESU_PRIME_WBTC_USDT_BORROW.debtAsset,
      wallet.address,
      0n,
      -repayRaw
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "repay",
      `${amount || "0"} USDT`,
      "Vesu Prime WBTC/USDT",
      VESU_PRIME_WBTC_USDT_BORROW.poolAddress
    );
    toast.success("Prime WBTC/USDT repay successful", { id: "prime-usdt-repay-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handlePrimeWbtcUsdtWithdrawCollateral = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const withdrawRaw = BigInt(Math.floor((parseFloat(amount || "0") || 0) * 10 ** WBTC_DECIMALS));
    if (withdrawRaw <= 0n) throw new Error("Invalid withdraw amount");

    toast.loading("Submitting Prime WBTC collateral withdraw...", {
      id: "prime-usdt-withdraw-status",
    });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_PRIME_WBTC_USDT_BORROW.poolAddress,
      VESU_PRIME_WBTC_USDT_BORROW.collateralAsset,
      VESU_PRIME_WBTC_USDT_BORROW.debtAsset,
      wallet.address,
      -withdrawRaw,
      0n
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "withdraw_collateral",
      `${amount || "0"} WBTC`,
      "Vesu Prime WBTC/USDT",
      VESU_PRIME_WBTC_USDT_BORROW.poolAddress
    );
    toast.success("Prime WBTC collateral withdrawn", { id: "prime-usdt-withdraw-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handleRe7UsdcPrimeBorrow = async (collateralAmount: string, borrowAmount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");

    const collateralRaw = BigInt(
      Math.floor((parseFloat(collateralAmount || "0") || 0) * 10 ** WBTC_DECIMALS)
    );
    const borrowRaw = BigInt(
      Math.floor((parseFloat(borrowAmount || "0") || 0) * 10 ** USDC_DECIMALS)
    );
    if (collateralRaw <= 0n && borrowRaw <= 0n) {
      throw new Error("Enter collateral and/or borrow amount");
    }

    if (collateralRaw > 0n) {
      toast.loading("Checking WBTC approval...", { id: "re7-usdc-prime-borrow-status" });
      const allowance = await checkAllowance(
        currentNetwork.rpcUrl,
        VESU_RE7_USDC_PRIME_BORROW.collateralAsset,
        wallet.address,
        VESU_RE7_USDC_PRIME_BORROW.poolAddress
      );
      if (allowance < collateralRaw) {
        toast.loading("Approving WBTC collateral...", { id: "re7-usdc-prime-borrow-status" });
        const approveTx = await approveToken(
          wallet,
          VESU_RE7_USDC_PRIME_BORROW.collateralAsset,
          VESU_RE7_USDC_PRIME_BORROW.poolAddress,
          MAX_UINT256
        );
        await wallet.waitForTransaction(approveTx, {
          retryInterval: 3000,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          timeout: 180000,
        });
      }
    }

    toast.loading("Submitting Re7 USDC Prime borrow transaction...", {
      id: "re7-usdc-prime-borrow-status",
    });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_RE7_USDC_PRIME_BORROW.poolAddress,
      VESU_RE7_USDC_PRIME_BORROW.collateralAsset,
      VESU_RE7_USDC_PRIME_BORROW.debtAsset,
      wallet.address,
      collateralRaw,
      borrowRaw
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "borrow",
      `${collateralAmount || "0"} WBTC / ${borrowAmount || "0"} USDC`,
      "Vesu Re7 USDC Prime",
      VESU_RE7_USDC_PRIME_BORROW.poolAddress
    );
    toast.success("Re7 USDC Prime position updated", { id: "re7-usdc-prime-borrow-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handleRe7UsdcPrimeRepay = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const repayRaw = BigInt(Math.floor((parseFloat(amount || "0") || 0) * 10 ** USDC_DECIMALS));
    if (repayRaw <= 0n) throw new Error("Invalid repay amount");

    toast.loading("Checking USDC approval...", { id: "re7-usdc-prime-repay-status" });
    const allowance = await checkAllowance(
      currentNetwork.rpcUrl,
      VESU_RE7_USDC_PRIME_BORROW.debtAsset,
      wallet.address,
      VESU_RE7_USDC_PRIME_BORROW.poolAddress
    );
    if (allowance < repayRaw) {
      toast.loading("Approving USDC for repay...", { id: "re7-usdc-prime-repay-status" });
      const approveTx = await approveToken(
        wallet,
        VESU_RE7_USDC_PRIME_BORROW.debtAsset,
        VESU_RE7_USDC_PRIME_BORROW.poolAddress,
        MAX_UINT256
      );
      await wallet.waitForTransaction(approveTx, {
        retryInterval: 3000,
        successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        timeout: 180000,
      });
    }

    toast.loading("Submitting Re7 USDC Prime repay transaction...", {
      id: "re7-usdc-prime-repay-status",
    });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_RE7_USDC_PRIME_BORROW.poolAddress,
      VESU_RE7_USDC_PRIME_BORROW.collateralAsset,
      VESU_RE7_USDC_PRIME_BORROW.debtAsset,
      wallet.address,
      0n,
      -repayRaw
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "repay",
      `${amount || "0"} USDC`,
      "Vesu Re7 USDC Prime",
      VESU_RE7_USDC_PRIME_BORROW.poolAddress
    );
    toast.success("Re7 USDC Prime repay successful", { id: "re7-usdc-prime-repay-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handleRe7UsdcPrimeWithdrawCollateral = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const withdrawRaw = BigInt(Math.floor((parseFloat(amount || "0") || 0) * 10 ** WBTC_DECIMALS));
    if (withdrawRaw <= 0n) throw new Error("Invalid withdraw amount");

    toast.loading("Submitting Re7 USDC Prime collateral withdraw...", {
      id: "re7-usdc-prime-withdraw-status",
    });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_RE7_USDC_PRIME_BORROW.poolAddress,
      VESU_RE7_USDC_PRIME_BORROW.collateralAsset,
      VESU_RE7_USDC_PRIME_BORROW.debtAsset,
      wallet.address,
      -withdrawRaw,
      0n
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "withdraw_collateral",
      `${amount || "0"} WBTC`,
      "Vesu Re7 USDC Prime",
      VESU_RE7_USDC_PRIME_BORROW.poolAddress
    );
    toast.success("Re7 USDC Prime collateral withdrawn", { id: "re7-usdc-prime-withdraw-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handlePrimeBorrow = async (collateralAmount: string, borrowAmount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");

    const collateralRaw = BigInt(
      Math.floor((parseFloat(collateralAmount || "0") || 0) * 10 ** selectedPrimeOption.decimals)
    );
    const borrowRaw = BigInt(Math.floor((parseFloat(borrowAmount || "0") || 0) * 10 ** 8));
    if (collateralRaw <= 0n && borrowRaw <= 0n) {
      throw new Error("Enter collateral and/or borrow amount");
    }

    if (collateralRaw > 0n) {
      toast.loading(`Checking ${selectedPrimeOption.symbol} approval...`, { id: "prime-borrow-status" });
      const allowance = await checkAllowance(
        currentNetwork.rpcUrl,
        selectedPrimeOption.address,
        wallet.address,
        VESU_PRIME_POOL.poolAddress
      );
      if (allowance < collateralRaw) {
        toast.loading(`Approving ${selectedPrimeOption.symbol} collateral...`, {
          id: "prime-borrow-status",
        });
        const approveTx = await approveToken(
          wallet,
          selectedPrimeOption.address,
          VESU_PRIME_POOL.poolAddress,
          MAX_UINT256
        );
        await wallet.waitForTransaction(approveTx, {
          retryInterval: 3000,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          timeout: 180000,
        });
      }
    }

    toast.loading("Submitting Vesu Prime borrow transaction...", { id: "prime-borrow-status" });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_PRIME_POOL.poolAddress,
      selectedPrimeOption.address,
      VESU_PRIME_POOL.debtAsset,
      wallet.address,
      collateralRaw,
      borrowRaw
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "borrow",
      `${collateralAmount || "0"} ${selectedPrimeOption.symbol} / ${borrowAmount || "0"} WBTC`,
      "Vesu Prime Borrow WBTC",
      VESU_PRIME_POOL.poolAddress
    );
    toast.success("Vesu Prime position updated", { id: "prime-borrow-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handlePrimeRepay = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const repayRaw = BigInt(Math.floor((parseFloat(amount || "0") || 0) * 10 ** 8));
    if (repayRaw <= 0n) throw new Error("Invalid repay amount");

    toast.loading("Checking WBTC approval for repay...", { id: "prime-repay-status" });
    const allowance = await checkAllowance(
      currentNetwork.rpcUrl,
      VESU_PRIME_POOL.debtAsset,
      wallet.address,
      VESU_PRIME_POOL.poolAddress
    );
    if (allowance < repayRaw) {
      toast.loading("Approving WBTC for repay...", { id: "prime-repay-status" });
      const approveTx = await approveToken(
        wallet,
        VESU_PRIME_POOL.debtAsset,
        VESU_PRIME_POOL.poolAddress,
        MAX_UINT256
      );
      await wallet.waitForTransaction(approveTx, {
        retryInterval: 3000,
        successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        timeout: 180000,
      });
    }

    toast.loading("Submitting Vesu Prime repay transaction...", { id: "prime-repay-status" });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_PRIME_POOL.poolAddress,
      selectedPrimeOption.address,
      VESU_PRIME_POOL.debtAsset,
      wallet.address,
      0n,
      -repayRaw
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "repay",
      `${amount || "0"} WBTC`,
      "Vesu Prime Borrow WBTC",
      VESU_PRIME_POOL.poolAddress
    );
    toast.success("Vesu Prime repay successful", { id: "prime-repay-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handlePrimeWithdrawCollateral = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const withdrawRaw = BigInt(
      Math.floor((parseFloat(amount || "0") || 0) * 10 ** selectedPrimeOption.decimals)
    );
    if (withdrawRaw <= 0n) throw new Error("Invalid withdraw amount");

    toast.loading("Submitting Vesu Prime collateral withdraw...", {
      id: "prime-withdraw-status",
    });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_PRIME_POOL.poolAddress,
      selectedPrimeOption.address,
      VESU_PRIME_POOL.debtAsset,
      wallet.address,
      -withdrawRaw,
      0n
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "withdraw_collateral",
      `${amount || "0"} ${selectedPrimeOption.symbol}`,
      "Vesu Prime Borrow WBTC",
      VESU_PRIME_POOL.poolAddress
    );
    toast.success("Vesu Prime collateral withdrawn", { id: "prime-withdraw-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handleXbtcBorrow = async (collateralAmount: string, borrowAmount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");

    const collateralRaw = BigInt(
      Math.floor((parseFloat(collateralAmount || "0") || 0) * 10 ** selectedXbtcOption.decimals)
    );
    const borrowRaw = BigInt(Math.floor((parseFloat(borrowAmount || "0") || 0) * 10 ** WBTC_DECIMALS));
    if (collateralRaw <= 0n && borrowRaw <= 0n) {
      throw new Error("Enter collateral and/or borrow amount");
    }

    if (collateralRaw > 0n) {
      toast.loading(`Checking ${selectedXbtcOption.symbol} approval...`, { id: "xbtc-borrow-status" });
      const allowance = await checkAllowance(
        currentNetwork.rpcUrl,
        selectedXbtcOption.address,
        wallet.address,
        VESU_RE7_XBTC_POOL.poolAddress
      );
      if (allowance < collateralRaw) {
        toast.loading(`Approving ${selectedXbtcOption.symbol} collateral...`, {
          id: "xbtc-borrow-status",
        });
        const approveTx = await approveToken(
          wallet,
          selectedXbtcOption.address,
          VESU_RE7_XBTC_POOL.poolAddress,
          MAX_UINT256
        );
        await wallet.waitForTransaction(approveTx, {
          retryInterval: 3000,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          timeout: 180000,
        });
      }
    }

    toast.loading("Submitting Re7 xBTC borrow transaction...", { id: "xbtc-borrow-status" });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_RE7_XBTC_POOL.poolAddress,
      selectedXbtcOption.address,
      VESU_RE7_XBTC_POOL.debtAsset,
      wallet.address,
      collateralRaw,
      borrowRaw
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "borrow",
      `${collateralAmount || "0"} ${selectedXbtcOption.symbol} / ${borrowAmount || "0"} WBTC`,
      "Vesu Re7 xBTC",
      VESU_RE7_XBTC_POOL.poolAddress
    );
    toast.success("Re7 xBTC position updated", { id: "xbtc-borrow-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handleXbtcRepay = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const repayRaw = BigInt(Math.floor((parseFloat(amount || "0") || 0) * 10 ** WBTC_DECIMALS));
    if (repayRaw <= 0n) throw new Error("Invalid repay amount");

    toast.loading("Checking WBTC approval for repay...", { id: "xbtc-repay-status" });
    const allowance = await checkAllowance(
      currentNetwork.rpcUrl,
      VESU_RE7_XBTC_POOL.debtAsset,
      wallet.address,
      VESU_RE7_XBTC_POOL.poolAddress
    );
    if (allowance < repayRaw) {
      toast.loading("Approving WBTC for repay...", { id: "xbtc-repay-status" });
      const approveTx = await approveToken(
        wallet,
        VESU_RE7_XBTC_POOL.debtAsset,
        VESU_RE7_XBTC_POOL.poolAddress,
        MAX_UINT256
      );
      await wallet.waitForTransaction(approveTx, {
        retryInterval: 3000,
        successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        timeout: 180000,
      });
    }

    toast.loading("Submitting Re7 xBTC repay transaction...", { id: "xbtc-repay-status" });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_RE7_XBTC_POOL.poolAddress,
      selectedXbtcOption.address,
      VESU_RE7_XBTC_POOL.debtAsset,
      wallet.address,
      0n,
      -repayRaw
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "repay",
      `${amount || "0"} WBTC`,
      "Vesu Re7 xBTC",
      VESU_RE7_XBTC_POOL.poolAddress
    );
    toast.success("Re7 xBTC repay successful", { id: "xbtc-repay-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handleXbtcWithdrawCollateral = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const withdrawRaw = BigInt(
      Math.floor((parseFloat(amount || "0") || 0) * 10 ** selectedXbtcOption.decimals)
    );
    if (withdrawRaw <= 0n) throw new Error("Invalid withdraw amount");

    toast.loading("Submitting Re7 xBTC collateral withdraw...", {
      id: "xbtc-withdraw-status",
    });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_RE7_XBTC_POOL.poolAddress,
      selectedXbtcOption.address,
      VESU_RE7_XBTC_POOL.debtAsset,
      wallet.address,
      -withdrawRaw,
      0n
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "withdraw_collateral",
      `${amount || "0"} ${selectedXbtcOption.symbol}`,
      "Vesu Re7 xBTC",
      VESU_RE7_XBTC_POOL.poolAddress
    );
    toast.success("Re7 xBTC collateral withdrawn", { id: "xbtc-withdraw-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handleSelectPrimeCollateral = (collateralAddress: string) => {
    hasUserSelectedPrimeCollateralRef.current = true;
    setSelectedPrimeCollateral(collateralAddress);
  };

  const handleSelectXbtcCollateral = (collateralAddress: string) => {
    hasUserSelectedXbtcCollateralRef.current = true;
    setSelectedXbtcCollateral(collateralAddress);
  };

  const handleRepay = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const repayRaw = BigInt(Math.floor((parseFloat(amount || "0") || 0) * 10 ** USDC_DECIMALS));
    if (repayRaw <= 0n) throw new Error("Invalid repay amount");

    toast.loading("Checking USDC approval...", { id: "repay-status" });
    const allowance = await checkAllowance(
      currentNetwork.rpcUrl,
      VESU_RE7_USDC_CORE_BORROW.debtAsset,
      wallet.address,
      VESU_RE7_USDC_CORE_BORROW.poolAddress
    );
    if (allowance < repayRaw) {
      toast.loading("Approving USDC for repay...", { id: "repay-status" });
      const approveTx = await approveToken(
        wallet,
        VESU_RE7_USDC_CORE_BORROW.debtAsset,
        VESU_RE7_USDC_CORE_BORROW.poolAddress,
        MAX_UINT256
      );
      await wallet.waitForTransaction(approveTx, {
        retryInterval: 3000,
        successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        timeout: 180000,
      });
    }

    toast.loading("Submitting repay transaction...", { id: "repay-status" });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_RE7_USDC_CORE_BORROW.poolAddress,
      VESU_RE7_USDC_CORE_BORROW.collateralAsset,
      VESU_RE7_USDC_CORE_BORROW.debtAsset,
      wallet.address,
      0n,
      -repayRaw
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "repay",
      `${amount || "0"} USDC`,
      "Vesu Re7 USDC Core",
      VESU_RE7_USDC_CORE_BORROW.poolAddress
    );
    toast.success("Repay successful", { id: "repay-status" });
    setRefreshNonce((v) => v + 1);
  };

  const handleWithdrawCollateral = async (amount: string) => {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const withdrawRaw = BigInt(
      Math.floor((parseFloat(amount || "0") || 0) * 10 ** WBTC_DECIMALS)
    );
    if (withdrawRaw <= 0n) throw new Error("Invalid withdraw amount");

    toast.loading("Submitting collateral withdraw...", { id: "withdraw-collateral-status" });
    const txHash = await modifyVesuPosition(
      wallet,
      VESU_RE7_USDC_CORE_BORROW.poolAddress,
      VESU_RE7_USDC_CORE_BORROW.collateralAsset,
      VESU_RE7_USDC_CORE_BORROW.debtAsset,
      wallet.address,
      -withdrawRaw,
      0n
    );
    await wallet.waitForTransaction(txHash, {
      retryInterval: 5000,
      successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      timeout: 180000,
    });
    saveLoanHistory(
      txHash,
      "withdraw_collateral",
      `${amount || "0"} WBTC`,
      "Vesu Re7 USDC Core",
      VESU_RE7_USDC_CORE_BORROW.poolAddress
    );
    toast.success("Collateral withdrawn", { id: "withdraw-collateral-status" });
    setRefreshNonce((v) => v + 1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-4xl bg-[#101D22] p-6">
        <h1 className="mb-2 text-3xl font-medium text-white">Loans</h1>
        <p className="text-gray-400">
          Borrow WBTC, USDC, or other assets by supplying a specified collateral.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-gray-700 bg-[#0F1A1F] p-1">
          <button
            type="button"
            onClick={() => setLoanViewMode("borrow-btc")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              loanViewMode === "borrow-btc"
                ? "bg-[#97FCE4] text-black"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Borrow Bitcoin using other assets as collateral
          </button>
          <button
            type="button"
            onClick={() => setLoanViewMode("borrow-other")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              loanViewMode === "borrow-other"
                ? "bg-[#97FCE4] text-black"
                : "text-gray-300 hover:text-white"
            }`}
          >
            Use bitcoin as collateral to borrow other assets
          </button>
        </div>
      </div>

      {loanViewMode === "borrow-other" && (
        <>
      <div className="rounded-3xl border border-gray-800 bg-[#101D22] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-medium text-white">Re7 USDC Core - WBTC/USDC</h2>
            <p className="mt-1 text-sm text-gray-400">
              Borrow USDC while supplying WBTC as collateral.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Borrow APR</div>
            <div className="text-xl font-semibold text-[#97FCE4]">
              {debtMarketData?.borrowAPY || "—"}
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Supply APR</div>
            <div className="mt-1 text-lg text-white">{marketData?.supplyAPY || "—"}</div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Utilization</div>
            <div className="mt-1 text-lg text-white">
              {debtMarketData?.utilization || marketData?.utilization || "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Your Wallet</div>
            <div className="mt-1 text-white">WBTC: {wbtcBalance}</div>
            <div className="text-white">USDC: {usdcBalance}</div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Supplied Collateral</div>
            <div className="mt-1 text-white">{loanPosition?.collateralAmount.toFixed(6) || "0"} WBTC</div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Borrowed Debt</div>
            <div className="mt-1 text-white">{loanPosition?.debtAmount.toFixed(2) || "0"} USDC</div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Current LTV</div>
            <div className="mt-1 text-white">
              {loanPosition ? `${(loanPosition.currentLtv * 100).toFixed(2)}%` : "0%"}
            </div>
            <div className="text-xs text-gray-500">
              Max {(loanPosition ? loanPosition.maxLtv * 100 : 0).toFixed(2)}%
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Liquidation Price ({selectedPrimeOption.symbol})</div>
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
            disabled={isLoading}
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
      </div>

      <div className="rounded-3xl border border-gray-800 bg-[#101D22] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-medium text-white">Re7 USDC Prime - WBTC/USDC</h2>
            <p className="mt-1 text-sm text-gray-400">
              Supply WBTC as collateral and borrow USDC on Re7 USDC Prime.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Supply APR</div>
            <div className="text-xl font-semibold text-[#97FCE4]">{re7UsdcPrimeSupplyApr}</div>
            <div className="mt-1 text-sm text-gray-400">Borrow APR</div>
            <div className="text-xl font-semibold text-[#97FCE4]">{re7UsdcPrimeBorrowApr}</div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Utilization</div>
            <div className="mt-1 text-lg text-white">{re7UsdcPrimeUtilization}</div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Your Wallet</div>
            <div className="mt-1 text-white">WBTC: {re7UsdcPrimeCollateralBalance}</div>
            <div className="text-white">USDC: {re7UsdcPrimeDebtBalance}</div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Current LTV</div>
            <div className="mt-1 text-white">
              {re7UsdcPrimePosition
                ? `${(re7UsdcPrimePosition.currentLtv * 100).toFixed(2)}%`
                : "0.00%"}
            </div>
            <div className="text-xs text-gray-500">
              Max {(re7UsdcPrimePosition ? re7UsdcPrimePosition.maxLtv * 100 : 0).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Supplied Collateral</div>
            <div className="mt-1 text-white">
              {re7UsdcPrimePosition?.collateralAmount.toFixed(6) || "0.000000"} WBTC
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Borrowed Debt</div>
            <div className="mt-1 text-white">
              {re7UsdcPrimePosition?.debtAmount.toFixed(2) || "0.00"} USDC
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Liquidation Price ({selectedXbtcOption.symbol})</div>
            <div className="mt-1 text-white">
              $
              {re7UsdcPrimePosition?.liquidationPriceUsd
                ? re7UsdcPrimePosition.liquidationPriceUsd.toLocaleString(undefined, {
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
              setIsRe7UsdcPrimeBorrowOpen(true);
            }}
            className="rounded-full bg-[#97FCE4] px-6 py-3 font-medium text-black transition-colors hover:bg-[#85E6D1]"
            disabled={isLoading}
          >
            Borrow / Supply
          </button>
          <button
            type="button"
            onClick={() => setIsRe7UsdcPrimeRepayOpen(true)}
            className="rounded-full bg-[#101D22] px-6 py-3 font-medium text-white ring-1 ring-gray-700 transition-colors hover:bg-[#15242b]"
            disabled={!re7UsdcPrimePosition || re7UsdcPrimePosition.debtRaw <= 0n}
          >
            Repay
          </button>
          <button
            type="button"
            onClick={() => setIsRe7UsdcPrimeWithdrawOpen(true)}
            className="rounded-full bg-[#101D22] px-6 py-3 font-medium text-white ring-1 ring-gray-700 transition-colors hover:bg-[#15242b]"
            disabled={!re7UsdcPrimePosition || re7UsdcPrimePosition.collateralRaw <= 0n}
          >
            Withdraw Collateral
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-800 bg-[#101D22] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-medium text-white">Prime - WBTC/USDT</h2>
            <p className="mt-1 text-sm text-gray-400">
              Supply WBTC as collateral and borrow USDT on Prime.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Supply APR</div>
            <div className="text-xl font-semibold text-[#97FCE4]">{primeWbtcUsdtSupplyApr}</div>
            <div className="mt-1 text-sm text-gray-400">Borrow APR</div>
            <div className="text-xl font-semibold text-[#97FCE4]">{primeWbtcUsdtBorrowApr}</div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Utilization</div>
            <div className="mt-1 text-lg text-white">{primeWbtcUsdtUtilization}</div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Your Wallet</div>
            <div className="mt-1 text-white">WBTC: {primeWbtcUsdtCollateralBalance}</div>
            <div className="text-white">USDT: {primeWbtcUsdtDebtBalance}</div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Current LTV</div>
            <div className="mt-1 text-white">
              {primeWbtcUsdtPosition
                ? `${(primeWbtcUsdtPosition.currentLtv * 100).toFixed(2)}%`
                : "0.00%"}
            </div>
            <div className="text-xs text-gray-500">
              Max {(primeWbtcUsdtPosition ? primeWbtcUsdtPosition.maxLtv * 100 : 0).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Supplied Collateral</div>
            <div className="mt-1 text-white">
              {primeWbtcUsdtPosition?.collateralAmount.toFixed(6) || "0.000000"} WBTC
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Borrowed Debt</div>
            <div className="mt-1 text-white">
              {primeWbtcUsdtPosition?.debtAmount.toFixed(2) || "0.00"} USDT
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Liquidation Price (WBTC)</div>
            <div className="mt-1 text-white">
              $
              {primeWbtcUsdtPosition?.liquidationPriceUsd
                ? primeWbtcUsdtPosition.liquidationPriceUsd.toLocaleString(undefined, {
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
              setIsPrimeWbtcUsdtBorrowOpen(true);
            }}
            className="rounded-full bg-[#97FCE4] px-6 py-3 font-medium text-black transition-colors hover:bg-[#85E6D1]"
            disabled={isLoading}
          >
            Borrow / Supply
          </button>
          <button
            type="button"
            onClick={() => setIsPrimeWbtcUsdtRepayOpen(true)}
            className="rounded-full bg-[#101D22] px-6 py-3 font-medium text-white ring-1 ring-gray-700 transition-colors hover:bg-[#15242b]"
            disabled={!primeWbtcUsdtPosition || primeWbtcUsdtPosition.debtRaw <= 0n}
          >
            Repay
          </button>
          <button
            type="button"
            onClick={() => setIsPrimeWbtcUsdtWithdrawOpen(true)}
            className="rounded-full bg-[#101D22] px-6 py-3 font-medium text-white ring-1 ring-gray-700 transition-colors hover:bg-[#15242b]"
            disabled={!primeWbtcUsdtPosition || primeWbtcUsdtPosition.collateralRaw <= 0n}
          >
            Withdraw Collateral
          </button>
        </div>
      </div>
        </>
      )}

      {loanViewMode === "borrow-btc" && (
        <>
      <div className="rounded-3xl border border-gray-800 bg-[#101D22] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-medium text-white">Vesu Prime - Borrow WBTC</h2>
            <p className="mt-1 text-sm text-gray-400">
              Select a collateral pair and borrow WBTC with pair-specific risk limits.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Supply APR</div>
            <div className="text-xl font-semibold text-[#97FCE4]">{selectedPrimeSupplyApr}</div>
            <div className="mt-1 text-sm text-gray-400">Borrow APR</div>
            <div className="text-xl font-semibold text-[#97FCE4]">{primeBorrowApr}</div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-[#0F1A1F] p-4">
          <div className="mb-2 text-sm font-medium text-gray-300">Collateral Asset</div>
          <select
            value={selectedPrimeOption.address}
            onChange={(e) => handleSelectPrimeCollateral(e.target.value)}
            className="w-full rounded-xl border border-[#97FCE4]/40 bg-[#101D22] px-4 py-3 text-base font-semibold text-white outline-none transition-colors focus:border-[#97FCE4] focus:ring-2 focus:ring-[#97FCE4]/30 md:w-64"
          >
            {VESU_PRIME_COLLATERAL_OPTIONS.map((option) => (
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
              {selectedPrimeOption.symbol} / WBTC
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Max LTV</div>
            <div className="mt-1 text-white">
              {selectedPrimePair ? `${(selectedPrimePair.maxLtv * 100).toFixed(2)}%` : "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Liquidation LTV</div>
            <div className="mt-1 text-white">
              {selectedPrimePair
                ? `${(selectedPrimePair.liquidationLtv * 100).toFixed(2)}%`
                : "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Liquidation bonus</div>
            <div className="mt-1 text-white">
              {selectedPrimePair
                ? `${selectedPrimePair.liquidationBonus.toFixed(2)}%`
                : "—"}
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="mb-1 text-gray-400">Supplied Collateral</div>
            <div className="text-white">
              {primeLoanPosition?.collateralAmount?.toFixed(6) || "0.000000"}{" "}
              {selectedPrimeOption.symbol}
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Borrowed Debt</div>
            <div className="mt-1 text-white">
              {primeLoanPosition?.debtAmount?.toFixed(8) || "0.00000000"} WBTC
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Current LTV</div>
            <div className="mt-1 text-white">
              {primeLoanPosition ? `${(primeLoanPosition.currentLtv * 100).toFixed(2)}%` : "0.00%"}
            </div>
            <div className="text-xs text-gray-500">
              Max {(selectedPrimePair?.maxLtv ? selectedPrimePair.maxLtv * 100 : 0).toFixed(2)}%
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Liquidation Price (WBTC)</div>
            <div className="mt-1 text-white">
              $
              {primeLoanPosition?.liquidationPriceUsd
                ? primeLoanPosition.liquidationPriceUsd.toLocaleString(undefined, {
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
              setIsPrimeBorrowOpen(true);
            }}
            className="rounded-full bg-[#97FCE4] px-6 py-3 font-medium text-black transition-colors hover:bg-[#85E6D1]"
            disabled={isLoading}
          >
            Prime Borrow / Supply
          </button>
          <button
            type="button"
            onClick={() => setIsPrimeRepayOpen(true)}
            className="rounded-full bg-[#101D22] px-6 py-3 font-medium text-white ring-1 ring-gray-700 transition-colors hover:bg-[#15242b]"
            disabled={!primeLoanPosition || primeLoanPosition.debtRaw <= 0n}
          >
            Prime Repay
          </button>
          <button
            type="button"
            onClick={() => setIsPrimeWithdrawOpen(true)}
            className="rounded-full bg-[#101D22] px-6 py-3 font-medium text-white ring-1 ring-gray-700 transition-colors hover:bg-[#15242b]"
            disabled={!primeLoanPosition || primeLoanPosition.collateralRaw <= 0n}
          >
            Prime Withdraw Collateral
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-800 bg-[#101D22] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-medium text-white">Re7 xBTC - Borrow WBTC</h2>
            <p className="mt-1 text-sm text-gray-400">
              Choose xtBTC, xWBTC, xsBTC, mRe7BTC, or xLBTC as collateral and borrow WBTC from the same
              pool.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Supply APR</div>
            <div className="text-xl font-semibold text-[#97FCE4]">{selectedXbtcSupplyApr}</div>
            <div className="mt-1 text-sm text-gray-400">Borrow APR</div>
            <div className="text-xl font-semibold text-[#97FCE4]">{xbtcBorrowApr}</div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-[#0F1A1F] p-4">
          <div className="mb-2 text-sm font-medium text-gray-300">Collateral Asset</div>
          <select
            value={selectedXbtcOption.address}
            onChange={(e) => handleSelectXbtcCollateral(e.target.value)}
            className="w-full rounded-xl border border-[#97FCE4]/40 bg-[#101D22] px-4 py-3 text-base font-semibold text-white outline-none transition-colors focus:border-[#97FCE4] focus:ring-2 focus:ring-[#97FCE4]/30 md:w-64"
          >
            {VESU_XBTC_COLLATERAL_OPTIONS.map((option) => (
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
              {selectedXbtcOption.symbol} / WBTC
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Max LTV</div>
            <div className="mt-1 text-white">
              {selectedXbtcPair ? `${(selectedXbtcPair.maxLtv * 100).toFixed(2)}%` : "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Liquidation LTV</div>
            <div className="mt-1 text-white">
              {selectedXbtcPair
                ? `${(selectedXbtcPair.liquidationLtv * 100).toFixed(2)}%`
                : "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Liquidation bonus</div>
            <div className="mt-1 text-white">
              {selectedXbtcPair
                ? `${selectedXbtcPair.liquidationBonus.toFixed(2)}%`
                : "—"}
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="mb-1 text-gray-400">Supplied Collateral</div>
            <div className="text-white">
              {xbtcLoanPosition?.collateralAmount?.toFixed(6) || "0.000000"}{" "}
              {selectedXbtcOption.symbol}
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Borrowed Debt</div>
            <div className="mt-1 text-white">
              {xbtcLoanPosition?.debtAmount?.toFixed(8) || "0.00000000"} WBTC
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Current LTV</div>
            <div className="mt-1 text-white">
              {xbtcLoanPosition ? `${(xbtcLoanPosition.currentLtv * 100).toFixed(2)}%` : "0.00%"}
            </div>
            <div className="text-xs text-gray-500">
              Max {(selectedXbtcPair?.maxLtv ? selectedXbtcPair.maxLtv * 100 : 0).toFixed(2)}%
            </div>
          </div>
          <div className="rounded-2xl bg-[#0F1A1F] p-4">
            <div className="text-gray-400">Liquidation Price (WBTC)</div>
            <div className="mt-1 text-white">
              $
              {xbtcLoanPosition?.liquidationPriceUsd
                ? xbtcLoanPosition.liquidationPriceUsd.toLocaleString(undefined, {
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
              setIsXbtcBorrowOpen(true);
            }}
            className="rounded-full bg-[#97FCE4] px-6 py-3 font-medium text-black transition-colors hover:bg-[#85E6D1]"
            disabled={isLoading}
          >
            xBTC Borrow / Supply
          </button>
          <button
            type="button"
            onClick={() => setIsXbtcRepayOpen(true)}
            className="rounded-full bg-[#101D22] px-6 py-3 font-medium text-white ring-1 ring-gray-700 transition-colors hover:bg-[#15242b]"
            disabled={!xbtcLoanPosition || xbtcLoanPosition.debtRaw <= 0n}
          >
            xBTC Repay
          </button>
          <button
            type="button"
            onClick={() => setIsXbtcWithdrawOpen(true)}
            className="rounded-full bg-[#101D22] px-6 py-3 font-medium text-white ring-1 ring-gray-700 transition-colors hover:bg-[#15242b]"
            disabled={!xbtcLoanPosition || xbtcLoanPosition.collateralRaw <= 0n}
          >
            xBTC Withdraw Collateral
          </button>
        </div>
      </div>
        </>
      )}

      <VesuBorrowModal
        isOpen={isBorrowOpen}
        onClose={() => setIsBorrowOpen(false)}
        onSubmit={handleBorrow}
        collateralBalance={wbtcBalance}
        borrowApr={debtMarketData?.borrowAPY || "—"}
        supplyApr={marketData?.supplyAPY || "—"}
        utilization={debtMarketData?.utilization || marketData?.utilization}
        existingCollateralAmount={loanPosition?.collateralAmount || 0}
        existingDebtAmount={loanPosition?.debtAmount || 0}
        collateralPriceUsd={loanPosition?.collateralPriceUsd || 0}
        debtPriceUsd={loanPosition?.debtPriceUsd || 0}
        maxLtv={loanPosition?.maxLtv || 0}
      />

      <VesuBorrowModal
        isOpen={isPrimeWbtcUsdtBorrowOpen}
        onClose={() => setIsPrimeWbtcUsdtBorrowOpen(false)}
        onSubmit={handlePrimeWbtcUsdtBorrow}
        title="Borrow USDT with WBTC"
        collateralSymbol="WBTC"
        debtSymbol="USDT"
        debtDecimals={USDT_DECIMALS}
        collateralBalance={primeWbtcUsdtCollateralBalance}
        borrowApr={primeWbtcUsdtBorrowApr}
        supplyApr={primeWbtcUsdtSupplyApr}
        utilization={primeWbtcUsdtUtilization}
        existingCollateralAmount={primeWbtcUsdtPosition?.collateralAmount || 0}
        existingDebtAmount={primeWbtcUsdtPosition?.debtAmount || 0}
        collateralPriceUsd={primeWbtcUsdtPosition?.collateralPriceUsd || 0}
        debtPriceUsd={primeWbtcUsdtPosition?.debtPriceUsd || 0}
        maxLtv={primeWbtcUsdtPosition?.maxLtv || 0}
      />

      <VesuBorrowModal
        isOpen={isRe7UsdcPrimeBorrowOpen}
        onClose={() => setIsRe7UsdcPrimeBorrowOpen(false)}
        onSubmit={handleRe7UsdcPrimeBorrow}
        title="Borrow USDC with WBTC"
        collateralSymbol="WBTC"
        debtSymbol="USDC"
        debtDecimals={USDC_DECIMALS}
        collateralBalance={re7UsdcPrimeCollateralBalance}
        borrowApr={re7UsdcPrimeBorrowApr}
        supplyApr={re7UsdcPrimeSupplyApr}
        utilization={re7UsdcPrimeUtilization}
        existingCollateralAmount={re7UsdcPrimePosition?.collateralAmount || 0}
        existingDebtAmount={re7UsdcPrimePosition?.debtAmount || 0}
        collateralPriceUsd={re7UsdcPrimePosition?.collateralPriceUsd || 0}
        debtPriceUsd={re7UsdcPrimePosition?.debtPriceUsd || 0}
        maxLtv={re7UsdcPrimePosition?.maxLtv || 0}
      />

      <VesuLoanManageModal
        isOpen={isRepayOpen}
        onClose={() => setIsRepayOpen(false)}
        mode="repay"
        onSubmit={handleRepay}
        maxAmount={loanPosition?.debtAmount?.toString() || "0"}
        assetSymbol="USDC"
      />

      <VesuLoanManageModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        mode="withdraw"
        onSubmit={handleWithdrawCollateral}
        maxAmount={loanPosition?.collateralAmount?.toString() || "0"}
        assetSymbol="WBTC"
      />

      <VesuLoanManageModal
        isOpen={isPrimeWbtcUsdtRepayOpen}
        onClose={() => setIsPrimeWbtcUsdtRepayOpen(false)}
        mode="repay"
        onSubmit={handlePrimeWbtcUsdtRepay}
        maxAmount={primeWbtcUsdtPosition?.debtAmount?.toString() || "0"}
        assetSymbol="USDT"
      />

      <VesuLoanManageModal
        isOpen={isPrimeWbtcUsdtWithdrawOpen}
        onClose={() => setIsPrimeWbtcUsdtWithdrawOpen(false)}
        mode="withdraw"
        onSubmit={handlePrimeWbtcUsdtWithdrawCollateral}
        maxAmount={primeWbtcUsdtPosition?.collateralAmount?.toString() || "0"}
        assetSymbol="WBTC"
      />

      <VesuLoanManageModal
        isOpen={isRe7UsdcPrimeRepayOpen}
        onClose={() => setIsRe7UsdcPrimeRepayOpen(false)}
        mode="repay"
        onSubmit={handleRe7UsdcPrimeRepay}
        maxAmount={re7UsdcPrimePosition?.debtAmount?.toString() || "0"}
        assetSymbol="USDC"
      />

      <VesuLoanManageModal
        isOpen={isRe7UsdcPrimeWithdrawOpen}
        onClose={() => setIsRe7UsdcPrimeWithdrawOpen(false)}
        mode="withdraw"
        onSubmit={handleRe7UsdcPrimeWithdrawCollateral}
        maxAmount={re7UsdcPrimePosition?.collateralAmount?.toString() || "0"}
        assetSymbol="WBTC"
      />

      <VesuPrimeBorrowModal
        isOpen={isPrimeBorrowOpen}
        onClose={() => setIsPrimeBorrowOpen(false)}
        currentSupplyApr={selectedPrimeSupplyApr}
        pairOptions={VESU_PRIME_COLLATERAL_OPTIONS}
        selectedCollateral={selectedPrimeOption.address}
        onSelectCollateral={handleSelectPrimeCollateral}
        collateralBalance={primeCollateralBalance}
        currentBorrowApr={primeBorrowApr}
        pairStats={selectedPrimePair}
        existingCollateralAmount={primeLoanPosition?.collateralAmount || 0}
        existingDebtAmount={primeLoanPosition?.debtAmount || 0}
        collateralPriceUsd={primeLoanPosition?.collateralPriceUsd || 0}
        debtPriceUsd={primeLoanPosition?.debtPriceUsd || 0}
        onSubmit={handlePrimeBorrow}
      />

      <VesuLoanManageModal
        isOpen={isPrimeRepayOpen}
        onClose={() => setIsPrimeRepayOpen(false)}
        mode="repay"
        onSubmit={handlePrimeRepay}
        maxAmount={primeLoanPosition?.debtAmount?.toString() || "0"}
        assetSymbol="WBTC"
      />

      <VesuLoanManageModal
        isOpen={isPrimeWithdrawOpen}
        onClose={() => setIsPrimeWithdrawOpen(false)}
        mode="withdraw"
        onSubmit={handlePrimeWithdrawCollateral}
        maxAmount={primeLoanPosition?.collateralAmount?.toString() || "0"}
        assetSymbol={selectedPrimeOption.symbol}
      />

      <VesuPrimeBorrowModal
        isOpen={isXbtcBorrowOpen}
        onClose={() => setIsXbtcBorrowOpen(false)}
        title="Re7 xBTC Borrow WBTC"
        pairOptions={VESU_XBTC_COLLATERAL_OPTIONS}
        selectedCollateral={selectedXbtcOption.address}
        onSelectCollateral={handleSelectXbtcCollateral}
        collateralBalance={xbtcCollateralBalance}
        currentBorrowApr={xbtcBorrowApr}
        currentSupplyApr={selectedXbtcSupplyApr}
        pairStats={selectedXbtcPair}
        existingCollateralAmount={xbtcLoanPosition?.collateralAmount || 0}
        existingDebtAmount={xbtcLoanPosition?.debtAmount || 0}
        collateralPriceUsd={xbtcLoanPosition?.collateralPriceUsd || 0}
        debtPriceUsd={xbtcLoanPosition?.debtPriceUsd || 0}
        onSubmit={handleXbtcBorrow}
      />

      <VesuLoanManageModal
        isOpen={isXbtcRepayOpen}
        onClose={() => setIsXbtcRepayOpen(false)}
        mode="repay"
        onSubmit={handleXbtcRepay}
        maxAmount={xbtcLoanPosition?.debtAmount?.toString() || "0"}
        assetSymbol="WBTC"
      />

      <VesuLoanManageModal
        isOpen={isXbtcWithdrawOpen}
        onClose={() => setIsXbtcWithdrawOpen(false)}
        mode="withdraw"
        onSubmit={handleXbtcWithdrawCollateral}
        maxAmount={xbtcLoanPosition?.collateralAmount?.toString() || "0"}
        assetSymbol={selectedXbtcOption.symbol}
      />
    </div>
  );
}


