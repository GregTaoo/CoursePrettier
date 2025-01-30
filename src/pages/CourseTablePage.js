import React, { useEffect, useState } from 'react';
import { getSemesters, getCourseTable } from '../api/api';
import { Table, Select, Spin, Alert, Typography, Row, Col, Card, Space, List, Divider } from 'antd';
import { LoadingOutlined, UserOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons';

const CourseTablePage = () => {
    const [semesters, setSemesters] = useState([]);  // 存储学期列表
    const [selectedSemesterId, setSelectedSemesterId] = useState(null);  // 当前选择的学期ID
    const [courseTable, setCourseTable] = useState([]);  // 存储课程表
    const [error, setError] = useState('');  // 错误信息
    const [loading, setLoading] = useState(false);  // 加载状态

    // 获取学期数据
    useEffect(() => {
        const fetchSemesters = async () => {
            setLoading(true);
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
                }
            } catch (err) {
                setError('Failed to fetch semesters');
            } finally {
                setLoading(false);
            }
        };

        fetchSemesters();
    }, []);

    // 处理学期选择
    const handleSemesterChange = async (id) => {
        setSelectedSemesterId(id);
        setLoading(true);

        try {
            const courses = await getCourseTable(id);
            setCourseTable(generateTableData(courses.message));
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch courses');
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
                            <Row><Space><CalendarOutlined/>Week: {week.minWeek === week.maxWeek ? week.minWeek : `${week.minWeek}-${week.maxWeek}`}</Space></Row>
                            <Row><Space><HomeOutlined/>{week.classroom}</Space></Row>
                            <Row><Space><UserOutlined/>{week.teachers}</Space></Row>
                        </Col>
                    </List.Item>
                    )}
                />
            </>
        ) : '';
    }

    // 设置表格的列
    const columns = [
        { title: 'Time', dataIndex: 'time', key: 'time', width: 90 },
        { title: 'Monday', dataIndex: '1', key: '1', onCell: (record, index) => onColCell(1, record, index), render: (_, record) => onRender(1, record) },
        { title: 'Tuesday', dataIndex: '2', key: '2', onCell: (record, index) => onColCell(2, record, index), render: (_, record) => onRender(2, record) },
        { title: 'Wednesday', dataIndex: '3', key: '3', onCell: (record, index) => onColCell(3, record, index), render: (_, record) => onRender(3, record) },
        { title: 'Thursday', dataIndex: '4', key: '4', onCell: (record, index) => onColCell(4, record, index), render: (_, record) => onRender(4, record) },
        { title: 'Friday', dataIndex: '5', key: '5', onCell: (record, index) => onColCell(5, record, index), render: (_, record) => onRender(5, record) },
        { title: 'Saturday', dataIndex: '6', key: '6', onCell: (record, index) => onColCell(6, record, index), render: (_, record) => onRender(6, record) },
        { title: 'Sunday', dataIndex: '7', key: '7', onCell: (record, index) => onColCell(7, record, index), render: (_, record) => onRender(7, record) },
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
                        <Col>No.{i}</Col>
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
            <Typography.Title level={2} style={{ marginBottom: '20px' }}>
                Course Table
            </Typography.Title>

            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

            <Card style={{ marginBottom: '20px' }}>
                <Row align="middle">
                    <Space>
                        <Typography.Text>Select Semester</Typography.Text>
                        <Select
                            disabled={loading}
                            value={selectedSemesterId}
                            style={{ width: '200px' }}
                            onChange={handleSemesterChange}
                            placeholder="Select Semester"
                            options={Array.from(semesters).reverse().map(([id, { year, term }]) => ({
                                label: `${year} - Term ${term}`,
                                value: id
                            }))}
                        />
                    </Space>
                    <Divider type="vertical" />
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
