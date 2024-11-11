const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 9999;

const API_KEYS = [
    'AIzaSyDfyni3DAsiDasXwzpPCuvnYFNsC5H2kTw',
    'AIzaSyDSFQTodWCEVU6GI8LBxczmviEPdWlnoao',
    'AIzaSyAGF9sxNoeFonDokV6h9D4qGbJCGitAM0Y',
    'AIzaSyDYUeSj9-8n1S0j239-QHZrZYF_r_EdZDM'
];

let currentAPIIndex = 0;
const conversationFilePath = path.join(__dirname,'database', 'conversations.json'); 
const createAPIConnection = (apiKey) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

app.use(express.json());
app.use(express.static('frontend'));

const readConversations = () => {
    if (!fs.existsSync(conversationFilePath)) {
        return {}; 
    }
    const data = fs.readFileSync(conversationFilePath, 'utf8');
    try {
        const parsedData = JSON.parse(data);

        if (typeof parsedData === 'object') {
            return parsedData;
        } else {
            return {};
        }
    } catch (error) {
        console.error("Error parsing JSON data:", error);
        return {};
    }
};

const writeConversations = (conversations) => {
    fs.writeFileSync(conversationFilePath, JSON.stringify(conversations, null, 2), 'utf8');
};

app.post('/generate', async (req, res) => {
    const { prompt, conversationId } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    let context = '';
    const conversations = readConversations(); 
    let newConversationId = conversationId || Date.now().toString(); 
    let currentConversation = conversations[newConversationId];

    if (currentConversation) {
        context = currentConversation.messages.map(msg => `${msg.sender}: ${msg.message}`).join('\n');
    } else {
        
        conversations[newConversationId] = {
            conversationId: newConversationId,
            messages: []
        };
    }

    const promptForAI = `
    You are a highly skilled software engineer named "AI-Craft" created by "Kenji Akira( Ngọc Từ )". 
    Your main task is to assist with programming tasks, solve coding problems, and explain technical concepts. 
    You can help with:
    - Debugging code in various programming languages (JavaScript, Python, Java, etc.).
    - Explaining algorithms and data structures.
    - Writing code snippets and examples to solve specific tasks.
    - Offering advice on best practices for software development.
    - Helping with concepts like design patterns, software architecture, and version control.

    Please respond with clear, concise, and actionable information, and provide code examples whenever appropriate.
    
    Previous conversation context:
    ${context}

    Task: ${prompt}
    `;

    const tryWithBackupAPI = async () => {
        for (let i = currentAPIIndex; i < API_KEYS.length; i++) {
            try {
                const model = createAPIConnection(API_KEYS[i]);
                const result = await model.generateContent(promptForAI);
                const aiResponse = result.response.text();

                conversations[newConversationId].messages.push({ sender: 'user', message: prompt });
                conversations[newConversationId].messages.push({ sender: 'ai', message: aiResponse });

                writeConversations(conversations);

                res.json({ text: aiResponse, conversationId: newConversationId });

                currentAPIIndex = i; 
                return;
            } catch (error) {
                console.error(`Error with API key ${API_KEYS[i]}: ${error.message}`);
                if (i === API_KEYS.length - 1) {
                    return res.status(500).json({ error: 'All API attempts failed' });
                }
            }
        }
    };

    try {
       
        await tryWithBackupAPI();
    } catch (error) {
       
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}/home.html`);
});
module.exports = app;