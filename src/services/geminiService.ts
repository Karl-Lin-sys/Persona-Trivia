import { GoogleGenAI, Type, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateTriviaQuestions(topic: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 5 trivia questions about ${topic}. Ensure facts are up-to-date and accurate.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: 'The trivia question.' },
            answer: { type: Type.STRING, description: 'The correct answer.' },
            explanation: { type: Type.STRING, description: 'A brief explanation of the answer.' },
          },
          required: ['question', 'answer', 'explanation'],
        },
      },
    },
  });

  return JSON.parse(response.text || '[]');
}

export async function generateHostDialogue(
  personality: string,
  context: string,
  question: string,
  answer?: string,
  userAnswer?: string,
  isCorrect?: boolean
) {
  let prompt = `You are a trivia game host with the following personality: ${personality}. `;
  if (context === 'intro') {
    prompt += `Introduce the next question to the player. The question is: "${question}". Keep it brief (1-2 sentences) and stay in character.`;
  } else if (context === 'evaluation') {
    prompt += `The player answered "${userAnswer}". The correct answer is "${answer}". They were ${isCorrect ? 'correct' : 'incorrect'}. React to their answer, reveal the correct answer if they were wrong, and keep score if you want. Keep it brief (2-3 sentences) and stay in character.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
}

export async function generateSpeech(text: string, voiceName: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
}

export function getLiveSession() {
  return ai.live;
}
