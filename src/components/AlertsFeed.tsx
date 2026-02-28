import { useState, useRef } from 'react';
import { AlertTriangle, AlertCircle, Eye, CheckCircle2, XCircle, GripVertical } from 'lucide-react';
import { todayAlerts, alertHistory, type AlertItem } from '../data/sampleData';

type AlertTier = 'critical' | 'warning' | 'watch';

const tierConfig: Record<AlertTier, {
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  headerColor: string;
  borderTop: string;
  badgeBg: string;
  badgeText: string;
  cardBorder: string;
  cardBg: string;
  actionText: string;
}> = {
  critical: {
    label: 'Critical',
    subtitle: 'Order Immediately',
    icon: <AlertCircle className="w-4 h-4 text-red-400" />,
    headerColor: 'text-red-400',
    borderTop: 'border-t-2 border-t-red-500',
    badgeBg: 'bg-red-500',
    badgeText: 'text-white',
    cardBorder: 'border-l-red-500',
    cardBg: 'bg-red-500/5',
    actionText: 'text-red-300',
  },
  warning: {
    label: 'Warning',
    subtitle: 'Order This Week',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    headerColor: 'text-amber-400',
    borderTop: 'border-t-2 border-t-amber-500',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
    cardBorder: 'border-l-amber-500',
    cardBg: 'bg-amber-500/5',
    actionText: 'text-amber-300',
  },
  watch: {
    label: 'Watch',
    subtitle: 'Monitor Closely',
    icon: <Eye className="w-4 h-4 text-accent" />,
    headerColor: 'text-accent',
    borderTop: 'border-t-2 border-t-accent',
    badgeBg: 'bg-accent',
    badgeText: 'text-[#0a1a20]',
    cardBorder: 'border-l-[#4de8e8]',
    cardBg: 'bg-accent/5',
    actionText: 'text-accent',
  },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

interface KanbanCardProps {
  alert: AlertItem;
  onDragStart: (e: React.DragEvent, sku: string) => void;
}

function KanbanCard({ alert, onDragStart }: KanbanCardProps) {
  const cfg = tierConfig[alert.tier];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, alert.sku)}
      className={`border border-border-subtle border-l-4 ${cfg.cardBorder} ${cfg.cardBg} rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:border-border-hover group`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-text-muted/40 mt-0.5 shrink-0 group-hover:text-text-muted transition-colors" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <span className="text-text-muted text-[10px] font-mono">{alert.sku}</span>
              <h4 className="text-text-primary font-semibold text-xs leading-tight truncate">{alert.product}</h4>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${cfg.cardBg === 'bg-accent/5' ? 'bg-accent/20 text-accent' : alert.tier === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {alert.daysLeft === 0 ? 'OUT' : `${alert.daysLeft}d`}
            </span>
          </div>
          <div className="text-[10px] text-text-muted space-y-0.5">
            <div>{alert.location} &middot; <span className="text-text-secondary">{alert.currentStock} units</span></div>
            <div className="flex items-center justify-between">
              <span>{alert.supplier}</span>
              <span className="text-red-400">{fmt(alert.estimatedDailyLoss)}/d</span>
            </div>
          </div>
          <p className={`text-[10px] font-medium mt-1.5 ${cfg.actionText}`}>
            Order {alert.recommendedOrderQty}u &middot; {alert.leadTimeDays}d lead
          </p>
        </div>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  tier: AlertTier;
  alerts: AlertItem[];
  onDragStart: (e: React.DragEvent, sku: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, tier: AlertTier) => void;
  isDropTarget: boolean;
}

function KanbanColumn({ tier, alerts, onDragStart, onDragOver, onDragLeave, onDrop, isDropTarget }: KanbanColumnProps) {
  const cfg = tierConfig[tier];

  return (
    <div className={`bg-bg-card rounded-lg border border-border-subtle ${cfg.borderTop} flex flex-col`}>
      {/* Column Header */}
      <div className="px-3 py-2.5 border-b border-border-subtle/50 flex items-center gap-2">
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-bold uppercase tracking-wide ${cfg.headerColor}`}>{cfg.label}</span>
          <span className="text-text-muted text-[10px] ml-1.5">{cfg.subtitle}</span>
        </div>
        <span className={`px-1.5 py-0.5 ${cfg.badgeBg} ${cfg.badgeText} text-[10px] font-bold rounded-full min-w-[20px] text-center`}>
          {alerts.length}
        </span>
      </div>

      {/* Cards Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, tier)}
        className={`flex-1 p-2 space-y-2 overflow-y-auto max-h-[480px] min-h-[120px] transition-colors ${
          isDropTarget ? 'bg-accent/5 ring-1 ring-accent/30 ring-inset' : ''
        }`}
      >
        {alerts.length === 0 && (
          <div className="flex items-center justify-center h-20 text-text-muted text-xs">
            No alerts
          </div>
        )}
        {alerts.map((alert) => (
          <KanbanCard key={alert.sku} alert={alert} onDragStart={onDragStart} />
        ))}
        {isDropTarget && (
          <div className="border-2 border-dashed border-accent/30 rounded-lg p-3 text-center text-accent/60 text-xs">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlertsFeed() {
  const [alerts, setAlerts] = useState<AlertItem[]>([...todayAlerts]);
  const [dropTarget, setDropTarget] = useState<AlertTier | null>(null);
  const draggedSku = useRef<string | null>(null);

  const criticalAlerts = alerts.filter((a) => a.tier === 'critical');
  const warningAlerts = alerts.filter((a) => a.tier === 'warning');
  const watchAlerts = alerts.filter((a) => a.tier === 'watch');

  const totalDailyLoss = alerts.reduce((sum, a) => sum + a.estimatedDailyLoss, 0);

  function handleDragStart(_e: React.DragEvent, sku: string) {
    draggedSku.current = sku;
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    const col = e.currentTarget.closest('[data-tier]') as HTMLElement | null;
    if (col) setDropTarget(col.dataset.tier as AlertTier);
  }

  function handleDragLeave(e: React.DragEvent) {
    const related = e.relatedTarget as HTMLElement | null;
    const col = e.currentTarget.closest('[data-tier]') as HTMLElement | null;
    if (col && related && !col.contains(related)) {
      setDropTarget(null);
    }
  }

  function handleDrop(_e: React.DragEvent, tier: AlertTier) {
    if (!draggedSku.current) return;
    setAlerts((prev) =>
      prev.map((a) => (a.sku === draggedSku.current ? { ...a, tier } : a))
    );
    draggedSku.current = null;
    setDropTarget(null);
  }

  const tiers: AlertTier[] = ['critical', 'warning', 'watch'];
  const tierAlerts: Record<AlertTier, AlertItem[]> = {
    critical: criticalAlerts,
    warning: warningAlerts,
    watch: watchAlerts,
  };

  return (
    <div className="space-y-5">
      {/* Summary Banner */}
      <div className="bg-bg-card border border-border-subtle rounded-lg p-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-text-primary font-semibold text-sm">{alerts.length} items need attention today</h3>
            <p className="text-text-muted text-xs">
              <span className="text-red-400 font-medium">{criticalAlerts.length} critical</span>
              {' · '}
              <span className="text-amber-400 font-medium">{warningAlerts.length} warning</span>
              {' · '}
              <span className="text-accent font-medium">{watchAlerts.length} watch</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-text-muted text-[10px]">Est. daily loss</p>
            <p className="text-red-400 font-bold text-base">{fmt(totalDailyLoss)}</p>
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <div key={tier} data-tier={tier}>
            <KanbanColumn
              tier={tier}
              alerts={tierAlerts[tier]}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              isDropTarget={dropTarget === tier}
            />
          </div>
        ))}
      </div>

      {/* Alert History Table */}
      <div className="bg-bg-card rounded-lg p-5 border border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Recent Alert History (Last 14 Days)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="pb-2.5 text-text-muted font-medium text-xs">Date</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs">SKU</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs">Product</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs hidden md:table-cell">Tier</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs hidden lg:table-cell">Action Taken</th>
                <th className="pb-2.5 text-text-muted font-medium text-xs text-center">Resolved</th>
              </tr>
            </thead>
            <tbody>
              {alertHistory.map((item, i) => (
                <tr key={i} className="border-b border-border-subtle/50 hover:bg-bg-elevated/30 transition-colors">
                  <td className="py-2.5 text-text-muted text-xs whitespace-nowrap">{item.date}</td>
                  <td className="py-2.5 text-text-muted font-mono text-xs">{item.sku}</td>
                  <td className="py-2.5 text-text-primary text-xs">{item.product}</td>
                  <td className="py-2.5 hidden md:table-cell">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      item.tier === 'critical'
                        ? 'bg-red-500/20 text-red-400'
                        : item.tier === 'warning'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-accent/20 text-accent'
                    }`}>
                      {item.tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 text-text-muted text-xs hidden lg:table-cell">{item.actionTaken}</td>
                  <td className="py-2.5 text-center">
                    {item.resolved ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mx-auto" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400 mx-auto" />
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
