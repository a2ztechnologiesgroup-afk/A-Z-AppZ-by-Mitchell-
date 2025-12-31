
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const APPROVED_APIS = `
APPROVED FREE & KEYLESS APIs (USE THESE SPECIFICALLY):
1.  **Weather**: \`https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true\`
2.  **Crypto/Finance**: \`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd\`
3.  **User Data**: \`https://randomuser.me/api/?results=10\`
4.  **IP/Location**: \`https://ipapi.co/json/\`
5.  **Jokes**: \`https://v2.jokeapi.dev/joke/Any\`
6.  **Universities**: \`http://universities.hipolabs.com/search?country=United+States\`
7.  **Country Data**: \`https://restcountries.com/v3.1/all\`
8.  **Space/ISS**: \`http://api.open-notify.org/iss-now.json\`
9.  **News**: \`https://jsonplaceholder.typicode.com/posts\`
`;

const SYSTEM_INSTRUCTION = `
You are the "Autonomous Repair Engine" for A²Z AppZ (built by Mitchell).
Your primary role is to build and MAINTAIN production-grade applications.

AUTONOMOUS PROTOCOLS:
1.  **SELF-HEALING**: If the user (or the system) provides a runtime error, you must analyze the current code and provide a fixed version IMMEDIATELY.
2.  **ROBUSTNESS**: Avoid fragile code. Use try-catch blocks for API calls. Ensure UI doesn't crash if an API is unavailable.
3.  **REAL NETWORKING**: Use real fetch() calls to APPROVED APIs.
4.  **SINGLE FILE**: Output a complete, self-contained index.html string.
5.  **NATIVE FEEL**: Include viewport settings and CSS to prevent accidental text selection for a professional app feel.

${APPROVED_APIS}
`;

export const generateAppCode = async (
  prompt: string,
  history: Message[],
  imageBase64?: string,
  mimeType?: string,
  currentCode?: string
): Promise<string> => {
  try {
    const modelId = imageBase64 ? 'gemini-3-pro-image-preview' : 'gemini-3-pro-preview';
    
    const historyContext = history
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role === 'user' ? 'User' : 'Architect'}: ${msg.content}`)
      .join('\n');

    let fullPrompt = `${SYSTEM_INSTRUCTION}\n\nSTORY SO FAR:\n${historyContext}\n\n`;
    
    if (currentCode) {
        fullPrompt += `CURRENT SOURCE CODE (TO BE FIXED/UPDATED):\n\`\`\`html\n${currentCode}\n\`\`\`\n\n`;
    }

    fullPrompt += `TASK: ${prompt}`;

    const parts: any[] = [{ text: fullPrompt }];

    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      });
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        maxOutputTokens: 8192,
        temperature: 0.2, // Lower temperature for more deterministic/stable fixes
        thinkingConfig: { thinkingBudget: 4096 }
      }
    });

    const text = response.text || '';
    const match = text.match(/```(?:html)?\s*([\s\S]*?)```/);
    if (match && match[1]) return match[1].trim();
    
    const htmlIndex = text.indexOf('<!DOCTYPE html>');
    if (htmlIndex !== -1) return text.substring(htmlIndex).trim();

    return text.trim();
  } catch (error) {
    console.error("A²Z Engine Critical Error:", error);
    throw error;
  }
};
