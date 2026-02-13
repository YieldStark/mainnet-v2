import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { useWalletStore } from '~/providers/wallet-store-provider'

interface Position {
  protocol: string
  balance: string
  apy: string
  data: { value: number; timestamp?: number }[]
  logoPath: string
  chartColor: string
  gradientId: string
}

const CurrentPositions = () => {
  const vesuBalance = useWalletStore((state) => state.vesuBalance)
  const ekuboBalance = useWalletStore((state) => state.ekuboBalance)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPositions([
      {
        protocol: 'Vesu',
        balance: vesuBalance > 0 ? vesuBalance.toFixed(8) : '0.00000000',
        apy: '0%',
        data: Array(8)
          .fill(null)
          .map(() => ({ value: vesuBalance })),
        logoPath: '/supported_platforms/vesu_brand.png',
        chartColor: '#97FCE4',
        gradientId: 'gradientVesu',
      },
      {
        protocol: 'Ekubo',
        balance: ekuboBalance > 0 ? ekuboBalance.toFixed(8) : '0.00000000',
        apy: '0%',
        data: Array(8)
          .fill(null)
          .map(() => ({ value: ekuboBalance })),
        logoPath: '/supported_platforms/ekubo.png',
        chartColor: '#8B5CF6',
        gradientId: 'gradientEkubo',
      },
    ])
    setLoading(false)
  }, [vesuBalance, ekuboBalance])

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
                  <p className="text-xs lg:text-sm text-gray-400 mb-1">Deposited</p>
                  <span className="text-xl lg:text-2xl font-bold text-white">
                    {position.balance}
                  </span>
                  <span className="text-sm text-gray-400 ml-2">WBTC</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">APY</p>
                  <span className="text-base lg:text-lg font-semibold text-[#97FCE4]">
                    {position.apy}
                  </span>
                </div>
              </div>

              <div className="h-16 lg:h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={position.data}
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
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={position.chartColor}
                      fill={`url(#${position.gradientId})`}
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
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
