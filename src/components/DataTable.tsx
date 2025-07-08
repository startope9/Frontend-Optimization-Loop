import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

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

            <table className="min-w-full table-auto border-collapse border border-gray-200 mb-4">
                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="border">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((row, i) => (
                        <tr key={i}>
                            {headers.map((header) => (
                                <th key={header} className="border">
                                    {row[header]}
                                </th>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-center">
                <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                    Prev
                </button>
                <span>
                    Page {page + 1} of {totalPages}
                </span>
                <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default DataTable;
