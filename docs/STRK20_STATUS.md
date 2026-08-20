# STRK20 privacy — current status

Snapshot of what is in the `privacy` branch as of 19 Aug 2026. Plan (what we intended): [STRK20_PRIVACY_PLAN.md](./STRK20_PRIVACY_PLAN.md). Scoring file: [`strk20.json`](../strk20.json).

---

## What the product does now

Private mode is an extra path. Public Vesu / Troves / AVNU / Layerswap are unchanged.

| Surface | Behavior |
|---|---|
| Connect | Tries `WalletAccountV6` (STRK20). Falls back to `WalletAccount` so Braavos still works publicly. |
| Dashboard | Shield / unshield WBTC & USDC. Shielded balances. Public / Private toggle. **Private send** (note-to-note). |
| Yield | Private lend/withdraw on Re7 USDC Core **USDC and WBTC**. Troves and extra pools stay public-only. |
| Swap | Private AVNU swap if the sell token is already shielded. Untested on mainnet. |
| History | Local rows: `shield`, `unshield`, `private-lend`, `private-swap`, `private-transfer`. |
| Docs / README | Private-mode copy: identity private; Vesu/AVNU **amounts** public. |

Wallet: **Ready**, Wallet API `>= 0.10.3`. Viewing keys stay in the wallet. YieldStark never stores them.

Addresses:

- Pool: `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`
- Vesu helper: `0x028b49bc7a48b92d06d436d90e889729d7161dfc2fef3f16b674029bf7abc336`

---

## Private send (new)

Dashboard → **Private send**. Token USDC or WBTC, amount from **shielded** balance, recipient `0x…`.

Calls `transferShielded` → Wallet API `type: "transfer"` (not `"OPEN"`). Both parties must be **registered** in the pool. If the recipient is not enrolled, the wallet returns `NOT_REGISTERED` (or similar). Enroll via Ready or [strk20.starknet.io/app](https://strk20.starknet.io/app).

This is the actually private transfer: no public amount/parties on the note-to-note leg. Shield/unshield remain public edges.

---

## Done vs not done

### In the app

- starknet.js `^10.4` (resolved 10.7) + `@avnu/avnu-sdk` `^4.2`
- STRK20 detection, shield/unshield, shielded balances
- Private Vesu deposit/withdraw (two Core markets)
- Public / Private toggle
- Private send UI
- Private swap **code path**
- Docs + this status note

### Not in the app / not proven

- In-app viewing-key registration (wallet / official app only — we do not hold keys)
- Private swap **proven** on mainnet (may need a server paymaster for `sponsored_private`)
- Ready E2E: connect → shield → private lend → unshield (needs your wallet + funds)
- Public lend / swap / bridge regression after starknet 10 (typecheck only)
- `strk20.json` txs, demo URL, video, hackathon registry PR

### Out of sprint (protocol limits)

Private Troves LP (no official helper), private Vesu borrow (`modify_position` ≠ ERC-4626 helper), sub-accounts (Wallet API not ready), confidential/enclave routing, bridge-straight-into-the-pool (bridge public, then shield).

---

## Why the site stuck on Loading… (fixed)

Symptom: infinite console errors `unsupported channel for spec version: 0.8.1` in `<StarknetProvider>`.

Cause: `starknet@10` removed RPC 0.8.x. `@starknet-react/core` `publicProvider()` still passed `0.8.1`.

Fix: `app/providers/starknet-provider.tsx` now uses `jsonRpcProvider` + `specVersion: "0.9.0"` (`app/lib/utils/rpcProvider.ts`).


This is a React Router + Vite app that **SSR-renders only “Loading…”** (`ClientOnlyApp` in `app/root.tsx`) so wallet/window code does not run on the server.

Effects:

1. **First HTML has no route tree.** Vite cannot see dashboard/yield/swap/Layerswap until the client hydrates.
2. **Then it discovers huge deps in waves** (`starknet`, wagmi/viem, Layerswap, AVNU). Each wave used to **invalidate the optimizer and full-reload** — often **60–90s per wave on Windows**.
3. **`holdUntilCrawlEnd: true`** made it worse: the first request waited for a crawl that never saw the real graph.
4. After a lockfile change (starknet 10 / AVNU 4.2), Vite **re-optimizes from scratch** (`Re-optimizing dependencies because lockfile has changed`).
5. **Port 5173 already in use** starts a second server on 5174; the old 5173 tab looks “broken.”

What we changed in `vite.config.ts`: `holdUntilCrawlEnd: false`, prebundle `@avnu/avnu-sdk` + Layerswap/wagmi/viem, extra warmup files. The **first** `npm run dev` after a lockfile change can still take a few minutes while esbuild prebundles. Later starts should be faster. Kill extra Node/Vite processes so you only hit one port.

If you still sit on “Loading…” for minutes: wait for the first optimize, hard-refresh, or delete `node_modules/.vite` and restart once.

---

## How to try it

```bash
npm run dev
```

1. Ready on **mainnet**, Wallet API 0.10.3+.
2. Register in the pool if you have not (Ready or the official STRK20 app).
3. Dashboard: Shield a small USDC or WBTC amount (this step **is public**).
4. Yield → Private → lend on Re7 USDC Core.
5. Dashboard → Private send to another registered address.
6. Optional: Swap with Private on and a shielded sell token.

Fill `strk20.json` `transactions` with three hashes that **succeeded and touched the pool**. Relayer txs will not show your address as sender — that is expected.
