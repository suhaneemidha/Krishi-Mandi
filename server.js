require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use(cors());

// --- CONFIGURATION ---
const API_KEY = process.env.GEMINI_API_KEY;

// Check for API Key on startup
if (!API_KEY) {
    console.error("❌ FATAL ERROR: GEMINI_API_KEY is missing in your .env or Hosting Settings!");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ UPDATED: Using the model you confirmed is valid
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash", 
    safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
});

// --- KNOWLEDGE BASE (Backup to save API Limit) ---
const MARKET_RATES = {
    "onion": "2400 INR/Quintal",
    "potato": "1800 INR/Quintal",
    "tomato": "3200 INR/Quintal",
    "wheat": "2100 INR/Quintal",
    "rice": "2800 INR/Quintal",
    "pyaz": "2400 INR/Quintal",
    "aloo": "1800 INR/Quintal"
};

// --- API ROUTE ---
app.post('/api/chat', async (req, res) => {
    try {
        if (!API_KEY) {
            return res.status(500).json({ error: "API Key missing on server." });
        }

        const { message } = req.body;
        console.log("📩 Received Query:", message);

        // 1. Check Local Prices first (Instant & Free)
        const lowerMsg = message.toLowerCase();
        for (const [crop, price] of Object.entries(MARKET_RATES)) {
            if (lowerMsg.includes(crop)) {
                return res.json({ response: `The current mandi price for ${crop} is ${price}.` });
            }
        }

        // 2. Ask Gemini AI
        const prompt = `You are "Krishi Mitra", an Indian agricultural expert. 
        Answer this farmer's question simply in English: "${message}"
        Keep it short (under 50 words).`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });

    } catch (error) {
        console.error("❌ API Error:", error.message);
        
        // Return a clean error message to the frontend
        res.status(500).json({ 
            error: "Server Busy or Limit Reached. Try again in 1 minute." 
        });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});