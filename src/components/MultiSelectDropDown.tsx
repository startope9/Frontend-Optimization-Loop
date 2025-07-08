import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { AppDispatch } from '../redux/store';
import { setColumnFilter, clearColumnFilter, clearAllFilters } from '../redux/dataSlice';

interface ColumnDropdownProps {
  columnName: string;
  availableOptions: string[];
  selectedValues: string[];
  onFilterChange: (selectedValues: string[]) => void;
  onClearFilter: () => void;
}

const ColumnDropdown: React.FC<ColumnDropdownProps> = ({
  columnName,
  availableOptions,
  selectedValues,
  onFilterChange,
  onClearFilter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    return availableOptions.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableOptions, searchTerm]);

  const handleOptionToggle = (option: string) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter(val => val !== option)
      : [...selectedValues, option];
    
    onFilterChange(newSelectedValues);
  };

  const handleSelectAll = () => {
    onFilterChange(filteredOptions);
  };

  const handleDeselectAll = () => {
    onFilterChange([]);
  };

  return (
    <div className="relative inline-block text-left mb-2 mr-2">
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-w-48"
        >
          <span className="truncate">
            {columnName} {selectedValues.length > 0 && `(${selectedValues.length})`}
          </span>
          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu">
            {/* Search Input */}
            <div className="px-4 py-2 border-b">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-2 border-b flex justify-between">
              <button
                onClick={handleSelectAll}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Select All ({filteredOptions.length})
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Deselect All
              </button>
              <button
                onClick={onClearFilter}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear Filter
              </button>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option)}
                      onChange={() => handleOptionToggle(option)}
                      className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="truncate">{option}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MultiSelectDropDown: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { filteredData, columnFilters, availableFilterOptions } = useSelector(
    (state: RootState) => state.data
  );

  if (filteredData.length === 0) {
    return (
      <div className="mb-4 p-4 bg-gray-100 rounded-md">
        <p className="text-gray-600">Upload a CSV file to start filtering data</p>
      </div>
    );
  }

  const columns = Object.keys(filteredData[0]);

  const handleColumnFilterChange = (columnName: string, selectedValues: string[]) => {
    dispatch(setColumnFilter({ columnName, selectedValues }));
  };

  const handleClearColumnFilter = (columnName: string) => {
    dispatch(clearColumnFilter(columnName));
  };

  const handleClearAllFilters = () => {
    dispatch(clearAllFilters());
  };

  const totalActiveFilters = Object.values(columnFilters).reduce(
    (total, filters) => total + filters.length,
    0
  );

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Column Filters</h2>
        {totalActiveFilters > 0 && (
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">
              {totalActiveFilters} active filter{totalActiveFilters !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleClearAllFilters}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap">
        {columns.map((columnName) => (
          <ColumnDropdown
            key={columnName}
            columnName={columnName}
            availableOptions={availableFilterOptions[columnName] || []}
            selectedValues={columnFilters[columnName] || []}
            onFilterChange={(selectedValues) =>
              handleColumnFilterChange(columnName, selectedValues)
            }
            onClearFilter={() => handleClearColumnFilter(columnName)}
          />
        ))}
      </div>

      {/* Filter Summary */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="text-sm text-blue-800">
          <div className="flex items-center justify-between">
            <span>
              Showing <strong>{filteredData.length}</strong> rows
            </span>
            {totalActiveFilters > 0 && (
              <span className="text-xs">
                Active filters: {Object.entries(columnFilters)
                  .filter(([, values]) => values.length > 0)
                  .map(([column, values]) => `${column} (${values.length})`)
                  .join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiSelectDropDown;