import { AlertTriangle, AlertCircle, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { todayAlerts, alertHistory, type AlertItem } from '../data/sampleData';

const criticalAlerts = todayAlerts.filter((a) => a.tier === 'critical');
const warningAlerts = todayAlerts.filter((a) => a.tier === 'warning');
const watchAlerts = todayAlerts.filter((a) => a.tier === 'watch');

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

interface AlertCardProps {
  alert: AlertItem;
}

function AlertCard({ alert }: AlertCardProps) {
  const tierStyles = {
    critical: {
      border: 'border-l-red-500',
      bg: 'bg-red-500/5',
      icon: <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />,
      badge: 'bg-red-500/20 text-red-400',
    },
    warning: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-500/5',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />,
      badge: 'bg-amber-500/20 text-amber-400',
    },
    watch: {
      border: 'border-l-[#4de8e8]',
      bg: 'bg-accent/5',
      icon: <Eye className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />,
      badge: 'bg-accent/20 text-accent',
    },
  };

  const style = tierStyles[alert.tier];

  return (
    <div className={`border border-border-subtle border-l-4 ${style.border} ${style.bg} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        {style.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <span className="text-text-muted text-xs font-mono">{alert.sku}</span>
              <h4 className="text-text-primary font-semibold text-sm leading-tight">{alert.product}</h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${style.badge}`}>
              {alert.daysLeft === 0 ? 'OUT' : `${alert.daysLeft}d left`}
            </span>
          </div>
          <div className="text-xs text-text-muted space-y-0.5">
            <div>{alert.location} &bull; Stock: <span className="text-text-secondary">{alert.currentStock} units</span></div>
            <div>Supplier: <span className="text-text-secondary">{alert.supplier}</span></div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className={`text-xs font-medium ${alert.tier === 'critical' ? 'text-red-300' : alert.tier === 'warning' ? 'text-amber-300' : 'text-accent'}`}>
              Action: Order {alert.recommendedOrderQty} units — lead time {alert.leadTimeDays} days
            </p>
            <span className="text-xs text-text-muted hidden sm:block">
              Est. loss: <span className="text-red-400">{fmt(alert.estimatedDailyLoss)}/day</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlertsFeed() {
  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-text-primary font-semibold text-lg">12 items need attention today</h3>
            <p className="text-text-muted text-sm">
              <span className="text-red-400 font-medium">3 critical</span>
              {' · '}
              <span className="text-amber-400 font-medium">5 warning</span>
              {' · '}
              <span className="text-accent font-medium">4 watch</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-text-muted text-xs">Total estimated daily loss</p>
              <p className="text-red-400 font-bold text-lg">
                {fmt(todayAlerts.reduce((sum, a) => sum + a.estimatedDailyLoss, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CRITICAL Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-red-400 font-bold uppercase tracking-wide text-sm">
            Critical — Order Immediately
          </h3>
          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{criticalAlerts.length}</span>
        </div>
        <div className="space-y-3">
          {criticalAlerts.map((alert) => (
            <AlertCard key={alert.sku} alert={alert} />
          ))}
        </div>
      </div>

      {/* WARNING Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-amber-400 font-bold uppercase tracking-wide text-sm">
            Warning — Order This Week
          </h3>
          <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">{warningAlerts.length}</span>
        </div>
        <div className="space-y-3">
          {warningAlerts.map((alert) => (
            <AlertCard key={alert.sku} alert={alert} />
          ))}
        </div>
      </div>

      {/* WATCH Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-5 h-5 text-accent" />
          <h3 className="text-accent font-bold uppercase tracking-wide text-sm">
            Watch — Monitor Closely
          </h3>
          <span className="px-2 py-0.5 bg-accent text-[#0a1a20] text-xs font-bold rounded-full">{watchAlerts.length}</span>
        </div>
        <div className="space-y-3">
          {watchAlerts.map((alert) => (
            <AlertCard key={alert.sku} alert={alert} />
          ))}
        </div>
      </div>

      {/* Alert History Table */}
      <div className="bg-bg-card rounded-lg p-6 border border-border-subtle">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Alert History (Last 14 Days)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="pb-3 text-text-muted font-medium">Date</th>
                <th className="pb-3 text-text-muted font-medium">SKU</th>
                <th className="pb-3 text-text-muted font-medium">Product</th>
                <th className="pb-3 text-text-muted font-medium hidden md:table-cell">Tier</th>
                <th className="pb-3 text-text-muted font-medium hidden lg:table-cell">Action Taken</th>
                <th className="pb-3 text-text-muted font-medium text-center">Resolved</th>
              </tr>
            </thead>
            <tbody>
              {alertHistory.map((item, i) => (
                <tr key={i} className="border-b border-border-subtle/50 hover:bg-bg-elevated/30 transition-colors">
                  <td className="py-3 text-text-muted text-xs whitespace-nowrap">{item.date}</td>
                  <td className="py-3 text-text-muted font-mono text-xs">{item.sku}</td>
                  <td className="py-3 text-text-primary text-sm">{item.product}</td>
                  <td className="py-3 hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      item.tier === 'critical'
                        ? 'bg-red-500/20 text-red-400'
                        : item.tier === 'warning'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-accent/20 text-accent'
                    }`}>
                      {item.tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-text-muted text-xs hidden lg:table-cell">{item.actionTaken}</td>
                  <td className="py-3 text-center">
                    {item.resolved ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
