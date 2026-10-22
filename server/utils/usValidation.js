// US-only shipping: phone numbers, states, ZIP codes and addresses.

export const US_STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts",
  MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const NAME_TO_CODE = Object.fromEntries(Object.entries(US_STATES).map(([code, name]) => [name.toLowerCase(), code]));

// "ca" / "CA" / "California" -> "CA"; anything else -> null
export function normalizeUsState(input) {
  const v = String(input || "").trim();
  if (!v) return null;
  const upper = v.toUpperCase();
  if (US_STATES[upper]) return upper;
  return NAME_TO_CODE[v.toLowerCase()] || null;
}

// "90245" or "90245-3006" -> same; otherwise null
export function normalizeUsZip(input) {
  const v = String(input || "").trim();
  return /^\d{5}(-\d{4})?$/.test(v) ? v : null;
}

// "(562) 524-3557", "562-524-3557", "+1 562 524 3557" -> "+15625243557"; otherwise null
export function normalizeUsPhone(input) {
  let digits = String(input || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return null;
  // N11 numbers (411, 911...) are service codes, never area codes or exchanges
  if (digits.slice(1, 3) === "11" || digits.slice(4, 6) === "11") return null;
  // obvious placeholders: 5555555555, 555-01xx fiction numbers, 1234567 runs
  if (/^(\d)\1+$/.test(digits) || /^(\d)\1+$/.test(digits.slice(3))) return null;
  if (digits.slice(3, 6) === "555" && /^01\d\d$/.test(digits.slice(6))) return null;
  if (["1234567", "2345678", "3456789", "7654321", "9876543"].includes(digits.slice(3))) return null;
  if (digits.slice(0, 3) === "555") return null;
  return `+1${digits}`;
}

export function isUsCountry(input) {
  const v = String(input || "").trim().toLowerCase().replace(/\./g, "");
  return ["", "us", "usa", "united states", "united states of america", "america"].includes(v);
}

// Returns { value } with cleaned fields, or { errors } (field -> message)
export function validateUsAddress(a) {
  const errors = {};
  const street = String(a.street || "").trim();
  const city = String(a.city || "").trim();
  const state = normalizeUsState(a.state);
  const postalCode = normalizeUsZip(a.postalCode);
  const phone = normalizeUsPhone(a.phone);

  if (street.length < 3) errors.street = "Enter your street address";
  if (city.length < 2 || !/^[A-Za-z][A-Za-z .'-]*$/.test(city)) errors.city = "Enter a valid city";
  if (!state) errors.state = "Choose a valid US state";
  if (!postalCode) errors.postalCode = "Enter a valid ZIP code (12345 or 12345-6789)";
  if (!phone) errors.phone = "Enter a valid US phone number, like (562) 524-3557";
  if (!isUsCountry(a.country)) errors.country = "We currently ship only within the United States";

  if (Object.keys(errors).length) return { errors };
  return { value: { street, city, state, postalCode, phone, country: "US" } };
}
