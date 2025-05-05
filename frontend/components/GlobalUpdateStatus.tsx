"use client";

import React, { useState, useEffect } from 'react';
import { useGlobalData } from './web3/GlobalDataProvider';

/**
 * GlobalUpdateStatus displays the timestamp of when the application data was
 * last updated. It also shows loading status and any errors that occurred.
 * Now includes a manual refresh button for users to trigger updates.
 * Updates the display every 1 second to show real-time elapsed time.
 */
export default function GlobalUpdateStatus() {
  const { lastUpdated, isLoading, error, manualRefresh } = useGlobalData();
  const [, setTick] = useState(0); // Used to force re-render every second

  // Set up a timer to update the component every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(tick => tick + 1); // Force re-render
    }, 1000);
    
    return () => clearInterval(timer); // Clean up on unmount
  }, []);

  // Format time to show hours, minutes, and seconds
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Calculate time elapsed since last update
  const getTimeElapsed = () => {
    if (!lastUpdated) return 'Never';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diffInSeconds < 10) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 120) return '1 minute ago';
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!isLoading) {
      await manualRefresh();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-800/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700/80 shadow-lg">
      <div className="flex items-center text-xs">
        <div className="flex items-center mr-2">
          {isLoading ? (
            <svg className="w-3.5 h-3.5 mr-1.5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <div className={`w-2 h-2 rounded-full mr-1.5 ${lastUpdated ? 'bg-green-400' : 'bg-red-400'}`}></div>
          )}
          <span className="text-slate-300 font-medium">
            {isLoading ? 'Updating...' : 'Data Status:'}
          </span>
        </div>
        
        <div className="text-slate-400">
          {lastUpdated ? (
            <div className="flex flex-col">
              <span className="font-mono">Last updated: {formatTime(lastUpdated)}</span>
              <span className="text-[10px] text-slate-500">{getTimeElapsed()}</span>
            </div>
          ) : (
            <span>No data available</span>
          )}
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isLoading}
          className={`ml-3 px-1.5 py-1 rounded text-xs flex items-center ${
            isLoading 
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' 
              : 'bg-blue-600/30 text-blue-400 hover:bg-blue-600/50 hover:text-blue-300 transition-colors'
          }`}
          title="Refresh data manually"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      
      {error && (
        <div className="mt-1 text-red-400 text-[10px] flex items-center">
          <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
} 