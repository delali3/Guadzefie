// src/components/dashboard/SalesChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
  data: Array<{
    name: string;
    sales: number;
    orders: number;
  }>;
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Sales ($)" />
        <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name="Orders" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SalesChart;