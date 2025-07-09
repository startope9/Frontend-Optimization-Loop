import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import {
  setColumnFilter,
  clearColumnFilter,
  clearAllFilters,
} from '../redux/dataSlice';
import { FixedSizeList as List, ListOnItemsRenderedProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import './MultiSelectDropDown.css';


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
  onClearFilter,
}) => {
  const { rawData, columnFilters } = useSelector((s: RootState) => s.data);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Compute options and counts excluding this column's filter
  const options = useMemo(() => {
    const otherFilters = { ...columnFilters, [columnName]: [] };
    const dataExcl = rawData.filter(row =>
      Object.entries(otherFilters).every(([col, sel]) =>
        sel.length === 0 || sel.includes(String(row[col] ?? ''))
      )
    );
    const uniq = Array.from(
      new Set(dataExcl.map(r => String(r[columnName] ?? '')))
    ).filter(Boolean).sort();
    return uniq;
  }, [rawData, columnFilters, columnName]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rawData.forEach(r => {
      const v = String(r[columnName] ?? '');
      c[v] = (c[v] || 0) + 1;
    });
    return c;
  }, [rawData, columnName]);

  // Filtered options by search
  const filteredOptions = useMemo(
    () => options.filter(opt =>
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [options, searchTerm]
  );

  // Infinite loading state
  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);
  const hasNextPage = loadedCount < filteredOptions.length;
  const isNextPageLoading = false;

  const loadMoreItems = useCallback(() => {
    if (!hasNextPage) return;
    setLoadedCount(count => Math.min(count + PAGE_SIZE, filteredOptions.length));
  }, [hasNextPage, filteredOptions.length]);

  const isItemLoaded = (index: number) => index < loadedCount;

  const Item = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (!isItemLoaded(index)) {
      return <div style={style}>Loading...</div>;
    }
    const opt = filteredOptions[index];
    const checked = selectedValues.includes(opt);

    const toggleOption = () => {
      const sel = checked
        ? selectedValues.filter(v => v !== opt)
        : [...selectedValues, opt];
      onFilterChange(sel);
    };

    return (
      <div
        style={style}
        className="msd-option-virtualized"
        onClick={toggleOption}
      >
        <label>
          <input
            type="checkbox"
            checked={checked}
            readOnly
          />
          <span className="msd-option-value">{opt}</span>
          <span className="msd-option-count">({counts[opt] || 0})</span>
        </label>
      </div>
    );
  };


  return (
    <div className="msd-dropdown-container" ref={ref}>
      <button className="msd-button" onClick={() => setIsOpen(o => !o)}>
        <span className="msd-button-label">
          {columnName}{selectedValues.length ? ` (${selectedValues.length})` : ''}
        </span>
        {/* <span className={`msd-caret ${isOpen ? 'open' : ''}`} /> */}
      </button>

      {isOpen && (
        <div className="msd-menu-virtual">
          <div className="msd-header">
            <span>{columnName}</span>
            <span>{filteredOptions.length} items</span>
          </div>

          <div className="msd-search">
            <i className="fa fa-search"></i>
            <input
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          <div className="msd-actions">
            <button onClick={() => onFilterChange(filteredOptions.slice(0, loadedCount))}>
              Select All
            </button>
            <button onClick={() => onFilterChange([])}>Deselect All</button>
            <button onClick={onClearFilter}>Clear</button>
          </div>

          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={filteredOptions.length}
            loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }) => (
              <List
                height={300}
                itemCount={filteredOptions.length}
                itemSize={35}
                onItemsRendered={(props: ListOnItemsRenderedProps) => {
                  onItemsRendered(props);
                  const { visibleStopIndex } = props;
                  if (visibleStopIndex + 1 >= loadedCount && hasNextPage) {
                    loadMoreItems();
                  }
                }}
                ref={ref}
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
  const filterStartRef = useRef<number | null>(null); // for execution time

  const { filteredData, columnFilters } = useSelector((s: RootState) => s.data);

  if (!filteredData.length) {
    return <div className="msd-empty"><p>Upload a CSV to start filtering.</p></div>;
  }

  const columns = Object.keys(filteredData[0]);
  const totalFilters = Object.values(columnFilters).reduce((acc, v) => acc + v.length, 0);

  //for execution time
  useEffect(() => {
    if (filterStartRef.current !== null) {
      const duration = performance.now() - filterStartRef.current;
      console.log(`⏱️ Filter applied in ${Math.round(duration)} ms`);
      filterStartRef.current = null;
    }
  }, [filteredData]);


  return (
    <div className="msd-wrapper">
      <div className="msd-toolbar">
        {/* <h2>Column Filters</h2> */}
        {totalFilters > 0 && (
          <button className="msd-clearall" onClick={() => dispatch(clearAllFilters())}>
            Clear All ({totalFilters})
          </button>
        )}
      </div>

      <div className="msd-dropdowns">
        {columns.map(col => (
          <ColumnDropdown
            key={col}
            columnName={col}
            selectedValues={columnFilters[col] || []}
            // onFilterChange={vals => dispatch(setColumnFilter({ columnName: col, selectedValues: vals }))}
            onFilterChange={vals => {
              filterStartRef.current = performance.now();
              dispatch(setColumnFilter({ columnName: col, selectedValues: vals }));
            }}

            onClearFilter={() => dispatch(clearColumnFilter(col))}
          />
        ))}
      </div>

      <div className="msd-summary">
        {/* <span>Showing {filteredData.length} rows</span> */}
        {totalFilters > 0 && (
          <span>
            Active: {columns
              .filter(c => columnFilters[c]?.length)
              .map(c => `${c} (${columnFilters[c].length})`)
              .join(', ')}
          </span>
        )}
      </div>
    </div>
  );
};

export default MultiSelectDropDown;
