import { useState, useEffect, useMemo } from 'react'
import { Check } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { useVesuPoolData } from '~/hooks/useVesuPoolData'
import { useTrovesStrategies } from '~/hooks/useTrovesStrategies'
import { useWalletStore } from '~/providers/wallet-store-provider'
import { useNetworkStore } from '~/stores/network-store'
import {
  VESU_LENDING_POOLS,
  getVTokenBalance,
  convertSharesToAssets,
} from '~/lib/services/vesu'
import {
  getVaultAddress,
  getTrovesVaultShareBalance,
  getTrovesVaultTotalSupply,
  getTrovesVaultTotalAssets,
} from '~/lib/services/troves'

/** Approximate WBTC price in USD for user position valuation */
const WBTC_PRICE_USD = 97_000

interface PositionCard {
  protocol: string
  userPositionUsd: number
  apyDisplay: string
  chartData: { name: string; value: number }[]
  logoPath: string
  chartColor: string
  gradientId: string
}

/** Parse apy string e.g. "5.00%" to number */
function parseApyPercent(apy: string): number {
  const s = (apy || '').replace(/%/g, '').trim()
  return parseFloat(s) || 0
}

function formatUsd(usd: number): string {
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(2)}K`
  return `$${usd.toFixed(2)}`
}

/** Build uptrend chart data: smooth rise from ~0 to current value */
function uptrendChartData(currentValue: number, points = 12): { name: string; value: number }[] {
  if (currentValue <= 0) {
    return Array.from({ length: points }, (_, i) => ({ name: `${i + 1}`, value: 0 }))
  }
  return Array.from({ length: points }, (_, i) => {
    const t = (i + 1) / points
    const value = currentValue * t * t
    return { name: `${i + 1}`, value: Math.round(value * 100) / 100 }
  })
}

const CurrentPositions = () => {
  const address = useWalletStore((state) => state.vaultAddress)
  const currentNetwork = useNetworkStore((state) => state.currentNetwork)
  const { poolsData: vesuPools, isLoading: vesuLoading } = useVesuPoolData()
  const { strategies: trovesWbtcStrategies, isLoading: trovesLoading } = useTrovesStrategies()

  const [userVesuUsd, setUserVesuUsd] = useState(0)
  const [userEkuboUsd, setUserEkuboUsd] = useState(0)
  const [userLoading, setUserLoading] = useState(true)
  const [positions, setPositions] = useState<PositionCard[]>([])

  const protocolLoading = vesuLoading || trovesLoading

  const vesuWeightedApy = useMemo(() => {
    let totalTvl = 0
    let sum = 0
    vesuPools.forEach((pool) => {
      const tvl = parseFloat((pool.tvl || '').replace(/[$,MK]/g, '')) || 0
      const mult = pool.tvl?.endsWith('M') ? 1e6 : pool.tvl?.endsWith('K') ? 1e3 : 1
      const tvlNum = tvl * mult
      const apy = parseApyPercent(pool.apy)
      totalTvl += tvlNum
      sum += tvlNum * apy
    })
    return totalTvl > 0 ? sum / totalTvl : 0
  }, [vesuPools])

  const ekuboWeightedApy = useMemo(() => {
    let totalTvl = 0
    let sum = 0
    trovesWbtcStrategies.forEach((s) => {
      const tvl = s.tvlUsd ?? 0
      const apy = s.apy != null ? s.apy * 100 : 0
      totalTvl += tvl
      sum += tvl * apy
    })
    return totalTvl > 0 ? sum / totalTvl : 0
  }, [trovesWbtcStrategies])

  useEffect(() => {
    if (!address || !currentNetwork.rpcUrl) {
      setUserVesuUsd(0)
      setUserEkuboUsd(0)
      setUserLoading(false)
      return
    }

    let cancelled = false
    setUserLoading(true)
    const rpcUrl = currentNetwork.rpcUrl

    const fetchUserPositions = async () => {
      let vesuUsd = 0
      let ekuboUsd = 0

      try {
        for (const pool of VESU_LENDING_POOLS) {
          try {
            const vTokenBalance = await getVTokenBalance(rpcUrl, pool.vTokenAddress, address)
            if (vTokenBalance === 0n) continue
            const assetAmount = await convertSharesToAssets(
              rpcUrl,
              pool.vTokenAddress,
              vTokenBalance
            )
            const decimals = pool.decimals
            const amount = Number(assetAmount) / 10 ** decimals
            if (pool.asset === 'USDC') {
              vesuUsd += amount
            } else {
              // WBTC and BTCfi assets (LBTC/tBTC/SolvBTC) are ~1 BTC in value.
              vesuUsd += amount * WBTC_PRICE_USD
            }
          } catch {
            // ignore per-pool errors
          }
        }

        if (trovesWbtcStrategies.length > 0) {
          for (const strategy of trovesWbtcStrategies) {
            try {
              const vaultAddr = getVaultAddress(strategy)
              const shareBalance = await getTrovesVaultShareBalance(rpcUrl, vaultAddr, address)
              if (shareBalance === 0n) continue
              const [totalSupply, totalAssets] = await Promise.all([
                getTrovesVaultTotalSupply(rpcUrl, vaultAddr),
                getTrovesVaultTotalAssets(rpcUrl, vaultAddr),
              ])
              if (totalSupply > 0n && strategy.tvlUsd > 0) {
                const ratio = Number(shareBalance) / Number(totalSupply)
                ekuboUsd += ratio * strategy.tvlUsd
              }
            } catch {
              // ignore per-strategy errors
            }
          }
        }
      } finally {
        if (!cancelled) {
          setUserVesuUsd(vesuUsd)
          setUserEkuboUsd(ekuboUsd)
          setUserLoading(false)
        }
      }
    }

    fetchUserPositions()
    return () => {
      cancelled = true
    }
  }, [address, currentNetwork.rpcUrl, trovesWbtcStrategies])

  useEffect(() => {
    if (protocolLoading) return
    setPositions([
      {
        protocol: 'Vesu',
        userPositionUsd: userVesuUsd,
        apyDisplay: `${vesuWeightedApy.toFixed(2)}%`,
        chartData: uptrendChartData(userVesuUsd),
        logoPath: '/supported_platforms/vesu_brand.png',
        chartColor: '#97FCE4',
        gradientId: 'gradientVesu',
      },
      {
        protocol: 'Ekubo',
        userPositionUsd: userEkuboUsd,
        apyDisplay: `${ekuboWeightedApy.toFixed(2)}%`,
        chartData: uptrendChartData(userEkuboUsd),
        logoPath: '/supported_platforms/ekubo.png',
        chartColor: '#8B5CF6',
        gradientId: 'gradientEkubo',
      },
    ])
  }, [protocolLoading, userVesuUsd, userEkuboUsd, vesuWeightedApy, ekuboWeightedApy])

  const loading = protocolLoading || userLoading

  if (loading) {
    return (
      <div className="bg-[#101D22] rounded-4xl p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-medium text-white mb-4 lg:mb-6">
          Current Positions
        </h3>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#97FCE4] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#101D22] rounded-4xl p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h3 className="text-base lg:text-lg font-medium text-white">
          Current Positions
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {positions.map((position, index) => (
          <motion.div
            key={position.protocol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            }}
            className="bg-[#0F1A1F] rounded-xl p-4 lg:p-6 relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs lg:text-sm text-gray-400 mb-1">Your position</p>
                  <span className="text-xl lg:text-2xl font-bold text-white">
                    {formatUsd(position.userPositionUsd)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">APY</p>
                  <span className="text-base lg:text-lg font-semibold text-[#97FCE4]">
                    {position.apyDisplay}
                  </span>
                </div>
              </div>

              <div className="h-16 lg:h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={position.chartData}
                    margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id={position.gradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={position.chartColor}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={position.chartColor}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F1A1F', border: '1px solid #333' }}
                      formatter={(value) => [formatUsd(Number(value ?? 0)), 'Value']}
                      labelFormatter={() => 'Growth'}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={position.chartColor}
                      fill={`url(#${position.gradientId})`}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: position.chartColor }}
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center">
                  <img
                    src={position.logoPath}
                    alt={position.protocol}
                    width={position.protocol === 'Vesu' ? 50 : 35}
                    height={35}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <Check className="w-3 lg:w-4 h-3 lg:h-4 text-[#97FCE4]" />
                  <span className="text-xs lg:text-sm text-gray-400">Audited</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default CurrentPositions
