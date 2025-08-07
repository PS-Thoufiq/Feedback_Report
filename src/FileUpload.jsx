/* FileUpload.jsx */
import React, { useState } from 'react';
import { extractTextFromPDF, evaluateWithOpenAI } from './pdfUtils';

const FileUpload = ({ onEvaluation }) => {
  const [file, setFile] = useState(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file');
      return;
    }
    if (!interviewDate) {
      setError('Please select an interview date');
      return;
    }
    setLoading(true);
    try {
      const text = await extractTextFromPDF(file);
      console.log('Extracted text:', text.substring(0, 200) + '...');
      const evaluation = await evaluateWithOpenAI(text, interviewDate);
      console.log('Evaluation result:', JSON.stringify(evaluation, null, 2));
      localStorage.setItem('evaluation_data', JSON.stringify(evaluation));
      onEvaluation(evaluation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Upload Feedback PDF</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Select PDF File</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Interview Date</label>
          <input
            type="date"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Evaluate Feedback'}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;