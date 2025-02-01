import React from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ConfigProvider, FloatButton, theme } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/locale/zh_CN'; // 引入中文语言包
import LoginPage from './pages/LoginPage';
import CourseTablePage from './pages/CourseTablePage';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === '1');

  const toggleDarkMode = () => {
    let dark = !isDarkMode;
    setIsDarkMode(dark);
    localStorage.setItem('dark_mode', dark ? '1' : '0');
  };

  return (
    <ConfigProvider locale={zhCN} 
      theme={{ 
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/courses" element={<CourseTablePage />} />
        </Routes>
      </Router>
      <FloatButton onClick={toggleDarkMode} icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />} />
    </ConfigProvider>
  );
}

export default App;
