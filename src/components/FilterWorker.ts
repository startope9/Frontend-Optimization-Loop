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

    // Compute options
    const columns = Object.keys(rawData[0] || {});
    const counts: Record<string, Record<string, number>> = {};
    for (const col of columns) counts[col] = {};
    for (const row of filtered) {
        for (const col of columns) {
            const val = row[col];
            if (val !== undefined && val !== null && val !== '') {
                counts[col][val] = (counts[col][val] || 0) + 1;
            }
        }
    }
    const availableFilterOptions: Record<string, { value: string; count: number }[]> = {};
    for (const col of columns) {
        availableFilterOptions[col] = Object.entries(counts[col])
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => a.value.localeCompare(b.value));
    }

    // Send result back
    self.postMessage({ filteredData, availableFilterOptions });
};
export { };