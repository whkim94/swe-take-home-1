import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function Filters({ locations, metrics, filters, onFilterChange, onApplyFilters, loading }) {
  // Track if a warning should be shown
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  // Check if analysis type is trends but no location is selected
  useEffect(() => {
    setShowLocationWarning(filters.analysisType === 'trends' && !filters.locationId);
  }, [filters.analysisType, filters.locationId]);

  const handleFilterChange = (field, value) => {
    const updatedFilters = { ...filters, [field]: value };
    
    // If switching to trends analysis, remind user to select a location
    if (field === 'analysisType' && value === 'trends' && !filters.locationId) {
      setShowLocationWarning(true);
    } else if (field === 'locationId' && value && filters.analysisType === 'trends') {
      setShowLocationWarning(false);
    }
    
    onFilterChange(updatedFilters);
  };

  const handleApplyFilters = () => {
    // If trends analysis but no location, don't apply and show warning
    if (filters.analysisType === 'trends' && !filters.locationId) {
      setShowLocationWarning(true);
      return;
    }
    
    onApplyFilters(filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      locationId: '',
      startDate: '',
      endDate: '',
      metric: '',
      qualityThreshold: '',
      analysisType: 'raw'
    };
    
    setShowLocationWarning(false);
    onFilterChange(resetFilters);
    onApplyFilters(resetFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-eco-primary mb-4">Filter Data</h2>
      
      {loading && <p className="text-gray-500 mb-4">Loading filter options...</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
            {filters.analysisType === 'trends' && (
              <span className="ml-1 text-red-500 font-medium">*</span>
            )}
          </label>
          <select
            className={`w-full p-2 border rounded-md focus:ring-eco-primary focus:border-eco-primary ${
              showLocationWarning ? 'border-red-500' : 'border-gray-300'
            }`}
            value={filters.locationId}
            onChange={(e) => handleFilterChange('locationId', e.target.value ? parseInt(e.target.value) : '')}
            disabled={loading}
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}, {location.country}
              </option>
            ))}
          </select>
          {showLocationWarning && (
            <p className="mt-1 text-sm text-red-500">
              Location selection is required for Trend Analysis
            </p>
          )}
        </div>

        {/* Climate metric selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Climate Metric</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-eco-primary focus:border-eco-primary"
            value={filters.metric}
            onChange={(e) => handleFilterChange('metric', e.target.value)}
            disabled={loading}
          >
            <option value="">All Metrics</option>
            {metrics.map((metric) => (
              <option key={metric.id} value={metric.name}>
                {metric.display_name} ({metric.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Start date selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <DatePicker
            selected={filters.startDate}
            onChange={(date) => handleFilterChange('startDate', date)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-eco-primary focus:border-eco-primary"
            dateFormat="yyyy-MM-dd"
            placeholderText="Select start date"
            disabled={loading}
          />
        </div>

        {/* End date selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => handleFilterChange('endDate', date)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-eco-primary focus:border-eco-primary"
            dateFormat="yyyy-MM-dd"
            placeholderText="Select end date"
            disabled={loading}
          />
        </div>

        {/* Quality threshold selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Quality Threshold</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-eco-primary focus:border-eco-primary"
            value={filters.qualityThreshold}
            onChange={(e) => handleFilterChange('qualityThreshold', e.target.value)}
            disabled={loading}
          >
            <option value="">All</option>
            <option value="poor">Poor</option>
            <option value="questionable">Questionable</option>
            <option value="good">Good</option>
            <option value="excellent">Excellent</option>
          </select>
        </div>

        {/* Analysis type selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Type</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-eco-primary focus:border-eco-primary"
            value={filters.analysisType}
            onChange={(e) => handleFilterChange('analysisType', e.target.value)}
            disabled={loading}
          >
            <option value="raw">Raw Data</option>
            <option value="trends">Trend Analysis</option>
            <option value="weighted">Summary Statistics</option>
          </select>
          {filters.analysisType === 'trends' && (
            <p className="mt-1 text-xs text-gray-500 italic">
              Trend Analysis requires location selection
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end mt-4 space-x-2">
        <button
          onClick={handleResetFilters}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          disabled={loading}
        >
          Reset
        </button>
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-eco-primary text-white rounded-md hover:bg-eco-secondary transition"
          disabled={loading || showLocationWarning}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

export default Filters;