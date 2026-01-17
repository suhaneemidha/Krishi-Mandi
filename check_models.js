require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY;

console.log("🔍 Checking available models for your Key...");

async function check() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await axios.get(url);
        
        console.log("\n✅ SUCCESS! Here are the valid model names you can use:");
        console.log("------------------------------------------------");
        response.data.models.forEach(model => {
            // Only show generation models, not embedding models
            if(model.supportedGenerationMethods.includes("generateContent")) {
                console.log(`👉 ${model.name.replace('models/', '')}`);
            }
        });
        console.log("------------------------------------------------");

    } catch (error) {
        console.error("❌ ERROR:", error.response ? error.response.data : error.message);
    }
}

check();