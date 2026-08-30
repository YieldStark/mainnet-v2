import { useWalletStore } from '~/providers/wallet-store-provider'
import { readShielded, isStrk20Wallet } from '~/lib/services/strk20'

export function useStrk20() {
  const wallet = useWalletStore((s) => s.wallet)
  const privacySupported = useWalletStore((s) => s.privacySupported)
  const privacyMode = useWalletStore((s) => s.privacyMode)
  const setPrivacyMode = useWalletStore((s) => s.setPrivacyMode)
  const shieldedBalances = useWalletStore((s) => s.shieldedBalances)
  const refreshShieldedBalances = useWalletStore((s) => s.refreshShieldedBalances)

  return {
    account: isStrk20Wallet(wallet) ? wallet : null,
    privacySupported,
    privacyMode,
    setPrivacyMode,
    shieldedBalances,
    refreshShieldedBalances,
    shieldedOf: (tokenAddress: string) =>
      readShielded(shieldedBalances, tokenAddress),
  }
}
