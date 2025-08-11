'use client'

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { BillingDashboardData } from '@/lib/billing';

export const runtime = 'edge';

export default function DashboardPage() {
  const [data, setData] = useState<BillingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/billing/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result: BillingDashboardData = await response.json();
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        toast.error('Error fetching data', { description: errorMessage });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const liveStats = data ? [
    { name: 'Unbilled Calls', value: data.unbilledCallCount.toString(), icon: <Phone className="h-6 w-6 text-gray-500" /> },
    { name: 'Unbilled Minutes', value: data.unbilledTotalMinutes.toString(), icon: <Clock className="h-6 w-6 text-gray-500" /> },
    { name: 'Successful Calls (Unbilled)', value: data.unbilledSuccessfulCalls.toString(), icon: <CheckCircle className="h-6 w-6 text-green-500" /> },
    { name: 'Failed Calls (Unbilled)', value: data.unbilledFailedCalls.toString(), icon: <XCircle className="h-6 w-6 text-red-500" /> },
  ] : [];

  // Mock data for other components
  const agents = [
    { id: 1, name: 'Support Agent', status: 'active', calls: 423, successRate: 96.2, lastActive: '2 min ago' },
    { id: 2, name: 'Sales Assistant', status: 'active', calls: 312, successRate: 92.1, lastActive: '5 min ago' },
    { id: 3, name: 'Appointment Scheduler', status: 'paused', calls: 156, successRate: 89.4, lastActive: '1 hour ago' },
  ];

  const recentCalls = data?.recentCalls.map(call => ({
    id: call.id,
    contact: call.call_name,
    agent: 'N/A', // Agent info not in this data model
    duration: 'N/A', // Duration info not in this data model
    status: call.status,
    time: new Date(call.created_at).toLocaleString(),
  })) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Here's what's happening with your voice agents.
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading...</CardTitle>
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
              </CardContent>
            </Card>
          ))
        ) : data ? (
          liveStats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-4 text-center text-gray-500">Could not load stats.</div>
        )}
      </div>

      {/* Usage Chart and Live Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Call Volume</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Successful</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Failed</span>
              </div>
            </div>
          </div>
          
          {/* Mock Chart */}
          <div className="h-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-end justify-center p-4 space-x-2">
            {[65, 45, 78, 52, 83, 67, 92, 58, 74, 89, 76, 64].map((height, index) => (
              <div key={index} className="flex flex-col items-center space-y-1 flex-1">
                <div 
                  className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t opacity-80"
                  style={{ height: `${height}%` }}
                ></div>
                <div 
                  className="w-full bg-red-500 rounded-b opacity-60"
                  style={{ height: `${Math.random() * 15 + 5}%` }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Agents */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Live Agents</h3>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${ 
                  agent.status === 'active' 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-gray-400'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {agent.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {agent.calls} calls • {agent.successRate}% success
                  </p>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {agent.lastActive}
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-6 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-lg transition-colors duration-200">
            Manage Agents
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Calls</h3>
            <a href="/calls" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
              View all
            </a>
          </div>
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentCalls.map((call) => (
                <tr key={call.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {call.contact}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {call.agent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {call.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
                      call.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                    }`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {call.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}