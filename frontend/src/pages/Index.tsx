import { useState, useMemo } from "react";
import AppSidebar from "@/components/AppSidebar";
import StatsCards from "@/components/StatsCards";
import AnnotationCard from "@/components/AnnotationCard";
import CategoryGrid from "@/components/CategoryGrid";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import { useAnnotationStore } from "@/lib/annotation-store";
import { mockCategories } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const Index = () => {
  const { annotations } = useAnnotationStore();
  const [activeView, setActiveView] = useState("home");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredAnnotations = useMemo(() => {
    let items = annotations;
    if (filter !== "all") {
      items = items.filter((a) => a.annotationType === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (a) =>
          a.highlightedText?.toLowerCase().includes(q) ||
          a.stickyNoteContent?.toLowerCase().includes(q) ||
          a.pageTitle.toLowerCase().includes(q) ||
          a.aiCategory.toLowerCase().includes(q) ||
          a.aiTags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [annotations, filter, search]);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="ml-64 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-foreground">
            {activeView === "home" && "Your Library"}
            {activeView === "annotations" && "All Annotations"}
            {activeView === "categories" && "Categories"}
            {activeView === "search" && "Search"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeView === "home" && "Welcome back. Here's what you've been learning."}
            {activeView === "annotations" && "Browse all your web annotations in one place."}
            {activeView === "categories" && "AI-organized topics from your annotations."}
            {activeView === "search" && "Find anything across your entire library."}
          </p>
        </motion.div>

        {/* Home View */}
        {activeView === "home" && (
          <div className="space-y-8">
            <StatsCards />

            {/* AI Insight */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-primary/5 border border-primary/10 rounded-xl p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-foreground mb-1">AI Insight</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You've been deeply exploring <strong className="text-foreground">Machine Learning</strong> and{" "}
                  <strong className="text-foreground">Cognitive Science</strong> this week. Your annotations suggest an interest in how AI architectures mirror biological neural structures. Consider exploring neuromorphic computing next.
                </p>
              </div>
            </motion.div>

            {/* Top Categories */}
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">Top Categories</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {mockCategories.slice(0, 4).map((cat, i) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                    onClick={() => setActiveView("categories")}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <p className="font-medium text-sm text-foreground mt-2">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.count} items</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Annotations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold text-foreground">Recent Annotations</h2>
                <button
                  onClick={() => setActiveView("annotations")}
                  className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {annotations.slice(0, 4).map((a, i) => (
                  <AnnotationCard key={a.id} annotation={a} index={i} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Annotations View */}
        {activeView === "annotations" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <SearchBar value={search} onChange={setSearch} />
              </div>
              <FilterBar activeFilter={filter} onFilterChange={setFilter} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAnnotations.map((a, i) => (
                <AnnotationCard key={a.id} annotation={a} index={i} />
              ))}
              {filteredAnnotations.length === 0 && (
                <div className="col-span-2 text-center py-16">
                  <p className="text-muted-foreground">No annotations match your filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories View */}
        {activeView === "categories" && (
          <CategoryGrid />
        )}

        {/* Search View */}
        {activeView === "search" && (
          <div className="space-y-6">
            <SearchBar value={search} onChange={setSearch} />
            <FilterBar activeFilter={filter} onFilterChange={setFilter} />
            {search ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredAnnotations.map((a, i) => (
                  <AnnotationCard key={a.id} annotation={a} index={i} />
                ))}
                {filteredAnnotations.length === 0 && (
                  <div className="col-span-2 text-center py-16">
                    <p className="text-muted-foreground">No results found for "{search}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Start typing to search across all your annotations.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
