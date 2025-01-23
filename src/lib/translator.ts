import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'sk-kUpdgZep-F056GY1R1QRIuNrxGnTY5JZEeAtV75yotT3BlbkFJh4eE_krHYzyXfvxmsTapwbudUIjJCndDGhMMV7EXoA', // This will be replaced with your backend implementation
  dangerouslyAllowBrowser: true
});

export async function translateCode(
  sourceCode: string,
  fromLanguage: string,
  toLanguage: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a code translator. Translate the provided code from ${fromLanguage} to ${toLanguage}. Only respond with the translated code, no explanations or additional text.`
        },
        {
          role: "user",
          content: sourceCode
        }
      ],
      temperature: 0.3,
      max_tokens: 2048
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Failed to translate code');
  }
}