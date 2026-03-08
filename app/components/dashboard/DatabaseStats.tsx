import { useEffect, useState } from "react";
import { Database, TrendingUp, Users } from "lucide-react";

interface DbStats {
  total_deposits: number;
  unique_depositors: number;
  total_deposit_wbtc: number;
  total_deposit_usd: number;
  total_deposit_strk: number;
  total_volume_wbtc: number;
  total_volume_usd: number;
  total_volume_strk: number;
  total_swaps: number;
}

export default function DatabaseStats() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats?type=yield_page');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-[#101D22] rounded-3xl p-6 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Database className="text-[#97FCE4]" size={20} />
          <h3 className="text-lg font-medium text-white">Database Statistics</h3>
        </div>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#101D22] rounded-3xl p-6 border border-red-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Database className="text-red-400" size={20} />
          <h3 className="text-lg font-medium text-white">Database Statistics</h3>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#101D22] rounded-3xl p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-6">
        <Database className="text-[#97FCE4]" size={20} />
        <h3 className="text-lg font-medium text-white">Database Statistics</h3>
        <span className="ml-auto text-xs text-[#97FCE4]">● Live</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0F1A1F] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-[#97FCE4]" size={16} />
            <p className="text-sm text-gray-400">Total Swaps</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.total_swaps || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ${(Number(stats?.total_volume_usd) || 0).toFixed(2)} volume
          </p>
        </div>

        <div className="bg-[#0F1A1F] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="text-[#97FCE4]" size={16} />
            <p className="text-sm text-gray-400">Total Deposits</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.total_deposits || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ${(Number(stats?.total_deposit_usd) || 0).toFixed(2)} value
          </p>
        </div>

        <div className="bg-[#0F1A1F] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-[#97FCE4]" size={16} />
            <p className="text-sm text-gray-400">Unique Users</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.unique_depositors || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            depositors
          </p>
        </div>
      </div>

      {stats && (stats.total_deposit_wbtc || stats.total_volume_wbtc) && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-400 mb-2">Asset Breakdown</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">WBTC Deposits:</span>
              <span className="text-white ml-2">{(Number(stats.total_deposit_wbtc) || 0).toFixed(8)}</span>
            </div>
            <div>
              <span className="text-gray-400">WBTC Volume:</span>
              <span className="text-white ml-2">{(Number(stats.total_volume_wbtc) || 0).toFixed(8)}</span>
            </div>
            <div>
              <span className="text-gray-400">STRK Deposits:</span>
              <span className="text-white ml-2">{(Number(stats.total_deposit_strk) || 0).toFixed(4)}</span>
            </div>
            <div>
              <span className="text-gray-400">STRK Volume:</span>
              <span className="text-white ml-2">{(Number(stats.total_volume_strk) || 0).toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
