const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function createUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
}

function createBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
}

async function callGeminiAPI(prompt) {
    const response = await fetch('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt }),
    });

    const data = await response.json();
    return data.text || 'Sorry, I did not understand that.';
}

sendBtn.addEventListener('click', async () => {
    const prompt = userInput.value.trim();
    if (prompt === '') return;

    createUserMessage(prompt);
    userInput.value = '';

    const botReply = await callGeminiAPI(prompt);
    createBotMessage(botReply);

    chatBox.scrollTop = chatBox.scrollHeight;
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});
