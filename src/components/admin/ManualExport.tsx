import { useState, useEffect } from "react";
import { Download, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { getBookingRevenue, type BookingRow } from "./types";

const ALL_FIELDS = [
  { key: "booking_date", label: "Booking Date" },
  { key: "booking_time", label: "Booking Time" },
  { key: "activity", label: "Activity (slug)" },
  { key: "activity_name", label: "Activity Name" },
  { key: "full_name", label: "Customer Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "status", label: "Status" },
  { key: "court_type", label: "Court Type" },
  { key: "discount_type", label: "Discount Type" },
  { key: "attendance_status", label: "Attendance" },
  { key: "created_at", label: "Created At" },
  { key: "created_by", label: "Created By" },
  { key: "revenue", label: "Revenue ($)" },
] as const;

type FieldKey = (typeof ALL_FIELDS)[number]["key"];


const ManualExport = () => {
  const [activityOptions, setActivityOptions] = useState<{ key: string; label: string }[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<FieldKey>>(
    new Set(ALL_FIELDS.map((f) => f.key))
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BookingRow[] | null>(null);

  useEffect(() => {
    supabase.from("offerings").select("slug, name").order("name").then(({ data }) => {
      if (data) setActivityOptions(data.map((o) => ({ key: o.slug, label: o.name })));
    });
  }, []);

  const toggleField = (key: FieldKey) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelectedFields(new Set(ALL_FIELDS.map((f) => f.key)));
  const selectNone = () => setSelectedFields(new Set());

  const toggleActivity = (key: string) => {
    setSelectedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleFetch = async () => {
    if (selectedFields.size === 0) {
      toast.error("Select at least one field");
      return;
    }
    setLoading(true);
    setRows(null);
    try {
      let query = supabase
        .from("bookings")
        .select("*")
        .order("booking_date", { ascending: false });

      if (dateFrom) query = query.gte("booking_date", dateFrom);
      if (dateTo) query = query.lte("booking_date", dateTo);
      if (selectedActivities.size > 0) {
        query = query.in("activity", Array.from(selectedActivities));
      }

      const { data, error } = await query;
      if (error) throw error;
      setRows(data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch bookings");
    }
    setLoading(false);
  };

  const getFieldValue = (b: BookingRow, key: FieldKey): string => {
    if (key === "revenue") return getBookingRevenue(b).toFixed(2);
    const val = (b as any)[key];
    return val == null ? "" : String(val);
  };

  const activeFields = ALL_FIELDS.filter((f) => selectedFields.has(f.key));

  const handleDownloadCSV = () => {
    if (!rows) return;
    const headers = activeFields.map((f) => f.label);
    const csvRows = rows.map((b) =>
      activeFields.map((f) => `"${getFieldValue(b, f.key).replace(/"/g, '""')}"`)
    );
    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  return (
    <div className="grid gap-6 max-w-5xl">
      {/* Field selection */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Select Fields & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-foreground">Fields to include</Label>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-primary hover:underline">
                  Select all
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <button onClick={selectNone} className="text-xs text-primary hover:underline">
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {ALL_FIELDS.map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1.5 rounded-md hover:bg-secondary transition-colors"
                >
                  <Checkbox
                    checked={selectedFields.has(f.key)}
                    onCheckedChange={() => toggleField(f.key)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date from</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40 bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date to</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40 bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Activity</Label>
              <div className="flex flex-wrap gap-1.5">
                {activityOptions.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => toggleActivity(a.key)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      selectedActivities.has(a.key)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleFetch} disabled={loading || selectedFields.size === 0} className="gap-2 glow">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Fetch & Preview
          </Button>
        </CardContent>
      </Card>

      {/* Preview + download */}
      {rows !== null && !loading && (
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{rows.length} booking{rows.length !== 1 ? "s" : ""} found</CardTitle>
            <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="gap-2 shrink-0" disabled={rows.length === 0}>
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-auto max-h-[50vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {activeFields.map((f) => (
                      <TableHead key={f.key} className="whitespace-nowrap">{f.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={activeFields.length} className="text-center text-muted-foreground py-8">
                        No bookings match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.slice(0, 100).map((b, ri) => (
                      <TableRow key={ri}>
                        {activeFields.map((f) => (
                          <TableCell key={f.key} className="whitespace-nowrap">
                            {getFieldValue(b, f.key)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {rows.length > 100 && (
              <p className="text-xs text-muted-foreground mt-3">
                Showing first 100 of {rows.length} rows. Download CSV for full data.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManualExport;
