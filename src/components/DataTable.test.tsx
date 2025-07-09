import { render } from '@testing-library/react';
import DataTable from './DataTable';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dataReducer from '../redux/dataSlice';
import '@testing-library/jest-dom';

describe('DataTable', () => {
  it('renders nothing if filteredData is empty', () => {
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

    const { container } = render(
      <Provider store={store}>
        <DataTable />
      </Provider>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
