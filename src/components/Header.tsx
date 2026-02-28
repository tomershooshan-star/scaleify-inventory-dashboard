import { Sparkles, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-bg-card border-b border-border-subtle px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="p-2 bg-accent-glow rounded-lg">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Scaleify</h1>
            <p className="text-xs text-text-muted font-medium uppercase tracking-widest">Inventory Intelligence</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-accent/10 text-accent rounded text-xs font-semibold border border-accent/20 tracking-wide">
            DEMO
          </span>
          <Link
            to="/setup"
            className="p-2 text-text-muted hover:text-text-secondary hover:bg-bg-elevated rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
