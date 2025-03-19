import React, { useState, useEffect } from 'react';
import { ChatInterface } from '../Chat/ChatInterface';
import { MetricsDashboard } from '../Dashboard/MetricsDashboard';
import { wsService } from '../../services/websocket';

export const MainLayout: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    wsService.on('connected', handleConnect);
    wsService.on('disconnected', handleDisconnect);

    // Connect to WebSocket server
    wsService.connect();

    return () => {
      wsService.removeListener('connected', handleConnect);
      wsService.removeListener('disconnected', handleDisconnect);
      wsService.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Superagent Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
              </button>
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Chat Section */}
        <div className="flex-1 min-w-0">
          <ChatInterface className="h-full" />
        </div>

        {/* Metrics Section */}
        {showMetrics && (
          <div className="w-full lg:w-[600px] overflow-y-auto border-t lg:border-t-0 lg:border-l">
            <MetricsDashboard />
          </div>
        )}
      </div>
    </div>
  );
}; 