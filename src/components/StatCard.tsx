import type { LucideIcon } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

type CardColor = 'default' | 'green' | 'amber' | 'red';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  color?: CardColor;
  sparkline?: number[];
}

const accentColors: Record<CardColor, { icon: string; spark: string }> = {
  default: { icon: 'text-accent', spark: '#4de8e8' },
  green: { icon: 'text-emerald-400', spark: '#34d399' },
  amber: { icon: 'text-amber-400', spark: '#fbbf24' },
  red: { icon: 'text-red-400', spark: '#f87171' },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  subtitle,
  color = 'default',
  sparkline,
}: StatCardProps) {
  const accent = accentColors[color];
  const sparkData = sparkline?.map((v) => ({ v }));

  return (
    <div className="bg-bg-card rounded-lg p-5 border border-border-subtle hover:border-border-default transition-all card-glow relative overflow-hidden">
      {sparkData && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent.spark} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={accent.spark} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={accent.spark}
                strokeWidth={1.5}
                fill={`url(#spark-${color})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-text-primary mt-2 tracking-tight">{value}</p>
          {subtitle && <p className="text-text-muted text-xs mt-1.5">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trendUp === undefined ? 'text-text-secondary' : trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {trendUp !== undefined && (trendUp ? '\u2191 ' : '\u2193 ')}
              {trend}
            </p>
          )}
        </div>
        <div className="ml-4">
          <Icon className={`w-5 h-5 ${accent.icon} opacity-50`} />
        </div>
      </div>
    </div>
  );
}
