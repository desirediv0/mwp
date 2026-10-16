// US-only shipping helpers: states, ZIP and phone validation/formatting.

export const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"],
  ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

const usDigits = (value) => {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits;
};

export const isValidUsPhone = (value) => {
  const d = usDigits(value);
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(d) && d.slice(1, 3) !== "11" && d.slice(4, 6) !== "11";
};

export const isValidUsZip = (value) => /^\d{5}(-\d{4})?$/.test(String(value || "").trim());

// Types as (562) 524-3557 while the user keeps typing; also accepts +1562... from the database
export const formatUsPhone = (value) => {
  const d = usDigits(value).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

export const stateName = (code) => US_STATES.find(([c]) => c === String(code || "").toUpperCase())?.[1] || code || "";

// "El Segundo, CA 90245"
export const formatCityLine = (a) => [a?.city, [a?.state, a?.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");

export const formatCountry = (country) => {
  const v = String(country || "").trim();
  return !v || /^(us|usa|united states( of america)?)$/i.test(v) ? "United States" : v;
};
