import { Settings, Package, FileSpreadsheet, Database, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const csvColumns = [
  'sku', 'product_name', 'category', 'location', 'current_stock',
  'daily_demand', 'unit_cost', 'reorder_qty', 'lead_time_days', 'supplier_name',
];

const businessConfig = `{
  "business_name": "Your Company Name",
  "locations": ["Main Warehouse", "Facility B"],
  "currency": "USD",
  "timezone": "America/New_York"
}`;

const alertRulesConfig = `{
  "tiers": {
    "critical": { "days_left_max": 3 },
    "warning":  { "days_left_max": 7 },
    "watch":    { "days_left_max": 14 }
  },
  "notify": {
    "slack_webhook": "https://hooks.slack.com/...",
    "email": "ops@yourcompany.com"
  },
  "refresh_interval_hours": 4
}`;

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Sub-header */}
      <div className="bg-bg-card border-b border-border-subtle px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-accent" />
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Getting Started</h1>
              <p className="text-text-muted text-sm">What you need to deploy this dashboard for your business</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* What You Need */}
        <section className="bg-bg-card border border-border-subtle rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-accent text-[#0a1a20] rounded-full flex items-center justify-center font-bold text-sm">1</div>
            <h2 className="text-xl font-bold text-text-primary">What You Need</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bg-elevated rounded-lg p-4 border border-border-subtle">
              <FileSpreadsheet className="w-6 h-6 text-accent mb-2" />
              <h3 className="text-text-primary font-semibold mb-1">Inventory CSV</h3>
              <p className="text-text-muted text-sm">Your current inventory levels exported from your ERP or WMS (weekly or daily)</p>
            </div>
            <div className="bg-bg-elevated rounded-lg p-4 border border-border-subtle">
              <Package className="w-6 h-6 text-accent mb-2" />
              <h3 className="text-text-primary font-semibold mb-1">Supplier List</h3>
              <p className="text-text-muted text-sm">List of suppliers with lead times and contact info for performance tracking</p>
            </div>
            <div className="bg-bg-elevated rounded-lg p-4 border border-border-subtle">
              <Database className="w-6 h-6 text-accent mb-2" />
              <h3 className="text-text-primary font-semibold mb-1">Business Config</h3>
              <p className="text-text-muted text-sm">Location names, alert thresholds, and notification preferences</p>
            </div>
          </div>
        </section>

        {/* CSV Format */}
        <section className="bg-bg-card border border-border-subtle rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-accent text-[#0a1a20] rounded-full flex items-center justify-center font-bold text-sm">2</div>
            <h2 className="text-xl font-bold text-text-primary">CSV Format</h2>
          </div>
          <p className="text-text-muted text-sm mb-4">
            Export your inventory data with these columns. Most ERP/WMS systems can export this directly.
          </p>
          <div className="bg-bg-primary border border-border-subtle rounded-lg p-4 overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="border-b border-border-default">
                  {csvColumns.map((col) => (
                    <th key={col} className="pb-2 pr-4 text-left text-accent font-mono whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="text-text-muted">
                  <td className="pt-2 pr-4 font-mono whitespace-nowrap">BRK-001</td>
                  <td className="pt-2 pr-4 whitespace-nowrap">Front Brake Pads</td>
                  <td className="pt-2 pr-4 whitespace-nowrap">Brake Components</td>
                  <td className="pt-2 pr-4 whitespace-nowrap">Main Warehouse</td>
                  <td className="pt-2 pr-4">14</td>
                  <td className="pt-2 pr-4">8</td>
                  <td className="pt-2 pr-4">42.00</td>
                  <td className="pt-2 pr-4">150</td>
                  <td className="pt-2 pr-4">4</td>
                  <td className="pt-2 pr-4 whitespace-nowrap">FastParts Inc</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-text-muted text-xs mt-3 opacity-60">
            Supported formats: CSV, XLSX &bull; Maximum 50,000 SKUs &bull; Refresh daily or on-demand
          </p>
        </section>

        {/* Configuration */}
        <section className="bg-bg-card border border-border-subtle rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-accent text-[#0a1a20] rounded-full flex items-center justify-center font-bold text-sm">3</div>
            <h2 className="text-xl font-bold text-text-primary">Configuration Files</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-text-muted text-sm font-medium mb-2">business.json</p>
              <pre className="bg-bg-primary border border-border-subtle rounded-lg p-4 text-xs text-text-secondary overflow-x-auto">
                <code>{businessConfig}</code>
              </pre>
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium mb-2">alert_rules.json</p>
              <pre className="bg-bg-primary border border-border-subtle rounded-lg p-4 text-xs text-text-secondary overflow-x-auto">
                <code>{alertRulesConfig}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-[#0e383c] to-[#164955] border border-accent/20 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-text-primary mb-2">Ready to deploy for your business?</h3>
          <p className="text-text-secondary text-sm mb-4">
            We handle the full setup — data pipeline, dashboard configuration, and alert routing — in under a week.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://cal.com/scale-ify/clarity-call"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-accent text-[#0a1a20] rounded-lg font-semibold hover:bg-accent/90 transition-colors"
            >
              Book a Setup Call
            </a>
            <Link
              to="/"
              className="px-6 py-3 bg-bg-elevated text-text-primary rounded-lg font-semibold hover:bg-border-default transition-colors"
            >
              Back to Demo Dashboard
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
