import { useState } from "react";
import { Modal, Button, DatePicker, Space, QRCode } from "antd";

export default function ICSGenerator({ externalOpen, setExternalOpen, courseData }) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [dataUrl, setDataUrl] = useState('');

    const parseTimeFormat = (time) => {
        let [hour, minute] = time.split(':');
        hour = hour.padStart(2, '0');
        minute = minute.padStart(2, '0');
        return `${hour}${minute}`;
    }

    const generateIcal = () => {
        const date = selectedDate;
        let firstMonday0 = date.toDate().getTime();
        let icsData = `BEGIN:VCALENDAR
VERSION:2.0
X-WR-CALNAME:课表
X-WR-TIMEZONE:Asia/Shanghai
`;

        if (!courseData.hasOwnProperty('periods')) return;
        let periodsData = {};
        Object.entries(courseData['periods']).forEach(([index, time]) => {
            time = time[index];
            periodsData[parseInt(index) + 1] = {
                start: time.split('-')[0],
                end: time.split('-')[1]
            };
        });
        console.log(periodsData)
        courseData['courses'].forEach(course => {
            for (let i = 1; i <= 18; i++) {
                if (course['weeks'][i] === '1') {
                    let monday0 = firstMonday0 + (i - 1) * 7 * 24 * 60 * 60 * 1000;
                    Object.entries(course['times']).forEach(([day, periods]) => {
                        // 时间格式 yyyyMMddTHHmmssZ
                        const date = new Date(monday0 + (day - 1) * 24 * 60 * 60 * 1000);
                        const dateString = date.getFullYear() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
                        const periodsList = periods.split(',');
                        const start = parseTimeFormat(periodsData[periodsList[0]]['start']);
                        const end = parseTimeFormat(periodsData[periodsList[periodsList.length - 1]]['end']);
                        icsData += `BEGIN:VEVENT
UID:${dateString}-${start}-${end}-${course['name'].length}-${course['classroom'].length}-${i}
DTSTART:${dateString}T${start}00
DTEND:${dateString}T${end}00
SUMMARY:${course['name']}
LOCATION:${course['classroom']}
DESCRIPTION:${course['teachers']} 
SEQUENCE:0
END:VEVENT\n`;
                    });
                }
            }
        });

        icsData += `END:VCALENDAR`;
        const blob = new Blob([icsData], { type: "text/calendar" });
        const url = URL.createObjectURL(blob);
        setDataUrl(url.split('blob:')[1]);
        const a = document.createElement("a");
        a.href = url;
        a.download = "course_table.ics";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // 获取选中日期所在周的周一
    const getFirstMonday = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = (day === 0 ? 6 : day - 1); // 如果是周日，则需要调整为前一个周一
        d.setDate(d.getDate() - diff);
        return d;
    };

    // 格式化日期为yyyyMMdd格式
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    return (
        <Modal
            title="选择第一周周一的日期"
            open={externalOpen}
            onCancel={() => setExternalOpen(false)}
            footer={null}
        >
            <Space>
                <DatePicker onChange={setSelectedDate} placeholder="选择日期"/>
                <Button type="primary" onClick={generateIcal}>
                    生成 iCal 日程
                </Button>
            </Space>
            {dataUrl === '' ? '' : <QRCode value={dataUrl || '-'} />}
        </Modal>
    );
}
