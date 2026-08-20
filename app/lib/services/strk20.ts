import { uint256, type STRK20_ACTION, type WalletAccountV6 } from "starknet";
import { STRK20_CONFIG } from "~/lib/config";
import { USDC_ADDRESS, WBTC_ADDRESS } from "~/lib/utils/Constants";
import { formatUnits } from "~/lib/utils/parseUnits";
import { VESU_LENDING_POOLS } from "~/lib/services/vesu";

export const STRK20_PRIVATE_LEND_POOL_IDS = [
  "vesu-usdc-core",
  "vesu-wbtc-core",
] as const;

export type Strk20Account = WalletAccountV6;

export type ShieldedBalanceMap = Record<string, string>;

const LENDING_DEPOSIT = 0;
const LENDING_WITHDRAW = 1;

export function normalizeAddr(address: string): string {
  return address.replace(/^0x/, "").toLowerCase().padStart(64, "0");
}

export function toFelt(value: bigint | number | string): string {
  if (typeof value === "string") {
    if (value === "OPEN" || value.startsWith("${")) return value;
    if (value.startsWith("0x") || value.startsWith("0X")) return value;
  }
  return `0x${BigInt(value).toString(16)}`;
}

export function isStrk20Wallet(account: unknown): account is Strk20Account {
  if (!account || typeof account !== "object") return false;
  const a = account as Partial<Strk20Account>;
  return (
    typeof a.strk20Balances === "function" &&
    typeof a.strk20InvokeTransaction === "function"
  );
}

export function requireStrk20(account: unknown): Strk20Account {
  if (!isStrk20Wallet(account)) {
    throw new Error(
      "This wallet does not support STRK20. Install Ready with Wallet API 0.10.3+ to use private mode."
    );
  }
  return account;
}

function parseBalanceEntry(entry: {
  token?: string;
  amount?: string | bigint;
  balance?: string | bigint;
}): { token: string; amount: bigint } {
  const token = entry.token ?? "";
  const raw = entry.amount ?? entry.balance ?? "0x0";
  const amount = typeof raw === "bigint" ? raw : BigInt(raw);
  return { token, amount };
}

async function invokeActions(
  account: Strk20Account,
  actions: STRK20_ACTION[],
  dryRun = true
): Promise<string> {
  if (dryRun && typeof account.strk20PrepareInvoke === "function") {
    await account.strk20PrepareInvoke(actions, true);
  }
  const { transaction_hash } = await account.strk20InvokeTransaction(actions);
  return transaction_hash;
}

export async function probePrivacySupport(account: unknown): Promise<boolean> {
  if (!isStrk20Wallet(account)) return false;
  try {
    await account.strk20Balances([]);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Wallet has the API but user may not be registered yet — still capable.
    if (
      /NOT_REGISTERED|not registered|STRK20|privacy/i.test(msg) ||
      msg.includes("0.10")
    ) {
      return true;
    }
    return false;
  }
}

export const STRK20_SHIELD_TOKENS = [
  { symbol: "USDC", address: USDC_ADDRESS, decimals: 6 },
  { symbol: "WBTC", address: WBTC_ADDRESS, decimals: 8 },
] as const;

export function privateLendPools() {
  return VESU_LENDING_POOLS.filter((p) =>
    (STRK20_PRIVATE_LEND_POOL_IDS as readonly string[]).includes(p.id)
  );
}

export function isPrivateLendPool(poolId: string): boolean {
  return (STRK20_PRIVATE_LEND_POOL_IDS as readonly string[]).includes(poolId);
}

export async function getShieldedBalances(
  account: unknown,
  tokens?: string[]
): Promise<Array<{ token: string; amount: bigint }>> {
  const strk20 = requireStrk20(account);
  const list = tokens ?? [
    ...STRK20_SHIELD_TOKENS.map((t) => t.address),
    ...privateLendPools().map((p) => p.vTokenAddress),
  ];
  const entries = await strk20.strk20Balances(list);
  return entries.map(parseBalanceEntry);
}

