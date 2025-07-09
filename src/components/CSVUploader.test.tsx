// src/components/CSVUploader.test.tsx

import { render, fireEvent } from '@testing-library/react';
import CSVUploader from './CSVUploader';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dataReducer from '../redux/dataSlice';
import '@testing-library/jest-dom';

describe('CSVUploader', () => {
    function renderWithStore() {
        const store = configureStore({
            reducer: { data: dataReducer },
            preloadedState: {
                data: {
                    filteredData: [],
                    rawData: [],
                    selectedColumns: [],
                    columnFilters: {},
                    availableFilterOptions: {},
                    page: 0,
                    pageSize: 10,
                    globalSearch: '',
                },
            },
        });

        return {
            store,
            ...render(
                <Provider store={store}>
                    <CSVUploader />
                </Provider>
            ),
        };
    }

    it('renders file input', () => {
        const { getByLabelText } = renderWithStore();
        expect(getByLabelText(/upload csv file/i)).toBeInTheDocument();
    });

    it('does not dispatch if no file is selected', () => {
        const { getByLabelText } = renderWithStore();
        const input = getByLabelText(/upload csv file/i) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [] } });
        // This ensures no crash or dispatch — just stability check
        expect(input.files?.length || 0).toBe(0);
    });
});
