// ai-service/controllers/chat.controller.js
const { callLLM } = require("../services/ollama.service");
const { BASE_SYSTEM_PROMPT } = require("../prompts/system.prompt");
const { userDataPrompt } = require("../prompts/user.prompt");
const { detectIntent, fetchUserContext } = require("../services/chat.service");

exports.chat = async (req, res) => {
  try {
    console.log('🟢 ========== AI-SERVICE REQUEST START ==========');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📥 Headers:', req.headers.authorization ? '✅ Token present' : '❌ No token');
    
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('🔑 Token:', token ? `${token.substring(0, 30)}...` : '❌ NO TOKEN');
    
    const messages = [{ role: "system", content: BASE_SYSTEM_PROMPT }];

    // Detect intent
    const intent = detectIntent(message);
    console.log(`🤖 Detected intent: "${intent}"`);

    // Fetch context
    if (token) {
      try {
        console.log(`📡 Fetching context for userId: ${userId}, intent: ${intent}`);
        const userContext = await fetchUserContext(userId, intent, token, message);
        
        console.log('📊 ========== USER CONTEXT RECEIVED ==========');
        console.log(JSON.stringify(userContext, null, 2));
        console.log('📊 ============================================');
        
        if (userContext && Object.keys(userContext).length > 0) {
          const userPrompt = userDataPrompt(userContext);
          console.log('📝 User prompt generated, length:', userPrompt.length);
          console.log('📝 First 500 chars:', userPrompt.substring(0, 500));
          
          messages.push({
            role: "system",
            content: userPrompt
          });
          console.log('✅ User context added to messages');
        } else {
          console.warn('⚠️ User context is empty or null');
        }
      } catch (contextError) {
        console.error('❌ Error fetching context:', contextError.message);
        console.error('Stack:', contextError.stack);
      }
    } else {
      console.warn('⚠️ No token - skipping context fetch');
    }

    messages.push({ role: "user", content: message });

    console.log(`📤 Total messages for LLM: ${messages.length}`);
    console.log('📤 Messages:', messages.map((m, i) => `${i}: ${m.role} (${m.content.length} chars)`));
    
    const reply = await callLLM(messages);

    console.log('✅ LLM response received');
    console.log('🟢 ========== AI-SERVICE REQUEST END ==========');
    
    res.json({ reply });
    
  } catch (err) {
    console.error('❌ ai-service error:', err.message);
    console.error('Stack:', err.stack);
    
    if (!res.headersSent) {
      res.status(503).json({ 
        error: "AI service error", 
        details: err.message 
      });
    }
  }
};
