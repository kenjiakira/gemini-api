const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const suggestionsBox = document.getElementById('suggestions');
const welcomeMessage = document.getElementById('welcome-message');

let suggestionSelected = false;
let messageSent = false;

let suggestions = [];

async function loadSuggestions() {
    try {
        const response = await fetch('../config.json');
        const data = await response.json();
        suggestions = data.suggestions;
        renderSuggestions();
    } catch (error) {
        console.error('Error loading suggestions:', error);
    }
}

function renderSuggestions() {
    if (!suggestionsBox) return;

    suggestionsBox.innerHTML = ''; 

    suggestions.forEach(suggestion => {
        const button = document.createElement('button');
        button.classList.add('suggestion-btn');
        
        const icon = document.createElement('i');
        icon.classList.add(...suggestion.icon.split(' '));  

        button.appendChild(icon);
        button.appendChild(document.createTextNode(suggestion.label));

        button.addEventListener('click', () => {
            const randomMessage = getRandomMessage(suggestion.messages);
            addMessageToChat(randomMessage, 'user');

            suggestionSelected = true;
            messageSent = true;

            if (suggestionsBox) {
                suggestionsBox.style.display = 'none';
            }

            sendMessageToAI(randomMessage);
        });

        suggestionsBox.appendChild(button);
    });
}

function getRandomMessage(messages) {
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
}

function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');
    
    if (sender === 'user') {
        messageDiv.classList.add('user-message');
    } else if (sender === 'ai') {
        messageDiv.classList.add('ai-message');
        
        const avatar = document.createElement('img');
        avatar.src = './public/logo.png';
        avatar.alt = 'AI Avatar';

        messageDiv.appendChild(avatar);
    }

    message = message.replace(/\n/g, '%BR%');
    
    typeMessage(messageDiv, message); 

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (welcomeMessage && chatBox.childElementCount > 1) {
        welcomeMessage.style.display = 'none';
    }
}

function typeMessage(messageDiv, message) {
    let index = 0;
    const typingSpeed = 5;
    
    messageDiv.innerHTML = '';

    const interval = setInterval(() => {
        const currentChar = message[index];

        if (currentChar === '%') {
            messageDiv.innerHTML += '<br>';
            index += 4;
        } else {
            messageDiv.innerHTML += currentChar;
            index++;
        }

        if (index === message.length) {
            clearInterval(interval);
        }
    }, typingSpeed);
}

sendBtn.addEventListener('click', async () => {
    const prompt = userInput.value;
    if (prompt.trim() === '') return;

    addMessageToChat(prompt, 'user');
    userInput.value = '';

    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('typing-indicator');
    chatBox.appendChild(typingIndicator);

    chatBox.scrollTop = chatBox.scrollHeight;

    if (suggestionsBox) {
        suggestionsBox.style.display = 'none';
    }

    messageSent = true;

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        const aiMessage = data.text;

        chatBox.removeChild(typingIndicator);
        addMessageToChat(aiMessage, 'ai');
    } catch (error) {
        console.error('Error generating AI response:', error);
    }
});

async function sendMessageToAI(message) {
    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: message })
        });
        const data = await response.json();
        addMessageToChat(data.text, 'ai');
    } catch (error) {
        console.error('Error generating AI response:', error);
    }
}

userInput.addEventListener('focus', () => {
    if (!suggestionSelected && !messageSent && userInput.value.trim() === '') {
        if (suggestionsBox) {
            suggestionsBox.style.display = 'flex';
        }
    }
});

userInput.addEventListener('input', () => {
    if (userInput.value.trim() !== '') {
        if (suggestionsBox) {
            suggestionsBox.style.display = 'none';
        }
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

userInput.addEventListener('focus', () => {
    if (suggestionSelected || messageSent) {
        suggestionSelected = false;
        messageSent = false;
        if (suggestionsBox) {
            suggestionsBox.style.display = 'none';
        }
    }
});

loadSuggestions();
