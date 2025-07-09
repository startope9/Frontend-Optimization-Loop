
import { forwardRef, Ref } from 'react'; 
import { render, fireEvent, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dataReducer from '../redux/dataSlice';
import { RootState } from '../redux/store';
import MultiSelectDropDown from './MultiSelectDropDown';
import '@testing-library/jest-dom';

// Mock lodash.debounce with .cancel()
jest.mock('lodash.debounce', () => ({
    __esModule: true,
    default: (fn: any) => {
        const debounced = (...args: any[]) => fn(...args);
        debounced.cancel = () => { };
        return debounced;
    },
}));

// Mock Worker
jest.mock('./FilterWorker.ts?worker', () => {
    return {
        __esModule: true,
        default: class {
            postMessage = () => { };
            terminate = () => { };
            addEventListener = () => { };
            removeEventListener = () => { };
            onmessage: ((e: any) => void) | null = null;
            onerror: ((e: any) => void) | null = null;
        },
    };
});

// Mock react-window
jest.mock('react-window', () => ({
    FixedSizeList: forwardRef(
        ({ children, itemCount = 1, itemData }: any, ref: Ref<HTMLDivElement>) => (
            <div ref={ref} data-testid="virtual-list">
                {Array.from({ length: itemCount }).map((_, index) => (
                    <div key={index}>
                        {children({ index, style: {}, isScrolling: false, isVisible: true, data: itemData })}
                    </div>
                ))}
            </div>
        )
    ),
}));

// Mock react-window-infinite-loader
jest.mock('react-window-infinite-loader', () => ({
    __esModule: true,
    default: ({ children }: any) => (
        <div data-testid="infinite-loader">
            {typeof children === 'function'
                ? children({
                    onItemsRendered: () => { },
                    ref: () => { },
                })
                : children}
        </div>
    ),
}));

describe('MultiSelectDropDown', () => {
    function renderWithStore(preloadedState: Partial<RootState>) {
        const store = configureStore({
            reducer: { data: dataReducer },
            preloadedState: preloadedState as RootState,
        });

        return render(
            <Provider store={store}>
                <MultiSelectDropDown />
            </Provider>
        );
    }

    it('renders empty message if no data', () => {
        renderWithStore({
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
        });

        expect(screen.getByText(/upload a csv to start filtering/i)).toBeInTheDocument();
    });

    it('renders dropdowns for each column', () => {
        renderWithStore({
            data: {
                filteredData: [
                    { Name: 'Alice', Age: 30 },
                    { Name: 'Bob', Age: 25 },
                ],
                rawData: [
                    { Name: 'Alice', Age: 30 },
                    { Name: 'Bob', Age: 25 },
                ],
                selectedColumns: [],
                columnFilters: {},
                availableFilterOptions: {
                    Name: [{ value: 'Alice', count: 1 }, { value: 'Bob', count: 1 }],
                    Age: [{ value: '30', count: 1 }, { value: '25', count: 1 }],
                },
                page: 0,
                pageSize: 10,
                globalSearch: '',
            },
        });

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
    });

    it('shows clear all button when filters are active', () => {
        renderWithStore({
            data: {
                filteredData: [
                    { Name: 'Alice', Age: 30 },
                    { Name: 'Bob', Age: 25 },
                ],
                rawData: [
                    { Name: 'Alice', Age: 30 },
                    { Name: 'Bob', Age: 25 },
                ],
                selectedColumns: [],
                columnFilters: { Name: ['Alice'] },
                availableFilterOptions: {
                    Name: [{ value: 'Alice', count: 1 }, { value: 'Bob', count: 1 }],
                    Age: [{ value: '30', count: 1 }, { value: '25', count: 1 }],
                },
                page: 0,
                pageSize: 10,
                globalSearch: '',
            },
        });

        expect(screen.getByText(/clear all/i)).toBeInTheDocument();
    });

    it('opens dropdown and shows options', () => {
        renderWithStore({
            data: {
                filteredData: [
                    { Name: 'Alice', Age: 30 },
                    { Name: 'Bob', Age: 25 },
                ],
                rawData: [
                    { Name: 'Alice', Age: 30 },
                    { Name: 'Bob', Age: 25 },
                ],
                selectedColumns: [],
                columnFilters: {},
                availableFilterOptions: {
                    Name: [{ value: 'Alice', count: 1 }, { value: 'Bob', count: 1 }],
                    Age: [{ value: '30', count: 1 }, { value: '25', count: 1 }],
                },
                page: 0,
                pageSize: 10,
                globalSearch: '',
            },
        });

        fireEvent.click(screen.getByText('Name'));

        const dropdown = screen.getByTestId('virtual-list');
        expect(within(dropdown).getByText('Alice')).toBeInTheDocument();
        expect(within(dropdown).getByText('Bob')).toBeInTheDocument();
    });
});
