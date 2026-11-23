import express from 'express';
import { chatWithLLM } from './chat';

const router = express.Router();

router.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const response = await chatWithLLM(message);
        res.json({ response });
    } catch (error) {
        console.error('Error in chat handler:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 