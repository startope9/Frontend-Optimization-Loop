import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import DataTable, { TableColumn } from 'react-data-table-component';
import './DataTable.css'

const CustomDataTable: React.FC = () => {
    const filteredData = useSelector((state: RootState) => state.data.filteredData);
    if (filteredData.length === 0) return null;

    const headers = Object.keys(filteredData[0]);

    const slNoColumn: TableColumn<any> = {
        name: '',
        cell: (_row, index) => index + 1,
        width: '80px',
        grow: 0,
        center: true,
    };

    const columns: TableColumn<any>[] = [
        slNoColumn,
        ...headers.map((header) => ({
            name: header,
            selector: (row) => row[header],
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

    return (
        <div className="table-outer-wrapper">
            <div className="table-center-wrapper">
                <DataTable
                    columns={columns}
                    data={filteredData}
                    customStyles={customStyles}
                    pagination
                    paginationPerPage={100}
                    paginationRowsPerPageOptions={[100]}
                    fixedHeader
                    fixedHeaderScrollHeight="500px"
                    highlightOnHover
                    striped
                    responsive
                    dense
                />
            </div>
        </div>
    );

};

export default CustomDataTable;
