import { Package, TrendingDown, AlertTriangle, XCircle, CheckCircle2, Eye } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Label,
  ResponsiveContainer,
} from 'recharts';
import StatCard from './StatCard';
import {
  inventorySummary,
  inventoryHealthData,
  inventoryItems,
  type StockTier,
} from '../data/sampleData';

const tierConfig: Record<StockTier, { label: string; badgeCls: string; textCls: string }> = {
  healthy: { label: 'HEALTHY', badgeCls: 'bg-green-500/20 text-green-400', textCls: 'text-green-400' },
  watch: { label: 'WATCH', badgeCls: 'bg-blue-500/20 text-blue-400', textCls: 'text-blue-400' },
  warning: { label: 'WARNING', badgeCls: 'bg-amber-500/20 text-amber-400', textCls: 'text-amber-400' },
  critical: { label: 'CRITICAL', badgeCls: 'bg-red-500/20 text-red-400', textCls: 'text-red-400' },
  out: { label: 'OUT OF STOCK', badgeCls: 'bg-red-700/30 text-red-300', textCls: 'text-red-300' },
};

const tierOrder: StockTier[] = ['out', 'critical', 'warning', 'watch', 'healthy'];

const atRiskItems = [...inventoryItems]
  .sort((a, b) => {
    const aOrder = tierOrder.indexOf(a.tier);
    const bOrder = tierOrder.indexOf(b.tier);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.daysLeft - b.daysLeft;
  })
  .slice(0, 15);

function CustomLabel({ viewBox }: { viewBox?: { cx?: number; cy?: number } }) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2f0f0" fontSize={22} fontWeight="bold">
        487
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#36a5a5" fontSize={10}>
        SKUs
      </text>
    </g>
  );
}

export default function InventoryOverview() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          title="Total SKUs"
          value={inventorySummary.total}
          icon={Package}
          sparkline={[400, 420, 445, 460, 470, 480, 487]}
        />
        <StatCard
          title="Healthy (14+ days)"
          value={inventorySummary.healthy}
          icon={CheckCircle2}
          trend="64% of inventory"
          color="green"
          sparkline={[290, 300, 310, 305, 308, 312]}
        />
        <StatCard
          title="Watch (7-14 days)"
          value={inventorySummary.watch}
          icon={Eye}
          trend="18% of inventory"
          sparkline={[70, 75, 80, 85, 82, 89]}
        />
        <StatCard
          title="Warning (3-7 days)"
          value={inventorySummary.warning}
          icon={AlertTriangle}
          trend="+8 vs last week"
          trendUp={false}
          color="amber"
          sparkline={[35, 38, 42, 44, 48, 52]}
        />
        <StatCard
          title="Critical (<3 days)"
          value={inventorySummary.critical}
          icon={TrendingDown}
          trend="+5 vs last week"
          trendUp={false}
          color="red"
          sparkline={[12, 14, 16, 19, 21, 24]}
        />
        <StatCard
          title="Out of Stock"
          value={inventorySummary.out}
          icon={XCircle}
          subtitle={`Estimated daily cost: $${inventorySummary.dailyOutOfStockCost.toLocaleString()}`}
          color="red"
          sparkline={[4, 5, 6, 7, 8, 10]}
        />
      </div>

      {/* Inventory Health Chart */}
      <div className="bg-bg-card rounded-lg p-5 border border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Inventory Health Distribution</h3>
        <div className="flex flex-col lg:flex-row items-center gap-5">
          <div className="w-full lg:w-64 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryHealthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  dataKey="value"
                  labelLine={false}
                >
                  {inventoryHealthData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                  <Label content={<CustomLabel />} position="center" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c2025',
                    border: '1px solid #164955',
                    borderRadius: '8px',
                    color: '#e2f0f0',
                  }}
                  formatter={(value) => {
                    const num = typeof value === 'number' ? value : 0;
                    return [`${num} SKUs`, ''];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom legend */}
          <div className="flex-1 space-y-2">
            {inventoryHealthData.map((entry, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-text-secondary text-xs">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-primary font-semibold text-sm">{entry.value}</span>
                  <span className="text-text-muted text-xs w-10 text-right">
                    {Math.round((entry.value / inventorySummary.total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* At-Risk Items Table */}
      <div className="bg-bg-card rounded-lg p-5 border border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          At-Risk Items
          <span className="ml-2 text-xs font-normal text-text-muted">(sorted by urgency)</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="pb-2.5 text-text-muted font-medium text-xs">SKU</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs">Product</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs hidden md:table-cell">Location</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs text-right">Stock</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs text-right hidden lg:table-cell">Daily Demand</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs text-right">Days Left</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs">Status</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs hidden xl:table-cell">Supplier</th>
              </tr>
            </thead>
            <tbody>
              {atRiskItems.map((item) => {
                const cfg = tierConfig[item.tier];
                return (
                  <tr
                    key={item.sku}
                    className="border-b border-border-subtle/50 hover:bg-bg-elevated/30 transition-colors"
                  >
                    <td className="py-2.5 text-text-muted font-mono text-xs">{item.sku}</td>
                    <td className="py-2.5 text-text-primary font-medium text-xs max-w-48">
                      <div className="truncate">{item.product}</div>
                    </td>
                    <td className="py-2.5 text-text-muted hidden md:table-cell text-xs">{item.location}</td>
                    <td className="py-2.5 text-text-secondary text-right text-xs">{item.currentStock}</td>
                    <td className="py-2.5 text-text-muted text-right hidden lg:table-cell text-xs">{item.dailyDemand}/day</td>
                    <td className={`py-2.5 text-right font-bold text-xs ${cfg.textCls}`}>
                      {item.daysLeft === 0 ? 'Out' : `${item.daysLeft}d`}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${cfg.badgeCls}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-2.5 text-text-muted text-xs hidden xl:table-cell">{item.supplier}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
