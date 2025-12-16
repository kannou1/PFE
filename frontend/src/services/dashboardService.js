import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Get dashboard statistics
export async function getDashboardStats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch dashboard stats: " + error.message);
  }
}
