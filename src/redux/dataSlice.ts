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

// Utility: Get unique sorted values for a column
const getUniqueValues = (data: any[], col: string) =>
  Array.from(new Set(data.map(row => String(row[col] || ''))))
    .filter(Boolean)
    .sort();

// Applies filters to data
const applyFilters = (data: any[], filters: ColumnFilter) =>
  data.filter(row =>
    Object.entries(filters).every(([col, sel]) =>
      sel.length === 0 || sel.includes(String(row[col] ?? ''))
    )
  );

// Computes available options for each column (excluding its own filter)
const computeOptions = (raw: any[], filters: ColumnFilter) => {
  if (!raw.length) return {};
  return Object.keys(raw[0]).reduce((opts, col) => {
    const filtersExcludingCol = { ...filters, [col]: [] };
    const filtered = applyFilters(raw, filtersExcludingCol);
    opts[col] = getUniqueValues(filtered, col);
    return opts;
  }, {} as Record<string, string[]>);
};

// Builds filteredData based on filters and selected columns
const buildFilteredData = (
  raw: any[],
  filters: ColumnFilter,
  selected: string[]
) => {
  const filtered = applyFilters(raw, filters);
  if (selected.length) {
    return filtered.map(row =>
      selected.reduce((acc, col) => {
        acc[col] = row[col];
        return acc;
      }, {} as any)
    );
  }
  return filtered;
};

// Central function to update filteredData and availableFilterOptions
const updateDerivedState = (state: DataState) => {
  state.filteredData = buildFilteredData(
    state.rawData,
    state.columnFilters,
    state.selectedColumns
  );
  state.availableFilterOptions = computeOptions(
    state.rawData,
    state.columnFilters
  );
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setRawData: (state, { payload }: PayloadAction<any[]>) => {
      state.rawData = payload;
      state.columnFilters = {};
      state.selectedColumns = [];
      updateDerivedState(state);
    },

    setSelectedColumns: (state, { payload }: PayloadAction<string[]>) => {
      state.selectedColumns = payload;
      updateDerivedState(state);
    },

    setColumnFilter: (
      state,
      { payload }: PayloadAction<{ columnName: string; selectedValues: string[] }>
    ) => {
      state.columnFilters[payload.columnName] = payload.selectedValues;
      updateDerivedState(state);
    },

    clearColumnFilter: (state, { payload }: PayloadAction<string>) => {
      state.columnFilters[payload] = [];
      updateDerivedState(state);
    },

    clearAllFilters: state => {
      Object.keys(state.columnFilters).forEach(col => {
        state.columnFilters[col] = [];
      });
      updateDerivedState(state);
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
