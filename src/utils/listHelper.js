// Helper to split large arrays into multiple sections for WhatsApp interactive lists
// WhatsApp limit: 10 items per section, 10 sections max = 100 items total
export function createListSections(items, mapFn, sectionTitle = "Items") {
  const sections = [];
  
  for (let i = 0; i < items.length && i < 100; i += 10) {
    const chunk = items.slice(i, i + 10);
    sections.push({
      title: sections.length === 0 
        ? sectionTitle 
        : `${sectionTitle} (${i + 1}-${Math.min(i + 10, items.length)})`,
      rows: chunk.map(mapFn)
    });
  }
  
  return sections;
}
