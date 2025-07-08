import React from 'react';
import CSVUploader from './components/CSVUploader';
import DataTable from './components/DataTable';
import MultiSelectDropDown from './components/MultiSelectDropDown';

const App: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">CSV Viewer</h1>
      <CSVUploader />
      <MultiSelectDropDown />
      <DataTable />
    </div>
  );
};

export default App;
