import { useState, useEffect } from "react";
import Layout from "~/components/layout/Layout";

const SECTIONS = [
  { id: "introduction", label: "Introduction" },
  { id: "what-is-yieldstark", label: "What is YieldStark?" },
  { id: "features", label: "Features" },
  { id: "bridge", label: "Bridge" },
  { id: "deposits", label: "Deposits" },
  { id: "withdrawals", label: "Withdrawals" },
  { id: "earn-yield", label: "Earn Yield" },
  { id: "swap", label: "Swap" },
  { id: "private-mode", label: "Private mode" },
  { id: "fees", label: "Fees" },
] as const;

export default function DocsPage() {
  const [activeId, setActiveId] = useState<string>("introduction");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Layout showSidebar={true}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="bg-[#101D22] rounded-4xl p-6">
          <h1 className="text-3xl font-medium text-white mb-1">Documentation</h1>
          <p className="text-gray-400">How YieldStark works and how to use it</p>
        </div>

        {/* In-content nav: horizontal strip so it's clearly part of Docs, not app nav */}
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeId === id
                  ? "bg-[#97FCE4] text-black"
                  : "bg-[#101D22] text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Single-column content */}
        <div className="bg-[#101D22] rounded-4xl p-6 lg:p-8 max-w-3xl space-y-10">
          <section id="introduction" className="scroll-mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Introduction</h2>
            <p className="text-gray-400 leading-relaxed">
              YieldStark is an all-in-one Bitcoin platform on Starknet that allows you to swap,
              earn yield, and stake your Bitcoin.
            </p>
          </section>

          <section id="what-is-yieldstark" className="scroll-mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">What is YieldStark?</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              YieldStark is an all-in-one Bitcoin platform on Starknet. You can swap tokens, earn
              yield on your Bitcoin (WBTC), and stake—all from one non-custodial dashboard. You
              connect your wallet; we never hold your funds. Deposit into audited protocols (Vesu,
              TrovesFi/Ekubo) and keep full control of your assets.
            </p>
            <ul className="text-gray-400 space-y-1 list-disc list-inside">
              <li>Swap — Exchange tokens on Starknet to get WBTC or USDC</li>
              <li>Earn yield — Lend or provide liquidity and earn APY</li>
              <li>Stake — Stake your Bitcoin (staking coming soon)</li>
              <li>Non-custodial — your keys, your crypto</li>
              <li>Starknet-native — fast, low-fee L2</li>
            </ul>
          </section>

          <section id="features" className="scroll-mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Features</h2>
            <ul className="text-gray-400 space-y-3">
              <li>
                <strong className="text-gray-300">Dashboard</strong> — Total balance, positions
                (Vesu & Ekubo), and your supplied value.
              </li>
              <li>
                <strong className="text-gray-300">Yield</strong> — Lend WBTC/USDC on Vesu or
                provide liquidity to TrovesFi Ekubo pools and earn APY.
              </li>
              <li>
                <strong className="text-gray-300">Send & Receive</strong> — Move WBTC to any
                Starknet address.
              </li>
              <li>
                <strong className="text-gray-300">Bridge</strong> — Move supported assets into
                or out of Starknet, non-custodially, via Layerswap.
              </li>
              <li>
                <strong className="text-gray-300">Swap</strong> — Swap tokens on Starknet to get
                WBTC or USDC for depositing.
              </li>
              <li>
                <strong className="text-gray-300">History</strong> — Deposit, withdrawal, and
                transfer history.
              </li>
              <li>
                <strong className="text-gray-300">Settings</strong> — Manage wallet and
                disconnect.
              </li>
            </ul>
          </section>

          <section id="bridge" className="scroll-mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Bridge</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              The Bridge page moves supported assets into or out of Starknet using{" "}
              <a
                href="https://layerswap.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#97FCE4] hover:underline"
              >
                Layerswap
              </a>
              , a third-party non-custodial bridge. YieldStark never takes custody of bridged
              funds: you connect source and destination wallets, sign the transfer, and
              Layerswap settles assets directly to your own address on the destination chain.
            </p>
            <ul className="text-gray-400 space-y-2">
              <li>
                <strong className="text-gray-300">Deposit</strong> — Send a supported asset from
                another chain; it arrives in your connected Starknet wallet.
              </li>
              <li>
                <strong className="text-gray-300">Withdraw</strong> — Send a supported asset from
                your Starknet wallet to another chain.
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              Bridged assets can then be deposited into Vesu or TrovesFi from the Yield page like
              any other tokens in your wallet.
            </p>
          </section>

          <section id="deposits" className="scroll-mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Deposits</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              You deposit from your connected wallet into Vesu pools or TrovesFi (Ekubo) vaults.
            </p>
            <ul className="text-gray-400 space-y-2">
              <li>
                <strong className="text-gray-300">Vesu</strong> — Choose a pool, approve the
                vToken once, then deposit. You receive vTokens that accrue yield.
              </li>
              <li>
                <strong className="text-gray-300">TrovesFi (Ekubo)</strong> — Deposit equal value
                of both tokens (e.g. WBTC + USDC). You receive vault shares; redeem later for your
                share of the pool.
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              All deposits are on Starknet; confirm in your wallet. Balances update after
              confirmation.
            </p>
          </section>

          <section id="withdrawals" className="scroll-mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Withdrawals</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              You can withdraw your supplied assets back to your wallet at any time (subject to
              protocol liquidity).
            </p>
            <ul className="text-gray-400 space-y-2">
              <li>
                <strong className="text-gray-300">Vesu</strong> — Use “Withdraw” in the lend
                modal: burn vTokens and receive the underlying asset to your wallet.
              </li>
              <li>
                <strong className="text-gray-300">TrovesFi (Ekubo)</strong> — Use “Redeem”: redeem
                vault shares and receive your share of WBTC and USDC (or USDC.e) back.
              </li>
            </ul>
          </section>

          <section id="earn-yield" className="scroll-mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Earn Yield</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Yield comes from the underlying protocols, not from YieldStark.
            </p>
            <ul className="text-gray-400 space-y-2">
              <li>
                <strong className="text-gray-300">Vesu</strong> — Lending APY from borrowers.
                APY varies by pool and utilization.
              </li>
              <li>
                <strong className="text-gray-300">TrovesFi (Ekubo)</strong> — Fee-based APY from
                concentrated liquidity. APY is 7d fee annualized; impermanent loss may apply.
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              “Current Positions” on the dashboard shows your supplied value in USD and APY per
              protocol.
            </p>
          </section>

          <section id="swap" className="scroll-mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Swap</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              The Swap page lets you exchange tokens on Starknet (e.g. ETH or STRK for WBTC or
              USDC). Use it to get assets before depositing into Vesu or TrovesFi. Swaps are
              executed by integrated DEX aggregators; you sign in your wallet and pay network and
              DEX fees.
            </p>
            <p className="text-gray-400 leading-relaxed">
              YieldStark charges an <strong className="text-gray-300">integrator fee</strong> on
              swaps (0.6%). This is in addition to any DEX or network fees shown on the swap
              interface.
            </p>
          </section>

          <section id="private-mode" className="scroll-mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Private mode</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Private mode uses STRK20 through a Ready wallet (Wallet API 0.10.3+). YieldStark
              never holds viewing keys. The wallet proves and submits.
            </p>
            <ul className="text-gray-400 space-y-2">
              <li>
                <strong className="text-gray-300">Shield / unshield</strong> — Public ERC-20
                legs. Your address, token, and amount are visible at that edge. Deposits are
                screened on-chain (FPI).
              </li>
              <li>
                <strong className="text-gray-300">Private Vesu lend</strong> — vToken shares
                land as notes. Identity is private. Amounts on the Vesu helper leg are public
                (open notes). APY is the same as the public pool.
              </li>
              <li>
                <strong className="text-gray-300">Private AVNU swap</strong> — Sell token must
                already be shielded. Swap size is public; who swapped is not.
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              Public mode keeps working if STRK20 is unavailable. Troves LP and Vesu borrows
              stay public-only. See{" "}
              <a href="/docs" className="text-[#97FCE4] hover:underline">
                in-app docs
              </a>{" "}
              and the repo plan at{" "}
              <code className="text-gray-300">docs/STRK20_PRIVACY_PLAN.md</code>.
            </p>
          </section>

          <section id="fees" className="scroll-mt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Fees</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              What you pay when using YieldStark and the protocols:
            </p>
            <ul className="text-gray-400 space-y-2">
              <li>
                <strong className="text-gray-300">Starknet gas</strong> — For deposit, withdraw,
                and transfer. Amount depends on network congestion.
              </li>
              <li>
                <strong className="text-gray-300">Vesu / TrovesFi</strong> — No extra fee from
                YieldStark. Protocols may have their own fees (e.g. performance fees on TrovesFi).
              </li>
              <li>
                <strong className="text-gray-300">Swap</strong> — DEX spread or fees as shown on
                the swap interface, plus a 0.6% YieldStark integrator fee.
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              We do not charge deposit or withdrawal fees. You only pay gas and any
              protocol/DEX fees shown at the time of the action.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
