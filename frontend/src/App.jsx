import { useState, useEffect } from 'react';
import Filters from './components/Filters';
import ChartContainer from './components/ChartContainer';
import SummaryChart from './components/SummaryChart';
import QualityDistributionChart from './components/QualityDistributionChart';
import TrendAnalysis from './components/TrendAnalysis';
import QualityIndicator from './components/QualityIndicator';
import Pagination from './components/Pagination';
import { getLocations, getMetrics } from './api';

function App() {
  const [locations, setLocations] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [climateData, setClimateData] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [trendData, setTrendData] = useState(null);
  const [filters, setFilters] = useState({
    locationId: '',
    startDate: '',
    endDate: '',
    metric: '',
    qualityThreshold: '',
    analysisType: 'raw'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    totalCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);

  // Load location and metric data
  useEffect(() => {
    const fetchFilterData = async () => {
      setFiltersLoading(true);
      try {
        const [locationsResponse, metricsResponse] = await Promise.all([
          getLocations(),
          getMetrics()
        ]);
        
        setLocations(locationsResponse.data || []);
        setMetrics(metricsResponse.data || []);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setFiltersLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  // Updated fetch function to handle different analysis types and pagination
  const fetchData = async (page = pagination.page, itemsPerPage = pagination.perPage) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(filters.locationId && { location_id: filters.locationId }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
        ...(filters.metric && { metric: filters.metric }),
        ...(filters.qualityThreshold && { quality_threshold: filters.qualityThreshold }),
        page: page,
        per_page: itemsPerPage
      });

      // Convert Date objects to strings
      if (filters.startDate instanceof Date) {
        queryParams.set('start_date', filters.startDate.toISOString().split('T')[0]);
      }
      if (filters.endDate instanceof Date) {
        queryParams.set('end_date', filters.endDate.toISOString().split('T')[0]);
      }

      let endpoint = '/api/v1/climate';
      if (filters.analysisType === 'trends') {
        endpoint = '/api/v1/trends';
      } else if (filters.analysisType === 'weighted') {
        endpoint = '/api/v1/summary';
      }

      const response = await fetch(`${endpoint}?${queryParams}`);
      const data = await response.json();
      
      if (filters.analysisType === 'trends') {
        setTrendData(data.data);
      } else if (filters.analysisType === 'weighted') {
        setSummaryData(data.data);
      } else {
        setClimateData(data.data);
        // Update pagination metadata
        if (data.meta) {
          setPagination({
            ...pagination,
            page: data.meta.page,
            perPage: itemsPerPage,
            totalCount: data.meta.total_count
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
    fetchData(newPage);
  };

  // Items per page change handler
  const handlePerPageChange = (newPerPage) => {
    setPagination({
      ...pagination,
      page: 1, // Reset to first page when changing items per page
      perPage: newPerPage
    });
    fetchData(1, newPerPage);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-eco-primary mb-2">
          EcoVision: Climate Visualizer
        </h1>
        <p className="text-gray-600 italic">
          Transforming climate data into actionable insights for a sustainable future
        </p>
      </header>

      <Filters 
        locations={locations}
        metrics={metrics}
        filters={filters}
        onFilterChange={setFilters}
        onApplyFilters={() => fetchData(1)} // Move to first page when applying filters
        loading={filtersLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {filters.analysisType === 'trends' ? (
          <TrendAnalysis 
            data={trendData}
            loading={loading}
          />
        ) : filters.analysisType === 'weighted' ? (
          <>
            <SummaryChart 
              title="Climate Summary Statistics"
              loading={loading}
              summaryData={summaryData}
            />
            <QualityDistributionChart 
              title="Quality Distribution"
              loading={loading}
              summaryData={summaryData}
              metric={filters.metric}
            />
          </>
        ) : (
          <>
            <ChartContainer 
              title="Climate Trends"
              loading={loading}
              chartType="line"
              data={climateData}
              showQuality={true}
            />
            <ChartContainer 
              title="Quality Distribution"
              loading={loading}
              chartType="bar"
              data={climateData}
              showQuality={true}
            />
          </>
        )}
      </div>

      {filters.analysisType !== 'weighted' && (
        <QualityIndicator 
          data={climateData}
          className="mt-6"
        />
      )}

      {/* Pagination component - only show for raw climate data mode */}
      {filters.analysisType === 'raw' && (
        <Pagination 
          page={pagination.page}
          perPage={pagination.perPage}
          totalCount={pagination.totalCount}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          className="mt-6"
        />
      )}
    </div>
  );
}

export default App;