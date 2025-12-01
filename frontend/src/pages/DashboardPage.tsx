import { useState, useEffect } from 'react';
import { dashboardApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { LEAD_STAGES, MESSAGE_STATUS } from '../lib/config';
import {
  UsersIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  ClockIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summary, metrics] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.metrics(),
        ]);

        setDashboardSummary(summary.data);
        setDashboardMetrics(metrics.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="metric-card">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card">
              <div className="card-header">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="card-body">
                <div className="animate-pulse space-y-4">
                  <div className="h-40 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const MetricCard = ({ icon: Icon, title, value, change, changeType, color = 'blue' }: any) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      amber: 'text-amber-600 bg-amber-100',
      red: 'text-red-600 bg-red-100',
    };

    return (
      <div className="metric-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="metric-label">{title}</p>
              <p className="metric-value">{value?.toLocaleString() || 0}</p>
            </div>
          </div>
          {change !== undefined && (
            <div className={`metric-change ${changeType}`}>
              {changeType === 'positive' ? (
                <TrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.name}! Here's what's happening with your leads today.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={UsersIcon}
          title="Total Leads"
          value={dashboardSummary?.totalLeads}
          change={dashboardSummary?.newLeads7Days > 0 ? 12.5 : -8.3}
          changeType={dashboardSummary?.newLeads7Days > 0 ? 'positive' : 'negative'}
          color="blue"
        />
        <MetricCard
          icon={TrendingUpIcon}
          title="New Leads (7 days)"
          value={dashboardSummary?.newLeads7Days}
          color="green"
        />
        <MetricCard
          icon={PhoneIcon}
          title="Hot Leads"
          value={dashboardSummary?.hotLeads}
          color="amber"
        />
        <MetricCard
          icon={ClockIcon}
          title="Missed Follow-ups"
          value={dashboardSummary?.missedFollowUps}
          color="red"
        />
        <MetricCard
          icon={ChartBarIcon}
          title="Conversion Rate"
          value={`${dashboardSummary?.conversionRate || 0}%`}
          change={5.2}
          changeType="positive"
          color="green"
        />
        <MetricCard
          icon={ChatBubbleLeftRightIcon}
          title="Avg Response Time"
          value={`${dashboardSummary?.avgResponseTime || 0}h`}
          change={-15.3}
          changeType="negative"
          color="blue"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lead Stages Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Leads by Stage</h3>
          </div>
          <div className="card-body">
            {dashboardMetrics?.leadsByStage?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardMetrics.leadsByStage.map((item: any) => ({
                      name: LEAD_STAGES.find(s => s.value === item.stage)?.label || item.stage,
                      value: item.count,
                      color: LEAD_STAGES.find(s => s.value === item.stage)?.color.replace('text-', 'bg-') || '#3b82f6',
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => (
                      <text
                        x={0}
                        y={0}
                        fill="currentColor"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {`${name}: ${(percent * 100).toFixed(0)}%`}
                      </text>
                    )}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leads by Source */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Leads by Source</h3>
          </div>
          <div className="card-body">
            {dashboardMetrics?.leadsBySource?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardMetrics.leadsBySource}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <UsersIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Lead Activity Timeline</h3>
        </div>
        <div className="card-body">
          {dashboardMetrics?.timeline?.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dashboardMetrics.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value, name) => [
                    name === 'leads' ? 'Leads' : 'Messages',
                    name === 'leads' ? value?.toLocaleString() : value,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No timeline data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="card-body space-y-3">
            <button className="w-full text-left btn btn-primary">
              <UsersIcon className="h-4 w-4 mr-2" />
              Add New Lead
            </button>
            <button className="w-full text-left btn btn-secondary">
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
              Send Message
            </button>
            <button className="w-full text-left btn btn-secondary">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              View Reports
            </button>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Performance</h3>
          </div>
          <div className="card-body space-y-4">
            {dashboardMetrics?.agentPerformance?.slice(0, 3).map((agent: any, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{agent.agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.agent.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {agent.leadsAssigned} leads
                  </p>
                  <p className="text-xs text-green-600">
                    {agent.conversions} conversions ({agent.conversionRate}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">System Status</h3>
          </div>
          <div className="card-body space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">WhatsApp Service</span>
              <span className="flex items-center text-sm text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Automation Queue</span>
              <span className="flex items-center text-sm text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="flex items-center text-sm text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Healthy
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;