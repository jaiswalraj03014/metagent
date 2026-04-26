import 'dotenv/config';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { getTableContext } from './omClient';

export async function askMetagent(userQuestion: string, tableFQN: string) {
    console.log(`🔍 Fetching verified context for: ${tableFQN}...`);
    
    // 1. Get the truth from OpenMetadata
    const tableContext = await getTableContext(tableFQN);
    
    if (!tableContext) {
        return "I couldn't find that table in OpenMetadata. I refuse to guess!";
    }

    // 2. Build the strict prompt
    const systemPrompt = `
    You are Metagent, an elite Data Context AI. 
    Your job is to answer the user's question using ONLY the provided database schema context. 
    If the answer cannot be determined from the provided columns, state clearly that you do not know. 
    Do not hallucinate columns or data.

    CONTEXT:
    Table Name: ${tableContext.tableName}
    Columns: ${JSON.stringify(tableContext.columns, null, 2)}
    `;

    // 3. Route to the chosen LLM
    const provider = process.env.ACTIVE_LLM?.toLowerCase() || 'groq';
    console.log(`🧠 Context secured. Routing to -> [${provider.toUpperCase()}]`);

    try {
        if (provider === 'openai') {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userQuestion }
                ],
                temperature: 0.1,
            });
            return response.choices[0].message.content;
        } 
        
        if (provider === 'groq') {
            const groq = new OpenAI({ 
                apiKey: process.env.GROQ_API_KEY,
                baseURL: "https://api.groq.com/openai/v1" 
            });
            const response = await groq.chat.completions.create({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userQuestion }
                ],
                temperature: 0.1,
            });
            return response.choices[0].message.content;
        }

        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const combinedPrompt = `${systemPrompt}\n\nUser Question: ${userQuestion}`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: combinedPrompt,
                config: { temperature: 0.1 }
            });
            return response.text;
        }

        return `Error: Unknown provider "${provider}" set in ACTIVE_LLM.`;

    } catch (error: any) {
        return `🚨 AI API Error: ${error.message}`;
    }
}