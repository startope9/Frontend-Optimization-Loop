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
  pageSize: 100, // default page size, can be changed
};



// Web Worker-based filtering: reducers only update state, not filter logic


const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {

    setRawData: (state, { payload }: PayloadAction<any[]>) => {
      state.rawData = payload;
      state.page = 0;
    },

    setSelectedColumns: (state, { payload }: PayloadAction<string[]>) => {
      state.selectedColumns = payload;
      state.page = 0;
    },

    setColumnFilter: (
      state,
      { payload }: PayloadAction<{ columnName: string; selectedValues: string[] }>
    ) => {
      state.columnFilters[payload.columnName] = payload.selectedValues;
      state.page = 0;
    },

    clearColumnFilter: (state, { payload }: PayloadAction<string>) => {
      state.columnFilters[payload] = [];
      state.page = 0;
    },

    clearAllFilters: state => {
      Object.keys(state.columnFilters).forEach(col => (state.columnFilters[col] = []));
      state.page = 0;
    },

    setFilteredResults: (
      state,
      { payload }: PayloadAction<{ filteredData: any[]; availableFilterOptions: Record<string, { value: string; count: number }[]> }>
    ) => {
      state.filteredData = payload.filteredData;
      state.availableFilterOptions = payload.availableFilterOptions;
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
  setFilteredResults,
  setPage,
  setPageSize,
} = dataSlice.actions;
export default dataSlice.reducer;