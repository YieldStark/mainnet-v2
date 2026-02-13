/**
 * Parse a decimal string into bigint with the given decimals (e.g. "1.5" with 18 -> 1500000000000000000n).
 */
export function parseUnits(value: string, decimals: number): bigint {
  const trimmed = (value || '0').trim()
  if (!trimmed) return 0n
  const [whole = '0', frac = ''] = trimmed.split('.')
  const padded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  const combined = (whole === '-' ? '0' : whole) + padded
  return BigInt(combined)
}

/** Format bigint amount to decimal string with given decimals. */
export function formatUnits(value: bigint, decimals: number): string {
  const s = value.toString()
  if (decimals <= 0) return s
  const pad = s.padStart(decimals + 1, '0')
  const whole = pad.slice(0, -decimals)
  const frac = pad.slice(-decimals).replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : whole
}
