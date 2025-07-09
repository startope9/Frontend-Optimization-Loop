// src/components/MultiSelectDropDown.tsx

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useSelector, useDispatch, batch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import {
  setColumnFilter,
  clearColumnFilter,
  clearAllFilters,
  setFilteredResults,
  setGlobalSearch,
} from '../redux/dataSlice';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import debounce from 'lodash.debounce';
import './MultiSelectDropDown.css';

import FilterWorker from './FilterWorker.ts?worker';

interface OptionWithCount {
  value: string;
  count: number;
}

interface ColumnDropdownProps {
  columnName: string;
  selectedValues: string[];
  onFilterChange: (selectedValues: string[]) => void;
  onClearFilter: () => void;
}

const PAGE_SIZE = 100;

const ColumnDropdown: React.FC<ColumnDropdownProps> = ({
  columnName,
  selectedValues,
  onFilterChange,
}) => {
  const availableFilterOptions = useSelector((s: RootState) => s.data.availableFilterOptions);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = useMemo(() => availableFilterOptions[columnName] || [], [availableFilterOptions, columnName]);

  const filteredOptions = useMemo(() =>
    options.filter(opt => opt.value.toLowerCase().includes(searchTerm.toLowerCase())), [options, searchTerm]);

  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);
  const hasNextPage = useMemo(() => loadedCount < filteredOptions.length, [loadedCount, filteredOptions.length]);

  const loadMoreItems = useCallback(() => {
    if (!hasNextPage) return;
    setLoadedCount(count => Math.min(count + PAGE_SIZE, filteredOptions.length));
  }, [hasNextPage, filteredOptions.length]);

  const isItemLoaded = useCallback((index: number) => index < loadedCount, [loadedCount]);

  const Item = useCallback(({ index, style, data }: { index: number; style: React.CSSProperties; data: OptionWithCount[] }) => {
    const opt = data[index];
    const checked = selectedValues.includes(opt.value);
    const toggleOption = () => {
      const sel = checked
        ? selectedValues.filter((v) => v !== opt.value)
        : [...selectedValues, opt.value];
      onFilterChange(sel);
    };

    return (
      <div style={style} className="msd-option-virtualized" onClick={toggleOption}>
        <label>
          <input type="checkbox" checked={checked} readOnly />
          <span className="msd-option-value">{opt.value}</span>
          <span className="msd-option-count">({opt.count})</span>
        </label>
      </div>
    );
  }, [onFilterChange, selectedValues]);

  return (
    <div className="msd-dropdown-container" ref={ref}>
      <button className="msd-button" onClick={() => setIsOpen(o => !o)}>
        <span className="msd-button-label">
          {columnName}
          {selectedValues.length ? ` (${selectedValues.length})` : ''}
        </span>
      </button>

      {isOpen && (
        <div className="msd-menu-virtual">
          <div className="msd-header">
            <span>{columnName}</span>
            <span>{filteredOptions.length} items</span>
          </div>

          <div className="msd-search">
            <input
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={filteredOptions.length} loadMoreItems={loadMoreItems}>
            {({
              onItemsRendered,
              ref: listRef,
            }: {
              onItemsRendered: (props: {
                overscanStartIndex: number;
                overscanStopIndex: number;
                visibleStartIndex: number;
                visibleStopIndex: number;
              }) => void;
              ref: (ref: any) => void;
            }) => (

              <List
                height={500}
                itemCount={filteredOptions.length}
                itemSize={35}
                itemData={filteredOptions}
                onItemsRendered={onItemsRendered}
                ref={listRef}
                width={300}
              >
                {Item}
              </List>
            )}
          </InfiniteLoader>
        </div>
      )}
    </div>
  );
};

const MultiSelectDropDown: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rawData, filteredData, columnFilters, selectedColumns, globalSearch } = useSelector((s: RootState) => s.data);
  const filterUpdateStartTimeRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const runWorker = useCallback(() => {
    if (!rawData.length) return;
    if (!workerRef.current) {
      workerRef.current = new FilterWorker();
    }

    workerRef.current.postMessage({ rawData, filters: columnFilters, selectedColumns, globalSearch });
    workerRef.current.onmessage = (e: MessageEvent) => {
      batch(() => {
        dispatch(setFilteredResults(e.data));
      });
    };
  }, [rawData, columnFilters, selectedColumns, globalSearch, dispatch]);

  const debouncedWorker = useMemo(() => debounce(runWorker, 300), [runWorker]);

  useEffect(() => {
    debouncedWorker();
    return () => debouncedWorker.cancel();
  }, [debouncedWorker]);

  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    filterUpdateStartTimeRef.current = performance.now();
    dispatch(setGlobalSearch(e.target.value));
  };

  useEffect(() => {
    if (filterUpdateStartTimeRef.current !== null) {
      const duration = performance.now() - filterUpdateStartTimeRef.current;
      console.log(`%cFilter to table update took ${duration.toFixed(2)}ms`, 'color: green; font-weight: bold;');
      filterUpdateStartTimeRef.current = null;
    }
  }, [filteredData]);

  if (!filteredData.length) {
    return <div className="msd-empty"><p>Upload a CSV to start filtering.</p></div>;
  }

  const columns = Object.keys(filteredData[0]);
  const totalFilters = Object.values(columnFilters).reduce((acc, v) => acc + v.length, 0);

  return (
    <div className="msd-wrapper">
      <div className="msd-toolbar">
        <input
          type="search"
          placeholder="Global search across all columns..."
          value={globalSearch}
          onChange={handleGlobalSearch}
          className="msd-global-search"
        />
        {totalFilters > 0 && (
          <button className="msd-clearall" onClick={() => dispatch(clearAllFilters())}>
            Clear All ({totalFilters})
          </button>
        )}
      </div>

      <div className="msd-dropdowns">
        {columns.map(col => {
          const values = columnFilters[col] || [];
          return (
            <ColumnDropdown
              key={col}
              columnName={col}
              selectedValues={values}
              onFilterChange={(vals) => {
                filterUpdateStartTimeRef.current = performance.now();
                dispatch(setColumnFilter({ columnName: col, selectedValues: vals }));
              }}
              onClearFilter={() => dispatch(clearColumnFilter(col))}
            />
          );
        })}
      </div>

      <div className="msd-summary">
        {totalFilters > 0 && (
          <span>
            Active Filters:{' '}
            {columns
              .filter((c) => columnFilters[c]?.length)
              .map((c) => `${c} (${columnFilters[c].length})`)
              .join(', ')}
          </span>
        )}
      </div>
    </div>
  );
};

export default MultiSelectDropDown;
