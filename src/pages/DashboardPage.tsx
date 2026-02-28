import { useState } from 'react';
import { Calendar } from 'lucide-react';
import TabNav from '../components/TabNav';
import InventoryOverview from '../components/InventoryOverview';
import StockoutCosts from '../components/StockoutCosts';
import SupplierScorecard from '../components/SupplierScorecard';
import AlertsFeed from '../components/AlertsFeed';

type TabId = 'inventory' | 'costs' | 'suppliers' | 'alerts';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('inventory');

  return (
    <>
      <TabNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabId)} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Context bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Central Auto Parts Distribution</h2>
            <p className="text-text-muted text-sm">3 locations &bull; 487 SKUs &bull; Last updated: Feb 27, 2026</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-text-muted text-sm bg-bg-card border border-border-subtle rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4" />
            <span>Feb 2026</span>
          </div>
        </div>

        {activeTab === 'inventory' && <InventoryOverview />}
        {activeTab === 'costs' && <StockoutCosts />}
        {activeTab === 'suppliers' && <SupplierScorecard />}
        {activeTab === 'alerts' && <AlertsFeed />}
      </main>

      {/* CTA Footer */}
      <div className="border-t border-border-subtle bg-bg-card mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="bg-gradient-to-r from-[#0e383c] to-[#164955] rounded-lg p-8 text-center border border-accent/20">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                Want this dashboard tracking YOUR inventory?
              </h2>
              <p className="text-text-secondary mb-6 text-lg">
                See your real stockout costs and supplier performance in real-time. Book a free 15-minute clarity call to see how we can set this up for you.
              </p>
              <a
                href="https://cal.com/scale-ify/clarity-call"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent text-[#0a1a20] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent/90 transition-colors shadow-xl"
              >
                <Calendar className="w-5 h-5" />
                Book Your Free Clarity Call
              </a>
              <p className="text-text-muted text-sm mt-4">
                No commitment required &bull; See if we're a good fit &bull; Get personalized recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm">
              &copy; 2026 Scaleify. This is a demo dashboard with sample data.
            </p>
            <p className="text-text-muted text-xs opacity-60">
              Built with React, TypeScript, and Recharts
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
