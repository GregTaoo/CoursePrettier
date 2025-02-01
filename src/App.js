import React from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ConfigProvider, FloatButton, theme } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/locale/zh_CN'; // 引入中文语言包
import LoginPage from './pages/LoginPage';
import CourseTablePage from './pages/CourseTablePage';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

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
      <FloatButton onClick={() => setIsDarkMode(!isDarkMode)} icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />} />
    </ConfigProvider>
  );
}

export default App;
