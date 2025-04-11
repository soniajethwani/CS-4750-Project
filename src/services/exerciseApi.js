import axios from 'axios';

const API_KEY = 'J5k7pCx4VWtCcJa4+fFrTQ==yG0hHk7v078dgHNj';
const BASE_URL = 'https://api.api-ninjas.com/v1/exercises';

export const fetchExercises = async (params = {}) => {
  try {
    const response = await axios.get(BASE_URL, {
      params,
      headers: { 'X-Api-Key': API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
};