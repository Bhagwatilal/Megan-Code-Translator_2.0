import { Language } from '../types';

const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = '5482b73bcfmshae605cff1bd565bp1716e9jsn027d2055ff4a'; // This should be moved to environment variables

const languageIds: Record<string, number> = {
  'python': 71,
  'javascript': 63,
  'typescript': 74,
  'java': 62,
  'cpp': 54,
  'csharp': 51,
  'go': 60,
  'rust': 73
};

interface SubmissionResponse {
  token: string;
}

interface SubmissionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    description: string;
  };
}

export async function executeCode(code: string, language: Language): Promise<string> {
  try {
    const languageId = languageIds[language.id];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language.name}`);
    }

    // Create submission
    const submission = await fetch(`${JUDGE0_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: ''
      })
    });

    if (!submission.ok) {
      throw new Error('Failed to submit code');
    }

    const { token } = await submission.json() as SubmissionResponse;

    // Wait for the result
    let result: SubmissionResult = {
      stdout: null,
      stderr: null,
      compile_output: null,
      message: null,
      status: {
        description: ''
      }
    };
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get submission result');
      }

      result = await response.json() as SubmissionResult;

      if (result.status.description !== 'Processing') {
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Execution timed out');
    }

    // Format the output
    let output = '';

    if (result.compile_output) {
      output += `Compilation Output:\n${result.compile_output}\n\n`;
    }

    if (result.stderr) {
      output += `Error:\n${result.stderr}\n\n`;
    }

    if (result.stdout) {
      output += `Output:\n${result.stdout}`;
    }

    if (result.message) {
      output += `\nSystem Message:\n${result.message}`;
    }

    return output || 'No output';

  } catch (error) {
    console.error('Code execution error:', error);
    return `Error executing code: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}