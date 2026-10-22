// /university?category=slug&page=2 (page 1 and "all" are left out so the plain address stays clean)
export const universityHref = (category, page) => {
  const q = new URLSearchParams();
  if (category && category !== "all") q.set("category", category);
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return `/university${s ? `?${s}` : ""}#articles`;
};
