# YieldStark V2 (Mainnet)

React Router v7 app for YieldStark — DeFi yield optimization platform on Starknet.

## Features

- 🔄 **Cross-Protocol Swaps**: AVNU integration with 0.6% integrator fees
- 💰 **Vesu Lending**: Real-time TVL, APY, and utilization data
- 💳 **Wallet Integration**: Argent X and Braavos support
- 📊 **Real-time Data**: Live blockchain queries via backend RPC proxy
- 🎯 **4 Lending Pools**: Re7 xBTC, USDC Core, USDC Prime, USDC Stable

## Tech Stack

- **Framework**: React Router v7
- **Blockchain**: Starknet Mainnet
- **Wallet**: Starknet React
- **Lending**: Vesu Protocol
- **Swaps**: AVNU Aggregator
- **Styling**: Tailwind CSS
- **State**: Zustand

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## Documentation

- **[Vesu Integration Guide](docs/VESU_INTEGRATION.md)** - Complete lending integration docs
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## Key Implementations

### Vesu Lending Integration
- **Real-time TVL**: From vToken `total_assets()`
- **Dynamic APY**: Calculated from on-chain utilization
- **Auto-refresh**: Updates every 30 seconds
- **4 Pools**: WBTC and USDC lending markets

### Backend RPC Proxy
- Route: `/api/rpc`
- Bypasses CORS for browser-based blockchain queries
- Supports all Starknet RPC methods

### Network Configuration
- Default RPC: Lava Network (public, free)
- Alternatives: Infura, dRPC
- Configure in `app/lib/config.ts`

## Project Structure

```
app/
├── components/        # React components
│   ├── ui/           # Modals, cards, etc.
│   └── dashboard/    # Dashboard widgets
├── lib/
│   ├── abi/          # Contract ABIs
│   ├── services/     # Vesu, AVNU integrations
│   └── utils/        # Helpers
├── routes/
│   ├── api.rpc.ts    # Backend RPC proxy
│   └── dashboard.*.tsx # Dashboard pages
├── stores/           # Zustand stores
└── hooks/            # Custom hooks

docs/                 # Documentation
```

## Development

### Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run typecheck` - Type checking

### RPC Providers

Edit `app/lib/config.ts` to switch:
```typescript
const getMainnetRpcUrl = () => RPC_PROVIDERS.LAVA; // or INFURA, DRPC
```

Available:
- **Lava**: `https://rpc.starknet.lava.build`
- **Infura**: `https://starknet-mainnet.infura.io/v3/public`
- **dRPC**: `https://starknet.drpc.org`

## Vesu Pools

| Pool | TVL Source | APY Calculation |
|------|-----------|----------------|
| **Re7 xBTC** | vToken contract | Utilization-based lending curve |
| **Re7 USDC Core** | vToken contract | Utilization-based lending curve |
| **Re7 USDC Prime** | vToken contract | Utilization-based lending curve |
| **Re7 USDC Stable** | vToken contract | Utilization-based lending curve |

## Building for Production

```bash
npm run build
```

Outputs to `build/` directory:
- `build/client/` - Static assets
- `build/server/` - Server-side code

## Deployment

Compatible with:
- Docker
- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Fly.io
- Railway
- Vercel
- Netlify

See [React Router deployment docs](https://reactrouter.com/how-to/deployment) for details.

## Roadmap

- [x] Vesu lending with real-time data
- [x] AVNU swap integration
- [x] Backend RPC proxy
- [ ] Deposit/Withdraw execution
- [ ] User position tracking
- [ ] Historical APY charts
- [ ] Cross-chain bridge
- [ ] Mobile app

## Support

- **Docs**: See `/docs` folder
- **Issues**: GitHub Issues

## License

MIT License

---

Built with ❤️ on Starknet
