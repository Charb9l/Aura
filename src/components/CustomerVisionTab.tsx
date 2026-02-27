import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Pencil, X, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

interface HeroButton {
  to: string;
  label: string;
}

interface HomeContent {
  hero_subtitle: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_buttons: HeroButton[];
}

const PAGES = [
  { name: "Main Page", slug: "home", description: "Hero section, text, and action buttons", editable: true },
  { name: "What's Your Move?", slug: "whats-your-move", description: "Activity cards and filters section", editable: false },
  { name: "Book a Session", slug: "book", description: "Booking flow and activity selection", editable: false },
  { name: "Join Our Academies", slug: "academy", description: "Academy information and enrollment", editable: false },
  { name: "Clubs & Partners", slug: "clubs", description: "Club listings and partner info", editable: false },
];

const CustomerVisionTab = () => {
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroLine1, setHeroLine1] = useState("");
  const [heroLine2, setHeroLine2] = useState("");
  const [heroButtons, setHeroButtons] = useState<HeroButton[]>([]);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from("page_content")
        .select("*")
        .eq("page_slug", "home")
        .single();
      if (data) {
        const content = data.content as unknown as HomeContent;
        setHomeContent(content);
      }
    };
    fetchContent();
  }, []);

  const openHomeEditor = () => {
    if (homeContent) {
      setHeroSubtitle(homeContent.hero_subtitle);
      setHeroLine1(homeContent.hero_title_line1);
      setHeroLine2(homeContent.hero_title_line2);
      setHeroButtons([...homeContent.hero_buttons]);
    }
    setEditingPage("home");
  };

  const handleSaveHome = async () => {
    setSaving(true);
    const newContent: HomeContent = {
      hero_subtitle: heroSubtitle,
      hero_title_line1: heroLine1,
      hero_title_line2: heroLine2,
      hero_buttons: heroButtons.filter(b => b.label.trim() && b.to.trim()),
    };

    const { error } = await supabase
      .from("page_content")
      .update({ content: newContent as any, updated_at: new Date().toISOString() })
      .eq("page_slug", "home");

    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Home page updated successfully");
      setHomeContent(newContent);
      setEditingPage(null);
    }
  };

  const addButton = () => {
    setHeroButtons(prev => [...prev, { to: "/", label: "" }]);
  };

  const removeButton = (index: number) => {
    setHeroButtons(prev => prev.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, field: "to" | "label", value: string) => {
    setHeroButtons(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="customer-vision">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Customer Vision</h1>
        <p className="text-muted-foreground">Control what your customers see. Edit pages, text, and content directly.</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAGES.map((page) => (
                <TableRow key={page.slug}>
                  <TableCell className="font-medium">{page.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{page.description}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (page.slug === "home") openHomeEditor();
                        else toast.info(`${page.name} editor coming soon`);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Home Page Editor Dialog */}
      <Dialog open={editingPage === "home"} onOpenChange={(o) => !o && setEditingPage(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[66vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Edit Main Page
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Hero Subtitle */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Hero Subtitle (small text above title)
              </Label>
              <Input
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="e.g. Movement & Mindfulness"
                className="h-12 bg-secondary border-border"
              />
            </div>

            {/* Hero Title Line 1 */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Hero Title — Line 1
              </Label>
              <Input
                value={heroLine1}
                onChange={(e) => setHeroLine1(e.target.value)}
                placeholder="e.g. Your Journey."
                className="h-12 bg-secondary border-border"
              />
            </div>

            {/* Hero Title Line 2 (gradient text) */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Hero Title — Line 2 (gradient highlight)
              </Label>
              <Input
                value={heroLine2}
                onChange={(e) => setHeroLine2(e.target.value)}
                placeholder="e.g. Your Space."
                className="h-12 bg-secondary border-border"
              />
            </div>

            {/* Action Buttons */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-muted-foreground">Action Buttons</Label>
                <Button type="button" variant="outline" size="sm" onClick={addButton} className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Button
                </Button>
              </div>

              <div className="space-y-3">
                {heroButtons.map((btn, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/50">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={btn.label}
                        onChange={(e) => updateButton(i, "label", e.target.value)}
                        placeholder="Button label (e.g. Book a Session)"
                        className="h-9 bg-background border-border text-sm"
                      />
                      <Input
                        value={btn.to}
                        onChange={(e) => updateButton(i, "to", e.target.value)}
                        placeholder="Link path (e.g. /book)"
                        className="h-9 bg-background border-border text-sm font-mono"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeButton(i)}
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {heroButtons.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No buttons yet. Click "Add Button" to create one.</p>
                )}
              </div>
            </div>

            <Button
              onClick={handleSaveHome}
              disabled={saving}
              className="w-full h-12 text-base font-semibold glow"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CustomerVisionTab;
