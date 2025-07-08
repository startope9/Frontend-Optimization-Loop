import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ColumnFilter {
    [columnName: string]: string[]; // Selected values for each column
}

interface DataState {
    rawData: any[];
    filteredData: any[];
    selectedColumns: string[];
    columnFilters: ColumnFilter;
    availableFilterOptions: { [columnName: string]: string[] };
}

const initialState: DataState = {
    rawData: [],
    filteredData: [],
    selectedColumns: [],
    columnFilters: {},
    availableFilterOptions: {},
};

// Helper function to get unique values from a column
const getUniqueColumnValues = (data: any[], columnName: string): string[] => {
    const values = data.map(row => String(row[columnName] || '')).filter(Boolean);
    return [...new Set(values)].sort();
};

// Helper function to apply filters
const applyFilters = (data: any[], filters: ColumnFilter): any[] => {
    return data.filter(row => {
        return Object.entries(filters).every(([columnName, selectedValues]) => {
            if (selectedValues.length === 0) return true; // No filter applied
            const rowValue = String(row[columnName] || '');
            return selectedValues.includes(rowValue);
        });
    });
};

const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        setRawData: (state, action: PayloadAction<any[]>) => {
            state.rawData = action.payload;
            state.filteredData = action.payload;
            
            // Initialize available filter options for all columns
            if (action.payload.length > 0) {
                const columns = Object.keys(action.payload[0]);
                state.availableFilterOptions = {};
                columns.forEach(column => {
                    state.availableFilterOptions[column] = getUniqueColumnValues(action.payload, column);
                });
                
                // Initialize empty filters for all columns
                state.columnFilters = {};
                columns.forEach(column => {
                    state.columnFilters[column] = [];
                });
            }
        },
        setSelectedColumns: (state: DataState, action: PayloadAction<string[]>) => {
            state.selectedColumns = action.payload;
            // Apply column selection to already filtered data
            const filteredByValues = applyFilters(state.rawData, state.columnFilters);
            state.filteredData = filteredByValues.map((row: any) => {
                const filteredRow: any = {};
                action.payload.forEach((col: string) => {
                    filteredRow[col] = row[col];
                });
                return filteredRow;
            });
        },
        setColumnFilter: (state: DataState, action: PayloadAction<{ columnName: string; selectedValues: string[] }>) => {
            const { columnName, selectedValues } = action.payload;
            state.columnFilters[columnName] = selectedValues;
            
            // Apply all filters
            const filteredByValues = applyFilters(state.rawData, state.columnFilters);
            
            // Apply column selection if any
            if (state.selectedColumns.length > 0) {
                state.filteredData = filteredByValues.map((row: any) => {
                    const filteredRow: any = {};
                    state.selectedColumns.forEach((col: string) => {
                        filteredRow[col] = row[col];
                    });
                    return filteredRow;
                });
            } else {
                state.filteredData = filteredByValues;
            }
            
            // Update available filter options based on current filtered data
            if (filteredByValues.length > 0) {
                const columns = Object.keys(filteredByValues[0]);
                columns.forEach((column: string) => {
                    state.availableFilterOptions[column] = getUniqueColumnValues(filteredByValues, column);
                });
            }
        },
        clearColumnFilter: (state: DataState, action: PayloadAction<string>) => {
            const columnName = action.payload;
            state.columnFilters[columnName] = [];
            
            // Reapply all filters
            const filteredByValues = applyFilters(state.rawData, state.columnFilters);
            
            // Apply column selection if any
            if (state.selectedColumns.length > 0) {
                state.filteredData = filteredByValues.map((row: any) => {
                    const filteredRow: any = {};
                    state.selectedColumns.forEach((col: string) => {
                        filteredRow[col] = row[col];
                    });
                    return filteredRow;
                });
            } else {
                state.filteredData = filteredByValues;
            }
            
            // Update available filter options
            if (filteredByValues.length > 0) {
                const columns = Object.keys(filteredByValues[0]);
                columns.forEach((column: string) => {
                    state.availableFilterOptions[column] = getUniqueColumnValues(filteredByValues, column);
                });
            }
        },
        clearAllFilters: (state: DataState) => {
            // Reset all column filters
            Object.keys(state.columnFilters).forEach((column: string) => {
                state.columnFilters[column] = [];
            });
            
            // Reset to raw data (or apply column selection if any)
            if (state.selectedColumns.length > 0) {
                state.filteredData = state.rawData.map((row: any) => {
                    const filteredRow: any = {};
                    state.selectedColumns.forEach((col: string) => {
                        filteredRow[col] = row[col];
                    });
                    return filteredRow;
                });
            } else {
                state.filteredData = state.rawData;
            }
            
            // Reset available filter options to original values
            if (state.rawData.length > 0) {
                const columns = Object.keys(state.rawData[0]);
                columns.forEach((column: string) => {
                    state.availableFilterOptions[column] = getUniqueColumnValues(state.rawData, column);
                });
            }
        },
    },
});

export const { 
    setRawData, 
    setSelectedColumns, 
    setColumnFilter, 
    clearColumnFilter, 
    clearAllFilters 
} = dataSlice.actions;
export default dataSlice.reducer;
