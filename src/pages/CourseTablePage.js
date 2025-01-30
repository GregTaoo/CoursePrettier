import React, { useEffect, useState } from 'react';
import { getSemesters, getCourseTable } from '../api/api';
import { Table, Select, Spin, Alert, Typography, Row, Col, Card, Space } from 'antd';
import { LoadingOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons';

const CourseTablePage = () => {
    const [semesters, setSemesters] = useState([]);  // 存储学期列表
    const [selectedSemesterId, setSelectedSemesterId] = useState(null);  // 当前选择的学期ID
    const [courseTableData, setCourseTableData] = useState([]);  // 存储课程表
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
        setCourseTable([]);
        try {
            const courses = await getCourseTable(id);
            setCourseTableData(courses.message);
        } catch (err) {
            setError('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    const onColCell = (col, record, index) => {
        if (courseTable[index][col] === '') {
            return { rowSpan: 1 };
        } else if (index > 0 && courseTable[index][col] == courseTable[index - 1][col]) 
            return { rowSpan: 0 };
        else {
            let p = index + 1;
            while (p < courseTable.length && courseTable[p][col] == courseTable[index][col])
                p++;
            return { rowSpan: p - index };
        }
    }

    // 设置表格的列
    const columns = [
        { title: 'Time', dataIndex: 'time', key: 'time', width: 90 },
        { title: 'Monday', dataIndex: '1', key: '1', onCell: (record, index) => onColCell(1, record, index) },
        { title: 'Tuesday', dataIndex: '2', key: '2', onCell: (record, index) => onColCell(2, record, index) },
        { title: 'Wednesday', dataIndex: '3', key: '3', onCell: (record, index) => onColCell(3, record, index) },
        { title: 'Thursday', dataIndex: '4', key: '4', onCell: (record, index) => onColCell(4, record, index) },
        { title: 'Friday', dataIndex: '5', key: '5', onCell: (record, index) => onColCell(5, record, index) },
        { title: 'Saturday', dataIndex: '6', key: '6', onCell: (record, index) => onColCell(6, record, index) },
        { title: 'Sunday', dataIndex: '7', key: '7', onCell: (record, index) => onColCell(7, record, index) },
    ];

    // 转换课程数据为时间表格式
    const generateTableData = () => {
        const tableData = [];

        if (!courseTableData.hasOwnProperty('periods')) return;
        let periodsData = courseTableData['periods'];
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
            tableData.push(timeSlot);
            courseTable.push(timeSlot);
        }

        courseTableData['courses'].forEach(course => {
            const { weeks, times, name, teachers, classroom } = course;
            Object.entries(times).forEach(([day, periods]) => {
                periods.split(',').forEach((period) => {
                    tableData[period - 1][day] = (
                        <>
                            <Col>{name}</Col>
                            <Col><Space><HomeOutlined />{classroom}</Space></Col>
                            <Col><Space><UserOutlined />{teachers}</Space></Col>
                        </>
                    );
                    courseTable[period - 1][day] = name + classroom + teachers;
                })
            });
        });

        return tableData;
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
                </Row>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
                </div>
            ) : (
                <Table
                    columns={columns}
                    dataSource={generateTableData()}
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
