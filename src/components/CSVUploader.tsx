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

        Papa.parse<Record<string, string>>(file, {
            header: true,
            skipEmptyLines: true,
            worker: true, // use PapaParse's web worker for large files
            complete: (results) => {
                // Use a single pass and avoid creating intermediate objects
                const parsed = new Array(results.data.length);
                for (let i = 0; i < results.data.length; i++) {
                    const row = results.data[i];
                    const converted: Record<string, number | string> = {};
                    for (const key in row) {
                        const val = row[key];
                        // Only try to convert if val is not empty string/null/undefined
                        if (val !== undefined && val !== null && val !== '') {
                            const num = Number(val);
                            converted[key] = isNaN(num) ? val : num;
                        } else {
                            converted[key] = '';
                        }
                    }
                    parsed[i] = converted;
                }
                dispatch(setRawData(parsed));
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
