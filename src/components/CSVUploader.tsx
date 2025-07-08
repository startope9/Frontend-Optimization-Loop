import React from 'react';
import Papa from 'papaparse';
import { useDispatch } from 'react-redux';
import { setRawData } from '../redux/dataSlice';
import { AppDispatch } from '../redux/store';

const CSVUploader: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        type CSVRow = {
            number: number;
        } & {
            [key: `mod${string}`]: number;
        };


        Papa.parse<CSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: Papa.ParseResult<CSVRow>) => {
                dispatch(setRawData(results.data));
            },
        });

    };

    return (
        <div className="mb-4">
            <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
        </div>
    );
};

export default CSVUploader;
