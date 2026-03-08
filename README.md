# YieldStark V2 (Mainnet)

DeFi yield optimization on Starknet. React Router v7, Starknet React, Vesu lending, AVNU swaps, TrovesFi.

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

- [Vesu Integration](docs/VESU_INTEGRATION.md)
- [Troves Integration](docs/TROVES_INTEGRATION.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Deployment

Build: `npm run build` → `build/client/`, `build/server/`. Compatible with Docker, Vercel, Netlify, Fly.io, Railway, and standard Node hosts. See [React Router deployment](https://reactrouter.com/how-to/deployment).

## License

MIT
