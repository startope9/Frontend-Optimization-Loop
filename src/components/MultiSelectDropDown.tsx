import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import {
  setColumnFilter,
  clearColumnFilter,
  clearAllFilters,
} from '../redux/dataSlice';
import { FixedSizeList as List } from 'react-window';
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = useMemo(() => {
    const otherFilters = { ...columnFilters, [columnName]: [] };
    const dataExcl = rawData.filter((row: Record<string, unknown>) =>
      Object.entries(otherFilters).every(([col, selValue]) => {
        const sel = selValue as string[];
        return sel.length === 0 || sel.includes(String(row[col] ?? ''));
      })
    );
    const uniq = Array.from(
      new Set(dataExcl.map((r) => String(r[columnName] ?? '')))
    )
      .filter(Boolean)
      .sort();
    return uniq;
  }, [rawData, columnFilters, columnName]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rawData.forEach((r: Record<string, unknown>) => {
      const v = String(r[columnName] ?? '');
      c[v] = (c[v] || 0) + 1;
    });
    return c;
  }, [rawData, columnName]);

  const filteredOptions = useMemo(
    () =>
      options.filter((opt: string) =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [options, searchTerm]
  );

  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);
  const hasNextPage = loadedCount < filteredOptions.length;

  const loadMoreItems = useCallback(() => {
    if (!hasNextPage) return;
    setLoadedCount((count) =>
      Math.min(count + PAGE_SIZE, filteredOptions.length)
    );
  }, [hasNextPage, filteredOptions.length]);

  const isItemLoaded = (index: number) => index < loadedCount;

  const Item = ({
    index,
    style,
    data,
  }: {
    index: number;
    style: React.CSSProperties;
    data: string[];
  }) => {
    const opt = data[index];
    const checked = selectedValues.includes(opt);

    const toggleOption = () => {
      const sel = checked
        ? selectedValues.filter((v) => v !== opt)
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
          <input type="checkbox" checked={checked} readOnly />
          <span className="msd-option-value">{opt}</span>
          <span className="msd-option-count">({counts[opt] || 0})</span>
        </label>
      </div>
    );
  };

  return (
    <div className="msd-dropdown-container" ref={ref}>
      <button className="msd-button" onClick={() => setIsOpen((o) => !o)}>
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
            <i className="fa fa-search"></i>
            <input
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="msd-actions">
            <button
              onClick={() =>
                onFilterChange(filteredOptions.slice(0, loadedCount))
              }
            >
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
              <List<string>
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
  const { filteredData, columnFilters } = useSelector((s: RootState) => s.data);
  const filterUpdateStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (filterUpdateStartTimeRef.current !== null) {
      const duration = performance.now() - filterUpdateStartTimeRef.current;
      console.log(
        `%cFilter to table update took ${duration.toFixed(2)}ms`,
        'color: green; font-weight: bold;'
      );
      filterUpdateStartTimeRef.current = null;
    }
  }, [filteredData]);

  if (!filteredData.length) {
    return (
      <div className="msd-empty">
        <p>Upload a CSV to start filtering.</p>
      </div>
    );
  }

  const columns = Object.keys(filteredData[0]) as string[];
  const totalFilters = Object.values(columnFilters).reduce(
    (acc, v) => acc + v.length,
    0
  );

  return (
    <div className="msd-wrapper">
      <div className="msd-toolbar">
        {totalFilters > 0 && (
          <button
            className="msd-clearall"
            onClick={() => dispatch(clearAllFilters())}
          >
            Clear All ({totalFilters})
          </button>
        )}
      </div>

      <div className="msd-dropdowns">
        {columns.map((col: string) => {
          const values = columnFilters[col as keyof typeof columnFilters] || [];
          return (
            <ColumnDropdown
              key={col}
              columnName={col}
              selectedValues={values}
              onFilterChange={(vals) => {
                filterUpdateStartTimeRef.current = performance.now();
                dispatch(
                  setColumnFilter({ columnName: col, selectedValues: vals })
                );
              }}
              onClearFilter={() => dispatch(clearColumnFilter(col))}
            />
          );
        })}
      </div>

      <div className="msd-summary">
        {totalFilters > 0 && (
          <span>
            Active:{' '}
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
