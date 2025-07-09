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
}

const initialState: DataState = {
  rawData: [],
  filteredData: [],
  selectedColumns: [],
  columnFilters: {},
  availableFilterOptions: {},
};


// Applies given filters to data (fast, avoids unnecessary work)
const applyFilters = (data: any[], filters: ColumnFilter) => {
  // Precompute filter sets for O(1) lookup
  const filterSets: Record<string, Set<string>> = {};
  let hasActive = false;
  for (const [col, sel] of Object.entries(filters)) {
    if (sel.length) {
      filterSets[col] = new Set(sel);
      hasActive = true;
    }
  }
  if (!hasActive) return data;
  return data.filter(row => {
    for (const col in filterSets) {
      if (!filterSets[col].has(String(row[col] ?? ''))) return false;
    }
    return true;
  });
};

// Computes available options for each column based on the currently filtered rows, with counts
// Returns: Record<column, { value: string, count: number }[]>
const computeOptions = (raw: any[], filters: ColumnFilter) => {
  if (!raw.length) return {} as Record<string, { value: string; count: number }[]>;
  const filtered = applyFilters(raw, filters);
  const columns = Object.keys(raw[0]);
  const counts: Record<string, Record<string, number>> = {};
  for (const col of columns) counts[col] = Object.create(null);
  for (let i = 0, len = filtered.length; i < len; i++) {
    const row = filtered[i];
    for (const col of columns) {
      const val = row[col];
      if (val !== undefined && val !== null && val !== '') {
        counts[col][val] = (counts[col][val] || 0) + 1;
      }
    }
  }
  const result: Record<string, { value: string; count: number }[]> = {};
  for (const col of columns) {
    result[col] = Object.entries(counts[col])
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }
  return result;
};

// Builds filteredData based on filters and selected columns (fast, avoids reduce)
const buildFilteredData = (
  raw: any[],
  filters: ColumnFilter,
  selected: string[]
) => {
  const filtered = applyFilters(raw, filters);
  if (selected.length) {
    return filtered.map(row => {
      const obj: any = {};
      for (let i = 0, len = selected.length; i < len; i++) {
        const col = selected[i];
        obj[col] = row[col];
      }
      return obj;
    });
  }
  return filtered;
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setRawData: (state, { payload }: PayloadAction<any[]>) => {
      state.rawData = payload;
      // state.columnFilters = {};
      // state.selectedColumns = [];
      state.filteredData = payload;
      state.availableFilterOptions = computeOptions(payload, {});
    },

    setSelectedColumns: (state, { payload }: PayloadAction<string[]>) => {
      state.selectedColumns = payload;
      state.filteredData = buildFilteredData(
        state.rawData,
        state.columnFilters,
        payload
      );
      state.availableFilterOptions = computeOptions(
        state.rawData,
        state.columnFilters
      );
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
    },
  },
});

export const {
  setRawData,
  setSelectedColumns,
  setColumnFilter,
  clearColumnFilter,
  clearAllFilters,
} = dataSlice.actions;
export default dataSlice.reducer;