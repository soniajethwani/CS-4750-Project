import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api/exercises';

export const fetchExercises = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(BASE_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
};