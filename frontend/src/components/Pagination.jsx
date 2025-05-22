import React from 'react';

function Pagination({ page, totalCount, perPage, onPageChange, onPerPageChange, className = '' }) {
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / perPage);
  
  // Page buttons rendering logic
  const renderPageButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5; // Number of page buttons to show at once
    
    // Calculate start and end pages
    let startPage = Math.max(1, page - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);
    
    // Adjust page range if needed
    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }
    
    // Previous page button
    if (page > 1) {
      buttons.push(
        <button
          key="prev"
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1 mx-1 rounded-md bg-gray-200 hover:bg-gray-300"
          aria-label="Previous page"
        >
          &lt;
        </button>
      );
    }
    
    // First page button (if start page is not 1)
    if (startPage > 1) {
      buttons.push(
        <button
          key="1"
          onClick={() => onPageChange(1)}
          className="px-3 py-1 mx-1 rounded-md bg-gray-200 hover:bg-gray-300"
        >
          1
        </button>
      );
      
      // Ellipsis
      if (startPage > 2) {
        buttons.push(
          <span key="start-ellipsis" className="px-2 py-1">
            ...
          </span>
        );
      }
    }
    
    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 mx-1 rounded-md ${
            i === page 
              ? 'bg-eco-primary text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          aria-current={i === page ? 'page' : undefined}
        >
          {i}
        </button>
      );
    }
    
    // Last page button (if end page is not totalPages)
    if (endPage < totalPages) {
      // Ellipsis
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="end-ellipsis" className="px-2 py-1">
            ...
          </span>
        );
      }
      
      buttons.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className="px-3 py-1 mx-1 rounded-md bg-gray-200 hover:bg-gray-300"
        >
          {totalPages}
        </button>
      );
    }
    
    // Next page button
    if (page < totalPages) {
      buttons.push(
        <button
          key="next"
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1 mx-1 rounded-md bg-gray-200 hover:bg-gray-300"
          aria-label="Next page"
        >
          &gt;
        </button>
      );
    }
    
    return buttons;
  };
  
  return (
    <div className={`${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow-md">
        <div className="text-sm text-gray-600 mb-3 sm:mb-0">
          Showing <span className="font-semibold">{(page - 1) * perPage + 1}</span>-
          <span className="font-semibold">
            {Math.min(page * perPage, totalCount)}
          </span> of <span className="font-semibold">{totalCount}</span> items
        </div>
        
        <div className="flex items-center">
          <div className="mr-4">
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-md focus:ring-eco-primary focus:border-eco-primary"
              aria-label="Items per page"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
          
          <div className="flex">{renderPageButtons()}</div>
        </div>
      </div>
    </div>
  );
}

export default Pagination; 