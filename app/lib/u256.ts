import { uint256 } from 'starknet'

type BigNumberish = string | number | bigint

export function toUint256FromDecimals(amount: string, decimals: number) {
  const [whole, frac = ''] = amount.split('.')
  const normalizedFrac = (frac + '0'.repeat(decimals)).slice(0, decimals)
  const valueStr = `${whole}${normalizedFrac}`.replace(/^0+/, '') || '0'
  const asBigInt = BigInt(valueStr)
  return uint256.bnToUint256(asBigInt)
}

export function uint256ToDecimalString(value: { low: BigNumberish; high: BigNumberish }, decimals: number) {
  const bn = uint256.uint256ToBN(value)
  const s = bn.toString()
  if (decimals === 0) return s
  const pad = s.padStart(decimals + 1, '0')
  const whole = pad.slice(0, -decimals)
  const frac = pad.slice(-decimals).replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : whole
}