export async function getShieldedBalanceMap(
  account: unknown,
  tokenDecimals: Record<string, number>
): Promise<ShieldedBalanceMap> {
  const tokens = Object.keys(tokenDecimals);
  const entries = await getShieldedBalances(account, tokens);
  const map: ShieldedBalanceMap = {};
  for (const { token, amount } of entries) {
    const key = `0x${normalizeAddr(token)}`;
    const decimals =
      tokenDecimals[key] ??
      tokenDecimals[token] ??
      Object.entries(tokenDecimals).find(
        ([addr]) => normalizeAddr(addr) === normalizeAddr(token)
      )?.[1] ??
      18;
    map[normalizeAddr(token)] = formatUnits(amount, decimals);
  }
  for (const addr of tokens) {
    const n = normalizeAddr(addr);
    if (!(n in map)) map[n] = "0";
  }
  return map;
}

export function readShielded(
  balances: ShieldedBalanceMap,
  tokenAddress: string
): string {
  return balances[normalizeAddr(tokenAddress)] ?? "0";
}

export async function shield(
  account: unknown,
  token: string,
  amount: bigint
): Promise<string> {
  const strk20 = requireStrk20(account);
  if (amount <= 0n) throw new Error("Invalid amount");
  const actions: STRK20_ACTION[] = [
    { type: "deposit", token, amount: toFelt(amount) },
  ];
  return invokeActions(strk20, actions);
}

export async function unshield(
  account: unknown,
  token: string,
  amount: bigint,
  recipient: string
): Promise<string> {
  const strk20 = requireStrk20(account);
  if (amount <= 0n) throw new Error("Invalid amount");
  if (!recipient) throw new Error("Recipient required");
  const actions: STRK20_ACTION[] = [
    { type: "withdraw", token, amount: toFelt(amount), recipient },
  ];
  return invokeActions(strk20, actions);
}

export async function transferShielded(
  account: unknown,
  token: string,
  amount: bigint,
  recipient: string
): Promise<string> {
  const strk20 = requireStrk20(account);
  if (amount <= 0n) throw new Error("Invalid amount");
  const actions: STRK20_ACTION[] = [
    { type: "transfer", token, amount: toFelt(amount), recipient },
  ];
  return invokeActions(strk20, actions);
}

type Strk20InvokeCalldata = Extract<STRK20_ACTION, { type: "invoke" }>["calldata"];

function vesuHelperCalldata(
  operation: number,
  inToken: string,
  outToken: string,
  assets: bigint
): Strk20InvokeCalldata {
  const u = uint256.bnToUint256(assets);
  return [
    toFelt(operation),
    inToken,
    outToken,
    toFelt(BigInt(u.low)),
    toFelt(BigInt(u.high)),
    "${openNoteIds[0]}",
  ];
}

export async function lendVesuPrivate(
  account: unknown,
  params: {
    underlyingAddress: string;
    vTokenAddress: string;
    assets: bigint;
    userAddress: string;
  }
): Promise<string> {
  const strk20 = requireStrk20(account);
  if (params.assets <= 0n) throw new Error("Invalid amount");
  const actions: STRK20_ACTION[] = [
    {
      type: "transfer",
      token: params.vTokenAddress,
      amount: "OPEN",
      recipient: params.userAddress,
    },
    {
      type: "invoke",
      contract: STRK20_CONFIG.VESU_LENDING_HELPER,
      calldata: vesuHelperCalldata(
        LENDING_DEPOSIT,
        params.underlyingAddress,
        params.vTokenAddress,
        params.assets
      ),
    },
  ];
  return invokeActions(strk20, actions);
}

export async function withdrawVesuPrivate(
  account: unknown,
  params: {
    underlyingAddress: string;
    vTokenAddress: string;
    assets: bigint;
    userAddress: string;
  }
): Promise<string> {
  const strk20 = requireStrk20(account);
  if (params.assets <= 0n) throw new Error("Invalid amount");
  const actions: STRK20_ACTION[] = [
    {
      type: "transfer",
      token: params.underlyingAddress,
      amount: "OPEN",
      recipient: params.userAddress,
    },
    {
      type: "invoke",
      contract: STRK20_CONFIG.VESU_LENDING_HELPER,
      calldata: vesuHelperCalldata(
        LENDING_WITHDRAW,
        params.vTokenAddress,
        params.underlyingAddress,
        params.assets
      ),
    },
  ];
  return invokeActions(strk20, actions);
}

export { STRK20_CONFIG };
