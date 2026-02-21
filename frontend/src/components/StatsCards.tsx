import { motion } from "framer-motion";
import { BookOpen, Highlighter, StickyNote, Sparkles } from "lucide-react";

const stats = [
  { label: "Total Annotations", value: "47", icon: BookOpen, change: "+5 this week" },
  { label: "Highlights", value: "31", icon: Highlighter, change: "66% of total" },
  { label: "Sticky Notes", value: "16", icon: StickyNote, change: "34% of total" },
  { label: "AI Categories", value: "7", icon: Sparkles, change: "Auto-organized" },
];

const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-accent" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatsCards;
