import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { MoodEntry } from '../types';

interface MoodChartProps {
  entries: MoodEntry[];
}

export const MoodChart: React.FC<MoodChartProps> = ({ entries }) => {
  // Prepare data for the chart
  const chartData = entries
    .slice(-30) // Show last 30 entries
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      mood: entry.mood,
      fullDate: entry.date,
      label: entry.moodLabel,
      notes: entry.notes
    }))
    .reverse(); // Most recent first

  // Calculate average mood
  const averageMood = entries.length > 0 
    ? (entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length).toFixed(1)
    : '0';

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="card p-4 shadow-glow-lg max-w-xs">
          <p className="font-semibold text-primary-300 mb-1">{data.fullDate}</p>
          <p className="text-secondary-300 mb-1">
            Mood: {data.label} ({data.mood}/5)
          </p>
          {data.notes && (
            <p className="text-sm text-gray-300 mt-2 border-t border-primary-500/20 pt-2">
              {data.notes}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-500/10 to-blue-500/10 rounded-2xl p-6 border border-primary-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary-300">{entries.length}</span>
            </div>
            <div>
              <p className="text-sm text-primary-400 font-medium">Total Entries</p>
              <p className="text-xs text-gray-400">Mood records tracked</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-green-300">{averageMood}</span>
            </div>
            <div>
              <p className="text-sm text-green-400 font-medium">Average Mood</p>
              <p className="text-xs text-gray-400">Out of 5.0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-secondary-500/10 to-purple-500/10 rounded-2xl p-6 border border-secondary-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-secondary-500/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-secondary-300">
                {entries.filter(entry => {
                  const entryDate = new Date(entry.date);
                  const now = new Date();
                  return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
                }).length}
              </span>
            </div>
            <div>
              <p className="text-sm text-secondary-400 font-medium">This Month</p>
              <p className="text-xs text-gray-400">Recent activity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20">
        <h4 className="text-lg font-bold text-primary-300 mb-6 flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
          <span>Mood Trend (Last 30 entries)</span>
        </h4>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 84, 255, 0.1)" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: 'rgba(150, 84, 255, 0.2)' }}
              tickLine={{ stroke: 'rgba(150, 84, 255, 0.2)' }}
            />
            <YAxis 
              domain={[1, 5]} 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: 'rgba(150, 84, 255, 0.2)' }}
              tickLine={{ stroke: 'rgba(150, 84, 255, 0.2)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="mood" 
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={{ fill: '#9654ff', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, fill: '#d946ef', stroke: '#9654ff', strokeWidth: 2 }}
            />
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9654ff" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Mood Distribution Bar Chart */}
      <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20">
        <h4 className="text-lg font-bold text-secondary-300 mb-6 flex items-center space-x-2">
          <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
          <span>Mood Distribution</span>
        </h4>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[
            { mood: 'Terrible', count: entries.filter(e => e.mood === 1).length, fill: '#ef4444' },
            { mood: 'Bad', count: entries.filter(e => e.mood === 2).length, fill: '#f97316' },
            { mood: 'Okay', count: entries.filter(e => e.mood === 3).length, fill: '#eab308' },
            { mood: 'Good', count: entries.filter(e => e.mood === 4).length, fill: '#22c55e' },
            { mood: 'Great', count: entries.filter(e => e.mood === 5).length, fill: '#16a34a' },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 84, 255, 0.1)" />
            <XAxis 
              dataKey="mood" 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: 'rgba(150, 84, 255, 0.2)' }}
              tickLine={{ stroke: 'rgba(150, 84, 255, 0.2)' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: 'rgba(150, 84, 255, 0.2)' }}
              tickLine={{ stroke: 'rgba(150, 84, 255, 0.2)' }}
            />
            <Tooltip 
              formatter={(value) => [`${value} entries`, 'Count']}
              labelStyle={{ color: '#e5e7eb' }}
              contentStyle={{ 
                backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                border: '1px solid rgba(150, 84, 255, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)'
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};