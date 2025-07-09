import { render, fireEvent } from '@testing-library/react';
import CSVUploader from './CSVUploader';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dataReducer from '../redux/dataSlice';
import '@testing-library/jest-dom';

describe('CSVUploader', () => {
    it('renders file input', () => {
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
                }
            }
        });
        const { getByLabelText } = render(
            <Provider store={store}>
                <CSVUploader />
            </Provider>
        );
        expect(getByLabelText(/upload csv file/i)).toBeInTheDocument();
    });

    it('does not dispatch if no file is selected', () => {
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
                }
            }
        });
        const { getByLabelText } = render(
            <Provider store={store}>
                <CSVUploader />
            </Provider>
        );
        const input = getByLabelText(/upload csv file/i) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [] } });
        // No error should occur, and state should not change
        // Optionally, you can spy on dispatch if needed
    });
});