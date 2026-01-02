// catalogRegistry.js

function buildSections(vendorName, count, start = 0) {
  return Array.from({ length: count }, (_, i) =>
    `${vendorName}${String(start + i + 1).padStart(3, "0")}`
  );
}

// Exported arrays (live bindings)
export let arenaProductIds = [];
export let bestmanProductIds = [];
export let famotProductIds = [];
export let reneesProductIds = [];
export let rukamatProductIds = [];
export let yomiceProductIds = [];
export let afkProductIds = [];
export let alphaProductIds = [];
export let mayoProductIds = [];
export let excProductIds = [];

let initialized = false;

export function initializeProductIds() {
  if (initialized) return;

  arenaProductIds = buildSections("are", 24);
  bestmanProductIds = buildSections("bes", 93);
  famotProductIds = buildSections("fam", 35);
  reneesProductIds = buildSections("ren", 38);
  rukamatProductIds = buildSections("ruk", 23);
  yomiceProductIds = buildSections("yom", 21);
  afkProductIds = buildSections("afk", 29);
  alphaProductIds = buildSections("alp", 29);
  mayoProductIds = buildSections("may", 30);
  excProductIds = buildSections("exc", 37);

  initialized = true;
}
