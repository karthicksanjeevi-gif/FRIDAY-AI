import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

// Read .env manually to get the key
const envPath = path.resolve('.env');
let apiKey = null;
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
    apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;
} catch (e) {
    console.error("Error reading .env:", e.message);
    process.exit(1);
}

const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-pro-latest', 'gemini-1.5-pro-latest'];

async function testChat() {
    for (const model of MODELS) {
        console.log(`\nTesting model: ${model}...`);
        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const session = ai.chats.create({
                model: model,
                config: { systemInstruction: "Test" }
            });

            // geminiService uses { message: { parts: [...] } }
            const response = await session.sendMessageStream({ message: { parts: [{ text: "Hello" }] } });

            console.log("Reading stream...");
            let text = "";
            for await (const chunk of response) {
                text += chunk.text || "";
            }
            console.log(`SUCCESS with ${model}: ${text.substring(0, 20)}...`);
            return; // Exit on first success

        } catch (error) {
            console.log(`FAILED ${model}`);
            if (error.status) console.log(`Status: ${error.status}`);
            else if (error.message) console.log(`Message: ${error.message}`);
        }
    }
    console.log("ALL MODELS FAILED");
}

testChat();
