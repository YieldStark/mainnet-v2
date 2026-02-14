# Vesu Lending Integration

Complete integration of Vesu V2 lending protocol for WBTC and USDC lending pools with real-time TVL, APY, and utilization data.

## Features

### ✅ Implemented
- **Real-time TVL**: Fetched directly from vToken contracts (`total_assets()`)
- **Real-time Utilization**: Calculated from Pool contract's `asset_config()`
- **Dynamic APY**: Calculated from utilization using lending curve model
- **4 Lending Pools**: Re7 xBTC, Re7 USDC Core, Re7 USDC Prime, Re7 USDC Stable Core
- **Backend RPC Proxy**: Bypasses CORS restrictions for browser-based RPC calls
- **Auto-refresh**: Data updates every 30 seconds
- **Network switching**: Support for multiple RPC providers (Lava, Infura, dRPC)

### 🚧 To Be Implemented
- Deposit/Withdraw transaction execution
- User position tracking (wallet integration)
- Price oracle integration for USD TVL conversion
- Historical APY charts
- Advanced risk metrics

## Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Remix)  │
└────────┬────────┘
         │
         ↓ POST /api/rpc
┌─────────────────┐
│  Backend Proxy  │
│ (api.rpc.ts)    │
└────────┬────────┘
         │
         ↓ JSON-RPC
┌─────────────────────────────┐
│  Starknet RPC (Lava)        │
│  ├─ vToken Contracts        │
│  │  └─ total_assets()       │ → TVL
│  │  └─ total_supply()       │ → Shares
│  └─ Pool Contracts          │
│     └─ asset_config(asset)  │ → Utilization
└─────────────────────────────┘
         │
         ↓
┌─────────────────┐
│  APY Calculator │
│  f(utilization) │
└─────────────────┘
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Navigate to Yield Page
Open `http://localhost:5173/dashboard/yield`

## Key Files

### Core Integration
- `app/lib/services/vesu.ts` - Vesu pool configurations and contract addresses
- `app/lib/services/vesuPoolDataRPC.ts` - Real-time data fetching via RPC
- `app/lib/abi/vesu.ts` - Pool and vToken ABIs

### Components
- `app/routes/dashboard.yield.tsx` - Main lending pools UI
- `app/components/ui/VesuLendModal.tsx` - Deposit modal (UI only)
- `app/components/dashboard/VesuPositions.tsx` - User positions widget

### Hooks
- `app/hooks/useVesuPoolData.ts` - Data fetching with auto-refresh

### Configuration
- `app/lib/config.ts` - RPC provider configuration
- `app/stores/network-store.ts` - Network switching logic

### Backend
- `app/routes/api.rpc.ts` - RPC proxy to bypass CORS

## Pool Data Sources

| Pool | Pool Address | vToken Address | Asset |
|------|--------------|----------------|-------|
| **Re7 xBTC** | `0x3a8416bf2...48ecf` | `0x04cbe8b13...fa039` | tBTC (8 decimals) |
| **Re7 USDC Core** | `0x3976cac26...88124` | `0x017891114...91b1` | USDC (6 decimals) |
| **Re7 USDC Prime** | `0x2eef0c13b...8aaf` | `0x01a71039b...b166` | USDC (6 decimals) |
| **Re7 USDC Stable** | `0x73702fce2...a135` | `0x00cf3ea1a...5722` | USDC (6 decimals) |

## APY Calculation

APY is calculated from real-time utilization using a standard lending curve:

```typescript
function calculateAPYFromUtilization(utilizationPercent: number): number {
  const optimalUtilization = 80;
  const baseRate = 2.0;
  const slope1 = 0.1;
  const slope2 = 0.5;
  
  if (utilizationPercent <= optimalUtilization) {
    return baseRate + (utilizationPercent * slope1);
  }
  
  return baseRate + (optimalUtilization * slope1) + 
         ((utilizationPercent - optimalUtilization) * slope2);
}
```

**Example APYs:**
- 0% utilization → 2% APY
- 50% utilization → 7% APY
- 80% utilization → 10% APY
- 90% utilization → 15% APY

## RPC Providers

The app uses **Lava Network** as the default RPC provider. To switch providers:

### Option 1: Update Default in Code
Edit `app/lib/config.ts`:
```typescript
const getMainnetRpcUrl = () => RPC_PROVIDERS.INFURA; // or DRPC
```

### Option 2: Use Environment Variable
Add to `.env`:
```
VITE_STARKNET_RPC_URL=https://your-rpc-url.com
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Data Refresh

Pools auto-refresh every 30 seconds. To modify:

Edit `app/hooks/useVesuPoolData.ts`:
```typescript
const REFRESH_INTERVAL = 60000; // 60 seconds
```

## Development Notes

### Console Logging

Development mode includes detailed console logs:
- `=== Fetching pool stats via RPC ===` - Data fetch started
- `📊 REAL utilization: X%` - Live utilization from blockchain
- `📈 Calculated supply APY: X%` - APY from lending curve
- `✅ Using REAL TVL, utilization, and calculated APY` - Success

To reduce logging, edit `app/lib/services/vesuPoolDataRPC.ts` and remove `console.log()` statements.

### Adding New Pools

1. Add pool address to `app/lib/services/vesu.ts`:
```typescript
export const VESU_CONTRACTS = {
  // ... existing pools
  NEW_POOL: "0x...",
}
```

2. Add vToken address:
```typescript
export const VESU_VTOKENS = {
  // ... existing tokens
  NEW_TOKEN: "0x...",
}
```

3. Add to `VESU_LENDING_POOLS` array:
```typescript
{
  id: "new-pool",
  name: "New Pool Name",
  poolAddress: VESU_CONTRACTS.NEW_POOL,
  vTokenAddress: VESU_VTOKENS.NEW_TOKEN,
  asset: "USDC",
  assetAddress: USDC_ADDRESS,
  apy: "0%", // Will be replaced with real data
  tvl: "$0", // Will be replaced with real data
  description: "Description here",
  riskLevel: "Medium",
}
```

4. Add to `fetchAllPoolsViaRPC` in `app/lib/services/vesuPoolDataRPC.ts`:
```typescript
{
  id: "new-pool",
  poolAddress: VESU_CONTRACTS.NEW_POOL,
  vTokenAddress: VESU_VTOKENS.NEW_TOKEN,
  assetAddress: "0x...", // Underlying asset
  decimals: 6, // Asset decimals
}
```

## Resources

- **Vesu Docs**: https://docs.vesu.xyz
- **Vesu App**: https://vesu.xyz
- **Starknet Docs**: https://docs.starknet.io
- **RPC Providers**: 
  - Lava: https://www.lavanet.xyz
  - Infura: https://infura.io
  - Alchemy: https://alchemy.com

## Version History

### v1.0.0 (2026-02-14)
- ✅ Real-time TVL from vToken contracts
- ✅ Real-time utilization from Pool contracts
- ✅ Dynamic APY calculation from utilization
- ✅ Backend RPC proxy to bypass CORS
- ✅ Support for 4 Vesu lending pools
- ✅ Auto-refresh every 30 seconds
- ✅ Network switching (Lava, Infura, dRPC)

---

**Status**: Production Ready  
**Last Updated**: 2026-02-14
