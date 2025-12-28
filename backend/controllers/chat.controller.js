// Backend/controllers/chat.controller.js
const axios = require('axios');
const mongoose = require('mongoose');
const Conversation = require('../models/conversation');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:7000';

exports.chat = async (req, res) => {
  try {
    const { message, conversationId, certificationId } = req.body;
    
    // ✅ Get userId from authenticated user (set by middleware)
    const userId = req.user._id.toString();
    
    console.log('🔵 Backend chat controller');
    console.log('📥 Authenticated user:', userId);
    console.log('📥 User role:', req.user.role);
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const convId = conversationId || new mongoose.Types.ObjectId().toString();

    // ✅ GET TOKEN - Try multiple sources
    let token = req.headers.authorization;
    
    // If not in headers, reconstruct from cookie
    if (!token && req.cookies?.jwt) {
      token = `Bearer ${req.cookies.jwt}`;
    }
    
    console.log('📤 Token sources:');
    console.log('  - Authorization header:', req.headers.authorization ? '✅' : '❌');
    console.log('  - Cookie jwt:', req.cookies?.jwt ? '✅' : '❌');
    console.log('📤 Final token:', token ? '✅ Present' : '❌ Missing');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    console.log(`🔵 Calling ai-service at ${AI_SERVICE_URL}/chat`);

    // 1️⃣ Call the AI service WITH TOKEN and userId
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/chat`,
      {
        message,
        userId,
        certificationId
      },
      {
        headers: {
          'Authorization': token,  // ✅ Pass the token
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const answer = aiResponse.data.reply || aiResponse.data.answer || aiResponse.data;

    // 2️⃣ Save conversation in DB
    await Conversation.create({
      userId,
      conversationId: convId,
      message,
      response: typeof answer === 'string' ? answer : JSON.stringify(answer),
      createdAt: new Date()
    });

    console.log('✅ Backend received ai-service response');
    
    // 3️⃣ Return AI response to frontend
    res.json({ 
      answer,
      conversationId: convId 
    });
  } catch (err) {
    console.error('❌ Backend chat error:', err.message);
    if (err.response?.data) {
      console.error('ai-service error:', err.response.data);
    }
    
    if (!res.headersSent) {
      res.status(err.response?.status || 500).json({ 
        error: 'Chat service error',
        details: err.response?.data || err.message
      });
    }
  }
};
