import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Sparkles, Send, Loader2, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import ManualExport from "./ManualExport";

const EXAMPLE_PROMPTS = [
  "How many bookings did I get this month?",
  "Show me revenue breakdown by activity for the last 30 days",
  "List the top 10 customers by number of bookings",
  "How many nudges were made and what's their status?",
  "Show all academy registrations and their statuses",
  "How many new users signed up this month?",
];

type Mode = "ai" | "manual";

const ReportsTab = () => {
  const [mode, setMode] = useState<Mode>("ai");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    summary: string;
    csv_headers: string[];
    csv_rows: string[][];
  } | null>(null);

  const handleGenerate = async (text?: string) => {
    const query = text || prompt;
    if (!query.trim()) {
      toast.error("Please describe what report you need");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-report", {
        body: { prompt: query },
      });

      if (error) {
        toast.error(error.message || "Failed to generate report");
        setLoading(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      setResult(data);
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    }
    setLoading(false);
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    const csv = [
      result.csv_headers.join(","),
      ...result.csv_rows.map((row) =>
        row.map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="reports">
      <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">Reports</h1>
      <p className="text-muted-foreground mb-6">
        Generate and download booking reports using smart generation or manual field selection.
      </p>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-8">
        <Button
          variant={mode === "ai" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("ai")}
          className="gap-2"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Smart Report
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("manual")}
          className="gap-2"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Manual Export
        </Button>
      </div>

      {mode === "manual" ? (
        <ManualExport />
      ) : (
        <div className="grid gap-6 max-w-4xl">
          {/* Prompt input */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                What report do you need?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g. How many bookings did I get between January 1 and March 1?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[80px] bg-secondary border-border resize-none mb-3"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.slice(0, 3).map((ex) => (
                    <button
                      key={ex}
                      onClick={() => {
                        setPrompt(ex);
                        handleGenerate(ex);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors border border-border"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => handleGenerate()}
                  disabled={loading || !prompt.trim()}
                  className="gap-2 glow"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading state */}
          {loading && (
            <Card className="bg-card border-border">
              <CardContent className="py-12 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing your data and generating report...</p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && !loading && (
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Report Result
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="gap-2 shrink-0">
                  <Download className="h-3.5 w-3.5" />
                  Download CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-auto max-h-[50vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {result.csv_headers.map((h, i) => (
                          <TableHead key={i} className="whitespace-nowrap">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.csv_rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={result.csv_headers.length} className="text-center text-muted-foreground py-8">
                            No data matches your query.
                          </TableCell>
                        </TableRow>
                      ) : (
                        result.csv_rows.map((row, ri) => (
                          <TableRow key={ri}>
                            {row.map((cell, ci) => (
                              <TableCell key={ci} className="whitespace-nowrap">{cell}</TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {result.csv_rows.length} row{result.csv_rows.length !== 1 ? "s" : ""} generated
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ReportsTab;
