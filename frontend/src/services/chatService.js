import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:7000";

// Send a chat message
export async function sendChatMessage(message, userId) {
  try {
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      message,
      userId
    }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to send chat message: " + error.message);
  }
}

// Upload a file and get AI analysis
export async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${AI_SERVICE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to upload file: " + error.message);
  }
}
