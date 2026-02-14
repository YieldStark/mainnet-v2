# Vesu Integration Troubleshooting

Common issues and solutions for the Vesu lending integration.

## Table of Contents
1. [TVL Shows $0](#tvl-shows-0)
2. [APY Shows 0%](#apy-shows-0)
3. [CORS Errors](#cors-errors)
4. [RPC Connection Issues](#rpc-connection-issues)
5. [Module Import Errors](#module-import-errors)
6. [Network Switching Issues](#network-switching-issues)

---

## TVL Shows $0

### Symptoms
- All pools show `$0` TVL
- Console shows `Total Assets (raw): 0`

### Possible Causes & Solutions

#### 1. RPC Provider Issue
**Check console for errors:**
```
RPC error: { code: -32000, message: "..." }
```

**Solution**: Switch RPC provider
```typescript
// app/lib/config.ts
const getMainnetRpcUrl = () => RPC_PROVIDERS.INFURA; // Try different provider
```

#### 2. Backend Proxy Not Running
**Check console for:**
```
POST http://localhost:5173/api/rpc 404 (Not Found)
```

**Solution**: Restart dev server
```bash
# Stop server (Ctrl+C)
npm run dev
```

#### 3. Wrong vToken Address
**Verify vToken addresses in:**
- `app/lib/services/vesu.ts`

**Solution**: Check against Vesu docs: https://docs.vesu.xyz/developers/contract-addresses

---

## APY Shows 0%

### Symptoms
- Pools show `0.00%` APY
- TVL is correct but APY is zero

### Possible Causes & Solutions

#### 1. Asset Config Fetch Failed
**Check console for:**
```
⚠️ Could not fetch asset_config, using estimated APY
```

**Solution**: Verify Pool contract address
```typescript
// app/lib/services/vesu.ts - Check VESU_CONTRACTS
```

#### 2. Wrong Asset Address
**Check console for:**
```
asset_config response: { error: ... }
```

**Solution**: Verify asset addresses in `fetchAllPoolsViaRPC`:
- USDC: `0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8`
- tBTC: `0x03Fe2b97C1Fd336E750087D68B9b867997Fd64a2661fF3ca5A7C771641e8e7AC`

#### 3. Zero Utilization
If utilization is legitimately 0%, APY will be low (base rate ~2%).

---

## CORS Errors

### Symptoms
```
Access to fetch at 'https://rpc.starknet.lava.build/' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

### Solution
This should NOT happen if the backend proxy is working. If it does:

1. **Verify backend proxy route is registered:**
```typescript
// app/routes.ts
route("api/rpc", "routes/api.rpc.ts"),
```

2. **Restart dev server:**
```bash
npm run dev
```

3. **Check console for proxy errors:**
Look for `RPC proxy error:` messages

---

## RPC Connection Issues

### Symptoms
- `net::ERR_NAME_NOT_RESOLVED`
- `Failed to fetch`
- `Connection timeout`

### Solutions

#### 1. RPC Provider is Down
**Try different provider:**
```typescript
// app/lib/config.ts
export const RPC_PROVIDERS = {
  LAVA: 'https://rpc.starknet.lava.build',
  INFURA: 'https://starknet-mainnet.infura.io/v3/public',
  DRPC: 'https://starknet.drpc.org',
}

const getMainnetRpcUrl = () => RPC_PROVIDERS.INFURA; // Switch here
```

#### 2. Network/Firewall Blocking RPC
- Check if your network blocks blockchain RPCs
- Try using a VPN
- Use your own RPC endpoint (Alchemy, Infura with API key)

#### 3. Rate Limiting
Public RPCs have rate limits. Solutions:
- Get your own API key from Alchemy/Infura
- Implement request caching
- Increase refresh interval

---

## Module Import Errors

### Error: Cannot find module '@remix-run/node'
**Cause**: Old import statement

**Solution**: Use React Router v7 imports
```typescript
// ❌ Wrong
import { json } from "@remix-run/node";

// ✅ Correct
import { data } from "react-router";
```

### Error: Cannot find module '@react-router/node'
**Cause**: Incorrect import path

**Solution**: Use `react-router` package
```typescript
// ❌ Wrong
import { json } from "@react-router/node";

// ✅ Correct
import { data } from "react-router";
```

---

## Network Switching Issues

### Symptoms
- Switching networks in settings doesn't update data
- Old RPC URL persists after restart

### Solutions

#### 1. Clear localStorage
```javascript
// Browser DevTools Console
localStorage.clear();
// Refresh page
```

#### 2. Force Migration
Increment version in `app/stores/network-store.ts`:
```typescript
{
  name: 'network-storage',
  version: 4, // Increment this
  // ...
}
```

#### 3. Check Default Network
Verify first network in array is correct:
```typescript
// app/stores/network-store.ts
export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    id: 'mainnet-lava', // First = default
    name: 'Starknet Mainnet (Lava)',
    // ...
  },
  // ...
]
```

---

## Data Not Refreshing

### Symptoms
- TVL/APY stuck at old values
- No console logs after initial load

### Solutions

#### 1. Check Auto-Refresh
Verify interval in `app/hooks/useVesuPoolData.ts`:
```typescript
const REFRESH_INTERVAL = 30000; // Should be > 0
```

#### 2. Component Not Mounted
Check if `useVesuPoolData` hook is called:
```typescript
// app/routes/dashboard.yield.tsx
const { poolsData, loading, error } = useVesuPoolData();
```

#### 3. React Strict Mode Double Rendering
This is normal in development. Check `root.tsx`:
```typescript
// Double rendering is expected in dev with StrictMode
<React.StrictMode>
  <YourApp />
</React.StrictMode>
```

---

## Performance Issues

### Symptoms
- Slow page load
- High CPU usage
- Too many console logs

### Solutions

#### 1. Reduce Console Logging
Edit `app/lib/services/vesuPoolDataRPC.ts` and remove/comment out:
```typescript
// console.log("=== Fetching pool stats via RPC ===");
// console.log("RPC URL:", rpcUrl);
// etc.
```

#### 2. Increase Refresh Interval
```typescript
// app/hooks/useVesuPoolData.ts
const REFRESH_INTERVAL = 60000; // 60 seconds instead of 30
```

#### 3. Implement Request Caching
Cache responses in `api.rpc.ts`:
```typescript
// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 10000; // 10 seconds

export async function action({ request }: Route.ActionArgs) {
  const { rpcUrl, payload } = await request.json();
  const cacheKey = JSON.stringify({ rpcUrl, payload });
  
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data(data);
    }
  }
  
  // Make actual RPC call...
  const result = await fetch(rpcUrl, ...);
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return data(result);
}
```

---

## Getting Help

### Before Asking for Help

1. **Check browser console** - Look for error messages
2. **Check network tab** - Verify RPC calls are successful
3. **Verify RPC provider** - Try switching to a different one
4. **Clear localStorage** - Rule out stale configuration
5. **Restart dev server** - Rule out hot-reload issues

### Debug Checklist

- [ ] Browser console shows no errors
- [ ] Network tab shows `POST /api/rpc` returning 200
- [ ] RPC provider is accessible (test in browser: https://rpc.starknet.lava.build)
- [ ] vToken addresses are correct
- [ ] Pool addresses are correct
- [ ] Asset addresses are correct
- [ ] Dev server is running (`npm run dev`)

### Useful Console Commands

```javascript
// Check current network config
JSON.parse(localStorage.getItem('network-storage'))

// Clear network config
localStorage.removeItem('network-storage')

// Check if pools are loaded
document.querySelector('[data-pool-id]')
```

---

**Last Updated**: 2026-02-14
