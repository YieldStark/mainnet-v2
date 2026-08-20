interface PrivacyModeToggleProps {
  privacySupported: boolean
  privacyMode: boolean
  onChange: (enabled: boolean) => void
  className?: string
}

export default function PrivacyModeToggle({
  privacySupported,
  privacyMode,
  onChange,
  className = '',
}: PrivacyModeToggleProps) {
  return (
    <div className={className}>
      <div className="inline-flex rounded-full border border-gray-700 p-1 bg-[#0A1215]">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !privacyMode
              ? 'bg-[#97FCE4] text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Public
        </button>
        <button
          type="button"
          onClick={() => {
            if (!privacySupported) return
            onChange(true)
          }}
          disabled={!privacySupported}
          title={
            privacySupported
              ? 'Shielded balances and private Vesu / AVNU'
              : 'Install Ready with STRK20 (Wallet API 0.10.3+) to enable private mode'
          }
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            privacyMode
              ? 'bg-[#97FCE4] text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Private
        </button>
      </div>
    </div>
  )
}
