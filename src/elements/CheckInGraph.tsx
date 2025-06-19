import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Guest from "../types/Guest";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CheckInGraphProps {
  checkInTimes: Guest[];
}

export default function CheckInGraph({ checkInTimes }: CheckInGraphProps) {
  // Filter check-ins between 10 PM and 2 AM
  const filteredCheckIns = checkInTimes.filter((guest) => {
    if (!guest.checkedIn) return false;
  });

  // Aggregate check-ins per minute bucket
  const bucketCounts: Record<number, number> = {};
  filteredCheckIns.forEach((guest) => {
    const date = new Date(guest.checkedIn as string);
    const bucketHour = date.getHours();
    const bucketMinute = date.getMinutes();
    const timeInHours = bucketHour + bucketMinute / 60;
    bucketCounts[timeInHours] = (bucketCounts[timeInHours] || 0) + 1;
  });

  // Format data for line chart
  const dataPoints = Object.entries(bucketCounts)
    .map(([key, count]) => ({ x: parseFloat(key), y: count }))
    .sort((a, b) => a.x - b.x);

  const data = {
    datasets: [
      {
        label: 'Guests Checked-In',
        data: dataPoints,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
        pointRadius: 5,
        showLine: true,
      },
    ],
  };

  const options = {
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        title: {
          display: true,
          text: 'Time',
        },
        ticks: {
          callback: (value: number | string) => {
            const num = Number(value);
            const hrs = Math.floor(num);
            const mins = Math.round((num - hrs) * 60);
            const date = new Date();
            date.setHours(hrs, mins);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          },
        },
      },
      y: {
        title: {
            display: true,
            text: 'Check-Ins',
          },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Check-In Times',
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
}
