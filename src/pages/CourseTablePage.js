import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ICSGenerator from '../components/ICSGenerator';
import { getSemesters, getCourseTable, logout } from '../api/api';
import { Table, Select, Spin, Alert, Typography, Row, Col, Card, Space, List, Divider, Button } from 'antd';
import { LoadingOutlined, UserOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons';

const CourseTablePage = () => {
    const [semesters, setSemesters] = useState([]);  // 存储学期列表
    const [selectedSemesterId, setSelectedSemesterId] = useState(null);  // 当前选择的学期ID
    const [courseData, setCourseData] = useState(null);  // 存储课程数据
    const [courseTable, setCourseTable] = useState([]);  // 存储课程表
    const [error, setError] = useState('');  // 错误信息
    const [loading, setLoading] = useState(false);  // 加载状态
    const [modalOpen, setModalOpen] = useState(false);
    const navigate = useNavigate();

    // 获取学期数据
    useEffect(() => {
        const loginSession = document.cookie.split(';').some(cookie => cookie.trim().startsWith('LOGIN_SESSION='));
        const studentId = document.cookie.split(';').some(cookie => cookie.trim().startsWith('STUDENT_ID='));

        if (!loginSession || !studentId) {
            navigate('/');
        }

        const fetchSemesters = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getSemesters();
                if (response.isSuccess) {
                    const semesterData = response.message.semesters;
                    const semestersMap = new Map();

                    Object.keys(semesterData).forEach((year) => {
                        Object.entries(semesterData[year]).forEach(([term, id]) => {
                            semestersMap.set(id, { year, term });
                        });
                    });
                    setSemesters(semestersMap);  // 设置学期数据

                    // 获取默认学期和课程表
                    const defaultSemester = response.message.default_semester;
                    await handleSemesterChange(defaultSemester);
                } else if (response.message === 'Session expired') {
                    setError('登录失效，请重新登录');
                    handleLogout();
                } else {
                    setError('获取学期数据失败: ' + response.message);
                }
            } catch (err) {
                setError('获取学期数据失败');
            } finally {
                setLoading(false);
            }
        };

        fetchSemesters();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            const response = await logout();
            if (response.isSuccess) {
                navigate('/');
            } else {
                setError('登出失败: ' + response.message);
            }
        } catch (err) {
            setError('登出失败');
        }
    }

    // 处理学期选择
    const handleSemesterChange = async (id) => {
        setSelectedSemesterId(id);
        setLoading(true);
        setError(null);

        try {
            const courses = await getCourseTable(id);
            if (courses.isSuccess) {
                setCourseData(courses.message);
                setCourseTable(generateTableData(courses.message));
            } else if (courses.message === 'Session expired') {
                setError('登录失效，请重新登录');
                handleLogout();
            } else {
                setError('获取课程表失败: ' + courses.message);
            }
        } catch (err) {
            console.error(err);
            setError('获取课程表失败');
        } finally {
            setLoading(false);
        }
    };

    const onColCell = (col, record, index) => {
        if (!courseTable[index]) return {};
        if (courseTable[index][col] === '') {
            return { rowSpan: 1 };
        } else if (index > 0 && courseTable[index][col].key == courseTable[index - 1][col].key)
            return { rowSpan: 0 };
        else {
            let p = index + 1;
            while (p < courseTable.length && courseTable[p][col].key == courseTable[index][col].key)
                p++;
            return { rowSpan: p - index };
        }
    }

    const onRender = (col, record) => {
        return record[col] != '' ? (
            <>
                <Row><Typography.Text strong>{record[col].name}</Typography.Text></Row>
                <List
                    itemLayout="horizontal"
                    dataSource={record[col].weeks}
                    renderItem={(week) => (
                        <List.Item>
                            <Col>
                                <Row><Space><CalendarOutlined /><Typography.Text>第{week.minWeek === week.maxWeek ? week.minWeek : `${week.minWeek}~${week.maxWeek}`}周</Typography.Text></Space></Row>
                                <Row><Space><HomeOutlined />{week.classroom}</Space></Row>
                                <Row><Space><UserOutlined />{week.teachers}</Space></Row>
                            </Col>
                        </List.Item>
                    )}
                />
            </>
        ) : '';
    }

    // 设置表格的列
    const columns = [
        { title: '时间', dataIndex: 'time', key: 'time', width: 90 },
        { title: '周一', dataIndex: '1', key: '1', onCell: (record, index) => onColCell(1, record, index), render: (_, record) => onRender(1, record) },
        { title: '周二', dataIndex: '2', key: '2', onCell: (record, index) => onColCell(2, record, index), render: (_, record) => onRender(2, record) },
        { title: '周三', dataIndex: '3', key: '3', onCell: (record, index) => onColCell(3, record, index), render: (_, record) => onRender(3, record) },
        { title: '周四', dataIndex: '4', key: '4', onCell: (record, index) => onColCell(4, record, index), render: (_, record) => onRender(4, record) },
        { title: '周五', dataIndex: '5', key: '5', onCell: (record, index) => onColCell(5, record, index), render: (_, record) => onRender(5, record) },
        { title: '周六', dataIndex: '6', key: '6', onCell: (record, index) => onColCell(6, record, index), render: (_, record) => onRender(6, record) },
        { title: '周日', dataIndex: '7', key: '7', onCell: (record, index) => onColCell(7, record, index), render: (_, record) => onRender(7, record) },
    ];

    // 转换课程数据为时间表格式
    const generateTableData = (data) => {

        const courseTable = [];

        if (!data.hasOwnProperty('periods')) return;
        let periodsData = data['periods'];

        for (let i = 1; i <= periodsData.length; i++) {
            const timeSlot = {
                time: (
                    <>
                        <Col>第 {i} 节</Col>
                        <Col>{periodsData[i - 1][i - 1]}</Col>
                    </>
                ),
                1: '',
                2: '',
                3: '',
                4: '',
                5: '',
                6: '',
                7: '',
            };
            courseTable.push(timeSlot);
        }

        data['courses'].forEach(course => {
            const { weeks, times, name, teachers, classroom } = course;
            let minWeek = 0, maxWeek = 0;
            while (weeks[++maxWeek] === '0' && maxWeek <= 18);
            minWeek = maxWeek;
            while (weeks[++maxWeek] === '1' && maxWeek <= 18);
            maxWeek--;
            Object.entries(times).forEach(([day, periods]) => {
                periods.split(',').forEach((period) => {
                    if (!courseTable[period - 1][day]) {
                        courseTable[period - 1][day] = {
                            key: name + classroom + teachers,
                            name: name,
                            weeks: [{
                                minWeek: minWeek,
                                maxWeek: maxWeek,
                                classroom: classroom,
                                teachers: teachers
                            }]
                        }
                    } else {
                        courseTable[period - 1][day].weeks.push({
                            minWeek: minWeek,
                            maxWeek: maxWeek,
                            classroom: classroom,
                            teachers: teachers
                        })
                    }
                })
            });
        });

        courseTable.forEach((entry) => {
            for (let i = 1; i <= 7; i++) {
                if (entry[i].weeks) {
                    entry[i].weeks.sort((a, b) => a.minWeek - b.minWeek);
                }
            }
        });

        return courseTable;
    };

    return (
        <div style={{ padding: '20px' }}>
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

            <Card style={{ marginBottom: '20px' }}>
                <Row align="middle" justify="space-around">
                    <Col span={12}>
                        <Space>
                            <Typography.Text>选择学期</Typography.Text>
                            <Select
                                disabled={loading}
                                value={selectedSemesterId}
                                style={{ width: '250px' }}
                                onChange={handleSemesterChange}
                                placeholder="选择学期"
                                options={Array.from(semesters).reverse().map(([id, { year, term }]) => ({
                                    label: `${year} 学年, 第 ${term} 学期`,
                                    value: id
                                }))}
                            />
                        </Space>
                    </Col>
                    <Col span={4}>
                        <Button type="primary" onClick={() => setModalOpen(true)}>
                            导出 iCal 日程
                        </Button>
                        <ICSGenerator externalOpen={modalOpen} setExternalOpen={setModalOpen} courseData={courseData} />
                    </Col>
                    <Col span={4}>
                        <Button danger onClick={handleLogout} autoInsertSpace={false}>登出</Button>
                    </Col>
                </Row>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
                </div>
            ) : (
                <Table
                    columns={columns}
                    dataSource={courseTable}
                    pagination={false}
                    rowKey="time"
                    bordered
                    size="middle"
                    style={{ marginTop: '20px' }}
                />
            )}
        </div>
    );
};

export default CourseTablePage;
