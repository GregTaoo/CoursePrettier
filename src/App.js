import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN'; // 引入中文语言包
import LoginPage from './pages/LoginPage';
import CourseTablePage from './pages/CourseTablePage';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/courses" element={<CourseTablePage />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
