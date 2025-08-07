import { useState } from 'react';

const ReportHeader = ({ userDetails, submissionDate, downloadPDF }) => {
  const [excludeForPdf, setExcludeForPdf] = useState(false);

  return (
    <div className="report-header-container">
      <div className="personal">
        <div className="name">{userDetails?.userName || 'Praveen Pandey'}</div>
        {submissionDate && (
          <>
            <div className="submit">Submitted on</div>
            <div className="date">{submissionDate}</div>
          </>
        )}
      </div>
      {!excludeForPdf && (
        <div className="data">
          <button className="download" onClick={() => {
            setExcludeForPdf(true);
            setTimeout(() => {
              downloadPDF();
              setExcludeForPdf(false);
            }, 0);
          }}>
            DOWNLOAD
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportHeader;