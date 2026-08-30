# STRK20 Privacy Integration Plan — YieldStark

Plan to add a **private yield mode** to YieldStark for the [STRK20 Private Sprint](https://strk20.starknet.io/hackathon) (Aug 14–31, 2026). Maps to official idea **IDEA-16 / Private yield account**: hold shielded assets, lend on Vesu, and swap without linking positions to the user’s public wallet.

This is an integration plan, not an implementation log. Existing public Vesu / Troves / AVNU flows stay as they are. Privacy is a **mode**, not a rewrite.

---

## 1. Goal

Ship a working mainnet product a real user can open:

1. Connect a STRK20-capable wallet (Ready).
2. Shield WBTC / USDC into the live STRK20 pool.
3. Lend privately into Vesu (vToken shares land as private notes).
4. Optionally swap privately via AVNU.
5. See shielded balances and a public demo.

That is enough to score on the sprint. Sub-accounts, confidential routing, Troves LP anonymizers, and private borrows are stretch, not the MVP.

## 2. Why this product

YieldStark already does public yield on Vesu, Troves, and AVNU. STRK20 is the missing layer: **same yield surface, no public balance sheet**.

| Today (public) | After (private mode) |
|---|---|
| `account.execute` on vToken `deposit` | Wallet `strk20InvokeTransaction` → pool → Vesu anonymizer |
| ERC-20 `balance_of(wallet)` | Wallet `strk20Balances([token])` |
| AVNU `executeSwap` | AVNU `executePrivateSwap` (no custom Cairo) |
| Positions tied to one address | Notes in the pool; observers see pool ↔ helper, not the user |

Official Vesu helper is already on mainnet:

- Helper: [`0x028b49bc7a48b92d06d436d90e889729d7161dfc2fef3f16b674029bf7abc336`](https://voyager.online/contract/0x028b49bc7a48b92d06d436d90e889729d7161dfc2fef3f16b674029bf7abc336)
- Pattern: pool withdraws assets to helper → helper `deposit`/`withdraw` on vToken → credits vToken (or underlying) to an **open note**

Do **not** hold viewing keys in the app. Use the **Wallet API** (Ready + starknet.js). The wallet proves and submits.

## 3. Current YieldStark surface (what we hook)

| Area | Files | Hook |
|---|---|---|
| Wallet connect | `app/components/layout/Header.tsx` | `WalletAccount.connect` via get-starknet. Upgrade to `WalletAccountV6` + STRK20 methods. |
| Wallet state | `app/stores/wallet-store.ts` | Add shielded balances, privacy-capable flag, public vs private mode. |
| Public lend | `app/lib/services/vesu.ts` `depositToVesu` / `withdrawFromVesu` | Keep. Add `depositToVesuPrivate` / `withdrawFromVesuPrivate` beside them. |
| Yield UI | `app/routes/dashboard.yield.tsx`, `VesuLendModal.tsx` | Privacy toggle: same pools, private path when on. |
| Swap | `app/lib/avnu-swap.ts` | Add `runPrivateSwap` using `@avnu/avnu-sdk` `executePrivateSwap`. |
| Dashboard | `app/routes/dashboard.index.tsx` | Show shielded WBTC/USDC next to public balances. |
| Tokens | `app/lib/utils/Constants.ts` | Reuse `WBTC_ADDRESS`, `USDC_ADDRESS`. Add STRK20 pool + Vesu helper addresses. |
| Nav | `app/components/layout/Sidebar.tsx` | Optional “Privacy” item, or a toggle on Yield. |

Dependencies today that **must** change:

- `starknet`: `^8.5.4` → pin `^10.4.0` (STRK20 Wallet API lives here; `latest` 10.0.x does **not** have it)
- `@avnu/avnu-sdk`: `^4.0.1` → `^4.2.0` (private swap helpers)
- Wallet: Ready with Wallet API `>= 0.10.3`. Braavos is fine for public mode; gate private actions if STRK20 methods are missing.

## 4. Architecture

```
User (Ready wallet)
        │
        │  Wallet API 0.10.3
        │  strk20InvokeTransaction / strk20Balances
        ▼
YieldStark UI  ── public mode ──► existing vesu.ts / avnu-swap.ts
        │
        └── private mode ──► app/lib/services/strk20.ts
                                    │
                    ┌───────────────┼────────────────┐
                    ▼               ▼                ▼
              Shield/Unshield   Vesu helper      AVNU private swap
              (pool deposit)    (open note +     (AVNU executor,
                                invoke)           no Cairo)
                    │               │
                    ▼               ▼
              STRK20 privacy pool (mainnet)
                    │
                    └── InvokeExternal ──► Vesu lending anonymizer
                                           └── vToken.deposit / withdraw
```

Atomic private lend (one tx):

1. `transfer` with amount `"OPEN"` — creates the open note for vToken shares.
2. `invoke` on the Vesu helper with `${openNoteIds[0]}` in calldata.
3. Pool withdraws underlying to helper → helper deposits into Vesu → pool credits shares to the open note.

Observers see: pool → helper → Vesu. They do not see who initiated it. **Amounts on the Vesu leg are public** (open notes). Identity is private.

## 5. Sprint scope

Deadline: **August 31, 23:59 UTC**. Winners: **September 4**.

### Must ship (MVP)

- [ ] Hackathon registration PR
- [ ] starknet.js 10.4 + Ready STRK20 detection
- [ ] Shield / unshield WBTC and USDC
- [ ] Read shielded balances in the UI
- [ ] Private Vesu deposit + withdraw on **one** pool (Re7 USDC Core USDC or WBTC)
- [ ] Public vs private toggle on Yield (do not break public flows)
- [ ] Live demo URL, 3-minute video, `strk20.json` with ≥3 mainnet txs that touched the pool

### Should ship if time

- [ ] Private AVNU swap (sell token already shielded)
- [ ] Private lend on both USDC and WBTC Vesu pools already in `VESU_LENDING_POOLS`
- [ ] Private transfer (send shielded to another registered user)
- [ ] History row type `shield` / `private-lend` / `unshield` (no amounts leaked beyond what the chain already shows)

### Out of sprint (do not block on these)

- Private sub-accounts (Wallet API not ready; SDK-only today)
- Confidential compute / Enclave routing
- Troves dual-token LP anonymizer (no official helper; would need new Cairo + audit)
- Private Vesu **borrow** (`modify_position` is not the ERC-4626 helper)
- Layerswap / BTC bridge into the pool (use public bridge, then shield)

## 6. Phased build

### Phase 0 — Register (day 0)

1. Make sure this repo is **public**, MIT (already), with a first commit.
2. Fork [starkience/strk20-hackathon](https://github.com/starkience/strk20-hackathon).
3. Add to `registry.json`:

```json
{
  "repo_url": "https://github.com/<org>/mainnet-v2",
  "telegram": ["<handle>"],
  "name": "YieldStark",
  "one_liner": "Private yield on Starknet — shield, lend on Vesu, swap on AVNU",
  "category": "DeFi",
  "inspired_by": "IDEA-16"
}
```

4. Open the PR. Merging adds the project to the hub.
5. Add root `strk20.json` (fill hashes as they land):

```json
{
  "transactions": [],
  "contracts": [
    "0x028b49bc7a48b92d06d436d90e889729d7161dfc2fef3f16b674029bf7abc336"
  ],
  "demo_video": "",
  "demo_url": ""
}
```

Hub refreshes every 30 minutes. Push often — recency is the leaderboard, judging is separate.

### Phase 1 — Wallet + shield (days 1–3)

**Deps**

```bash
npm install starknet@^10.4.0 @avnu/avnu-sdk@^4.2.0
```

Pin 10.4.x. Confirm `@starknet-react/core` still builds; Header already uses `WalletAccount` from `starknet` + get-starknet, not react-query execute, so this is the main upgrade surface.

**New files**

- `app/lib/services/strk20.ts` — pool address, Vesu helper, `isStrk20Wallet`, `shield`, `unshield`, `getShieldedBalances`, `lendVesuPrivate`, `withdrawVesuPrivate`
- `app/lib/config.ts` — `STRK20_CONFIG` (pool, helper, supported tokens)
- `app/hooks/useStrk20.ts` — thin React wrapper over the wallet account in Zustand (or starknet-start `useStrk20` if it drops in cleanly)

**Wallet**

- After connect, probe `strk20Balances` / wallet API version.
- Store `privacySupported: boolean`.
- If missing: keep public mode, show “Install Ready with STRK20” for private actions.

**UI**

- Dashboard: **Shielded** row for WBTC / USDC.
- Modal: Shield (public → pool) and Unshield (pool → public address).
- Deposit screening is on-chain (FPI). Surface wallet errors; do not try to bypass.

**First three mainnet txs (hackathon bar)**

1. Shield USDC (or WBTC).
2. Unshield a dust amount, **or** private lend (phase 2).
3. A second shield / private transfer / private swap.

Each hash must succeed **and** touch the STRK20 pool.

### Phase 2 — Private Vesu lend (days 4–8) — core product

Reuse existing pool list in `app/lib/services/vesu.ts`. Private path only needs `assetAddress`, `vTokenAddress`, decimals.

Call shape (Wallet API):

```ts
const actions: STRK20_ACTION[] = [
  {
    type: "transfer",
    token: vTokenAddress,
    amount: "OPEN",
    recipient: userAddress,
  },
  {
    type: "invoke",
    contract: VESU_LENDING_HELPER,
    calldata: [
      /* LendingOperation::Deposit = 0 */
      0,
      underlyingAddress,
      vTokenAddress,
      assetsLow,
      assetsHigh,
      "${openNoteIds[0]}",
    ],
  },
]

await account.strk20PrepareInvoke(actions, true) // dry-run
const { transaction_hash } = await account.strk20InvokeTransaction(actions)
```

Withdraw is the reverse: open note for **underlying**, `operation = 1`, `in_token = vToken`, `out_token = underlying`.

**UI**

- `VesuLendModal`: if private mode, balances from `strk20Balances`, submit via `lendVesuPrivate`.
- Yield cards: badge **Private** when mode is on.
- Copy: “Your Vesu shares sit as notes. APY is the same pool APY. Amounts on the Vesu leg are visible; your identity is not.”

**Start with one market:** Re7 USDC Core / USDC (`vesu-usdc-core`) — 6 decimals, liquid, matches the official helper docs. Then WBTC.

Do not private-wrap Troves in this phase. Dual-asset LP needs a new anonymizer.

### Phase 3 — Private AVNU swap (days 9–11)

No Cairo. Sell token **must already be shielded**.

```ts
import {
  createStrk20WalletProver,
  executePrivateSwap,
  PRIVACY_POOL_ADDRESS,
} from "@avnu/avnu-sdk"

const prover = createStrk20WalletProver(walletAccount)
const { transactionHash } = await executePrivateSwap({
  quote,
  slippage: 0.01,
  takerAddress: walletAccount.address,
  poolAddress: PRIVACY_POOL_ADDRESS,
  feeMode: { poolFeeToken: quote.sellTokenAddress },
  prover,
})
```

Wire in `app/lib/avnu-swap.ts` as `runPrivateSwap`. Swap page: private toggle; disable if sell token shielded balance is 0.

Bump `@avnu/avnu-sdk` to `^4.2.0` and re-test public `executeSwap` so the 0.6% integrator fee path does not break.

### Phase 4 — Product UI (parallel with 2–3)

- Sidebar or Yield header: **Public / Private** segmented control.
- Overview: public balances + shielded balances (never mix them in one number without labeling).
- Empty states: not connected / wallet has no STRK20 / nothing shielded yet.
- Docs page: short “Private mode” section (what is hidden vs public).
- Do not log viewing keys, notes, or full action payloads.

### Phase 5 — Ship for judging (days 12–16)

Judging weights: 30% STRK20 depth, 30% working mainnet product, 25% innovation, 15% docs/OSS.

| Criterion | How YieldStark hits it |
|---|---|
| Integration depth | Shield + unshield + Vesu anonymizer invoke + (if possible) AVNU private swap |
| Working product | Demo anyone can open; ≥3 pool txs; no login wall |
| Innovation | Private yield account on an existing BTC/USDC yield app, not a toy shield demo |
| Docs | README + this plan + in-app copy + license |

Checklist:

- [ ] Demo deployed (GitHub Pages, Vercel, or repo Website field)
- [ ] 3-minute video: connect Ready → shield → private lend → show shielded vToken/underlying
- [ ] `strk20.json` filled; hub shows no missing fields
- [ ] README: Private mode, wallet requirement, what stays public
- [ ] License present (MIT)

## 7. File-level implementation map

| File | Change |
|---|---|
| `package.json` | `starknet@^10.4.0`, `@avnu/avnu-sdk@^4.2.0` |
| `app/lib/config.ts` | `STRK20_CONFIG` |
| `app/lib/utils/Constants.ts` | Helper + pool constants (pool from AVNU `PRIVACY_POOL_ADDRESS` or official docs) |
| **new** `app/lib/services/strk20.ts` | All Wallet API calls |
| `app/lib/services/vesu.ts` | Leave public functions; import helper address from strk20 config only if shared |
| `app/lib/avnu-swap.ts` | `runPrivateSwap` |
| `app/stores/wallet-store.ts` | `privacySupported`, `shieldedBalances`, `privacyMode` |
| `app/components/layout/Header.tsx` | `WalletAccountV6` if required by 10.4 |
| `app/components/layout/Sidebar.tsx` | Optional Privacy nav |
| `app/routes/dashboard.yield.tsx` | Branch deposit/withdraw on `privacyMode` |
| `app/components/ui/VesuLendModal.tsx` | Shielded balance + private copy |
| **new** `app/components/ui/ShieldModal.tsx` | Shield / unshield |
| `app/routes/dashboard.index.tsx` | Shielded balances widget |
| `app/routes/swap.tsx` | Private swap toggle |
| `app/routes/docs.tsx` | Private mode explanation |
| `strk20.json` | Scoring payload |
| `README.md` | Link this doc + private-mode usage |

## 8. Privacy / product rules (do not violate)

- **Identity private, amounts on DeFi legs public.** Do not claim “hidden APY” or “hidden deposit size on Vesu.” Open-note amounts are plaintext.
- **Shield and unshield are public ERC-20 legs.** Timing and size of those edges leak. Copy should say that.
- **Compliance is mandatory.** FPI screens shield deposits. No SDK/prover workaround.
- **One invoke per pool tx.** Do not batch lend + swap in one STRK20 transaction.
- **vToken notes are the position.** Yield accrues on shares the user holds privately. UI should show shielded vToken balance, not a fake “private USD TVL” invented client-side without a price feed.
- **Public mode stays working** if Ready STRK20 is unavailable.

## 9. Risks

| Risk | Mitigation |
|---|---|
| starknet 8 → 10 breaks `WalletAccount` / execute calldata | Upgrade in a branch first; keep public `account.execute` paths; fix Header connect before any UI. |
| Ready not detecting STRK20 | Feature-detect; document extension version; test on a fresh profile. |
| Vesu helper calldata order wrong | Always `strk20PrepareInvoke(..., true)` before submit. Match `privacy_invoke(operation, in_token, out_token, assets, note_id)`. |
| Helper “in progress” / pool mismatch | Confirm helper still called by the live mainnet pool before demo day. Ask in the sprint Telegram if dry-run fails. |
| AVNU private swap wants already-shielded sell token | UX: force shield first, or disable private swap. |
| `@starknet-react/core` vs starknet 10 | Header uses get-starknet directly; isolate react-query account usage (`AgentPerformance.tsx`). |
| Time | Cut swap and multi-pool; one USDC shield + one private lend + one unshield still scores. |

## 10. Suggested calendar (16 days from Aug 15)

| When | Outcome |
|---|---|
| Aug 15 | Registration PR, `strk20.json` stub, this plan in repo |
| Aug 16–17 | starknet 10.4, connect, shield/unshield, shielded balances |
| Aug 18–21 | Private Vesu USDC lend/withdraw on one pool |
| Aug 22–24 | Yield UI toggle, dashboard, WBTC if USDC works |
| Aug 25–27 | Private AVNU swap if wallet+SDK cooperate; else polish demo |
| Aug 28–30 | Deploy demo, record video, fill tx hashes, README |
| Aug 31 | Freeze. No new features after 18:00 UTC |

## 11. Resources

- Sprint hub: https://strk20.starknet.io/hackathon
- Apply: https://github.com/starkience/strk20-hackathon
- Day 0 mainnet: https://github.com/starkience/strk20-hackathon/blob/main/docs/MAINNET-DAY-0.md
- Wallet API + private DeFi: https://strk20-by-example.org/starknet-wallet-api/private-defi
- Vesu helper: https://strk20-by-example.org/helpers/vesu-lending-helper
- AVNU private swaps: https://strk20-by-example.org/starknet-wallet-api/avnu-private-swaps
- Starter kit: https://github.com/Akashneelesh/strk20-starter-kit
- Idea write-up: https://strk20.starknet.io/rfp/private-yield-account
- Agent docs dump: https://strk20-by-example.org/llms-full.txt
