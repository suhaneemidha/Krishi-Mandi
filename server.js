require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
// Increase data limit for audio/images
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use(cors());

// --- 1. VERIFY KEY ---
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing in .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 2. SETUP GEMINI MODEL ---
// Switched to 'gemini-2.0-flash' (Valid per your list, better stability)
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    // TURN OFF SAFETY FILTERS (Critical for "Crop Doctor" features)
    safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
});

// --- KNOWLEDGE BASE ---
const MARKET_RATES = {
    "onion": 2400, "pyaz": 2400, "kanda": 2400,
    "tomato": 1800, "tamatar": 1800,
    "potato": 1200, "aloo": 1200,
    "wheat": 2200, "gehu": 2200,
    "rice": 3000, "chawal": 3000
};

// ==================================================================
// ROUTE 1: THE MAIN VOICE BRAIN
// ==================================================================
app.post('/api/process-voice', async (req, res) => {
    try {
        const { text, userType, lang } = req.body;
        console.log(`🎤 Voice Input (${lang}): "${text}"`);

        const prompt = `
            Act as "Krishi Sahayak" (Indian Farmer AI).
            User Input: "${text}"
            Target Language: "${lang}" (You MUST reply in this language).
            
            DATA:
            - Market Prices (Rs/Quintal): ${JSON.stringify(MARKET_RATES)}
            
            LOGIC:
            1. SELL/PRICE: Identify crop. Convert Price to KG (Price/100).
            2. TRANSPORT: If asking about truck/distance, estimate cost (e.g., Distance * 15 Rs).
            3. DOCTOR: If input mentions disease/yellow leaves/insects, diagnose it and suggest remedy.
            4. WEATHER: If asking about rain/forecast, give a generic safe prediction.
            5. GENERAL: Answer helpful questions for farmers.

            OUTPUT:
            Return ONLY a JSON string. NO Markdown.
            {
                "voiceResponse": "Your reply here in ${lang}",
                "intent": "SELL"
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();
        
        // Clean JSON
        let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '');
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
            res.json(JSON.parse(cleanText));
        } else {
            console.error("AI returned invalid JSON");
            res.json({
                voiceResponse: "Maaf karein, network issue hai. Phir se boliye.",
                intent: "ERROR"
            });
        }

    } catch (error) {
        console.error("❌ MAIN PROCESS ERROR:", error);
        
        // Check for Quota Error specifically
        if (error.message.includes('429') || error.message.includes('Quota')) {
            res.status(503).json({ 
                voiceResponse: "Server busy (Limit Reached). Please wait 30 seconds." 
            });
        } else {
            res.status(500).json({ 
                voiceResponse: "System Error: " + error.message 
            });
        }
    }
});

// ==================================================================
// ROUTE 2: UNIVERSAL TRANSLATOR
// ==================================================================
app.post('/api/translate', async (req, res) => {
    try {
        const { text, targetLang } = req.body;
        
        const prompt = `
            Translate the following text into ${targetLang} (using native script).
            Return ONLY the translated string. No quotes, no explanations.
            Text: "${text}"
        `;
        
        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();
        
        res.json({ translatedText });
        
    } catch (error) {
        console.error("❌ TRANSLATION ERROR:", error);
        res.status(500).json({ error: "Translation Failed" });
    }
});

// ==================================================================
// START SERVER
// ==================================================================
// USE THE PORT RENDER GIVES US, OR 3000 IF LOCAL
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Krishi Server running on Port ${PORT}`));