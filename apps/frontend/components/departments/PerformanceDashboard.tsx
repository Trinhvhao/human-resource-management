'use client';

import { TrendingUp, TrendingDown, Minus, Users, Clock, Award, Target, Zap } from 'lucide-react';
import { Line } from 'recharts';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PerformanceData {
  employeeCount: number;
  totalAttendance: number;
  presentCount: number;
  lateCount: number;
  attendanceRate: number;
  onTimeRate: number;
  performanceScore: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  lastMonthRate: number;
  topPerformers: Array<{
    id: string;
    employeeCode: string;
    fullName: string;
    position: string;
    attendanceRate: number;
    presentDays: number;
    totalDays: number;
    lateDays: number;
  }>;
  trendData: Array<{
    monthLabel: string;
    attendanceRate: number;
  }>;
}

interface PerformanceDashboardProps {
  data: PerformanceData;
  loading?: boolean;
}

export default function PerformanceDashboard({ data, loading }: PerformanceDashboardProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-slate-100 rounded-xl"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (data.trend === 'up') return <TrendingUp size={18} />;
    if (data.trend === 'down') return <TrendingDown size={18} />;
    return <Minus size={18} />;
  };

  const getTrendColor = () => {
    if (data.trend === 'up') return 'text-green-600 bg-green-50 border-green-200';
    if (data.trend === 'down') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 75) return 'from-blue-500 to-indigo-600';
    if (score >= 60) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: 'Xuất sắc', color: 'bg-green-100 text-green-700 border-green-200' };
    if (score >= 75) return { text: 'Tốt', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (score >= 60) return { text: 'Khá', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { text: 'Cần cải thiện', color: 'bg-red-100 text-red-700 border-red-200' };
  };

  const scoreBadge = getScoreBadge(data.performanceScore);

  return (
    <div className="space-y-4">
      {/* Performance Score Card - Hero Style */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getScoreColor(data.performanceScore)} p-8 text-white shadow-xl`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
                  Điểm hiệu suất
                </p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${scoreBadge.color} border`}>
                  {scoreBadge.text}
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-6xl font-bold tracking-tight">{data.performanceScore.toFixed(1)}</span>
              <span className="text-3xl font-semibold opacity-60">/100</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30`}>
              {getTrendIcon()}
              <span className="text-2xl font-bold">
                {data.trendPercentage > 0 ? '+' : ''}{data.trendPercentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm opacity-75 mt-2 font-medium">so với tháng trước</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attendance Rate */}
        <div className="group bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Users className="text-white" size={22} />
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              data.attendanceRate >= 95 ? 'bg-green-50 text-green-700 border-green-200' : 
              data.attendanceRate >= 85 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {data.attendanceRate >= 95 ? 'Xuất sắc' : 
               data.attendanceRate >= 85 ? 'Tốt' : 'Cần cải thiện'}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-600 mb-2">Tỷ lệ đi làm</p>
          <p className="text-3xl font-bold text-slate-900 mb-3">{data.attendanceRate.toFixed(1)}%</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{data.presentCount}/{data.totalAttendance} ngày</span>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                style={{ width: `${data.attendanceRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* On-Time Rate */}
        <div className="group bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-green-300 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Clock className="text-white" size={22} />
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              data.onTimeRate >= 95 ? 'bg-green-50 text-green-700 border-green-200' : 
              data.onTimeRate >= 85 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {data.onTimeRate >= 95 ? 'Xuất sắc' : 
               data.onTimeRate >= 85 ? 'Tốt' : 'Cần cải thiện'}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-600 mb-2">Tỷ lệ đúng giờ</p>
          <p className="text-3xl font-bold text-slate-900 mb-3">{data.onTimeRate.toFixed(1)}%</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{data.lateCount} lần muộn</span>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all"
                style={{ width: `${data.onTimeRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Employee Count */}
        <div className="group bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Target className="text-white" size={22} />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Hoạt động
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-600 mb-2">Tổng nhân viên</p>
          <p className="text-3xl font-bold text-slate-900 mb-3">{data.employeeCount}</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">100% đang làm việc</span>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {data.trendData && data.trendData.length > 0 && (
        <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Xu hướng 6 tháng gần đây</h3>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-600 font-medium">Tỷ lệ đi làm</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.trendData}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="monthLabel" 
                stroke="#64748b"
                style={{ fontSize: '13px', fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '13px', fontWeight: 600 }}
                domain={[0, 100]}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: any) => [`${value}%`, 'Tỷ lệ đi làm']}
              />
              <Line 
                type="monotone" 
                dataKey="attendanceRate" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 2 }}
                fill="url(#colorAttendance)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Performers */}
      {data.topPerformers && data.topPerformers.length > 0 && (
        <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Award className="text-white" size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Top 5 nhân viên xuất sắc</h3>
          </div>
          <div className="space-y-3">
            {data.topPerformers.map((performer, index) => (
              <div 
                key={performer.id}
                className="group flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                  index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                  index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                  'bg-gradient-to-br from-blue-400 to-blue-500'
                }`}>
                  {index + 1}
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <Award size={12} className={
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-slate-400' :
                        'text-orange-500'
                      } />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {performer.fullName}
                  </p>
                  <p className="text-sm text-slate-600 truncate">
                    {performer.position} • {performer.employeeCode}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${performer.attendanceRate}%` }}
                      ></div>
                    </div>
                    <p className="text-lg font-bold text-blue-600 min-w-[3rem]">{performer.attendanceRate}%</p>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {performer.presentDays}/{performer.totalDays} ngày
                    {performer.lateDays > 0 && ` • ${performer.lateDays} muộn`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
