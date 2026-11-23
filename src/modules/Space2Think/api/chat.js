import { current } from '../../LexicalEditor/time';

export async function chatWithLLM(message) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that helps users analyze and understand their documents. You can help with summarization, finding connections between papers, and answering questions about the content."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[${current()}]`+ "[ChatBot] LLM Response:", data);

        return data.choices[0].message.content;
    } catch (error) {
        console.error(`[${current()}]`+ "[ChatBot] Error in chatWithLLM:", error);
        throw error;
    }
} 