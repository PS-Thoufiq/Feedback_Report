/* ReportGenerator.jsx */
import React, { useState } from 'react';
import generatePDF from 'react-to-pdf';
import { Grid, Card, Box, Typography, Slider } from '@mui/material';
import './ReportGenerator.scss';
import logo from "./assets/zeero-logo.svg";

// Rating labels and colors
const ratingLabels = {
  5: { label: 'Excellent', color: '#4FE567' },
  4: { label: 'Good', color: '#4FE567' },
  3: { label: 'Average', color: '#FF9C2C' },
  2: { label: 'Below Average', color: '#FF9C2C' },
  1: { label: 'Poor', color: '#FC1E1E' },
  0: { label: 'Poor', color: '#FC1E1E' }
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const ReportGenerator = ({ evaluation }) => {
  const [excludeForPdf, setExcludeForPdf] = useState(false);

  // PDF generation options
  const pageInput = React.useRef();
  const options = {
    filename: `${evaluation['Candidate Name'] || 'Candidate'}_Report.pdf`,
    page: {
      margin: 10,
    },
  };

  const handleGeneratePdf = () => {
    setExcludeForPdf(true);
    setTimeout(async () => {
      try {
        await generatePDF(pageInput, options);
      } finally {
        setExcludeForPdf(false);
      }
    }, 0);
  };

  const technicalSkills = Array.isArray(evaluation['Technical Skills']) ? evaluation['Technical Skills'] : [];
  const softSkills = Array.isArray(evaluation['Soft Skills']) ? evaluation['Soft Skills'] : [];
  const strengths = Array.isArray(evaluation.Strengths) ? evaluation.Strengths : [];
  const areasForImprovement = Array.isArray(evaluation['Areas for Improvement']) ? evaluation['Areas for Improvement'] : [];

  // Split skills into chunks for pagination - no padding
  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const technicalSkillsPages = chunkArray(technicalSkills.filter(skill => skill.Section), 10);
  const softSkillsPages = chunkArray(softSkills.filter(skill => skill.Section), 4);

  // Function to split text into 3-4 lines
  const splitIntoLines = (text, maxLines = 4) => {
    if (!text) return Array(maxLines).fill('');
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).length <= 50 && lines.length < maxLines - 1) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    while (lines.length < maxLines) lines.push('');
    return lines;
  };

  return (
    <div className="report-container" ref={pageInput}>
      {/* Header */}
      <div className="dev-report-header-container" style={{ pageBreakAfter: 'avoid' }}>
        <div className="personal">
          <div className="name">{evaluation['Candidate Name'] || 'Unknown'}</div>
          <div className="submit">Submitted on</div>
          <div className="date">{formatDate(evaluation['Interview Date'])}</div>
        </div>
        <div className="data">
          <div className="logo-placeholder">
            <img src={logo} alt="zeero-logo" style={{ width: '100px', height: 'auto', border: 'none', outline: 'none', boxShadow: 'none' }} />
          </div>
          {!excludeForPdf && (
            <button className="download" onClick={handleGeneratePdf}>
              DOWNLOAD
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="summary-wrapper" style={{ pageBreakAfter: 'always', textAlign: 'left' }}>
        <div className="summary-row">
          <Typography className="summary-title" sx={{ display: 'inline-block', color: '#000000' }}>
            Summary
          </Typography>
        </div>
        <div className="summary-row">
          <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px', color: '#4F4F4F', textAlign: 'justify', display: 'inline-block', width: '80%' }}>
            {evaluation.Summary || 'No summary provided'}
          </Typography>
        </div>
      </div>

      {/* Core Competencies */}
      <Box sx={{ mb: 4, pageBreakAfter: 'always', textAlign: 'left' }}>
        <Typography
          variant="h6"
          sx={{
            color: '#000000',
            fontFamily: 'Poppins',
            fontSize: '18px',
            fontWeight: 700,
            mb: 2,
            display: 'inline-block',
          }}
        >
          Core Competencies
        </Typography>
        <Box
          sx={{
            borderRadius: '8px',
            border: '1px solid #E0E0E0',
            background: '#FFF',
            p: 3,
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
            pageBreakInside: 'avoid'
          }}
        >
          <Box component="ul" sx={{ pl: 3, m: 0, textAlign: 'left', display: 'inline-block', width: '80%' }}>
            {strengths.map((item, index) => (
              <li key={index} style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <Typography
                  sx={{
                    color: '#4F4F4F',
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: '24px',
                    textAlign: 'justify',
                  }}
                >
                  {item}
                </Typography>
              </li>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Potential Development Areas */}
      <Box sx={{ mb: 4, pageBreakAfter: 'always', textAlign: 'left' }}>
        <Typography
          variant="h6"
          sx={{
            color: '#000000',
            fontFamily: 'Poppins',
            fontSize: '18px',
            fontWeight: 700,
            mb: 2,
            display: 'inline-block',
          }}
        >
          Potential Development Areas
        </Typography>
        <Box
          sx={{
            borderRadius: '8px',
            border: '1px solid #E0E0E0',
            background: '#FFF',
            p: 3,
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
            pageBreakInside: 'avoid'
          }}
        >
          <Box component="ul" sx={{ pl: 3, m: 0, textAlign: 'left', display: 'inline-block', width: '80%' }}>
            {areasForImprovement.map((item, index) => (
              <li key={index} style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                <Typography
                  sx={{
                    color: '#4F4F4F',
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: '24px',
                    textAlign: 'justify',
                  }}
                >
                  {item}
                </Typography>
              </li>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Technical Skills Evaluation */}
      {technicalSkillsPages.map((pageSkills, pageIndex) => (
        <Box 
          key={`tech-page-${pageIndex}`} 
          sx={{ 
            mb: 4, 
            pageBreakAfter: pageIndex < technicalSkillsPages.length - 1 ? 'always' : 'auto', 
            textAlign: 'center',
            pageBreakInside: 'avoid'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#4CAF50',
              fontFamily: 'Poppins',
              fontSize: '18px',
              fontWeight: 700,
              mb: 2,
              borderBottom: '2px solid #4CAF5020',
              pb: 1,
              display: 'inline-block',
            }}
          >
            Technical Skills Evaluation {technicalSkillsPages.length > 1 ? `(${pageIndex + 1})` : ''}
          </Typography>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 auto', pageBreakInside: 'avoid' }}>
            <tbody>
              {Array.from({ length: Math.ceil(pageSkills.length / 2) }, (_, rowIndex) => {
                const rowSkills = pageSkills.slice(rowIndex * 2, rowIndex * 2 + 2);
                if (rowSkills.length === 0) return null;
                
                return (
                  <tr key={rowIndex} style={{ pageBreakInside: 'avoid' }}>
                    {rowSkills.map((item, colIndex) => {
                      const index = rowIndex * 2 + colIndex;
                      const globalIndex = pageIndex * 10 + index + 1;
                      // Ensure rating is a valid number between 1 and 5
                      const rating = Math.min(Math.max(Number(item.rating) || 3, 1), 5);
                      const { label, color } = ratingLabels[rating] || { label: 'Average', color: '#FF9C2C' }; // Default to 3 if invalid
                      const lines = splitIntoLines(item.comments || item.evidence || '');
                      
                      return (
                        <td
                          key={index}
                          style={{
                            width: '50%',
                            padding: '16px',
                            verticalAlign: 'top',
                            border: excludeForPdf ? 'none' : '1px solid #e0e0e0',
                            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                            backgroundColor: '#fff',
                            minHeight: '220px',
                            pageBreakInside: 'avoid',
                          }}
                        >
                          <Box sx={{ position: 'relative', height: '100%' }}>
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                backgroundColor: '#0B52D4',
                                color: '#fff',
                                borderRadius: '0px 0px 8px 0px',
                                fontSize: '14px',
                                fontWeight: 600,
                                px: 1.5,
                                py: 0.5,
                              }}
                            >
                              {globalIndex}
                            </Box>
                            <Typography
                              variant="h6"
                              fontWeight={600}
                              sx={{ fontFamily: 'Poppins', mt: 3, fontSize: '16px', textAlign: 'center' }}
                            >
                              {item.Section}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              <Typography sx={{
                                color,
                                fontWeight: 600,
                                fontFamily: 'Poppins',
                                fontSize: '14px',
                                backgroundColor: `${color}20`,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                textAlign: 'center',
                              }}>
                                {label}
                              </Typography>
                              <Slider
                                value={rating}
                                max={5}
                                min={1}
                                step={1}
                                disabled
                                sx={{
                                  color: color,
                                  height: 10,
                                  width: '60%',
                                  '& .MuiSlider-thumb': {
                                    width: 20,
                                    height: 20,
                                    backgroundColor: '#fff',
                                    border: `3px solid ${color}`,
                                  },
                                  '& .MuiSlider-track': {
                                    backgroundColor: color,
                                    border: 'none',
                                  },
                                  '& .MuiSlider-rail': {
                                    backgroundColor: '#e0e0e0',
                                  },
                                }}
                              />
                            </Box>
                            <Box sx={{ mt: 2, textAlign: 'left', backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '4px', minHeight: '80px' }}>
                              {lines.map((line, idx) => (
                                <Typography
                                  key={idx}
                                  variant="body2"
                                  sx={{ 
                                    fontFamily: 'Poppins', 
                                    fontSize: '14px', 
                                    textAlign: 'justify', 
                                    marginBottom: idx < lines.length - 1 ? '8px' : 0,
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {line}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      ))}

      {/* Soft Skills Evaluation */}
      {softSkillsPages.map((pageSkills, pageIndex) => (
        <Box 
          key={`soft-page-${pageIndex}`} 
          sx={{ 
            mb: 4, 
            pageBreakAfter: pageIndex < softSkillsPages.length - 1 ? 'always' : 'auto', 
            textAlign: 'center',
            pageBreakInside: 'avoid'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#4CAF50',
              fontFamily: 'Poppins',
              fontSize: '18px',
              fontWeight: 700,
              mb: 2,
              borderBottom: '2px solid #4CAF5020',
              pb: 1,
              display: 'inline-block',
            }}
          >
            Soft Skills Evaluation {softSkillsPages.length > 1 ? `(${pageIndex + 1})` : ''}
          </Typography>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 auto', pageBreakInside: 'avoid' }}>
            <tbody>
              {Array.from({ length: Math.ceil(pageSkills.length / 2) }, (_, rowIndex) => {
                const rowSkills = pageSkills.slice(rowIndex * 2, rowIndex * 2 + 2);
                if (rowSkills.length === 0) return null;
                
                return (
                  <tr key={rowIndex} style={{ pageBreakInside: 'avoid' }}>
                    {rowSkills.map((item, colIndex) => {
                      const index = rowIndex * 2 + colIndex;
                      const globalIndex = pageIndex * 4 + index + 1;
                      // Ensure rating is a valid number between 1 and 5
                      const rating = Math.min(Math.max(Number(item.rating) || 3, 1), 5);
                      const { label, color } = ratingLabels[rating] || { label: 'Average', color: '#FF9C2C' }; // Default to 3 if invalid
                      const lines = splitIntoLines(item.evidence || item.comments || '');
                      
                      return (
                        <td
                          key={index}
                          style={{
                            width: '50%',
                            padding: '16px',
                            verticalAlign: 'top',
                            border: excludeForPdf ? 'none' : '1px solid #e0e0e0',
                            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                            backgroundColor: '#fff',
                            minHeight: '220px',
                            pageBreakInside: 'avoid',
                          }}
                        >
                          <Box sx={{ position: 'relative', height: '100%' }}>
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                backgroundColor: '#0B52D4',
                                color: '#fff',
                                borderRadius: '0px 0px 8px 0px',
                                fontSize: '14px',
                                fontWeight: 600,
                                px: 1.5,
                                py: 0.5,
                              }}
                            >
                              {globalIndex}
                            </Box>
                            <Typography
                              variant="h6"
                              fontWeight={600}
                              sx={{ fontFamily: 'Poppins', mt: 3, fontSize: '16px', textAlign: 'center' }}
                            >
                              {item.Section}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              <Typography sx={{
                                color,
                                fontWeight: 600,
                                fontFamily: 'Poppins',
                                fontSize: '14px',
                                backgroundColor: `${color}20`,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                textAlign: 'center',
                              }}>
                                {label}
                              </Typography>
                              <Slider
                                value={rating}
                                max={5}
                                min={1}
                                step={1}
                                disabled
                                sx={{
                                  color: color,
                                  height: 10,
                                  width: '60%',
                                  '& .MuiSlider-thumb': {
                                    width: 20,
                                    height: 20,
                                    backgroundColor: '#fff',
                                    border: `3px solid ${color}`,
                                  },
                                  '& .MuiSlider-track': {
                                    backgroundColor: color,
                                    border: 'none',
                                  },
                                  '& .MuiSlider-rail': {
                                    backgroundColor: '#e0e0e0',
                                  },
                                }}
                              />
                            </Box>
                            <Box sx={{ mt: 2, textAlign: 'left', backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '4px', minHeight: '80px' }}>
                              {lines.map((line, idx) => (
                                <Typography
                                  key={idx}
                                  variant="body2"
                                  sx={{ 
                                    fontFamily: 'Poppins', 
                                    fontSize: '14px', 
                                    textAlign: 'justify', 
                                    marginBottom: idx < lines.length - 1 ? '8px' : 0,
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {line}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      ))}
    </div>
  );
};

export default ReportGenerator;