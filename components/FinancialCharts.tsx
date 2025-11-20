
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, BarChart, Bar, Cell, ComposedChart, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-stone-500 text-xs mb-1 font-serif uppercase tracking-widest border-b border-stone-200 pb-1">{label}</p>
        {payload.map((p: any, index: number) => {
            if (p.value === null || p.value === undefined) return null;
            // Skip rendering 'Confidence Interval' array in tooltip text, only show single lines
            if (p.name === 'Confidence Interval') return null;
            
            return (
                <p key={index} className={`font-mono font-bold text-sm ${p.name === 'Optimistic' || p.name === 'Pessimistic' ? 'text-stone-400 text-xs' : 'text-black'}`}>
                    {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
                </p>
            );
        })}
      </div>
    );
  }
  return null;
};

const ValuationTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[180px]">
        <p className="text-black text-[10px] mb-3 font-bold uppercase tracking-widest border-b border-black pb-2">
          {data.name}
        </p>
        <div className="space-y-1">
            <div className="flex justify-between items-baseline">
                <span className="text-stone-500 text-xs">Valuation</span>
                <span className="text-black font-mono font-bold text-base">
                    ${data.value.toLocaleString()}
                </span>
            </div>
            {data.contribution && (
                <div className="flex justify-between items-center pt-1">
                    <span className="text-stone-500 text-[10px] uppercase tracking-wider">Contribution</span>
                    <span className="text-stone-800 font-mono text-xs">
                        {data.contribution}%
                    </span>
                </div>
            )}
        </div>
      </div>
    );
  }
  return null;
};

export const MarketTrendChart = ({ data, dataKey }: { data: any[], dataKey: string }) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="#e5e5e5" vertical={false} />
          <XAxis dataKey="Year" tick={{fontFamily: 'Inter', fontSize: 12, fill: '#000000'}} axisLine={{stroke: '#000000'}} tickLine={false} />
          <YAxis tick={{fontFamily: 'Inter', fontSize: 12, fill: '#000000'}} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={dataKey} stroke="#000000" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" name={dataKey} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ForecastChart = ({ data, targetCol }: { data: any[], targetCol: string }) => {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis dataKey="Year" tick={{fontFamily: 'Inter', fontSize: 12, fill: '#000000'}} axisLine={{stroke: '#000000'}} tickLine={false} />
            <YAxis tick={{fontFamily: 'Inter', fontSize: 12, fill: '#000000'}} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Confidence Interval Area using Range Tuple [Low, High] */}
            <Area type="monotone" dataKey="Confidence" stroke="none" fill="#f5f5f4" name="Confidence Interval" />
            
            {/* Guides for High/Low */}
             <Line type="monotone" dataKey="High" stroke="#d6d3d1" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Optimistic" />
             <Line type="monotone" dataKey="Low" stroke="#d6d3d1" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Pessimistic" />

            {/* Main Lines */}
            <Line type="monotone" dataKey="Historical" stroke="#000000" strokeWidth={2} dot={{r: 4, fill: '#000000'}} activeDot={{r: 6}} connectNulls />
            <Line type="monotone" dataKey="Forecast" stroke="#888888" strokeWidth={2} strokeDasharray="5 5" dot={{r: 4, fill: '#888888'}} activeDot={{r: 6}} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

export const VarianceChart = ({ data, metric }: { data: any[], metric: string }) => {
    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" stroke="#e5e5e5" vertical={false} />
                    <XAxis dataKey="Year" tick={{fontFamily: 'Inter', fontSize: 12, fill: '#000000'}} axisLine={{stroke: '#000000'}} tickLine={false} />
                    <YAxis tick={{fontFamily: 'Inter', fontSize: 12, fill: '#000000'}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#000" />
                    <Bar dataKey="Variance" name="Variance vs Budget">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.Variance >= 0 ? '#000000' : '#999999'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export const WaterfallChart = ({ data }: { data: any[] }) => {
    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                     <CartesianGrid strokeDasharray="0" stroke="#e5e5e5" vertical={false} />
                     <XAxis dataKey="name" tick={{fontFamily: 'Inter', fontSize: 12, fill: '#000000'}} axisLine={{stroke: '#000000'}} tickLine={false} />
                     <YAxis tick={{fontFamily: 'Inter', fontSize: 12, fill: '#000000'}} axisLine={false} tickLine={false} />
                     <Tooltip content={<ValuationTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                     <Bar dataKey="value">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isTotal ? '#000000' : (entry.value >= 0 ? '#666666' : '#bbbbbb')} />
                        ))}
                     </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
