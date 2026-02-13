# YieldStark (mainnet-v2)

React Router v7 app for YieldStark — all-in-one WBTC on Starknet mainnet.

## What we've done

- **App shell & routing** — React Router 7 routes, layout with sidebar/header, client-only app to avoid SSR with wallet/RPC.  
  → [`app/root.tsx`](app/root.tsx), [`app/routes.ts`](app/routes.ts), [`app/routes/`](app/routes/), [`app/components/layout/`](app/components/layout/)

- **RPC & network** — dRPC and Nethermind only (no Alchemy); default RPC `https://starknet.drpc.org`; optional Nethermind.  
  → [`app/stores/network-store.ts`](app/stores/network-store.ts), [`app/lib/utils/rpc.ts`](app/lib/utils/rpc.ts), [`app/lib/config.ts`](app/lib/config.ts)

- **WBTC balance** — Fetch ERC20 balance via RPC `balance_of`; wallet store exposes `totalBalance` and `updateBalances`.  
  → [`app/lib/utils/fetchWbtcBalance.ts`](app/lib/utils/fetchWbtcBalance.ts), [`app/lib/u256.ts`](app/lib/u256.ts), [`app/stores/wallet-store.ts`](app/stores/wallet-store.ts)

- **Explorer** — Voyager everywhere (links and any explorer URL config).  
  → [`app/stores/network-store.ts`](app/stores/network-store.ts), [`app/lib/config.ts`](app/lib/config.ts), [`app/components/ui/TokenSelectModal.tsx`](app/components/ui/TokenSelectModal.tsx), deposit/withdraw modals

- **Swap (AVNU)** — Verified tokens from AVNU; get quotes and execute swap with 0.6% integrator fees; sell/buy token selectors; success state and balance refresh (no auto-redirect to explorer).  
  → [`app/lib/avnu-swap.ts`](app/lib/avnu-swap.ts), [`app/routes/swap.tsx`](app/routes/swap.tsx), [`app/components/ui/TokenSelectModal.tsx`](app/components/ui/TokenSelectModal.tsx), [`app/lib/utils/parseUnits.ts`](app/lib/utils/parseUnits.ts), [`app/lib/utils/fetchTokenBalance.ts`](app/lib/utils/fetchTokenBalance.ts)

- **Integrator fee recipient** — Set in AVNU swap (e.g. `0x04b950...`).  
  → [`app/lib/avnu-swap.ts`](app/lib/avnu-swap.ts)

- **Constants** — Mainnet token addresses (WBTC, USDC, ETH).  
  → [`app/lib/utils/Constants.ts`](app/lib/utils/Constants.ts)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
