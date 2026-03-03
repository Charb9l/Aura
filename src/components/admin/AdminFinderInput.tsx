import { useState, useRef, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FinderSuggestion {
  label: string;
  sub?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  suggestions: FinderSuggestion[];
  placeholder?: string;
  className?: string;
  maxResults?: number;
}

const AdminFinderInput = ({ value, onChange, suggestions, placeholder = "Search...", className, maxResults = 8 }: Props) => {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    return suggestions
      .filter(s => s.label.toLowerCase().includes(q) || (s.sub || "").toLowerCase().includes(q))
      .slice(0, maxResults);
  }, [value, suggestions, maxResults]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(prev => (prev <= 0 ? filtered.length - 1 : prev - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      onChange(filtered[highlightIndex].label);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => { if (value.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-10 bg-secondary border-border pl-9 text-sm"
        />
      </div>
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto py-1"
        >
          {filtered.map((item, i) => (
            <li
              key={`${item.label}-${i}`}
              onMouseDown={(e) => { e.preventDefault(); onChange(item.label); setOpen(false); }}
              onMouseEnter={() => setHighlightIndex(i)}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm transition-colors",
                i === highlightIndex ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"
              )}
            >
              <span className="font-medium">{item.label}</span>
              {item.sub && <span className="ml-2 text-xs text-muted-foreground">{item.sub}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminFinderInput;
