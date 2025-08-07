/* pdfUtils.jsx */
import axios from 'axios';

// Azure OpenAI Configuration (Updated with provided values)
const AZURE_OPENAI_API_KEY = '27bf9a2345b0467cb0017d028c687ff0';
const AZURE_OPENAI_ENDPOINT = 'https://zeero.openai.azure.com';
const AZURE_DEPLOYMENT_NAME = 'zeero-prod';  // Updated deployment name
const AZURE_API_VERSION = '2024-02-15-preview';
const AZURE_OPENAI_URL = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${encodeURIComponent(AZURE_DEPLOYMENT_NAME)}/chat/completions?api-version=${AZURE_API_VERSION}`;

let pdfjsLib;
export const getPdfJs = async () => {
  if (!pdfjsLib) {
    try {
      pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
    } catch (error) {
      console.error('Failed to load pdfjs-dist:', error);
      throw new Error('PDF.js initialization failed');
    }
  }
  return pdfjsLib;
};

export const extractTextFromPDF = async (file) => {
  try {
    if (!file) throw new Error('No file provided for extraction');
    if (!file.type.includes('pdf')) throw new Error('File must be a PDF');
    if (file.size > 10 * 1024 * 1024) throw new Error('File size exceeds 10MB limit');

    console.log(`Processing PDF: ${file.name}, Size: ${file.size} bytes`);
    const pdfjs = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({
      data: arrayBuffer,
      cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
      cMapPacked: true,
      disableFontFace: false,
      useSystemFonts: true,
    }).promise;

    let fullText = '';
    const pageLimit = Math.min(pdf.numPages, 5);
    console.log(`Extracting text from ${pageLimit} pages`);

    for (let i = 1; i <= pageLimit; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false,
        });
        const pageText = textContent.items
          .map(item => item.str || '')
          .filter(text => text.trim() !== '')
          .join(' ');
        fullText += pageText + '\n';
        console.log(`Page ${i} text length: ${pageText.length}`);
      } catch (pageError) {
        console.warn(`Failed to process page ${i}:`, pageError);
        continue;
      }
    }

    const trimmedText = fullText.trim();
    if (!trimmedText) {
      console.warn('No text extracted, possibly image-based or encrypted PDF');
      throw new Error('No text extracted from PDF. It may be image-based or encrypted.');
    }

    console.log('Extracted text sample:', trimmedText.substring(0, 200));
    return trimmedText;
  } catch (error) {
    console.error('Error in extractTextFromPDF:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};

export const evaluateWithOpenAI = async (text, interviewDate) => {
  try {
    if (!text.trim()) throw new Error('No valid text provided for evaluation');

    console.log('Sending to Azure OpenAI, text length:', text.length);
    let response;
    try {
      response = await axios.post(
        AZURE_OPENAI_URL,
        {
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that analyzes interview feedback and returns a structured evaluation in JSON format. Ensure all required fields are present and valid.',
            },
            {
              role: 'user',
              content: `Analyze the following interview feedback and return a structured JSON evaluation:
{
  "Candidate Name": "<Full Name>",
  "Role": "<Job Title>",
  "Interview Date": "${interviewDate || '2025-07-23'}",
  "Summary": "<200+ word summary starting with '{Name}, evaluated on {Month DD, YYYY} is a...'>",
  "Strengths": ["<Point 1>", "<Point 2>"],
  "Areas for Improvement": ["<Point 1>", "<Point 2>"],
  "Technical Skills": [{"Section": "<Skill>", "rating": <1-5>, "comments": "<Evidence>"}],
  "Soft Skills": [{"Section": "<Skill>", "rating": <1-5>, "evidence": "<Evidence>"}]
}
Feedback:
${text}`
            }
          ],
          temperature: 0.5,
          max_tokens: 4000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': AZURE_OPENAI_API_KEY,
          },
        }
      );
    } catch (apiError) {
      console.error('Azure OpenAI API request failed:', apiError.response?.data || apiError.message);
      throw new Error(`Azure OpenAI request failed: ${apiError.response?.data?.error?.message || apiError.message}`);
    }

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      console.error('No content in Azure response:', response.data);
      throw new Error('No content returned from Azure OpenAI');
    }

    let evaluation;
    try {
      evaluation = JSON.parse(content.match(/```(?:json)?\n([\s\S]*?)\n```/)?.[1] || content);
    } catch (error) {
      console.error('Failed to parse Azure response:', content);
      throw new Error('Failed to parse Azure response as JSON');
    }

    // Validate the evaluation response
    const requiredFields = [
      'Candidate Name',
      'Role',
      'Interview Date',
      'Summary',
      'Strengths',
      'Areas for Improvement',
      'Technical Skills',
      'Soft Skills',
    ];
    const missingFields = requiredFields.filter(field => !(field in evaluation));
    if (missingFields.length > 0) {
      console.warn('Missing fields in evaluation:', missingFields);
      evaluation = {
        ...evaluation,
        ...missingFields.reduce((acc, field) => {
          acc[field] = field.includes('Skills') || field.includes('Strengths') || field.includes('Areas for Improvement') ? [] : '';
          return acc;
        }, {}),
      };
    }

    if (!Array.isArray(evaluation['Strengths'])) {
      console.warn('Strengths is not an array, setting to empty array');
      evaluation['Strengths'] = [];
    }
    if (!Array.isArray(evaluation['Areas for Improvement'])) {
      console.warn('Areas for Improvement is not an array, setting to empty array');
      evaluation['Areas for Improvement'] = [];
    }
    if (!Array.isArray(evaluation['Technical Skills'])) {
      console.warn('Technical Skills is not an array, setting to empty array');
      evaluation['Technical Skills'] = [];
    }
    if (!Array.isArray(evaluation['Soft Skills'])) {
      console.warn('Soft Skills is not an array, setting to empty array');
      evaluation['Soft Skills'] = [];
    }

    // Normalize ratings
    evaluation['Technical Skills'] = evaluation['Technical Skills'].map(skill => ({
      ...skill,
      Section: skill.Section || 'Unnamed Skill',
      rating: Math.min(Math.max(Number(skill.rating) || 3, 1), 5),
      comments: skill.comments || skill.evidence || 'No details provided',
    }));
    evaluation['Soft Skills'] = evaluation['Soft Skills'].map(skill => ({
      ...skill,
      Section: skill.Section || 'Unnamed Skill',
      rating: Math.min(Math.max(Number(skill.rating) || 3, 1), 5),
      evidence: skill.evidence || skill.comments || 'No details provided',
    }));

    console.log('Validated evaluation:', JSON.stringify(evaluation, null, 2));
    return evaluation;
  } catch (error) {
    console.error('Error in evaluateWithOpenAI:', error);
    throw new Error(`Evaluation failed: ${error.message}`);
  }
};