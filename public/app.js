// public/app.js - SAGE GREEN + MODAL + LIST VERSION

const TRANSLATIONS = {
    en: {
        listening: "Listening...", processing: "Thinking...",
        start: "Tap the mic to start", try_saying: "TRY ASKING:",
        farmer: "Farmer", buyer: "Buyer",
        suggestions: ["Onion Price?", "Truck to Pune?", "Crop Disease?", "Weather?"],
        confirm_title: "Did you say?", btn_retry: "Retry", btn_yes: "Yes"
    },
    hi: {
        listening: "सुन रहा हूँ...", processing: "सोच रहा हूँ...",
        start: "बोलने के लिए माइक दबाएं", try_saying: "यह पूछकर देखें:",
        farmer: "किसान", buyer: "खरीदार",
        suggestions: ["मुंबई में प्याज का भाव क्या है?", "नाशिक भेजने का ट्रक भाड़ा?", "टमाटर के पत्ते पीले हो रहे हैं", "क्या कल बारिश होगी?"],
        confirm_title: "क्या आपने कहा?", btn_retry: "फिर से बोलें", btn_yes: "हाँ"
    },
    mr: {
        listening: "ऐकत आहे...", processing: "विचार करत आहे...",
        start: "बोलण्यासाठी माइक दाबा", try_saying: "हे विचारून पहा:",
        farmer: "शेतकरी", buyer: "व्यापारी",
        suggestions: ["मुंबईत कांद्याचा भाव काय आहे?", "ट्रक पाठवण्याचा खर्च किती?", "टमाट्याचे पाने पिवळी पडत आहेत", "उद्या पाऊस पडेल का?"],
        confirm_title: "तुम्ही म्हणालात का?", btn_retry: "पुन्हा बोला", btn_yes: "हो"
    },
    bn: {
        listening: "শুনছি...", processing: "ভাবছি...",
        start: "কথা বলতে মাইক টিপুন", try_saying: "এটি জিজ্ঞাসা করুন:",
        farmer: "কৃষক", buyer: "ক্রেতা",
        suggestions: ["কলকাতায় পেঁয়াজের দাম কত?", "ট্রাক ভাড়া কত লাগবে?", "ফসলের রোগ?", "আগামীকাল কি বৃষ্টি হবে?"],
        confirm_title: "আপনি কি বলেছেন?", btn_retry: "আবার বলুন", btn_yes: "হ্যাঁ"
    },
    pa: {
        listening: "ਸੁਣ ਰਿਹਾ ਹਾਂ...", processing: "ਸੋਚ ਰਿਹਾ ਹਾਂ...",
        start: "ਬੋਲਣ ਲਈ ਮਾਈਕ ਦਬਾਓ", try_saying: "ਇਹ ਪੁੱਛੋ:",
        farmer: "ਕਿਸਾਨ", buyer: "ਖਰੀਦਦਾਰ",
        suggestions: ["ਪਿਆਜ਼ ਦਾ ਰੇਟ ਕੀ ਹੈ?", "ਟਰੱਕ ਦਾ ਖਰਚਾ ਕਿੰਨਾ?", "ਫਸਲ ਰੋਗ?", "ਕੀ ਕੱਲ ਮੀਂਹ ਪਵੇਗਾ?"],
        confirm_title: "ਕੀ ਤੁਸੀਂ ਕਿਹਾ?", btn_retry: "ਫੇਰ ਬੋਲੋ", btn_yes: "ਹਾਂ"
    }
};

let currentLang = 'en'; 
let currentUserType = 'farmer';
let isListening = false;
let pendingTranscript = "";
let rotationInterval;
let suggestionIndex = 0;

const LANG_CODES = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN', pa: 'pa-IN' };

// Elements
const micBtn = document.getElementById('micBtn');
const statusText = document.getElementById('statusText');
const outputText = document.getElementById('outputText');
const resultArea = document.getElementById('resultArea');
const suggestionText = document.getElementById('suggestionText');
const farmerScreen = document.getElementById('farmerScreen');
const buyerScreen = document.getElementById('buyerScreen');

// Modal Elements
const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmTranscript = document.getElementById('confirmTranscript');
const btnRetry = document.getElementById('btnRetry');
const btnYes = document.getElementById('btnYes');

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;

window.onload = () => { changeLanguage(); startRotation(); };

