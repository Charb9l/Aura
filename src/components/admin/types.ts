export interface BookingRow {
  id: string;
  activity: string;
  activity_name: string;
  booking_date: string;
  booking_time: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  user_id: string;
  court_type?: string | null;
  discount_type?: string | null;
  attendance_status?: string | null;
  created_by?: string | null;
  price?: number | null;
}

export interface ProfileRow {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface UserWithEmail {
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  club_id?: string | null;
  suspended?: boolean;
}

export interface ClubRow {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  offerings: string[];
  has_academy: boolean;
  published: boolean;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  booking_id: string;
  activity: string;
  activity_name: string;
  booking_date: string;
  booking_time: string;
  full_name: string;
  email: string;
  phone: string;
  court_type: string | null;
  discount_type: string | null;
  user_id: string;
  deleted_by: string;
  deleted_at: string;
  created_at: string;
  created_by: string | null;
}

export interface ActivityRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color?: string | null;
  created_at: string;
}

/** @deprecated Use ActivityRow instead */
export type OfferingRow = ActivityRow;

export interface ClubActivityPrice {
  id: string;
  club_id: string;
  activity_slug: string;
  price: number;
  price_label: string | null;
  location_id: string | null;
}

/**
 * Get booking revenue using DB prices.
 * priceMap keys: "clubId:activity_slug", "clubId:activity_slug:label", or fallback "activity_slug" / "activity_slug:label".
 * clubActivityMap maps club_id → activity slugs[] to resolve which club a booking belongs to.
 * IMPORTANT: Only bookings with attendance_status === "show" should be
 * passed to this function for revenue calculations.
 */
export const getBookingRevenue = (
  b: BookingRow,
  priceMap?: Record<string, number>,
  clubActivityMap?: Record<string, string[]>,
): number => {
  if (!priceMap) return 0;

  // Find which club this booking belongs to
  let clubId: string | undefined;
  if (clubActivityMap) {
    for (const [cid, activities] of Object.entries(clubActivityMap)) {
      if (activities.includes(b.activity)) {
        clubId = cid;
        break;
      }
    }
  }

  let base = 0;
  if (b.activity === "basketball" && b.court_type) {
    base = (clubId ? priceMap[`${clubId}:${b.activity}:${b.court_type}`] : undefined)
      ?? priceMap[`${b.activity}:${b.court_type}`] ?? 0;
  } else {
    base = (clubId ? priceMap[`${clubId}:${b.activity}`] : undefined)
      ?? priceMap[b.activity] ?? 0;
  }
  if (b.discount_type === "free") return 0;
  if (b.discount_type === "50%") return base * 0.5;
  return base;
};

export const ALL_CATEGORIES = [
  { key: "basketball", label: "Basketball" },
  { key: "pilates", label: "Pilates" },
  { key: "aerial-yoga", label: "Aerial Yoga" },
  { key: "tennis", label: "Tennis" },
];

export const CHART_COLORS = [
  "hsl(262, 50%, 55%)",
  "hsl(212, 70%, 55%)",
  "hsl(100, 22%, 60%)",
  "hsl(30, 80%, 55%)",
];

export const OPEN_HOUR = 7;
export const CLOSE_HOUR = 22;

export const ACTIVITY_OPTIONS = [
  { key: "basketball", label: "Basketball", name: "Basketball Court" },
  { key: "tennis", label: "Tennis", name: "Tennis Court" },
  { key: "pilates", label: "Pilates", name: "Pilates Studio" },
  { key: "aerial-yoga", label: "Aerial Yoga", name: "Aerial Yoga Studio" },
];
