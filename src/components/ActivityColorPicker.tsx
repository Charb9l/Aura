import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Palette, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

// Curated color palette
const COLOR_PALETTE = [
  { label: "Orange", hsl: "30 80% 55%" },
  { label: "Amber", hsl: "38 92% 50%" },
  { label: "Red", hsl: "0 72% 51%" },
  { label: "Rose", hsl: "350 65% 55%" },
  { label: "Pink", hsl: "330 65% 60%" },
  { label: "Fuchsia", hsl: "292 60% 55%" },
  { label: "Purple", hsl: "262 50% 55%" },
  { label: "Violet", hsl: "270 60% 60%" },
  { label: "Indigo", hsl: "234 60% 55%" },
  { label: "Blue", hsl: "212 70% 55%" },
  { label: "Sky", hsl: "199 80% 55%" },
  { label: "Cyan", hsl: "186 70% 50%" },
  { label: "Teal", hsl: "172 60% 42%" },
  { label: "Emerald", hsl: "155 60% 42%" },
  { label: "Dark Green", hsl: "142 50% 35%" },
  { label: "Green", hsl: "142 60% 45%" },
  { label: "Lime", hsl: "84 60% 50%" },
  { label: "Sage", hsl: "100 22% 60%" },
  { label: "Yellow", hsl: "48 90% 50%" },
  { label: "Slate", hsl: "215 20% 50%" },
];

interface Offering {
  id: string;
  name: string;
  slug: string;
  brand_color: string | null;
}

const ActivityColorPicker = () => {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchOfferings = async () => {
    const { data } = await supabase
      .from("offerings")
      .select("id, name, slug, brand_color")
      .order("name");
    setOfferings((data as Offering[]) || []);
  };

  useEffect(() => { fetchOfferings(); }, []);

  const setColor = async (offeringId: string, hsl: string) => {
    setSaving(offeringId);
    const { error } = await supabase
      .from("offerings")
      .update({ brand_color: hsl })
      .eq("id", offeringId);

    setSaving(null);
    if (error) {
      toast.error("Failed to save color");
    } else {
      setOfferings(prev =>
        prev.map(o => o.id === offeringId ? { ...o, brand_color: hsl } : o)
      );
      toast.success("Color updated!");
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Activity Brand Colors
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose a brand color for each activity. This color is used for glows, borders, and highlights across the customer experience.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {offerings.map((offering) => (
          <div key={offering.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg shrink-0 border border-border"
                style={{
                  backgroundColor: offering.brand_color
                    ? `hsl(${offering.brand_color})`
                    : "hsl(var(--muted))",
                }}
              />
              <span className="font-medium text-foreground text-sm">{offering.name}</span>
              {saving === offering.id && (
                <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => {
                const isSelected = offering.brand_color === color.hsl;
                return (
                  <button
                    key={color.hsl}
                    onClick={() => setColor(offering.id, color.hsl)}
                    title={color.label}
                    className={cn(
                      "h-8 w-8 rounded-lg border-2 transition-all relative hover:scale-110",
                      isSelected
                        ? "border-foreground ring-2 ring-foreground/20 scale-110"
                        : "border-transparent hover:border-muted-foreground/40"
                    )}
                    style={{ backgroundColor: `hsl(${color.hsl})` }}
                  >
                    {isSelected && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-md" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {offerings.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-6">No activities found. Create activities first.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityColorPicker;
