// src/components/filterWorker.ts
self.onmessage = (e) => {
    const { rawData, filters, selectedColumns } = e.data;

    // Filtering logic (copy from your redux/dataSlice.ts)
    const filterSets: Record<string, Set<string>> = {};
    let hasActive = false;
    for (const [col, sel] of Object.entries(filters)) {
        const arr = Array.isArray(sel) ? sel : [];
        if (arr.length) {
            filterSets[col] = new Set(arr);
            hasActive = true;
        }
    }
    const filtered = !hasActive
        ? rawData
        : rawData.filter((row: any) =>
            Object.entries(filterSets).every(
                ([col, set]) => set.has(String(row[col] ?? ''))
            )
        );

    // Build filteredData
    let filteredData = filtered;
    if (selectedColumns && selectedColumns.length) {
        filteredData = filtered.map((row: any) => {
            const obj: any = {};
            for (const col of selectedColumns) obj[col] = row[col];
            return obj;
        });
    }

    // Compute options with leave-one-out logic
    const columns = Object.keys(rawData[0] || {});
    const availableFilterOptions: Record<string, { value: string; count: number }[]> = {};
    for (const col of columns) {
        // Build filters for all columns except this one
        const otherFilters: Record<string, Set<string>> = {};
        for (const [k, v] of Object.entries(filters)) {
            if (k !== col && Array.isArray(v) && v.length) {
                otherFilters[k] = new Set(v);
            }
        }
        // Filter data with other filters only
        const filteredForOptions = Object.keys(otherFilters).length === 0
            ? rawData
            : rawData.filter((row: any) =>
                Object.entries(otherFilters).every(
                    ([k, set]) => set.has(String(row[k] ?? ''))
                )
            );
        // Count values for this column
        const counts: Record<string, number> = {};
        for (const row of filteredForOptions) {
            const val = row[col];
            if (val !== undefined && val !== null && val !== '') {
                counts[val] = (counts[val] || 0) + 1;
            }
        }
        // Sort: selected values first (in order of selection), then the rest alphabetically
        const allOptions = Object.entries(counts)
            .map(([value, count]) => ({ value, count }));
        const selected = Array.isArray(filters[col]) ? filters[col] : [];
        const selectedSet = new Set(selected);
        const selectedOptions = selected
            .map((val: string) => allOptions.find(opt => opt.value === val))
            .filter(Boolean) as { value: string; count: number }[];
        const unselectedOptions = allOptions
            .filter(opt => !selectedSet.has(opt.value))
            .sort((a, b) => a.value.localeCompare(b.value));
        availableFilterOptions[col] = [...selectedOptions, ...unselectedOptions];
    }

    // Send result back
    self.postMessage({ filteredData, availableFilterOptions });
};
export { };