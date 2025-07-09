import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ColumnFilter {
  [columnName: string]: string[];
}


interface DataState {
  rawData: any[];
  filteredData: any[];
  selectedColumns: string[];
  columnFilters: ColumnFilter;
  availableFilterOptions: Record<string, { value: string; count: number }[]>;
  page: number;
  pageSize: number;
}

const initialState: DataState = {
  rawData: [],
  filteredData: [],
  selectedColumns: [],
  columnFilters: {},
  availableFilterOptions: {},
  page: 0,
  pageSize: 50, // default page size, can be changed
};


// Applies given filters to data (fast, avoids unnecessary work)
const applyFilters = (() => {
  let lastData: any[] = [];
  let lastFilters: string = '';
  let lastResult: any[] = [];
  return (data: any[], filters: ColumnFilter) => {
    // Precompute filter sets for O(1) lookup
    const filterSets: Record<string, Set<string>> = {};
    let hasActive = false;
    for (const [col, sel] of Object.entries(filters)) {
      if (sel.length) {
        filterSets[col] = new Set(sel);
        hasActive = true;
      }
    }
    // Short-circuit: if no filters, return data directly
    if (!hasActive) return data;
    // Memoization: if data and filters are unchanged, return cached result
    const filtersKey = JSON.stringify(filters);
    if (lastData === data && lastFilters === filtersKey) {
      return lastResult;
    }
    const result = data.filter(row => {
      for (const col in filterSets) {
        if (!filterSets[col].has(String(row[col] ?? ''))) return false;
      }
      return true;
    });
    lastData = data;
    lastFilters = filtersKey;
    lastResult = result;
    return result;
  };
})();

// Computes available options for each column based on the currently filtered rows, with counts
// Returns: Record<column, { value: string, count: number }[]>
const computeOptions = (() => {
  let lastRaw: any[] = [];
  let lastFilters: string = '';
  let lastResult: Record<string, { value: string; count: number }[]> = {};
  return (raw: any[], filters: ColumnFilter) => {
    if (!raw.length) return {} as Record<string, { value: string; count: number }[]>;
    const filtersKey = JSON.stringify(filters);
    if (lastRaw === raw && lastFilters === filtersKey) {
      return lastResult;
    }
    // Short-circuit: if no filters, just count from raw data
    let source = raw;
    let hasActive = false;
    for (const sel of Object.values(filters)) {
      if (sel.length) {
        hasActive = true;
        break;
      }
    }
    if (hasActive) {
      source = applyFilters(raw, filters);
    }
    const columns = Object.keys(raw[0]);
    const counts: Record<string, Record<string, number>> = {};
    for (let c = 0; c < columns.length; c++) counts[columns[c]] = Object.create(null);
    for (let i = 0, len = source.length; i < len; i++) {
      const row = source[i];
      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        const val = row[col];
        if (val !== undefined && val !== null && val !== '') {
          counts[col][val] = (counts[col][val] || 0) + 1;
        }
      }
    }
    const result: Record<string, { value: string; count: number }[]> = {};
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      const arr = [];
      for (const value in counts[col]) {
        arr.push({ value, count: counts[col][value] });
      }
      arr.sort((a, b) => a.value.localeCompare(b.value));
      result[col] = arr;
    }
    lastRaw = raw;
    lastFilters = filtersKey;
    lastResult = result;
    return result;
  };
})();

// Builds filteredData based on filters and selected columns (fast, avoids reduce)
const buildFilteredData = (
  raw: any[],
  filters: ColumnFilter,
  selected: string[]
) => {
  const filtered = applyFilters(raw, filters);
  if (!selected.length) return filtered;
  // Fast path: if all columns are selected, return filtered as-is
  const allCols = Object.keys(filtered[0] || {});
  if (selected.length === allCols.length && selected.every((c, i) => c === allCols[i])) {
    return filtered;
  }
  // Otherwise, map to selected columns only
  return filtered.map(row => {
    const obj: any = {};
    for (let i = 0, len = selected.length; i < len; i++) {
      const col = selected[i];
      obj[col] = row[col];
    }
    return obj;
  });
};


const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setRawData: (state, { payload }: PayloadAction<any[]>) => {
      state.rawData = payload;
      state.filteredData = payload;
      state.availableFilterOptions = computeOptions(payload, {});
      state.page = 0;
    },

    setSelectedColumns: (state, { payload }: PayloadAction<string[]>) => {
      state.selectedColumns = payload;
      state.filteredData = buildFilteredData(
        state.rawData,
        state.columnFilters,
        payload
      );
      // Only recompute options if filters changed, not just columns
      state.page = 0;
    },

    setColumnFilter: (
      state,
      { payload }: PayloadAction<{ columnName: string; selectedValues: string[] }>
    ) => {
      state.columnFilters[payload.columnName] = payload.selectedValues;
      state.filteredData = buildFilteredData(
        state.rawData,
        state.columnFilters,
        state.selectedColumns
      );
      state.availableFilterOptions = computeOptions(
        state.rawData,
        state.columnFilters
      );
      state.page = 0;
    },

    clearColumnFilter: (state, { payload }: PayloadAction<string>) => {
      state.columnFilters[payload] = [];
      state.filteredData = buildFilteredData(
        state.rawData,
        state.columnFilters,
        state.selectedColumns
      );
      state.availableFilterOptions = computeOptions(
        state.rawData,
        state.columnFilters
      );
      state.page = 0;
    },

    clearAllFilters: state => {
      Object.keys(state.columnFilters).forEach(col => (state.columnFilters[col] = []));
      state.filteredData = buildFilteredData(
        state.rawData,
        state.columnFilters,
        state.selectedColumns
      );
      state.availableFilterOptions = computeOptions(
        state.rawData,
        state.columnFilters
      );
      state.page = 0;
    },

    setPage: (state, { payload }: PayloadAction<number>) => {
      state.page = payload;
    },

    setPageSize: (state, { payload }: PayloadAction<number>) => {
      state.pageSize = payload;
      state.page = 0;
    },
  },
});

export const {
  setRawData,
  setSelectedColumns,
  setColumnFilter,
  clearColumnFilter,
  clearAllFilters,
  setPage,
  setPageSize,
} = dataSlice.actions;
export default dataSlice.reducer;