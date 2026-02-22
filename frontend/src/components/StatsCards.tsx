import { motion } from "framer-motion";
import { BookOpen, Highlighter, StickyNote, Sparkles } from "lucide-react";
import { useAnnotationStore } from "@/lib/annotation-store";

const StatsCards = () => {
  const { annotations } = useAnnotationStore();
  
  const total = annotations.length;
  const highlights = annotations.filter(a => a.annotationType === 'highlight').length;
  const stickyNotes = annotations.filter(a => a.annotationType === 'sticky-note').length;
  const aiCategories = new Set(annotations.map(a => a.aiCategory).filter(Boolean)).size;

  const highlightsPercent = total === 0 ? "0%" : `${Math.round((highlights / total) * 100)}% of total`;
  const stickyNotesPercent = total === 0 ? "0%" : `${Math.round((stickyNotes / total) * 100)}% of total`;

  const stats = [
    { label: "Total Annotations", value: total.toString(), icon: BookOpen, change: "All time" },
    { label: "Highlights", value: highlights.toString(), icon: Highlighter, change: highlightsPercent },
    { label: "Sticky Notes", value: stickyNotes.toString(), icon: StickyNote, change: stickyNotesPercent },
    { label: "AI Categories", value: aiCategories.toString(), icon: Sparkles, change: "Auto-organized" },
  ];

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
