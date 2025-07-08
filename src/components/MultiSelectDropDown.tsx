import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import {
  setColumnFilter,
  clearColumnFilter,
  clearAllFilters,
} from '../redux/dataSlice';
import './MultiSelectDropDown.css';

interface ColumnDropdownProps {
  columnName: string;
  selectedValues: string[];
  onFilterChange: (selectedValues: string[]) => void;
  onClearFilter: () => void;
}

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

  const otherFilters = useMemo(() => {
    const f = { ...columnFilters };
    f[columnName] = [];
    return f;
  }, [columnFilters, columnName]);

  const dataExcl = useMemo(() => {
    return rawData.filter((row) =>
      Object.entries(otherFilters).every(([col, sel]) =>
        sel.length === 0 || sel.includes(String(row[col] ?? ''))
      )
    );
  }, [rawData, otherFilters]);

  const options = useMemo(() => (
    [...new Set(dataExcl.map((r) => String(r[columnName] ?? '')))]
      .filter(Boolean)
      .sort()
  ), [dataExcl, columnName]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    dataExcl.forEach((r) => {
      const v = String(r[columnName] ?? '');
      c[v] = (c[v] || 0) + 1;
    });
    return c;
  }, [dataExcl, columnName]);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggle = (opt: string) => {
    const sel = selectedValues.includes(opt)
      ? selectedValues.filter((v) => v !== opt)
      : [...selectedValues, opt];
    onFilterChange(sel);
  };

  return (
    <div className="msd-dropdown-container" ref={ref}>
      <button className="msd-button" onClick={() => setIsOpen((o) => !o)}>
        <span className="msd-button-label">
          {columnName}{selectedValues.length ? ` (${selectedValues.length})` : ''}
        </span>
        <span className={`msd-caret ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="msd-menu">
          <div className="msd-header">
            <span>{columnName}</span>
            <span>{options.length} items</span>
          </div>

          <div className="msd-search">
            <i className="msd-search-icon"></i>
            <input
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="msd-actions">
            <button onClick={() => onFilterChange(filtered)}>Select All</button>
            <button onClick={() => onFilterChange([])}>Deselect All</button>
            <button onClick={onClearFilter}>Clear</button>
          </div>

          <div className="msd-options">
            {filtered.length === 0 ? (
              <div className="msd-no-results">No matches</div>
            ) : (
              filtered.map((opt) => (
                <label className="msd-option" key={opt}>
                  <div className="msd-option-left">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(opt)}
                      onChange={() => toggle(opt)}
                    />
                    <span className="msd-option-label">{opt}</span>
                  </div>
                  <span className="msd-option-count">{counts[opt] || 0}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MultiSelectDropDown: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { filteredData, columnFilters } = useSelector((s: RootState) => s.data);

  if (!filteredData.length) {
    return <div className="msd-empty"><p>Upload a CSV to start filtering.</p></div>;
  }

  const columns = Object.keys(filteredData[0]);
  const totalFilters = Object.values(columnFilters).reduce((acc, v) => acc + v.length, 0);

  return (
    <div className="msd-wrapper">
      <div className="msd-toolbar">
        <h2>Column Filters</h2>
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
        {columns.map((col) => (
          <ColumnDropdown
            key={col}
            columnName={col}
            selectedValues={columnFilters[col] || []}
            onFilterChange={(vals) =>
              dispatch(setColumnFilter({ columnName: col, selectedValues: vals }))
            }
            onClearFilter={() => dispatch(clearColumnFilter(col))}
          />
        ))}
      </div>

      <div className="msd-summary">
        <span>Showing {filteredData.length} rows</span>
        {totalFilters > 0 && (
          <span>
            Active: {columns
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
