# TrovesFi Yield Integration – WBTC/USDC & WBTC/USDC.e

## Vault contracts you interact with

You interact **only with the Vault contract** for each strategy. Addresses match Troves strategy pages and `app.troves.fi/api/strategies` / `app/providers/strategies.json`.

### Ekubo WBTC/USDC

| Role | Address |
|------|--------|
| **Vault** | `0x076101c3b80af1103c9c6d541ca627f61b5ae7ae79d7fce96ccdf7bdb648450d` |
| USDC | `0x033068F6539f8e6e6b131e6B2B814e6c34A5224bC66947c47DaB9dFeE93b35fb` |
| WBTC | `0x03Fe2b97C1Fd336E750087D68B9b867997Fd64a2661fF3ca5A7C771641e8e7AC` |

- **Deposit rule:** equal **value** of WBTC and USDC (equal amounts in USD terms).
- Strategy id in API/JSON: `ekubo_cl_wbtcusdc_v2`.

### Ekubo WBTC/USDC.e

| Role | Address |
|------|--------|
| **Vault** | `0x02bcaef2eb7706875a5fdc6853dd961a0590f850bc3a031c59887189b5e84ba1` |
| USDC.e | `0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8` |
| WBTC | `0x03Fe2b97C1Fd336E750087D68B9b867997Fd64a2661fF3ca5A7C771641e8e7AC` |

- **Deposit rule:** equal **value** of WBTC and USDC.e.
- Strategy id: `ekubo_cl_wbtcusdc`.

### Ekubo WBTC/ETH (optional)

| Role | Address |
|------|--------|
| **Vault** | `0x01c9232b8186d9317652f05055615f18a120c2ad9e5ee96c39e031c257fb945b` |
| ETH | `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7` |
| WBTC | (same as above) |

---

## APY / TVL

- **Source:** `https://app.troves.fi/api/strategies`
- **Fallback:** `app/providers/strategies.json` (same shape).
- APY is 7d fee-based; it does **not** include impermanent loss (Troves dev confirmation).

---

## Implementation flow

1. **Approve spending limit** for **each** deposit token (USDC and WBTC, or USDC.e and WBTC) to the **vault** address.
2. **Deposit** on the vault with both amounts (and receiver).

So for each strategy you use **one vault contract**; users approve that vault to spend both tokens, then call the vault’s deposit once.

---

## Best way to implement

1. **Data**
   - Fetch strategies from `app.troves.fi/api/strategies` (or use `strategies.json`).
   - Filter by strategy id (`ekubo_cl_wbtcusdc_v2`, `ekubo_cl_wbtcusdc`) or by name / `depositToken` to get vault + token addresses and APY/TVL.

2. **UI**
   - Show “TrovesFi Yield” (or “Ekubo LP”) section with WBTC/USDC and WBTC/USDC.e cards (APY, TVL from API).
   - Deposit flow: two inputs (WBTC and USDC or USDC.e), enforce equal value (or derive one from the other); then two “Approve” actions and one “Deposit” on the vault.

3. **Contract calls**
   - **Approve:** ERC20 `approve(spender = vault_address, amount)` for each token (same pattern as Vesu).
   - **Deposit:** Call the vault’s deposit entrypoint with both token amounts and receiver. Exact name/calldata should be taken from the vault ABI on the strategy page or Troves/Re7 docs; typical pattern is something like `deposit(amount0, amount1, receiver)` with uint256 for each amount (low/high on Starknet).

4. **Token order**
   - Use `depositToken[0]` and `depositToken[1]` from the strategy as token0 and token1 so approval and deposit amounts match the vault’s expectation.

This keeps a single source of truth (API or strategies.json) for vault and token addresses and reuses your existing approve + execute pattern from Vesu.
