import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import DataTable, { TableColumn } from 'react-data-table-component';
import './DataTable.css';

interface RowData {
    [key: string]: any; // or use string | number | boolean if you want stricter typing
}

import { setPage, setPageSize } from '../redux/dataSlice';

const CustomDataTable: React.FC = () => {
    const dispatch = useDispatch();
    const { filteredData, page, pageSize } = useSelector((state: RootState) => state.data);
    if (filteredData.length === 0) return null;

    const headers = Object.keys(filteredData[0]);

    // Calculate paginated rows
    const totalRows = filteredData.length;
    const pageRows = filteredData.slice(page * pageSize, (page + 1) * pageSize);

    const slNoColumn: TableColumn<RowData> = {
        name: '',
        cell: (_row, index) => page * pageSize + index + 1,
        width: '80px',
        grow: 0,
        center: true,
    };

    const columns: TableColumn<RowData>[] = [
        slNoColumn,
        ...headers.map((header) => ({
            name: header,
            selector: (row: RowData) => row[header],
            sortable: true,
            wrap: true,
            center: true,
        })),
    ];

    const customStyles = {
        headCells: {
            style: {
                fontSize: '16px',
                fontWeight: 'bold',
            },
        },
    };

    // Pagination controls
    const totalPages = Math.ceil(totalRows / pageSize);
    const handlePageChange = (newPage: number) => {
        dispatch(setPage(newPage));
    };
    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch(setPageSize(Number(e.target.value)));
    };

    return (
        <div className="table-outer-wrapper">
            <div className="table-center-wrapper">
                <DataTable
                    columns={columns}
                    data={pageRows}
                    customStyles={customStyles}
                    fixedHeader
                    fixedHeaderScrollHeight="500px"
                    highlightOnHover
                    striped
                    responsive
                    dense
                    pagination={false}
                />
                <div className="custom-pagination-bar">
                    <button
                        onClick={() => handlePageChange(Math.max(0, page - 1))}
                        disabled={page === 0}
                    >
                        Prev
                    </button>
                    <span style={{ margin: '0 8px' }}>
                        Page {page + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                    >
                        Next
                    </button>
                    <span style={{ marginLeft: 16 }}>
                        Rows per page:
                        <select value={pageSize} onChange={handlePageSizeChange} style={{ marginLeft: 4 }}>
                            {[10, 25, 50, 100, 200, 500].map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </span>
                    <span style={{ marginLeft: 16 }}>
                        {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalRows)} of {totalRows}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CustomDataTable;
