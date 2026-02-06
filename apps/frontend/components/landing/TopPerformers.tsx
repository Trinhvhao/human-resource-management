'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Star, TrendingUp, Flame, Users, ArrowRight, Award, Target } from 'lucide-react';
import Button from './Button';

const TopEmployeeRow: React.FC<{ 
  rank: number; 
  name: string; 
  department: string; 
  score: number; 
  projects: number; 
  avatar: string; 
}> = ({ rank, name, department, score, projects, avatar }) => {
  
  let rankIcon;
  let rankColor;
  let rankBg;

  switch (rank) {
    case 1:
      rankIcon = <Crown size={20} className="text-yellow-500 fill-yellow-500" />;
      rankColor = "border-yellow-400";
      rankBg = "bg-yellow-50/50";
      break;
    case 2:
      rankIcon = <Medal size={20} className="text-slate-400 fill-slate-300" />;
      rankColor = "border-slate-300";
      rankBg = "bg-slate-50/50";
      break;
    case 3:
      rankIcon = <Medal size={20} className="text-amber-700 fill-amber-600" />;
      rankColor = "border-amber-600";
      rankBg = "bg-orange-50/30";
      break;
    default:
      rankIcon = <span className="text-sm font-bold text-slate-500">#{rank}</span>;
      rankColor = "border-transparent";
      rankBg = "bg-white";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: rank * 0.1 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border ${rank <= 3 ? rankColor : 'border-slate-100'} ${rankBg} hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="flex-shrink-0 w-8 flex justify-center">
        {rankIcon}
      </div>
      <div className="relative">
        <div className={`w-12 h-12 rounded-full border-2 p-0.5 ${rank <= 3 ? rankColor : 'border-slate-100'}`}>
          <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
        </div>
        {rank === 1 && (
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-3 -right-1 text-2xl"
          >
            👑
          </motion.div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-800 truncate">{name}</h4>
        <p className="text-xs text-slate-500 truncate">{department}</p>
      </div>
      <div className="text-right">
        <div className="font-bold text-brandBlue text-lg">{score}</div>
        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Điểm</div>
      </div>
    </motion.div>
  );
};

const TopDepartmentCard: React.FC<{
  rank: number;
  name: string;
  rating: number;
  employees: number;
  performance: number;
  manager: string;
}> = ({ rank, name, rating, employees, performance, manager }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: rank * 0.1 }}
    className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
  >
    <div className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brandBlue to-brandLightBlue flex items-center justify-center text-white font-bold text-lg shadow-lg">
            #{rank}
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1 block">Phòng ban</span>
            <h4 className="font-bold text-slate-800 text-sm md:text-base group-hover:text-brandBlue transition-colors">
              {name}
            </h4>
            <p className="text-xs text-slate-500 mt-1">Quản lý: {manager}</p>
          </div>
        </div>
        {rank === 1 && (
          <div className="absolute top-4 right-4">
            <div className="relative">
              <span className="absolute -inset-1 rounded-full bg-red-500 blur opacity-40 animate-pulse"></span>
              <Flame size={18} className="text-red-500 relative z-10 fill-red-500" />
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star size={12} className="text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-bold text-slate-700">{rating}</span>
          </div>
          <div className="text-[10px] text-slate-500">Đánh giá</div>
        </div>
        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users size={12} className="text-brandBlue" />
            <span className="text-xs font-bold text-slate-700">{employees}</span>
          </div>
          <div className="text-[10px] text-slate-500">Nhân viên</div>
        </div>
        <div className="bg-green-50 p-2 rounded-lg border border-green-100 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target size={12} className="text-green-600" />
            <span className="text-xs font-bold text-slate-700">{performance}%</span>
          </div>
          <div className="text-[10px] text-slate-500">Hiệu suất</div>
        </div>
      </div>
    </div>
  </motion.div>
);

const TopPerformers: React.FC = () => {
  const topEmployees = [
    { rank: 1, name: "Nguyễn Văn An", department: "Phòng IT", score: 2450, projects: 45, avatar: "https://i.pravatar.cc/100?img=33" },
    { rank: 2, name: "Trần Thị Bình", department: "Phòng Kế toán", score: 2100, projects: 38, avatar: "https://i.pravatar.cc/100?img=5" },
    { rank: 3, name: "Lê Hoàng Nam", department: "Phòng Nhân sự", score: 1950, projects: 32, avatar: "https://i.pravatar.cc/100?img=11" },
    { rank: 4, name: "Phạm Thị Hoa", department: "Phòng Marketing", score: 1800, projects: 29, avatar: "https://i.pravatar.cc/100?img=24" },
  ];

  const topDepartments = [
    { rank: 1, name: "Phòng Công nghệ thông tin", manager: "Nguyễn Văn An", rating: 4.9, employees: 25, performance: 95 },
    { rank: 2, name: "Phòng Kế toán", manager: "Trần Thị Bình", rating: 4.8, employees: 12, performance: 92 },
    { rank: 3, name: "Phòng Kinh doanh", manager: "Đỗ Minh Tâm", rating: 4.7, employees: 30, performance: 93 },
    { rank: 4, name: "Phòng Marketing", manager: "Phạm Thị Hoa", rating: 4.6, employees: 15, performance: 90 },
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brandBlue/5 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/5 rounded-full blur-[100px]"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-100 border border-yellow-200 text-yellow-700 text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Trophy size={14} className="fill-yellow-600" />
            Bảng vàng thành tích
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-slate-900 mb-4"
          >
            Vinh danh <span className="text-brandBlue">Nhân viên & Phòng ban</span>
          </motion.h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Cập nhật liên tục theo thời gian thực. Ghi nhận những đóng góp xuất sắc cho sự phát triển của công ty!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Column 1: Top Employees */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brandBlue rounded-xl text-white shadow-lg shadow-brandBlue/30">
                  <Crown size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Nhân viên xuất sắc</h3>
                  <p className="text-xs text-slate-500">Xếp hạng theo hiệu suất tháng này</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full text-xs h-8 px-4">Xem tất cả</Button>
            </div>

            <div className="space-y-4">
              {topEmployees.map((employee) => (
                <TopEmployeeRow key={employee.rank} {...employee} />
              ))}
              
              {/* Call to action card */}
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-brandBlue rounded-2xl p-6 text-white text-center flex flex-col items-center justify-center border border-white/10 relative overflow-hidden group mt-4"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Award size={48} className="mb-3 text-brandLightBlue relative z-10" />
                <h4 className="font-bold text-lg mb-2 relative z-10">Bạn muốn được vinh danh?</h4>
                <p className="text-brandLightBlue/80 text-sm mb-4 relative z-10">Nỗ lực hết mình và đạt thành tích xuất sắc.</p>
                <button className="text-sm font-bold bg-white text-brandBlue px-4 py-2 rounded-full hover:bg-secondary hover:text-white transition-colors flex items-center gap-2 relative z-10">
                  Xem tiêu chí <ArrowRight size={14} />
                </button>
              </motion.div>
            </div>
          </div>

          {/* Column 2: Top Departments */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-secondary rounded-xl text-white shadow-lg shadow-secondary/30">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Phòng ban tiêu biểu</h3>
                  <p className="text-xs text-slate-500">Hiệu suất và đánh giá cao nhất</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full text-xs h-8 px-4">Khám phá</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {topDepartments.map((dept) => (
                <TopDepartmentCard key={dept.rank} {...dept} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopPerformers;
