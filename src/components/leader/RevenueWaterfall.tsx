'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface RevenueWaterfallProps {
  data: Record<number, number>;
}

/**
 * RevenueWaterfall
 * Waterfall chart showing L1-L6 revenue breakdown
 */
export default function RevenueWaterfall({ data }: RevenueWaterfallProps) {
  // Transform data for waterfall visualization
  const chartData = [
    {
      name: 'Personal',
      value: data[0] || 0,
      fill: '#10b981',
    },
    {
      name: 'L1',
      value: data[1] || 0,
      fill: '#3b82f6',
    },
    {
      name: 'L2',
      value: data[2] || 0,
      fill: '#06b6d4',
    },
    {
      name: 'L3',
      value: data[3] || 0,
      fill: '#8b5cf6',
    },
    {
      name: 'L4',
      value: data[4] || 0,
      fill: '#ec4899',
    },
    {
      name: 'L5',
      value: data[5] || 0,
      fill: '#f97316',
    },
    {
      name: 'L6',
      value: data[6] || 0,
      fill: '#eab308',
    },
  ];

  const CustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-2 shadow-lg">
          <p className="text-xs font-semibold text-gray-100">{payload[0].name}</p>
          <p className="text-xs text-gray-300">
            ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
        <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
