/* App.jsx */
import React, { useState } from 'react';
import FileUpload from './FileUpload';
import ReportGenerator from './ReportGenerator';
import ErrorBoundary from './ErrorBoundary';

const App = () => {
  const [evaluation, setEvaluation] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-3xl font-bold text-center">Candidate Feedback Evaluator</h1>
      </header>
      <main className="py-8">
        <FileUpload onEvaluation={setEvaluation} />
        {evaluation && (
          <ErrorBoundary>
            <ReportGenerator evaluation={evaluation} />
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
};

export default App;