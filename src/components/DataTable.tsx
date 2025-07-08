import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import './DataTable.css';

const DataTable: React.FC = () => {
    const filteredData = useSelector((state: RootState) => state.data.filteredData);
    const [page, setPage] = useState(0);
    const rowsPerPage = 100;

    if (filteredData.length === 0) return null;

    const headers = Object.keys(filteredData[0]);
    const startIndex = page * rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    return (
        <div>
            <div className="table-container">
                <table className="fixed-header">
                    <thead>
                        <tr>
                            {headers.map((header) => (
                                <th key={header}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, i) => (
                            <tr key={i}>
                                {headers.map((header) => (
                                    <td key={header}>{row[header]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="pagination-controls">
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                >Prev</button>

                <span className="current-page">
                    {page + 1} / {totalPages}
                </span>

                <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                >Next</button>
            </div>

        </div>
    );
};

export default DataTable;