// --- 1. TOGGLE LOGIC (SCREEN SWITCH) ---
window.setMode = function(mode) {
    currentUserType = mode;
    document.getElementById('btnFarmer').classList.toggle('active', mode === 'farmer');
    document.getElementById('btnBuyer').classList.toggle('active', mode === 'buyer');

    // Show/Hide Screens
    if (mode === 'buyer') {
        farmerScreen.classList.add('hidden');
        buyerScreen.classList.remove('hidden');
    } else {
        buyerScreen.classList.add('hidden');
        farmerScreen.classList.remove('hidden');
    }
};

// --- 2. VOICE & CONFIRMATION LOGIC ---
micBtn.onclick = () => {
    if (isListening) return;
    new Audio("data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzb21tcDQyAP/7UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAInfoAAAAaAAAAAgAAQAIAKwAAAAAAA//7UAAALAAAABAAAAAAABHAAAABAAAAAAAABHAAAA//7UAAAAAAAABAAAAAAAABAAAAABAAAAAAAABAAAA//7UAAAAAAAABAAAAAAAABAAAAABAAAAAAAABAAAA//7UAAAAAAAABAAAAAAAABAAAAABAAAAAAAABAAAA//7UAAAAAAAABAAAAAAAABAAAAABAAAAAAAABAAAA//7UAAAAAAAABAAAAAAAABAAAAABAAAAAAAABAAAA//7UAAAAAAAABAAAAAAAABAAAAABAAAAAAAABAAAA").play().catch(e=>{});
    
    recognition.lang = LANG_CODES[currentLang];
    recognition.start();
    micBtn.classList.add('listening');
    statusText.innerText = TRANSLATIONS[currentLang].listening;
    isListening = true;
};

recognition.onresult = (event) => {
    micBtn.classList.remove('listening');
    isListening = false;
    pendingTranscript = event.results[0][0].transcript;
    
    // OPEN MODAL instead of sending immediately
    showConfirmation(pendingTranscript);
};

function showConfirmation(text) {
    confirmTranscript.innerText = `"${text}"`;
    confirmModal.classList.remove('hidden');
}

window.retryVoice = function() {
    confirmModal.classList.add('hidden');
    micBtn.click(); // Restart mic
};

window.confirmVoice = function() {
    confirmModal.classList.add('hidden');
    
    // Show in Transcript UI
    resultArea.classList.remove('hidden');
    outputText.innerText = pendingTranscript;
    statusText.innerText = TRANSLATIONS[currentLang].processing;
    
    // NOW send to server
    processVoiceInput(pendingTranscript);
};

// --- 3. SERVER LOGIC ---
async function processVoiceInput(text) {
    try {
        const response = await fetch('/api/process-voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, userType: currentUserType, lang: currentLang })
        });

        const data = await response.json();

        if (data.voiceResponse) {
            statusText.innerText = data.voiceResponse;
            speakResponse(data.voiceResponse);
        }

    } catch (error) {
        console.error(error);
        statusText.innerText = "Connection Failed.";
    }
}

// --- 4. LANGUAGE HELPER ---
window.changeLanguage = function() {
    currentLang = document.getElementById('languageSelect').value;
    const t = TRANSLATIONS[currentLang];
    
    document.getElementById('txtFarmer').innerText = t.farmer;
    document.getElementById('txtBuyer').innerText = t.buyer;
    document.querySelector('.suggestion-label').innerText = t.try_saying;
    statusText.innerText = t.start;
    
    // Update Modal Text
    confirmTitle.innerText = t.confirm_title;
    btnRetry.innerText = t.btn_retry;
    btnYes.innerText = t.btn_yes;
    
    suggestionIndex = -1; 
    startRotation(); 
};

function speakResponse(text) {
    window.speechSynthesis.cancel();
    let ttsLang = currentLang === 'pa' ? 'pa' : currentLang;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=tw-ob&q=${encodeURIComponent(text)}`;
    new Audio(url).play();
}

function startRotation() {
    if (rotationInterval) clearInterval(rotationInterval);
    updateSuggestion();
    rotationInterval = setInterval(() => {
        suggestionText.classList.add('fade-out');
        setTimeout(() => {
            updateSuggestion();
            suggestionText.classList.remove('fade-out');
        }, 500);
    }, 4000);
}

function updateSuggestion() {
    const list = TRANSLATIONS[currentLang].suggestions;
    suggestionIndex = (suggestionIndex + 1) % list.length;
    suggestionText.innerText = `"${list[suggestionIndex]}"`;
}