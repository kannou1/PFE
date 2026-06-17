import axios from "axios";

// Base URL of your backend (must include /emploi because backend mounts examen router as /emploi)
// Always build final URL explicitly to avoid baseUrl mismatches causing `/getAll` 404
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";



// 🟢 Create an emploi du temps
export const createEmploi = async (data, token) => {
  const res = await axios.post(`${API_URL}/create`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 🔍 Get all emplois du temps
export const getAllEmplois = async (token) => {
  const res = await axios.get(`${API_URL}/emploi/getAll`, {

    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 🔍 Get emploi du temps by ID
export const getEmploiById = async (id, token) => {
  const res = await axios.get(`${API_URL}/getById/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✏️ Update an emploi du temps
export const updateEmploi = async (id, data, token) => {
  const res = await axios.put(`${API_URL}/update/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ❌ Delete an emploi du temps
export const deleteEmploi = async (id, token) => {
  const res = await axios.delete(`${API_URL}/delete/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ❌ Delete all emplois du temps
export const deleteAllEmplois = async (token) => {
  const res = await axios.delete(`${API_URL}/deleteAll`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
