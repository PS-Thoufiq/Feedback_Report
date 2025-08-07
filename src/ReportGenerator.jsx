/* ReportGenerator.jsx */
import React, { useEffect, useState } from 'react';
import generatePDF from 'react-to-pdf';
import { Grid, Card, Box, Typography } from '@mui/material';
import './ReportGenerator.scss';
import Slider from '@mui/material/Slider';


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
  // Log evaluation object for debugging
  useEffect(() => {
    console.log('ReportGenerator received evaluation:', JSON.stringify(evaluation, null, 2));
  }, [evaluation]);

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

  // Split skills into chunks of 8 for pagination
  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const technicalSkillsPages = chunkArray(technicalSkills, 8);
  const softSkillsPages = chunkArray(softSkills, 8);

  return (
    <div className="report-container" ref={pageInput}>
      {/* Header */}
      <div className="dev-report-header-container">
        <div className="personal">
          <div className="name">{evaluation['Candidate Name'] || 'Unknown'}</div>
          <div className="submit">Submitted on</div>
          <div className="date">{formatDate(evaluation['Interview Date'])}</div>
        </div>
        {!excludeForPdf && (
          <div className="data">
            <button className="download" onClick={handleGeneratePdf}>
              DOWNLOAD
            </button>
          </div>
        )}
      </div>

      {/* User Details */}
      {/* <Box sx={{ mb: 4, mt: 4, pageBreakAfter: 'always' }}>
        <Typography
          variant="h6"
          sx={{
            color: '#0B52D4',
            fontFamily: 'Poppins',
            fontSize: '18px',
            fontWeight: 700,
            mb: 2,
            borderBottom: '2px solid #0B52D420',
            pb: 1,
          }}
        >
          User Details
        </Typography>
        <Box sx={{ pl: 3 }}>
          <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, mb: 1 }}>
            Candidate: {evaluation['Candidate Name'] || 'Unknown'}
          </Typography>
          <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, mb: 1 }}>
            Role: {evaluation.Role || 'N/A'}
          </Typography>
          <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, mb: 1 }}>
            Interview Date: {formatDate(evaluation['Interview Date'])}
          </Typography>
        </Box>
      </Box> */}

      {/* Summary */}
      <div className="summary-wrapper" style={{ pageBreakAfter: 'always' }}>
        <div className="summary-row">
          <Typography className="summary-title">Summary</Typography>
        </div>
        <div className="summary-row">
          <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px', color: '#4F4F4F' }}>
            {evaluation.Summary || 'No summary provided'}
          </Typography>
        </div>
      </div>

      {/* Core Competencies */}
      <Box sx={{ mb: 4, pageBreakAfter: 'always' }}>
        <ReportCard
          title="Core Competencies"
          items={strengths}
          titleColor="#4CAF50"
        />
      </Box>

      {/* Potential Development Areas */}
      <Box sx={{ mb: 4, pageBreakAfter: 'always' }}>
        <ReportCard
          title="Potential Development Areas"
          items={areasForImprovement}
          titleColor="#F44336"
        />
      </Box>

      {/* Technical Skills Evaluation */}
      {technicalSkillsPages.map((pageSkills, pageIndex) => (
        <Box key={`tech-page-${pageIndex}`} sx={{ mb: 4, pageBreakAfter: pageIndex < technicalSkillsPages.length - 1 ? 'always' : 'auto' }}>
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
            }}
          >
            Technical Skills Evaluation {technicalSkillsPages.length > 1 ? `(${pageIndex + 1})` : ''}
          </Typography>
          <Grid container spacing={2}>
            {pageSkills.map((item, index) => {
              const globalIndex = pageIndex * 8 + index + 1;
              const { label, color } = ratingLabels[item.rating] || { label: 'N/A', color: '#9E9E9E' };
              return (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    sx={{
                      padding: 2,
                      paddingTop: 4,
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      minHeight: '220px',
                      height: '100%',
                    }}
                  >
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
                      sx={{ fontFamily: 'Poppins', mt: 3, fontSize: '16px' }}
                    >
                      {item.Section || 'Unnamed Skill'}
                    </Typography>
                    <Typography sx={{ color, fontWeight: 600, mb: 1, fontFamily: 'Poppins', fontSize: '14px' }}>
                      {label}
                    </Typography>
                    <Slider
                      value={item.rating}
                      max={5}
                      min={1}
                      step={1}
                      disabled
                      sx={{
                        color: color,
                        height: 10,
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
                    <Typography variant="body2" mt={2} sx={{ fontFamily: 'Poppins', fontSize: '14px' }}>
                      {item.comments || item.evidence || 'No details'}
                    </Typography>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}

      {/* Soft Skills Evaluation */}
      {softSkillsPages.map((pageSkills, pageIndex) => (
        <Box key={`soft-page-${pageIndex}`} sx={{ mb: 4, pageBreakAfter: pageIndex < softSkillsPages.length - 1 ? 'always' : 'auto' }}>
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
            }}
          >
            Soft Skills Evaluation {softSkillsPages.length > 1 ? `(${pageIndex + 1})` : ''}
          </Typography>
          <Grid container spacing={2}>
            {pageSkills.map((item, index) => {
              const globalIndex = pageIndex * 8 + index + 1;
              const { label, color } = ratingLabels[item.rating] || { label: 'N/A', color: '#9E9E9E' };
              return (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    sx={{
                      padding: 2,
                      paddingTop: 4,
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      minHeight: '220px',
                      height: '100%',
                    }}
                  >
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
                      sx={{ fontFamily: 'Poppins', mt: 3, fontSize: '16px' }}
                    >
                      {item.Section || 'Unnamed Skill'}
                    </Typography>
                    <Typography sx={{ color, fontWeight: 600, mb: 1, fontFamily: 'Poppins', fontSize: '14px' }}>
                      {label}
                    </Typography>
                    <Slider
                      value={item.rating}
                      max={5}
                      min={1}
                      step={1}
                      disabled
                      sx={{
                        color: color,
                        height: 10,
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
                    <Typography variant="body2" mt={2} sx={{ fontFamily: 'Poppins', fontSize: '14px' }}>
                      {item.evidence || item.comments || 'No details'}
                    </Typography>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}

      {/* Overall Comment */}
      {/* <div className="summary-wrapper">
        <div className="summary-row">
          <Typography className="summary-title summary-title2">Overall Comment</Typography>
          <Typography className="summary-comments">
            {evaluation.Comments || 'No comments provided'}
          </Typography>
        </div>
      </div> */}
    </div>
  );
};

// ReportCard component
const ReportCard = ({ title, items, titleColor }) => {
  if (!items || items.length === 0) return null;

  return (
    <Box
      sx={{
        borderRadius: '8px',
        border: '1px solid #E0E0E0',
        background: '#FFF',
        p: 3,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: titleColor,
          fontFamily: 'Poppins',
          fontSize: '18px',
          fontWeight: 700,
          mb: 2,
          borderBottom: `2px solid ${titleColor}20`,
          pb: 1,
        }}
      >
        {title}
      </Typography>
      <Box component="ul" sx={{ pl: 3, m: 0 }}>
        {items.map((item, index) => (
          <li key={index} style={{ marginBottom: '12px' }}>
            <Typography
              sx={{
                color: '#4F4F4F',
                fontFamily: 'Poppins',
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: '24px',
              }}
            >
              {item}
            </Typography>
          </li>
        ))}
      </Box>
    </Box>
  );
};

export default ReportGenerator;