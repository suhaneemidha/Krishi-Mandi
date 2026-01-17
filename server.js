require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Setup Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use(cors());

// --- 1. API CONFIGURATION ---
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ FATAL ERROR: GEMINI_API_KEY is missing!");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ USING THE MODEL FROM YOUR APPROVED LIST
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash", 
    safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
});

// --- 2. FAST LOCAL DATA (Guarantees these answers work instantly) ---
const MARKET_PRICES = {
    "onion": "₹25/kg (Nashik)",
    "potato": "₹18/kg (Agra)",
    "tomato": "₹30/kg (Bangalore)",
    "pyaz": "₹25/kg",
    "aloo": "₹18/kg",
    "wheat": "₹2200/Quintal",
    "rice": "₹2900/Quintal"
};

// --- 3. CHAT ROUTE ---
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        console.log("📩 User message:", message);

        // CHECK LOCAL DATA FIRST (Saves API Limit)
        const lowerMsg = message.toLowerCase();
        for (const [key, price] of Object.entries(MARKET_PRICES)) {
            if (lowerMsg.includes(key)) {
                console.log("✅ Served from Local Data");
                return res.json({ response: `The current market price for ${key} is ${price}.` });
            }
        }

        // ASK GEMINI 2.0 FLASH
        const prompt = `You are Krishi Mitra, a helpful Indian agriculture assistant. 
        Answer this farmer's question in simple English (under 40 words): "${message}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });

    } catch (error) {
        console.error("❌ API Error:", error.message);
        // Fallback if API fails
        res.json({ response: "I am having trouble connecting to the satellite. Please ask 'Price of Onion' or 'Tomato' for offline rates." });
    }
});

app.listen(port, () => {
    console.log(`✅ Server started on port ${port}`);
});