// /src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import CourseTablePage from './pages/CourseTablePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/courses" element={<CourseTablePage />} />
      </Routes>
    </Router>
  );
}

export default App;
