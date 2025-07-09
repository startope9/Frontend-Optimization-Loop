// src/components/MultiSelectDropDown.test.tsx

jest.mock('./FilterWorker.ts?worker', () => {
  return {
    __esModule: true,
    default: class {
      postMessage = () => {};
      terminate = () => {};
      addEventListener = () => {};
      removeEventListener = () => {};
      onmessage = null;
      onerror = null;
    }
  };
});

jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount = 1, itemData }: any) => (
    <div>
      {Array.from({ length: itemCount }).map((_, index) =>
        children({ index, style: {}, isScrolling: false, isVisible: true, data: itemData })
      )}
    </div>
  ),
}));

jest.mock('react-window-infinite-loader', () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div>
      {typeof children === 'function'
        ? children({
            onItemsRendered: () => {},
            ref: () => {},
          })
        : children}
    </div>
  ),
}));

import { render, fireEvent, screen } from '@testing-library/react';
import MultiSelectDropDown from './MultiSelectDropDown';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dataReducer from '../redux/dataSlice';
import { RootState } from '../redux/store';
import '@testing-library/jest-dom';

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

    const nameButton = screen.getByText('Name');
    fireEvent.click(nameButton);

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows global search box', () => {
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

    const globalSearch = screen.getByPlaceholderText(/global search/i);
    expect(globalSearch).toBeInTheDocument();
  });
});
