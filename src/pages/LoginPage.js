import React, { useState } from 'react';
import { login } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Alert, Space, Typography, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title } = Typography;

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // 控制加载状态
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true); // 开始加载状态
    try {
      const loginData = await login(userId, password);
      if (loginData) {
        // Successful login
        localStorage.setItem('user_data', JSON.stringify(loginData)); // Save user data
        navigate('/courses'); // Redirect to course table page
      }
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false); // 结束加载状态
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card
        style={{ width: 300, padding: '20px' }}
        title={<Title level={3} style={{ textAlign: 'center' }}>Login</Title>}
        bordered={false}
      >
        {/* 错误信息 */}
        {error && <Alert message={error} type="error" showIcon />}
        
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* User ID */}
          <Input
            prefix={<UserOutlined />}
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            size="large"
          />
          
          {/* Password */}
          <Input
            prefix={<LockOutlined />}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            size="large"
          />
          
          {/* Login Button */}
          <Button
            type="primary"
            onClick={handleLogin}
            size="large"
            style={{ width: '100%' }}
            loading={loading} // 显示加载动画
            disabled={loading} // 禁用按钮
          >
            Login
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default LoginPage;
