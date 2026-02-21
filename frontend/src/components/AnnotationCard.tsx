import { ExternalLink, Highlighter, StickyNote } from "lucide-react";
import { motion } from "framer-motion";
import type { Annotation } from "@/lib/mock-data";

const colorMap: Record<string, string> = {
  yellow: "bg-highlight-yellow/30 border-highlight-yellow",
  green: "bg-highlight-green/30 border-highlight-green",
  blue: "bg-highlight-blue/30 border-highlight-blue",
  pink: "bg-highlight-pink/30 border-highlight-pink",
  orange: "bg-highlight-orange/30 border-highlight-orange",
};

const tagColorMap: Record<string, string> = {
  yellow: "bg-highlight-yellow/20 text-accent-foreground",
  green: "bg-highlight-green/20 text-accent-foreground",
  blue: "bg-highlight-blue/20 text-accent-foreground",
  pink: "bg-highlight-pink/20 text-accent-foreground",
  orange: "bg-highlight-orange/20 text-accent-foreground",
};

interface AnnotationCardProps {
  annotation: Annotation;
  index: number;
}

const AnnotationCard = ({ annotation, index }: AnnotationCardProps) => {
  const timeAgo = getTimeAgo(annotation.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full shrink-0 ${colorMap[annotation.color]?.split(" ")[0] || "bg-accent"}`} />
          <span className="text-xs font-medium text-muted-foreground truncate">
            {new URL(annotation.websiteUrl).hostname}
          </span>
          <span className="text-xs text-muted-foreground/50">·</span>
          <span className="text-xs text-muted-foreground/60">{timeAgo}</span>
        </div>
        <a
          href={annotation.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Page title */}
      <h3 className="font-display text-sm font-semibold text-foreground mb-3 line-clamp-1">
        {annotation.pageTitle}
      </h3>

      {/* Content */}
      {annotation.highlightedText && (
        <div className={`rounded-lg border-l-3 p-3 mb-3 ${colorMap[annotation.color] || "bg-secondary"}`}>
          <div className="flex items-start gap-2">
            <Highlighter className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
              "{annotation.highlightedText}"
            </p>
          </div>
        </div>
      )}

      {annotation.stickyNoteContent && (
        <div className="flex items-start gap-2 mb-3">
          <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent" />
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {annotation.stickyNoteContent}
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {annotation.aiCategory}
        </span>
        {annotation.aiTags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className={`text-xs px-2 py-0.5 rounded-full ${tagColorMap[annotation.color] || "bg-secondary text-secondary-foreground"}`}
          >
            #{tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now.getTime() - then.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default AnnotationCard;
