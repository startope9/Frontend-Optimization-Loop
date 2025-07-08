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

// Utility: get unique sorted values for a column
const getUniqueValues = (data: any[], col: string) =>
    Array.from(new Set(data.map(row => String(row[col] || ''))))
        .filter(Boolean)
        .sort();

// Applies given filters to data
const applyFilters = (data: any[], filters: ColumnFilter) =>
    data.filter(row =>
        Object.entries(filters).every(([col, sel]) =>
            sel.length === 0 || sel.includes(String(row[col] ?? ''))
        )
    );

// Computes available options for each column, ignoring its own filter
const computeOptions = (raw: any[], filters: ColumnFilter) => {
    if (!raw.length) return {} as Record<string, string[]>;
    return Object.keys(raw[0]).reduce((opts, col) => {
        // copy filters and clear this column's filter
        const fExcl = { ...filters, [col]: [] };
        const filtered = applyFilters(raw, fExcl);
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

const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        setRawData: (state, { payload }: PayloadAction<any[]>) => {
            state.rawData = payload;
            state.columnFilters = {};
            state.selectedColumns = [];
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
