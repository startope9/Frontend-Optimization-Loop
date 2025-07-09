import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ColumnFilter {
  [columnName: string]: string[];
}

interface DataState {
  rawData: any[];
  filteredData: any[];
  selectedColumns: string[];
  columnFilters: ColumnFilter;
  availableFilterOptions: Record<string, string[]>;
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

// Computes available options for each column, ignoring its own filter (fast, single pass)
const computeOptions = (raw: any[], filters: ColumnFilter) => {
  if (!raw.length) return {} as Record<string, string[]>;
  const columns = Object.keys(raw[0]);
  const sets: Record<string, Record<string, true>> = {};
  for (const col of columns) sets[col] = Object.create(null);

  // Precompute filter sets for all columns
  const filterSets: Record<string, Set<string>> = {};
  for (const [col, sel] of Object.entries(filters)) {
    if (sel.length) filterSets[col] = new Set(sel);
  }

  for (let i = 0, len = raw.length; i < len; i++) {
    const row = raw[i];
    for (const col of columns) {
      // For each column, ignore its own filter
      let pass = true;
      for (const fCol in filterSets) {
        if (fCol === col) continue;
        if (!filterSets[fCol].has(String(row[fCol] ?? ''))) {
          pass = false;
          break;
        }
      }
      if (pass) {
        const val = row[col];
        if (val !== undefined && val !== null && val !== '') sets[col][val] = true;
      }
    }
  }
  const result: Record<string, string[]> = {};
  for (const col of columns) {
    result[col] = Object.keys(sets[col]).sort();
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