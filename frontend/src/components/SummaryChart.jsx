import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Predefined colors for consistent appearance
const COLORS = {
  min: 'rgba(54, 162, 235, 0.7)',     // blue
  max: 'rgba(255, 99, 132, 0.7)',     // red
  avg: 'rgba(255, 206, 86, 0.7)',     // yellow
  weighted_avg: 'rgba(75, 192, 192, 0.7)' // teal
};

function SummaryChart({ title, loading, summaryData }) {
  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md h-96">
        <h2 className="text-xl font-semibold text-eco-primary mb-4">{title}</h2>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading data...</p>
        </div>
      </div>
    );
  }

  if (!summaryData || Object.keys(summaryData).length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md h-96">
        <h2 className="text-xl font-semibold text-eco-primary mb-4">{title}</h2>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No summary data available. Please apply filters to see visualizations.</p>
        </div>
      </div>
    );
  }

  // Process data for each metric
  const metrics = Object.keys(summaryData);
  
  const datasets = [
    {
      label: 'Min',
      data: metrics.map(metric => summaryData[metric].min),
      backgroundColor: COLORS.min,
      borderColor: COLORS.min.replace('0.7', '1'),
      borderWidth: 1
    },
    {
      label: 'Max',
      data: metrics.map(metric => summaryData[metric].max),
      backgroundColor: COLORS.max,
      borderColor: COLORS.max.replace('0.7', '1'),
      borderWidth: 1
    },
    {
      label: 'Avg',
      data: metrics.map(metric => summaryData[metric].avg),
      backgroundColor: COLORS.avg,
      borderColor: COLORS.avg.replace('0.7', '1'),
      borderWidth: 1
    },
    {
      label: 'Weighted Avg',
      data: metrics.map(metric => summaryData[metric].weighted_avg),
      backgroundColor: COLORS.weighted_avg,
      borderColor: COLORS.weighted_avg.replace('0.7', '1'),
      borderWidth: 1
    }
  ];

  const chartData = {
    labels: metrics.map(metric => metric.charAt(0).toUpperCase() + metric.slice(1)),
    datasets
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const metric = metrics[context.dataIndex];
            const unit = summaryData[metric].unit;
            return `${context.dataset.label}: ${context.raw} ${unit}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: metrics.length > 0 ? summaryData[metrics[0]].unit : 'Value'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Metrics'
        }
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-96">
      <h2 className="text-xl font-semibold text-eco-primary mb-4">{title}</h2>
      <div className="h-5/6">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

export default SummaryChart; 