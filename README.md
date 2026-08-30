# YieldStark V2 (Mainnet)

DeFi yield optimization on Starknet. React Router v7, Starknet React, Vesu lending, AVNU swaps, TrovesFi.

**STRK20 Private Sprint entry (IDEA-16):** optional **private yield mode** — shield assets, lend on Vesu privately, swap on AVNU, and send note-to-note transfers. Built on the [Starknet Wallet API](https://strk20.starknet.io/docs/starknet-wallet-api/overview); viewing keys never leave [Ready](https://ready.co).

## Tech Stack

- React Router v7, Tailwind CSS, Zustand
- starknet.js `^10.4` (Wallet API 0.10.3+), `@avnu/avnu-sdk` `^4.2`
- Starknet mainnet RPC (Lava / Nethermind / dRPC)
- Vesu Protocol (lending), AVNU (swaps), TrovesFi (yield)
- STRK20 pool + Vesu lending anonymizer (mainnet)

## Quick Start

```bash
git checkout privacy   # private mode is on this branch until merged to main
npm install
npm run dev
```

Open http://localhost:5173/dashboard

> Production deploy at [yieldstark.com](https://yieldstark.com) does not include private mode yet. Use the `privacy` branch locally (or deploy it) to test Shield / Private lend.

## Private mode (STRK20) — hackathon submission

### What it does

YieldStark adds a **private yield path** on top of the existing public app. Public Vesu / Troves / AVNU / Layerswap flows are unchanged.

| Feature | Description |
|---------|-------------|
| Shield / unshield | Move WBTC or USDC between public wallet and STRK20 pool |
| Private Vesu lend | Deposit shielded USDC or WBTC into Re7 USDC Core markets via the Vesu helper |
| Private send | Note-to-note transfer of shielded WBTC/USDC to another registered user |
| Private swap | AVNU swap when the sell token is already shielded (code path; mainnet not fully proven) |
| Public / Private toggle | Yield page filters to private-capable pools when enabled |

### Why privacy here

Standard DeFi ties every deposit, lend, and swap to your public Starknet address. STRK20 lets users **shield** funds into encrypted notes, act inside the pool, and route through anonymizer contracts into Vesu/AVNU. YieldStark is a **private yield account**: hold shielded assets, earn on Vesu, and exit — without linking positions to the user's public wallet identity on the private legs.

### Prerequisites

1. **[Ready](https://ready.co)** wallet extension (STRK20-capable, Wallet API `>= 0.10.3`). Braavos works for public yield only.
2. **Mainnet** selected in Ready.
3. **STRK** for gas and **USDC** or **WBTC** to shield.
4. **Pool registration** (one-time): register your viewing key in Ready's privacy UI or at [strk20.starknet.io/app](https://strk20.starknet.io/app). Without this, the wallet returns `NOT_REGISTERED`.

### How to try it (mainnet demo flow)

1. Connect **Ready** on the dashboard.
2. **Shield** a small USDC amount (Dashboard → Shield).
3. Go to **Yield** → toggle **Private** → lend into **Re7 USDC Core** (USDC or WBTC).
4. **Unshield** or **Private send** to complete the flow.

Scoring payload for the [STRK20 Private Sprint](https://strk20.starknet.io/hackathon): [`strk20.json`](strk20.json) (mainnet tx hashes, demo video, demo URL).

### Mainnet contracts

| Contract | Address |
|----------|---------|
| STRK20 pool | `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a` |
| Vesu lending helper (anonymizer) | `0x028b49bc7a48b92d06d436d90e889729d7161dfc2fef3f16b674029bf7abc336` |

Pool on Voyager: [view contract](https://voyager.online/contract/0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a)

### What is and isn't private

Be precise — overclaiming hurts integration-depth scoring.

| Public (visible on-chain) | Private (hidden identity) |
|---------------------------|---------------------------|
| Shield / unshield: your address, token, amount | Who initiated a private lend or private send |
| Vesu / AVNU leg: amounts and timing (open notes) | Note-to-note transfer parties and amounts |
| Deposit screening is on-chain | Viewing keys (stay in Ready; YieldStark never stores them) |

We **do not** claim: hidden APY, hidden Vesu deposit size, or hidden swap amounts. We **do** claim: identity privacy on shielded lend, swap, and private-send legs.

### Architecture (Wallet API route)

```
User → YieldStark (React) → starknet.js WalletAccountV6 → Ready wallet
                              ↓
                         STRK20 pool (mainnet) → Vesu helper → Vesu
```

- No viewing keys, notes, or proofs in the app — Ready proves and submits.
- Connection uses `StarknetInjectedWallet` + `WalletAccountV6` for STRK20 methods.
- Private Vesu uses `privacy_invoke` on the Vesu lending helper with open notes on the DeFi leg.

See [STRK20 Privacy Plan](docs/STRK20_PRIVACY_PLAN.md) and [current status](docs/STRK20_STATUS.md).

## Scripts

| Command        | Description          |
|----------------|----------------------|
| `npm run dev`  | Development server   |
| `npm run build`| Production build     |
| `npm run typecheck` | Type checking   |

## Project Structure

```
app/
├── components/     # UI and dashboard widgets
├── lib/            # ABIs, services (Vesu, Troves, AVNU), utils
├── routes/         # Pages and api.rpc proxy
├── stores/         # Zustand (network, wallet)
└── hooks/
docs/               # Integration and troubleshooting
```

## Configuration

- **RPC**: `app/stores/network-store.ts` — Lava, Nethermind, dRPC. Default: Lava.
- **API proxy**: `/api/rpc` — Starknet RPC proxy for browser CORS.

## Documentation

- [STRK20 Privacy Plan](docs/STRK20_PRIVACY_PLAN.md)
- [STRK20 current status](docs/STRK20_STATUS.md)
- [Vesu Integration](docs/VESU_INTEGRATION.md)
- [Troves Integration](docs/TROVES_INTEGRATION.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Deployment

Build: `npm run build` → `build/client/`, `build/server/`. Compatible with Docker, Vercel, Netlify, Fly.io, Railway, and standard Node hosts. See [React Router deployment](https://reactrouter.com/how-to/deployment).

## License

MIT
