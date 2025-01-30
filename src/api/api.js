// /src/api/api.js

import axios from 'axios';

const BASE_URL = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") ? 'http://localhost:8000' : '/';

export const login = async (user_id, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/login`, { user_id, password }, {
        withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error('Login failed');
  }
};

export const getSemesters = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/api/semesters`, {}, {
        withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch semesters');
  }
};

export const getCourseTable = async (semester_id) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/course_table`, { semester_id }, {
        withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch course table');
  }
};
