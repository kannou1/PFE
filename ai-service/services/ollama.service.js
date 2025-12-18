const OLLAMA_URL = "http://127.0.0.1:11434/v1/chat/completions";

async function callLLM(messages) {
  // Validate messages format
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
  }

  // Validate each message
  messages.forEach((msg, idx) => {
    if (!msg.role || !msg.content) {
      throw new Error(`Message ${idx} missing 'role' or 'content' field`);
    }
    if (typeof msg.content !== 'string') {
      throw new Error(`Message ${idx} content must be a string`);
    }
  });

  console.log('📤 Sending to Ollama:', JSON.stringify(messages, null, 2).substring(0, 200) + '...');

  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.1:8b",
      messages,
      temperature: 0.2,
      stream: false
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('❌ Ollama error response:', text);
    throw new Error(`Ollama API error: ${res.status} - ${text}`);
  }

  const data = await res.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from Ollama');
  }

  return data.choices[0].message.content;
}

module.exports = { callLLM };
