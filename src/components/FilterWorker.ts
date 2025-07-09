// src/components/filterWorker.ts

export function filterAndComputeOptions(
  rawData: any[],
  filters: Record<string, string[]>,
  selectedColumns: string[] = [],
  globalSearch: string = ''
) {
  const filterSets: Record<string, Set<string>> = {};
  let hasActiveFilters = false;

  for (const [col, sel] of Object.entries(filters)) {
    const arr = Array.isArray(sel) ? sel : [];
    if (arr.length) {
      filterSets[col] = new Set(arr);
      hasActiveFilters = true;
    }
  }

  let filtered = rawData;

  // Apply column filters
  if (hasActiveFilters) {
    filtered = filtered.filter((row: any) =>
      Object.entries(filterSets).every(
        ([col, set]) => set.has(String(row[col] ?? ''))
      )
    );
  }

  // Apply global search
  const searchTerm = globalSearch.trim().toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter((row: any) =>
      Object.entries(row).some(([col, val]) =>
        col.toLowerCase() !== 'sl no' &&
        String(val ?? '').toLowerCase().includes(searchTerm)
      )
    );
  }

  // Select columns if needed
  let filteredData = filtered;
  if (selectedColumns.length) {
    filteredData = filtered.map((row: any) => {
      const obj: any = {};
      for (const col of selectedColumns) obj[col] = row[col];
      return obj;
    });
  }

  // Compute dropdown options
  const columns = Object.keys(rawData[0] || {});
  const availableFilterOptions: Record<string, { value: string; count: number }[]> = {};

  for (const col of columns) {
    const otherFilters: Record<string, Set<string>> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (k !== col && v.length) {
        otherFilters[k] = new Set(v);
      }
    }

    let dataSubset = rawData;

    // Apply other filters
    if (Object.keys(otherFilters).length) {
      dataSubset = dataSubset.filter((row: any) =>
        Object.entries(otherFilters).every(
          ([k, set]) => set.has(String(row[k] ?? ''))
        )
      );
    }

    // Apply global search to dropdown options too
    if (searchTerm) {
      dataSubset = dataSubset.filter((row: any) =>
        Object.entries(row).some(([k, val]) =>
          k.toLowerCase() !== 'sl no' &&
          String(val ?? '').toLowerCase().includes(searchTerm)
        )
      );
    }

    const counts: Record<string, number> = {};
    for (const row of dataSubset) {
      const val = String(row[col] ?? '').trim();
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
      }
    }

    const allOptions = Object.entries(counts).map(([value, count]) => ({ value, count }));
    const selected = filters[col] || [];
    const selectedSet = new Set(selected);

    const selectedOptions = selected
      .map((val: string) => allOptions.find(opt => opt.value === val))
      .filter(Boolean) as { value: string; count: number }[];

    const unselectedOptions = allOptions
      .filter(opt => !selectedSet.has(opt.value))
      .sort((a, b) => a.value.localeCompare(b.value));

    availableFilterOptions[col] = [...selectedOptions, ...unselectedOptions];
  }

  return { filteredData, availableFilterOptions };
}

self.onmessage = (e) => {
  const { rawData, filters, selectedColumns, globalSearch } = e.data;
  const result = filterAndComputeOptions(rawData, filters, selectedColumns, globalSearch);
  self.postMessage(result);
};

export { };
