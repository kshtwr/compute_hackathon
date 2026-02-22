import { motion } from "framer-motion";
import type { Category } from "@/lib/mock-data";

export interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const maxCount = Math.max(1, ...categories.map((c) => c.count));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.length === 0 ? (
        <p className="col-span-full text-sm text-muted-foreground">No categories yet. Add annotations to see topics here.</p>
      ) : (
        categories.map((cat, i) => (
          <motion.button
            key={cat.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="group bg-card rounded-xl border border-border p-6 text-left hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40"
          >
            <div className="text-3xl mb-3">{cat.icon}</div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-1">{cat.name}</h3>
            <p className="text-sm text-muted-foreground">
              {cat.count} annotation{cat.count !== 1 ? "s" : ""}
            </p>
            <div className="mt-3 h-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min((cat.count / maxCount) * 100, 100)}%` }}
              />
            </div>
          </motion.button>
        ))
      )}
    </div>
  );
}
