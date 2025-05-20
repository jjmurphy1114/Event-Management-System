import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LinearScale } from 'chart.js';
import Guest from "../types/Guest";

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, PointElement, LinearScale);

interface CheckInGraphProps {
    checkInTimes: Guest[];
}

export default function CheckInGraph({ checkInTimes }: CheckInGraphProps) {
    // Filter check-ins between 10 PM and 2 AM
    const filteredCheckIns = checkInTimes.filter((guest) => {
        const checkInTime = new Date(guest.checkedIn as string);
        const hours = checkInTime.getHours();
        return (hours >= 22 || hours < 2); // 10 PM to 2 AM
    });

    // Format data for scatter plot
    const scatterData = filteredCheckIns.map((guest) => {
        const checkInTime = new Date(guest.checkedIn as string);
        const hours = checkInTime.getHours();
        const minutes = checkInTime.getMinutes();
        const timeInHours = hours + minutes / 60; // Convert to decimal hours
        return { x: timeInHours, y: 1 }; // y is a constant for distribution
    });

    // Chart.js data and options
    const data = {
        datasets: [
        {
            label: 'Check-In Times',
            data: scatterData,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            pointRadius: 5,
        },
        ],
    };

    const options = {
        scales: {
            x: {
                type: "linear", // Explicitly set the type to "linear"
                position: "bottom",
                title: {
                    display: true,
                    text: "Check-In Time",
                },
                ticks: {
                    callback: (value: number) => {
                        const hours = Math.floor(value);
                        const minutes = Math.round((value - hours) * 60);
                        const date = new Date();
                        date.setHours(hours, minutes);
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                    },
                },
            },
            y: {
                display: true,
            },
        },
        plugins: {
            legend: {
                display: false,
            },
        },
    };

    // Render the scatter plot
    return <Scatter data={data} options={options}/>;
}