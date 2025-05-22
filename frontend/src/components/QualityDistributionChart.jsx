import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

// Quality color mapping
const QUALITY_COLORS = {
  excellent: 'rgba(34, 197, 94, 0.7)',  // green
  good: 'rgba(59, 130, 246, 0.7)',      // blue
  questionable: 'rgba(234, 179, 8, 0.7)', // yellow
  poor: 'rgba(239, 68, 68, 0.7)'        // red
};

function QualityDistributionChart({ title, loading, summaryData, metric }) {
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
          <p className="text-gray-500">No quality data available. Please apply filters to see visualizations.</p>
        </div>
      </div>
    );
  }

  // If no specific metric is selected but we have multiple metrics, use the first one
  const metrics = Object.keys(summaryData);
  const selectedMetric = metric && summaryData[metric] ? metric : metrics[0];
  
  if (!selectedMetric || !summaryData[selectedMetric] || !summaryData[selectedMetric].quality_distribution) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md h-96">
        <h2 className="text-xl font-semibold text-eco-primary mb-4">{title}</h2>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No quality distribution data available for the selected metric.</p>
        </div>
      </div>
    );
  }

  const qualityDistribution = summaryData[selectedMetric].quality_distribution;
  const labels = Object.keys(qualityDistribution).map(
    quality => quality.charAt(0).toUpperCase() + quality.slice(1)
  );
  
  const data = {
    labels,
    datasets: [
      {
        data: Object.values(qualityDistribution).map(value => (value * 100).toFixed(1)),
        backgroundColor: Object.keys(qualityDistribution).map(quality => QUALITY_COLORS[quality]),
        borderColor: Object.keys(qualityDistribution).map(quality => QUALITY_COLORS[quality].replace('0.7', '1')),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      },
      title: {
        display: true,
        text: `Quality Distribution for ${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`,
        font: {
          size: 14
        }
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-96">
      <h2 className="text-xl font-semibold text-eco-primary mb-4">{title}</h2>
      <div className="h-5/6">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}

export default QualityDistributionChart; 