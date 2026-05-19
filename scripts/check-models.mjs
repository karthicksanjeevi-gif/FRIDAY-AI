import fs from 'fs';
import path from 'path';

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

if (!apiKey) {
    console.error("Could not find GEMINI_API_KEY");
    process.exit(1);
}

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            const names = data.models
                .map(m => m.name.replace('models/', ''))
                .filter(n => n.includes('flash') || n.includes('pro'));
            console.log("JSON_START");
            console.log(JSON.stringify(names, null, 2));
            console.log("JSON_END");
        } else {
            console.log("ERROR", JSON.stringify(data));
        }
    } catch (e) {
        console.error("FETCH_ERROR", e);
    }
}

listModels();
