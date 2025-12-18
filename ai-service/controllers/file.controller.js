const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { callLLM } = require('../services/ollama.service');
const mammoth = require('mammoth');
const { extractText } = require('unpdf');

// Configure Multer
const upload = multer({ dest: 'uploads/' });

// Helper function to sanitize text
function sanitizeContent(input) {
  // ✅ Handle different input types
  let text = '';
  
  if (typeof input === 'string') {
    text = input;
  } else if (typeof input === 'object' && input !== null) {
    // If it's an object, try to extract text
    if (input.text) {
      text = input.text;
    } else if (input.content) {
      text = input.content;
    } else {
      text = JSON.stringify(input);
    }
  } else {
    text = String(input || '');
  }
  
  // Remove control characters but keep newlines and common whitespace
  text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Limit content size to avoid overwhelming the API
  if (text.length > 10000) {
    text = text.substring(0, 10000) + '... (content truncated)';
  }
  
  return text;
}

exports.uploadFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      const ext = path.extname(file.originalname).toLowerCase();
      let content = '';

      console.log(`📥 Processing ${ext} file: ${file.originalname}`);

      // TXT files
      if (ext === '.txt') {
        content = fs.readFileSync(file.path, 'utf-8');
        console.log(`✅ TXT extracted: ${content.length} chars`);

      // PDF files
      } else if (ext === '.pdf') {
        try {
          const dataBuffer = fs.readFileSync(file.path);
          const uint8Array = new Uint8Array(dataBuffer);
          const result = await extractText(uint8Array);
          console.log(`📊 PDF extraction result type:`, typeof result, result);
          
          // Handle different response formats
          if (typeof result === 'string') {
            content = result;
          } else if (result && result.text) {
            content = result.text;
          } else if (result && result.pages) {
            content = result.pages.map(p => p.content || '').join('\n');
          } else {
            content = String(result || '');
          }
          
          console.log(`✅ PDF extracted: ${content.length} chars`);
        } catch (pdfErr) {
          console.error('❌ PDF extraction error:', pdfErr.message);
          fs.unlinkSync(file.path);
          return res.status(400).json({ 
            error: 'Failed to extract PDF content',
            details: pdfErr.message 
          });
        }

      // DOCX files
      } else if (ext === '.docx') {
        const data = await mammoth.extractRawText({ path: file.path });
        content = data.value || '';
        console.log(`✅ DOCX extracted: ${content.length} chars`);

      } else {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Unsupported file type. Use TXT, PDF, or DOCX.' });
      }

      // ✅ Sanitize content before sending
      content = sanitizeContent(content);

      if (!content) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'No readable content extracted from file' });
      }

      console.log(`🧹 Sanitized content: ${content.length} chars`);

      // ✅ Format messages correctly
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Summarize and analyze the provided content.'
        },
        {
          role: 'user',
          content: `Please analyze and summarize this content:\n\n${content}`
        }
      ];

      console.log(`📤 Sending to Ollama...`);
      const answer = await callLLM(messages);

      fs.unlinkSync(file.path); // cleanup
      res.json({ answer });

    } catch (err) {
      console.error('❌ Upload error:', err);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'File processing error', details: err.message });
    }
  }
];
