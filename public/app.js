document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ App Initialized");

    // --- ELEMENTS ---
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');

    // --- FUNCTIONS ---

    function appendMessage(sender, text) {
        if (!chatContainer) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender.toLowerCase()}`;
        msgDiv.style.margin = "10px";
        msgDiv.style.padding = "10px";
        msgDiv.style.borderRadius = "8px";
        msgDiv.style.backgroundColor = sender === 'User' ? '#d1e7dd' : '#f8d7da';
        msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        appendMessage("User", text);
        userInput.value = '';
        
        // Show loading state
        const loadingDiv = document.createElement('div');
        loadingDiv.innerText = "Krishi Mitra is thinking...";
        chatContainer.appendChild(loadingDiv);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            loadingDiv.remove(); // Remove loading text
            appendMessage("Krishi Mitra", data.response);

        } catch (error) {
            loadingDiv.remove();
            console.error(error);
            appendMessage("System", "⚠️ Network Error. Please check connection.");
        }
    }

    // --- EVENT LISTENERS ---

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // --- MIC LOGIC ---
    if (micBtn) {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-IN';
            recognition.continuous = false;

            micBtn.addEventListener('click', () => {
                console.log("🎤 Mic Activated");
                micBtn.style.backgroundColor = "red"; // Visual Cue
                recognition.start();
            });

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                userInput.value = transcript;
                micBtn.style.backgroundColor = ""; // Reset Color
                sendMessage(); // Auto Send
            };

            recognition.onend = () => {
                micBtn.style.backgroundColor = "";
            };

            recognition.onerror = (event) => {
                console.error("Mic Error:", event.error);
                micBtn.style.backgroundColor = "";
            };
        } else {
            console.warn("Speech recognition not supported in this browser.");
            micBtn.style.display = 'none'; // Hide if not supported
        }
    } else {
        console.error("❌ Mic Button (id='mic-btn') not found in HTML!");
    }
});