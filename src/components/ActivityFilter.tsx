import { useState } from "react";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface ActivityFilterProps {
  offerings: { id: string; name: string; slug: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const ActivityFilter = ({ offerings, selected, onChange }: ActivityFilterProps) => {
  const [open, setOpen] = useState(false);

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-10">
          <Filter className="h-4 w-4" />
          Filter
          {selected.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/20 text-primary px-2 py-0.5 text-xs font-semibold">
              {selected.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 bg-card border-border" align="start">
        <p className="text-xs font-medium text-muted-foreground mb-3">Show activities</p>
        <div className="space-y-2">
          {offerings.map((o) => (
            <label
              key={o.id}
              className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors"
            >
              <Checkbox
                checked={selected.includes(o.slug)}
                onCheckedChange={() => toggle(o.slug)}
              />
              <span className="text-sm text-foreground">{o.name}</span>
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-xs text-muted-foreground"
            onClick={() => onChange([])}
          >
            Clear all
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ActivityFilter;
