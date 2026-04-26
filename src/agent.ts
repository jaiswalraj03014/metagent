import 'dotenv/config';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { getTableContext } from './omClient';

// The PII Guardrail Dictionary
const SENSITIVE_KEYWORDS = ['email', 'ssn', 'password', 'phone', 'credit', 'card', 'address'];

export async function askMetagent(userQuestion: string, tableFQN: string) {
    console.log(`\n🔍 Fetching verified context for: ${tableFQN}...`);
    
    // 1. Get the truth from OpenMetadata
    const tableContext = await getTableContext(tableFQN);
    
    if (!tableContext) {
        return "I couldn't find that table in OpenMetadata. I refuse to guess!";
    }

    // ==========================================
    // FEATURE 1: THE PII SECURITY GUARDRAIL
    // ==========================================
    const questionLower = userQuestion.toLowerCase();
    const isAskingAboutPII = SENSITIVE_KEYWORDS.some(keyword => questionLower.includes(keyword));
    
    if (isAskingAboutPII) {
        console.log(`🚨 [SECURITY TRIGGER] PII requested. Checking schema permissions...`);
        // Simulate a strict enterprise governance policy:
        return `❌ **GOVERNANCE BLOCK:** You are querying for sensitive PII (Personally Identifiable Information). My OpenMetadata security policies prohibit me from writing queries or exposing data types for this column without explicit Admin approval.`;
    }

    console.log(`✅ Security check passed. Analyzing metadata...`);

    // ==========================================
    // FEATURE 2: THE SELF-HEALING CATALOG
    // ==========================================
    
    // Check if any columns are missing descriptions
    const blankColumns = tableContext.columns.filter((col: any) => 
        col.description === "No description provided." || col.description === "No Description" || !col.description
    );

    if (blankColumns.length > 0) {
        console.log(`⚠️  [AUTO-DOC] Detected ${blankColumns.length} missing column descriptions in OpenMetadata.`);
        console.log(`🤖 Drafting suggested documentation...\n`);
    }

    // 2. Build the strict prompt with Auto-Doc instructions
    const systemPrompt = `
    You are Metagent, an elite Data Governance AI.
    
    CONTEXT:
    Table Name: ${tableContext.tableName}
    Columns: ${JSON.stringify(tableContext.columns, null, 2)}

    TASK:
    1. Answer the user's question using ONLY the provided schema. 
    2. If any columns in this table have missing or "No Description" fields, write a highly professional, 1-sentence data dictionary definition for them based on their name and data type. Format these suggestions under a "💡 Suggested Documentation" header.
    
    RULES:
    If the answer cannot be determined from the provided columns, state clearly that you do not know. 
    Do not hallucinate columns or data.
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