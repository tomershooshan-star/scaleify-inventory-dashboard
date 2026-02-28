import { Package, DollarSign, Award, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const tabs: Tab[] = [
  { id: 'inventory', label: 'Inventory Status', icon: Package },
  { id: 'costs', label: 'Stockout Costs', icon: DollarSign },
  { id: 'suppliers', label: 'Supplier Scorecard', icon: Award },
  { id: 'alerts', label: 'Alerts', icon: Bell, badge: '12' },
];

interface TabNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="bg-bg-card border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full leading-none">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
