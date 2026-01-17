// --- DOM ELEMENTS ---
// Make sure the IDs inside getElementById match your index.html exactly
const chatContainer = document.getElementById('chat-container') || document.body; 
const messageInput = document.getElementById('user-input') || document.querySelector('input[type="text"]');
const sendButton = document.getElementById('send-btn') || document.querySelector('button');
const recordButton = document.getElementById('mic-btn'); // The microphone button

// --- VARIABLES ---
let isRecognizing = false;

// --- EVENT LISTENERS ---

// 1. Send on Button Click
if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
}

// 2. Send on Enter Key
if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// 3. Microphone Logic (Speech to Text)
if (recordButton && 'webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN'; // Indian English

    recordButton.addEventListener('click', () => {
        if (!isRecognizing) {
            recognition.start();
            recordButton.classList.add('recording'); // Add CSS class for visual effect
        } else {
            recognition.stop();
            recordButton.classList.remove('recording');
        }
    });

    recognition.onstart = () => {
        isRecognizing = true;
        console.log("Listening...");
    };

    recognition.onend = () => {
        isRecognizing = false;
        recordButton.classList.remove('recording');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (messageInput) messageInput.value = transcript;
        sendMessage(); // Auto-send after speaking
    };
}

// --- CORE FUNCTIONS ---

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // 1. Show User Message
    addMessageToUI("User", text);
    messageInput.value = ''; // Clear input

    // 2. Show Loading Indicator
    const loadingId = addMessageToUI("System", "Thinking...");

    try {
        // 3. Send Request to Server
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });

        const data = await response.json();
        
        // Remove "Thinking..." message
        removeMessage(loadingId);

        if (response.ok) {
            // ✅ SUCCESS: Show AI Response
            addMessageToUI("Krishi Mitra", data.response);
        } else {
            // ❌ SERVER ERROR: Show the real error message from server
            console.error("Server Error:", data.error);
            addMessageToUI("System", "⚠️ " + (data.error || "Something went wrong."));
        }

    } catch (error) {
        // ❌ NETWORK ERROR (Internet issue or Server down)
        removeMessage(loadingId);
        console.error("Fetch Error:", error);
        addMessageToUI("System", "❌ Network Error: Could not connect to server. Please check your internet.");
    }
}

// Helper: Add Message to Chat Window
function addMessageToUI(sender, text) {
    if (!chatContainer) return;

    const msgDiv = document.createElement('div');
    const msgId = 'msg-' + Date.now();
    msgDiv.id = msgId;
    msgDiv.classList.add('message', sender.toLowerCase().replace(" ", "-"));
    
    // Simple styling structure
    msgDiv.innerHTML = `
        <strong>${sender}:</strong> 
        <span>${text}</span>
    `;

    chatContainer.appendChild(msgDiv);
    
    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return msgId;
}

// Helper: Remove Message (for Loading state)
function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}