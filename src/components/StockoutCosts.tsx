import { ShoppingCart, UserMinus, Zap, Clock, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import StatCard from './StatCard';
import { monthlyCostHistory, topStockoutCosts } from '../data/sampleData';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const currentMonth = monthlyCostHistory[monthlyCostHistory.length - 1];
const prevMonth = monthlyCostHistory[monthlyCostHistory.length - 2];

export default function StockoutCosts() {
  return (
    <div className="space-y-6">
      {/* Hero cost callout */}
      <div className="bg-gradient-to-r from-red-500/8 to-red-900/8 border border-red-500/20 rounded-lg p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="p-4 bg-red-500/15 rounded-xl">
            <TrendingUp className="w-8 h-8 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-text-muted text-sm font-medium uppercase tracking-wide mb-1">
              Total Stockout Cost This Month
            </p>
            <p className="text-5xl font-bold text-text-primary mb-1">{fmt(currentMonth.total)}</p>
            <p className="text-red-400 text-sm">
              Up 12% from last month ({fmt(prevMonth.total)})
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-text-muted text-xs mb-1">Annualized run-rate</p>
            <p className="text-2xl font-bold text-red-400">{fmt(currentMonth.total * 12)}</p>
          </div>
        </div>
      </div>

      {/* Cost breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Direct Lost Sales"
          value={fmt(currentMonth.directLost)}
          icon={ShoppingCart}
          color="red"
        />
        <StatCard
          title="Customer Churn"
          value={fmt(currentMonth.churn)}
          icon={UserMinus}
          subtitle="~14 customers at risk"
          color="amber"
        />
        <StatCard
          title="Emergency Orders"
          value={fmt(currentMonth.emergency)}
          icon={Zap}
          subtitle="23 rush orders this month"
          color="amber"
        />
        <StatCard
          title="Labor / Firefighting"
          value={fmt(currentMonth.labor)}
          icon={Clock}
          subtitle="100 hours @ $35/hr"
        />
      </div>

      {/* Monthly Trend — Stacked Area Chart */}
      <div className="bg-bg-card rounded-lg p-6 border border-border-subtle">
        <h3 className="text-lg font-semibold text-text-primary mb-1">Monthly Stockout Cost Trend</h3>
        <p className="text-text-muted text-sm mb-4">Sep 2025 — Feb 2026 — costs are increasing each month</p>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={monthlyCostHistory} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="gDirect" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gChurn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gEmergency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gLabor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#36a5a5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#36a5a5" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#164955" />
            <XAxis dataKey="month" stroke="#1e6e72" tick={{ fill: '#36a5a5', fontSize: 12 }} />
            <YAxis
              stroke="#1e6e72"
              tick={{ fill: '#36a5a5', fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0c2025', border: '1px solid #164955', borderRadius: '8px', color: '#e2f0f0' }}
              formatter={(value, name) => {
                const num = typeof value === 'number' ? value : 0;
                const key = String(name);
                const labels: Record<string, string> = {
                  directLost: 'Direct Lost Sales',
                  churn: 'Customer Churn',
                  emergency: 'Emergency Orders',
                  labor: 'Labor / Firefighting',
                };
                return [fmt(num), labels[key] ?? key];
              }}
            />
            <Legend
              wrapperStyle={{ color: '#36a5a5', fontSize: 12 }}
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  directLost: 'Direct Lost Sales',
                  churn: 'Customer Churn',
                  emergency: 'Emergency Orders',
                  labor: 'Labor / Firefighting',
                };
                return labels[value] ?? value;
              }}
            />
            <Area type="monotone" dataKey="labor" stackId="1" stroke="#36a5a5" fill="url(#gLabor)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="emergency" stackId="1" stroke="#f59e0b" fill="url(#gEmergency)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="churn" stackId="1" stroke="#fb923c" fill="url(#gChurn)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="directLost" stackId="1" stroke="#ef4444" fill="url(#gDirect)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cost by Product Table */}
      <div className="bg-bg-card rounded-lg p-6 border border-border-subtle">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Top 10 SKUs by Stockout Cost (This Month)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="pb-3 text-text-muted font-medium w-10">Rank</th>
                <th className="pb-3 text-text-muted font-medium">SKU</th>
                <th className="pb-3 text-text-muted font-medium">Product</th>
                <th className="pb-3 text-text-muted font-medium text-right">Total Cost</th>
                <th className="pb-3 text-text-muted font-medium text-right hidden md:table-cell">Days Out</th>
                <th className="pb-3 text-text-muted font-medium text-right hidden md:table-cell">Stockouts</th>
                <th className="pb-3 text-text-muted font-medium hidden lg:table-cell">Supplier</th>
              </tr>
            </thead>
            <tbody>
              {topStockoutCosts.map((item) => (
                <tr
                  key={item.sku}
                  className="border-b border-border-subtle/50 hover:bg-bg-elevated/30 transition-colors"
                >
                  <td className="py-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      item.rank <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-bg-elevated text-text-muted'
                    }`}>
                      {item.rank}
                    </span>
                  </td>
                  <td className="py-3 text-text-muted font-mono text-xs">{item.sku}</td>
                  <td className="py-3 text-text-primary font-medium">{item.product}</td>
                  <td className="py-3 text-right font-bold text-red-400">{fmt(item.totalCost)}</td>
                  <td className="py-3 text-right text-text-muted hidden md:table-cell">{item.daysOut}</td>
                  <td className="py-3 text-right text-text-muted hidden md:table-cell">{item.stockouts}</td>
                  <td className="py-3 text-text-muted text-sm hidden lg:table-cell">{item.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
