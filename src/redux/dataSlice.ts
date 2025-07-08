import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DataState {
    rawData: any[];
    filteredData: any[];
    selectedColumns: string[];
}

const initialState: DataState = {
    rawData: [],
    filteredData: [],
    selectedColumns: [],
};

const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        setRawData: (state, action: PayloadAction<any[]>) => {
            state.rawData = action.payload;
            state.filteredData = action.payload;
        },
        setSelectedColumns: (state, action: PayloadAction<string[]>) => {
            state.selectedColumns = action.payload;
            state.filteredData = state.rawData.map(row => {
                const filteredRow: any = {};
                action.payload.forEach(col => {
                    filteredRow[col] = row[col];
                });
                return filteredRow;
            });
        },
    },
});

export const { setRawData, setSelectedColumns } = dataSlice.actions;
export default dataSlice.reducer;
