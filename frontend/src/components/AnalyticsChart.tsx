import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface ChartDataPoint {
  date: string;
  comments: number;
  matches: number;
  dms: number;
  leads: number;
}

interface AnalyticsChartProps {
  data: ChartDataPoint[];
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data }) => {
  // Format date labels (e.g. "2026-06-10" -> "Jun 10")
  const formatDate = (dateStr: any) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="w-full h-80 bg-[#09090b]/30 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorDms" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7f22fe" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7f22fe" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dx={-5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#121214',
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px',
            }}
            labelFormatter={formatDate}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }}
          />
          <Area
            name="DMs Sent"
            type="monotone"
            dataKey="dms"
            stroke="#7f22fe"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDms)"
          />
          <Area
            name="Leads Collected"
            type="monotone"
            dataKey="leads"
            stroke="#14b8a6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLeads)"
          />
          <Area
            name="Comments Ingested"
            type="monotone"
            dataKey="comments"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorComments)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
