/* pdfUtils.jsx */
import axios from 'axios';

// Azure OpenAI Configuration
const AZURE_OPENAI_API_KEY = '27bf9a2345b0467cb0017d028c687ff0';
const AZURE_OPENAI_ENDPOINT = 'https://zeero.openai.azure.com';
const AZURE_DEPLOYMENT_NAME = 'zeero-prod';
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
              content: 'You are an AI assistant that analyzes interview feedback and returns a structured evaluation in JSON format. Extract and evaluate exactly 10 Technical Skills, 4 Soft Skills, 6 Strengths, and 6 Areas for Improvement from the feedback. If the feedback contains fewer items, infer additional relevant content based on context (e.g., technical skills like "Python" or soft skills like "Communication") with reasonable ratings (1-5) and 3-line evidence for skills, or 2-line descriptions for Strengths and Areas. Only use placeholders (e.g., "Unnamed Skill" or "Inferred Point") if no valid inference is possible after exhausting context. Ensure all required fields are present and valid.',
            },
            {
              role: 'user',
              content: `Analyze the following interview feedback and return a structured JSON evaluation:
{
  "Candidate Name": "<Full Name>",
  "Role": "<Job Title>",
  "Interview Date": "${interviewDate || '2025-07-23'}",
  "Summary": "[200 to 300 words]<Start with '{Name}, evaluated on {Month DD, YYYY} is a...' where {Name} is the candidate's full name and {Month DD, YYYY} is the interview date from the feedback. Follow with a minimum of 200 words summary of performance. Use the exact date from the feedback, not the current date. Example: 'John Doe, evaluated on July 23, 2025 is a...'>",
  "Strengths": [//6 to 10 points with {Strength Area:Description} format
    "<Point Title(Strength name) : Specific strength with evidence from feedback>"
  ],
  "Areas for Improvement": [//6 to 10 points with {Area Name:Description} format
    "<Point title(Area name to improve): Specific area needing improvement with evidence>"
  ],
  "Technical Skills": [//6 to 10 skills with {Section:Skill Name, rating:Skill rating from 1-5 based on demonstrated ability in feedback, comments:25-35 words on how this skill was demonstrated in the interview} format
    {
      "Section": "<Skill Name>",
      "rating": "Skill rating from 1-5 based on demonstrated ability in feedback",
      "comments": "25-35 words on how each skill was demonstrated in the interview",
    }
  ],
  "Soft Skills": [//6 to 10 skills with {Section:Skill Name, rating:Skill rating from 1-5 based on demonstrated ability in feedback, evidence:25-35 words on how this skill was demonstrated in the interview} format
    {
      "Section": "<Skill Name>",
      "rating": "Skill rating from 1-5 based on demonstrated ability in feedback",
      "evidence": "<25-35 words on how each skill was demonstrated in the interview>"
    }]
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

    // Validate and ensure minimum item counts with inferred data
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

    if (!Array.isArray(evaluation['Technical Skills'])) evaluation['Technical Skills'] = [];
    while (evaluation['Technical Skills'].length < 10) {
      const inferredSkill = inferSkillFromContext(evaluation, 'Technical');
      evaluation['Technical Skills'].push(inferredSkill);
    }

    if (!Array.isArray(evaluation['Soft Skills'])) evaluation['Soft Skills'] = [];
    while (evaluation['Soft Skills'].length < 4) {
      const inferredSkill = inferSkillFromContext(evaluation, 'Soft');
      evaluation['Soft Skills'].push(inferredSkill);
    }

    if (!Array.isArray(evaluation.Strengths)) evaluation.Strengths = [];
    while (evaluation.Strengths.length < 6) {
      evaluation.Strengths.push(`Inferred Strength ${evaluation.Strengths.length + 1}: Inferred based on role context.\nAdditional inferred detail.`);
    }

    if (!Array.isArray(evaluation['Areas for Improvement'])) evaluation['Areas for Improvement'] = [];
    while (evaluation['Areas for Improvement'].length < 6) {
      evaluation['Areas for Improvement'].push(`Inferred Area ${evaluation['Areas for Improvement'].length + 1}: Inferred based on role context.\nAdditional inferred detail.`);
    }

    // Normalize ratings and ensure valid content
    evaluation['Technical Skills'] = evaluation['Technical Skills'].map((skill, index) => ({
      ...skill,
      Section: skill.Section || `Inferred Skill ${index + 1}`,
      rating: Math.min(Math.max(Number(skill.rating) || 3, 1), 5),
      comments: skill.comments || skill.evidence || 'Inferred from context: Limited details available',
    }));
    evaluation['Soft Skills'] = evaluation['Soft Skills'].map((skill, index) => ({
      ...skill,
      Section: skill.Section || `Inferred Skill ${index + 1}`,
      rating: Math.min(Math.max(Number(skill.rating) || 3, 1), 5),
      evidence: skill.evidence || skill.comments || 'Inferred from context: Limited details available',
    }));

    console.log('Validated evaluation:', JSON.stringify(evaluation, null, 2));
    return evaluation;
  } catch (error) {
    console.error('Error in evaluateWithOpenAI:', error);
    throw new Error(`Evaluation failed: ${error.message}`);
  }
};

// Helper function to infer skills from context
const inferSkillFromContext = (evaluation, skillType) => {
  const commonSkills = {
    Technical: ['Python', 'Java', 'JavaScript', 'C++', 'SQL', 'HTML', 'CSS', 'React', 'Node.js', 'Docker'],
    Soft: ['Communication', 'Teamwork', 'Problem Solving', 'Adaptability'],
  };
  const usedSkills = (evaluation[`${skillType} Skills`] || []).map(s => s.Section.toLowerCase());
  const availableSkills = commonSkills[skillType].filter(s => !usedSkills.includes(s.toLowerCase()));
  const skill = availableSkills.length > 0 ? availableSkills[0] : `Inferred ${skillType} Skill ${usedSkills.length + 1}`;
  return {
    Section: skill,
    rating: 3,
    [skillType === 'Technical' ? 'comments' : 'evidence']: `Inferred from context: ${skill} assumed based on role ${evaluation.Role || 'unknown'}.\nThis is an inferred skill with limited evidence.\nAdditional context not available.`,
  };
};