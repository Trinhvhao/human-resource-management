'use client';

import React, { useState } from 'react';
import { Users, MapPin, Clock, ArrowRight, Search, Grid, CalendarDays, ChevronLeft, ChevronRight, Briefcase, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

const EmployeeCard: React.FC<{ 
  name: string; 
  position: string; 
  department: string; 
  joinDate: string; 
  status: string; 
  avatar: string; 
  index: number 
}> = ({ name, position, department, joinDate, status, avatar, index }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col h-full"
  >
    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-brandBlue to-brandLightBlue">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity"></div>
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="w-32 h-32 rounded-full border-4 border-white/30 overflow-hidden transform group-hover:scale-110 transition-transform duration-700">
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
        {status}
      </div>
    </div>
    <div className="p-6 flex-1 flex flex-col">
      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brandBlue transition-colors leading-snug text-center">
        {name}
      </h3>
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Briefcase size={16} className="text-slate-400" />
          <span>{position}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <MapPin size={16} className="text-slate-400" />
          <span className="truncate">{department}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Clock size={16} className="text-slate-400" />
          <span>Tham gia: {joinDate}</span>
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-slate-50">
        <button className="text-brandBlue font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
          Xem hồ sơ <ArrowRight size={16} />
        </button>
      </div>
    </div>
  </motion.div>
);

const DepartmentView: React.FC<{ departments: any[] }> = ({ departments }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
    >
      <div className="p-6 lg:p-8 bg-white max-h-[600px] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-secondary font-bold uppercase tracking-wider text-xs">Cơ cấu tổ chức</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Các phòng ban</h2>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex">Xuất báo cáo</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {departments.map((dept, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-50 hover:bg-white p-6 rounded-2xl border border-slate-100 hover:border-secondary/20 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brandBlue/10 flex items-center justify-center group-hover:bg-brandBlue group-hover:text-white transition-colors">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-brandBlue transition-colors">{dept.name}</h3>
                    <p className="text-xs text-slate-500">{dept.manager}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <div className="text-2xl font-bold text-brandBlue">{dept.employees}</div>
                  <div className="text-xs text-slate-500">Nhân viên</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <div className="text-2xl font-bold text-secondary">{dept.performance}%</div>
                  <div className="text-xs text-slate-500">Hiệu suất</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const EmployeeShowcase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'departments'>('grid');

  const employees = [
    {
      name: "Nguyễn Văn An",
      position: "Trưởng phòng IT",
      department: "Phòng Công nghệ thông tin",
      joinDate: "01/2020",
      status: "Đang làm việc",
      avatar: "https://i.pravatar.cc/200?img=33"
    },
    {
      name: "Trần Thị Bình",
      position: "Kế toán trưởng",
      department: "Phòng Kế toán",
      joinDate: "03/2019",
      status: "Đang làm việc",
      avatar: "https://i.pravatar.cc/200?img=5"
    },
    {
      name: "Lê Hoàng Nam",
      position: "Giám đốc nhân sự",
      department: "Phòng Nhân sự",
      joinDate: "06/2018",
      status: "Đang làm việc",
      avatar: "https://i.pravatar.cc/200?img=11"
    },
    {
      name: "Phạm Thị Hoa",
      position: "Chuyên viên Marketing",
      department: "Phòng Marketing",
      joinDate: "09/2021",
      status: "Đang làm việc",
      avatar: "https://i.pravatar.cc/200?img=24"
    },
    {
      name: "Vũ Tuấn Anh",
      position: "Kỹ sư phần mềm",
      department: "Phòng Công nghệ thông tin",
      joinDate: "02/2022",
      status: "Đang làm việc",
      avatar: "https://i.pravatar.cc/200?img=59"
    },
    {
      name: "Đỗ Minh Tâm",
      position: "Trưởng phòng kinh doanh",
      department: "Phòng Kinh doanh",
      joinDate: "11/2017",
      status: "Đang làm việc",
      avatar: "https://i.pravatar.cc/200?img=12"
    }
  ];

  const departments = [
    { name: "Phòng Công nghệ thông tin", manager: "Nguyễn Văn An", employees: 25, performance: 95 },
    { name: "Phòng Kế toán", manager: "Trần Thị Bình", employees: 12, performance: 92 },
    { name: "Phòng Nhân sự", manager: "Lê Hoàng Nam", employees: 8, performance: 88 },
    { name: "Phòng Marketing", manager: "Phạm Thị Hoa", employees: 15, performance: 90 },
    { name: "Phòng Kinh doanh", manager: "Đỗ Minh Tâm", employees: 30, performance: 93 },
    { name: "Phòng Hành chính", manager: "Hoàng Thị Mai", employees: 10, performance: 87 }
  ];

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="employees" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-8 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Đội ngũ nhân sự</h2>
            <p className="text-slate-500 text-lg">Khám phá đội ngũ nhân viên tài năng và các phòng ban trong công ty.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant={viewMode === 'grid' ? "primary" : "outline"} 
              className="rounded-full px-6 gap-2"
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} /> Nhân viên
            </Button>
            <Button 
              variant={viewMode === 'departments' ? "primary" : "outline"} 
              className="rounded-full px-6 gap-2"
              onClick={() => setViewMode('departments')}
            >
              <CalendarDays size={18} /> Phòng ban
            </Button>
          </div>
        </div>

        {viewMode === 'grid' && (
          <div className="mb-12 relative max-w-lg">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brandBlue transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhân viên, vị trí, phòng ban..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all shadow-sm"
              />
            </div>
          </div>
        )}

        <div className="min-h-[600px]">
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div 
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee, index) => (
                    <EmployeeCard key={employee.name} index={index} {...employee} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                      <Search className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Không tìm thấy kết quả</h3>
                    <p className="text-slate-500">Vui lòng thử lại với từ khóa khác.</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-4 text-brandBlue font-semibold hover:underline"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="departments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <DepartmentView departments={departments} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default EmployeeShowcase;
