import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";

const countryCodes = [
  { code: "+961", country: "LB", flag: "🇱🇧", name: "Lebanon" },
  { code: "+1", country: "US", flag: "🇺🇸", name: "United States" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
  { code: "+49", country: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "+971", country: "AE", flag: "🇦🇪", name: "UAE" },
  { code: "+966", country: "SA", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+974", country: "QA", flag: "🇶🇦", name: "Qatar" },
  { code: "+965", country: "KW", flag: "🇰🇼", name: "Kuwait" },
  { code: "+968", country: "OM", flag: "🇴🇲", name: "Oman" },
  { code: "+973", country: "BH", flag: "🇧🇭", name: "Bahrain" },
  { code: "+962", country: "JO", flag: "🇯🇴", name: "Jordan" },
  { code: "+963", country: "SY", flag: "🇸🇾", name: "Syria" },
  { code: "+964", country: "IQ", flag: "🇮🇶", name: "Iraq" },
  { code: "+20", country: "EG", flag: "🇪🇬", name: "Egypt" },
  { code: "+90", country: "TR", flag: "🇹🇷", name: "Turkey" },
  { code: "+39", country: "IT", flag: "🇮🇹", name: "Italy" },
  { code: "+34", country: "ES", flag: "🇪🇸", name: "Spain" },
  { code: "+61", country: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "+81", country: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "+86", country: "CN", flag: "🇨🇳", name: "China" },
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
  { code: "+7", country: "RU", flag: "🇷🇺", name: "Russia" },
  { code: "+27", country: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "+82", country: "KR", flag: "🇰🇷", name: "South Korea" },
  { code: "+52", country: "MX", flag: "🇲🇽", name: "Mexico" },
  { code: "+31", country: "NL", flag: "🇳🇱", name: "Netherlands" },
  { code: "+46", country: "SE", flag: "🇸🇪", name: "Sweden" },
  { code: "+41", country: "CH", flag: "🇨🇭", name: "Switzerland" },
  { code: "+48", country: "PL", flag: "🇵🇱", name: "Poland" },
  { code: "+351", country: "PT", flag: "🇵🇹", name: "Portugal" },
  { code: "+30", country: "GR", flag: "🇬🇷", name: "Greece" },
  { code: "+357", country: "CY", flag: "🇨🇾", name: "Cyprus" },
  { code: "+1", country: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "+63", country: "PH", flag: "🇵🇭", name: "Philippines" },
  { code: "+234", country: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "+254", country: "KE", flag: "🇰🇪", name: "Kenya" },
];

function parsePhone(value: string) {
  // Try to match existing country code from value
  const sorted = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
  for (const cc of sorted) {
    if (value.startsWith(cc.code)) {
      return { code: cc.code, number: value.slice(cc.code.length).trim() };
    }
  }
  return { code: "+961", number: value.replace(/^\+/, "").trim() };
}

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
}

const PhoneInput = ({ value, onChange, placeholder = "XX XXX XXX", required, id, className = "" }: PhoneInputProps) => {
  const parsed = useMemo(() => parsePhone(value), [value]);
  const [selectedCode, setSelectedCode] = useState(parsed.code);
  const [localNumber, setLocalNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync from external value changes
  useEffect(() => {
    const p = parsePhone(value);
    setSelectedCode(p.code);
    setLocalNumber(p.number);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const emitChange = (code: string, num: string) => {
    onChange(num ? `${code}${num}` : "");
  };

  const selectedEntry = countryCodes.find(c => c.code === selectedCode) || countryCodes[0];

  const filtered = search
    ? countryCodes.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search) ||
        c.country.toLowerCase().includes(search.toLowerCase())
      )
    : countryCodes;

  return (
    <div className={`flex gap-0 ${className}`}>
      {/* Country code selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => { setOpen(!open); setSearch(""); }}
          className="flex items-center gap-1 h-12 px-3 rounded-l-md border border-r-0 border-border bg-secondary text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors whitespace-nowrap"
        >
          <span className="text-base">{selectedEntry.flag}</span>
          <span className="text-muted-foreground">{selectedCode}</span>
          <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 w-64 max-h-60 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {filtered.map((c, i) => (
                <button
                  type="button"
                  key={`${c.country}-${i}`}
                  onClick={() => {
                    setSelectedCode(c.code);
                    emitChange(c.code, localNumber);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    selectedCode === c.code && selectedEntry.country === c.country
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1 text-left">{c.name}</span>
                  <span className="text-muted-foreground text-xs">{c.code}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">No results</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Number input */}
      <Input
        id={id}
        inputMode="numeric"
        type="tel"
        placeholder={placeholder}
        value={localNumber}
        onChange={(e) => {
          const num = e.target.value.replace(/[^0-9]/g, "");
          setLocalNumber(num);
          emitChange(selectedCode, num);
        }}
        required={required}
        className="h-12 bg-secondary border-border rounded-l-none flex-1"
      />
    </div>
  );
};

export default PhoneInput;
