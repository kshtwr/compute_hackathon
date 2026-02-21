import { BookOpen, Home, Layers, Search, StickyNote, Settings, Sparkles } from "lucide-react";

interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: "home", label: "Overview", icon: Home },
  { id: "annotations", label: "All Annotations", icon: StickyNote },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "search", label: "Search", icon: Search },
];

const AppSidebar = ({ activeView, onViewChange }: AppSidebarProps) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-accent-foreground">Nalanda</h1>
            <p className="text-xs text-sidebar-foreground/60">Your Internet Library</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/30">
          <Sparkles className="w-4 h-4 text-sidebar-primary" />
          <span className="text-xs text-sidebar-foreground/80">AI-Powered Organization</span>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
