import React, { useState, useEffect } from 'react';
import { SystemMetrics, Agent } from '../../types/agent';
import { wsService } from '../../services/websocket';

interface MetricsDashboardProps {
  className?: string;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      // Request initial data only after connection is established
      try {
        wsService.send('get_metrics', {});
        wsService.send('get_agents', {});
      } catch (error) {
        console.error('Failed to request initial data:', error);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setMetrics(null); // Reset metrics when disconnected
      setAgents([]); // Reset agents when disconnected
    };

    wsService.on('connected', handleConnect);
    wsService.on('disconnected', handleDisconnect);
    wsService.on('metrics_update', handleMetricsUpdate);
    wsService.on('agents_update', handleAgentsUpdate);

    // If already connected, request data immediately
    if (wsService.isConnected()) {
      handleConnect();
    }

    return () => {
      wsService.removeListener('connected', handleConnect);
      wsService.removeListener('disconnected', handleDisconnect);
      wsService.removeListener('metrics_update', handleMetricsUpdate);
      wsService.removeListener('agents_update', handleAgentsUpdate);
    };
  }, []);

  const handleMetricsUpdate = (newMetrics: SystemMetrics) => {
    // Ensure dates are properly converted from strings to Date objects
    setMetrics({
      ...newMetrics,
      lastUpdated: new Date(newMetrics.lastUpdated)
    });
  };

  const handleAgentsUpdate = (newAgents: Agent[]) => {
    // Ensure all agent data is properly formatted
    setAgents(newAgents.map(agent => ({
      ...agent,
      metrics: {
        ...agent.metrics,
        successRate: agent.metrics?.successRate || 0,
        tasksCompleted: agent.metrics?.tasksCompleted || 0,
        averageResponseTime: agent.metrics?.averageResponseTime || 0
      }
    })));
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">
          Connecting to server...
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">
          Loading metrics...
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">System Overview</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Active Agents:</span>
              <span className="float-right font-semibold">{metrics.activeAgents}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Tasks:</span>
              <span className="float-right font-semibold">{metrics.totalTasks}</span>
            </div>
            <div>
              <span className="text-gray-600">Success Rate:</span>
              <span className="float-right font-semibold">
                {((metrics?.successRate || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Avg Response Time:</span>
              <span className="float-right font-semibold">
                {(metrics?.averageResponseTime || 0).toFixed(2)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Resource Usage</h3>
          <div className="space-y-4">
            {Object.entries(metrics.resourceUsage).map(([resource, usage]) => (
              <div key={resource}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 capitalize">
                    {resource.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="font-semibold">{usage}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((usage / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Agents */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Active Agents</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Success Rate</th>
                  <th className="text-left py-2">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b">
                    <td className="py-2">{agent.name}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          agent.status === 'idle'
                            ? 'bg-green-100 text-green-800'
                            : agent.status === 'busy'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {((agent.metrics?.successRate || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2">{agent.metrics?.tasksCompleted || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}; 