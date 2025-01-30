import React, { useState, useEffect } from 'react';
import { login } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Alert, Space, Typography, Card, Layout } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title } = Typography;
const LoginPage = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // 控制加载状态
    const navigate = useNavigate();

    // 检查登录状态和学生 ID 的 cookie
    useEffect(() => {
        const loginSession = document.cookie.split(';').some(cookie => cookie.trim().startsWith('LOGIN_SESSION='));
        const studentId = document.cookie.split(';').some(cookie => cookie.trim().startsWith('STUDENT_ID='));

        if (loginSession && studentId) {
            // 如果有 LOGIN_SESSION 和 STUDENT_ID cookie，跳转到课程页面
            navigate('/courses');
        }
    }, [navigate]);

    const handleLogin = async () => {
        setLoading(true); // 开始加载状态
        try {
            const loginData = await login(userId, password);
            if (loginData) {
                setError(null);
                localStorage.setItem('user_data', JSON.stringify(loginData)); // Save user data
                navigate('/courses'); // Redirect to course table page
            }
        } catch (err) {
            setError('登录失败，请检查学号和密码是否正确');
        } finally {
            setLoading(false); // 结束加载状态
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Card
                    style={{ width: 350, padding: '20px' }}
                    title={<Title level={3} style={{ textAlign: 'center' }}>登录</Title>}
                    bordered={false}
                >
                    {/* 错误信息 */}
                    {error && <Alert message={error} type="error" showIcon />}

                    <Space direction="vertical" style={{ width: '100%' }}>
                        {/* User ID */}
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="学号"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            size="large"
                        />

                        {/* Password */}
                        <Input
                            prefix={<LockOutlined />}
                            type="password"
                            placeholder="密码"
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
                            提交
                        </Button>

                        <Typography.Text style={{ color: 'lightgray', fontSize: '12px' }}>
                            请使用上海科技大学统一身份认证登录
                        </Typography.Text>
                    </Space>
                </Card>
            </div>
        </Layout>
    );
};

export default LoginPage;
