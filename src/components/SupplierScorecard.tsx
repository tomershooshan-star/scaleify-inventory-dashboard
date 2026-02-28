import { Building2, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import StatCard from './StatCard';
import { suppliers, supplierStats, type SupplierGrade } from '../data/sampleData';

function gradeColor(grade: SupplierGrade) {
  if (grade === 'A' || grade === 'A-') return 'bg-green-500/20 text-green-400 border border-green-500/30';
  if (grade === 'B+' || grade === 'B' || grade === 'B-') return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  if (grade === 'C+' || grade === 'C') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  return 'bg-red-500/20 text-red-400 border border-red-500/30';
}

function barColor(onTimeRate: number): string {
  if (onTimeRate >= 90) return '#22c55e';
  if (onTimeRate >= 85) return '#4de8e8';
  if (onTimeRate >= 80) return '#36a5a5';
  if (onTimeRate >= 75) return '#f59e0b';
  return '#ef4444';
}

const chartData = [...suppliers]
  .sort((a, b) => b.onTimeRate - a.onTimeRate)
  .map((s) => ({ name: s.name.replace(' Inc', '').replace(' Ltd', '').replace(' Co', ''), rate: s.onTimeRate }));

export default function SupplierScorecard() {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Suppliers"
          value={supplierStats.total}
          icon={Building2}
        />
        <StatCard
          title="Avg On-Time Rate"
          value={`${supplierStats.avgOnTimeRate}%`}
          icon={TrendingUp}
          trend="Target: 90%"
          trendUp={false}
          color="amber"
        />
        <StatCard
          title="Orders This Quarter"
          value={supplierStats.ordersQtd}
          icon={Package}
        />
        <StatCard
          title="Late Deliveries"
          value={supplierStats.lateDeliveries}
          icon={AlertTriangle}
          subtitle="18% of all orders"
          color="red"
        />
      </div>

      {/* On-Time Rate Bar Chart */}
      <div className="bg-bg-card rounded-lg p-6 border border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Supplier On-Time Delivery Rate</h3>
          <span className="text-xs text-text-muted bg-bg-elevated px-2 py-1 rounded">
            Reference line: 85% target
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 32, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#164955" horizontal={false} />
            <XAxis
              type="number"
              domain={[50, 100]}
              stroke="#1e6e72"
              tick={{ fill: '#36a5a5', fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#1e6e72"
              tick={{ fill: '#e2f0f0', fontSize: 12 }}
              width={100}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0c2025', border: '1px solid #164955', borderRadius: '8px', color: '#e2f0f0' }}
              formatter={(value) => {
                const num = typeof value === 'number' ? value : 0;
                return [`${num}%`, 'On-Time Rate'];
              }}
            />
            <ReferenceLine x={85} stroke="#4de8e8" strokeDasharray="4 4" label={{ value: '85% target', fill: '#4de8e8', fontSize: 11 }} />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={barColor(entry.rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Supplier Performance Table */}
      <div className="bg-bg-card rounded-lg p-6 border border-border-subtle">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Supplier Performance Scorecard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="pb-3 text-text-muted font-medium">Supplier</th>
                <th className="pb-3 text-text-muted font-medium text-right">On-Time %</th>
                <th className="pb-3 text-text-muted font-medium text-right hidden md:table-cell">Avg Lead Time</th>
                <th className="pb-3 text-text-muted font-medium text-right hidden lg:table-cell">Variance</th>
                <th className="pb-3 text-text-muted font-medium text-right hidden md:table-cell">Emergency Rate</th>
                <th className="pb-3 text-text-muted font-medium text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.name} className="border-b border-border-subtle/50 hover:bg-bg-elevated/30 transition-colors">
                  <td className="py-4">
                    <div className="font-medium text-text-primary">{s.name}</div>
                    <div className="text-xs text-text-muted">{s.ordersQtd} orders QTD</div>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`font-bold ${s.onTimeRate >= 90 ? 'text-green-400' : s.onTimeRate >= 80 ? 'text-accent' : s.onTimeRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                      {s.onTimeRate}%
                    </span>
                  </td>
                  <td className="py-4 text-right text-text-secondary hidden md:table-cell">{s.avgLeadTime} days</td>
                  <td className="py-4 text-right text-text-muted text-xs hidden lg:table-cell">{s.leadTimeVariance}</td>
                  <td className="py-4 text-right hidden md:table-cell">
                    <span className={`text-sm font-medium ${s.emergencyRate <= 5 ? 'text-green-400' : s.emergencyRate <= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                      {s.emergencyRate}%
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${gradeColor(s.grade)}`}>
                      {s.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grade Legend */}
        <div className="mt-4 pt-4 border-t border-border-subtle flex flex-wrap gap-3">
          <span className="text-text-muted text-xs self-center">Grade legend:</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">A / A-</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">B+ / B / B-</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">C+ / C</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">D / F</span>
        </div>
      </div>
    </div>
  );
}
