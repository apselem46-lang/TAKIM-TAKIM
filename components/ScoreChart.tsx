import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GameHistoryItem } from '../types';

interface ScoreChartProps {
  history: GameHistoryItem[];
}

const ScoreChart: React.FC<ScoreChartProps> = ({ history }) => {
  // Transform history for the chart. Add an initial 0 point.
  const data = [
    { level: 0, score: 0 },
    ...history.map(h => ({
      level: h.level,
      score: h.score,
      result: h.isCorrect ? 'Correct' : 'Incorrect'
    }))
  ];

  return (
    <div className="w-full h-64 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <h3 className="text-slate-400 text-sm font-semibold mb-4 uppercase tracking-wider">Performance History</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="level" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
            itemStyle={{ color: '#10b981' }}
          />
          <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreChart;
