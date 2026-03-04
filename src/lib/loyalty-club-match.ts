export interface LoyaltyBookingMatchInput {
  activity: string;
  activity_name: string;
}

export interface LoyaltyClubMatchInput {
  id: string;
  name: string;
  offerings: string[];
}

const normalize = (value: string) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const offeringMatchesBooking = (
  offering: string,
  booking: LoyaltyBookingMatchInput,
) => {
  const normalizedOffering = normalize(offering);
  const normalizedActivity = normalize(booking.activity);
  const normalizedActivityName = normalize(booking.activity_name);

  if (!normalizedOffering) return false;

  return (
    normalizedOffering === normalizedActivity ||
    normalizedOffering === normalizedActivityName ||
    normalizedOffering.includes(normalizedActivity) ||
    normalizedActivity.includes(normalizedOffering) ||
    normalizedOffering.includes(normalizedActivityName) ||
    normalizedActivityName.includes(normalizedOffering)
  );
};

export const findMatchingClubForBooking = (
  clubs: LoyaltyClubMatchInput[],
  booking: LoyaltyBookingMatchInput,
) => {
  const matches = clubs
    .filter((club) => club.offerings.some((offering) => offeringMatchesBooking(offering, booking)))
    .sort((a, b) => a.name.localeCompare(b.name));

  return matches[0] ?? null;
};
