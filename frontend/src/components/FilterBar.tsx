interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filters = [
  { id: "all", label: "All" },
  { id: "highlight", label: "Highlights" },
  { id: "sticky-note", label: "Sticky Notes" },
];

const FilterBar = ({ activeFilter, onFilterChange }: FilterBarProps) => {
  return (
    <div className="flex items-center gap-2">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            activeFilter === f.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;
