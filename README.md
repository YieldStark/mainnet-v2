# YieldStark V2 (Mainnet)

DeFi yield optimization on Starknet. React Router v7, Starknet React, Vesu lending, AVNU swaps, TrovesFi. Optional **private mode** via STRK20 (Ready wallet).

## Tech Stack

- React Router v7, Tailwind CSS, Zustand
- Starknet (Lava / Nethermind / dRPC RPC)
- Vesu Protocol (lending), AVNU (swaps), TrovesFi (yield)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Private mode (STRK20)

Requires [Ready](https://ready.co) with Wallet API `>= 0.10.3`. Braavos and other wallets keep public yield working.

1. Connect Ready, then Shield WBTC or USDC from the dashboard.
2. On Yield, switch to **Private** and lend into Re7 USDC Core (USDC or WBTC). Shares sit as notes.
3. Optional: **Private send** on the dashboard (note-to-note; recipient must be registered).
4. Optional: private swap on AVNU if the sell token is already shielded.

**What stays public:** shield/unshield size and address, and amounts on the Vesu/AVNU legs (open notes). **What is private:** who initiated the lend, swap, or private send. We do not claim hidden APY or hidden deposit size on Vesu.

See [STRK20 Privacy Plan](docs/STRK20_PRIVACY_PLAN.md) and [current status](docs/STRK20_STATUS.md). Scoring payload: `strk20.json`.

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
