'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, QrCode, Calendar, CheckCircle2, MapPin, Clock, Fingerprint, UserCheck } from 'lucide-react';

const FEATURES = [
  {
    id: 0,
    icon: <Fingerprint size={24} />,
    title: "Chấm công thông minh",
    desc: "Chấm công bằng vân tay, khuôn mặt hoặc QR code. Tự động ghi nhận thời gian vào/ra chính xác đến từng giây.",
  },
  {
    id: 1,
    icon: <Bell size={24} />,
    title: "Thông báo tức thì",
    desc: "Nhận thông báo đẩy về lịch làm việc, nghỉ phép được duyệt, hoặc thay đổi ca làm việc ngay lập tức.",
  },
  {
    id: 2,
    icon: <Calendar size={24} />,
    title: "Lịch sử công việc",
    desc: "Tự động lưu trữ tất cả lịch sử chấm công, nghỉ phép, làm thêm giờ và bảng lương hàng tháng.",
  }
];

// --- Phone Screen Components ---

const ScreenAttendance = () => (
  <div className="space-y-4">
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-16 h-16 bg-brandBlue/5 rounded-bl-full -mr-4 -mt-4"></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Hôm nay</div>
          <div className="font-bold text-brandBlue text-lg">Thứ Hai, 30/01/2026</div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <MapPin size={10} /> Văn phòng HN
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-4">
        <div className="space-y-1">
          <div className="text-xs text-gray-400">Giờ vào</div>
          <div className="font-semibold text-sm text-green-600">08:00 AM</div>
        </div>
        <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-inner">
          <Fingerprint size={48} className="text-brandBlue" />
        </div>
      </div>

      {/* Scan Animation */}
      <motion.div 
        className="absolute top-[60%] right-4 w-12 h-0.5 bg-green-500 shadow-[0_0_10px_green]"
        animate={{ y: [-24, 24, -24] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="h-20 bg-green-50/50 border border-green-100 rounded-xl p-3 flex flex-col justify-between">
        <UserCheck size={16} className="text-green-600" />
        <div className="text-xs font-medium text-green-600">Đã chấm công</div>
      </div>
      <div className="h-20 bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex flex-col justify-between">
        <Clock size={16} className="text-secondary" />
        <div className="text-xs font-medium text-secondary">8h 30p</div>
      </div>
    </div>
  </div>
);

const ScreenNotifications = () => (
  <div className="space-y-3">
    <div className="flex justify-between items-center mb-2 px-1">
      <span className="font-bold text-sm text-gray-700">Mới nhất</span>
      <span className="text-xs text-brandBlue font-medium">Đánh dấu đã đọc</span>
    </div>
    {[
      { title: "Nghỉ phép được duyệt", msg: "Đơn nghỉ phép ngày 05/02 đã được phê duyệt.", time: "2m ago", active: true },
      { title: "Thay đổi ca làm việc", msg: "Ca làm việc tuần sau chuyển sang ca sáng.", time: "1h ago", active: false },
      { title: "Bảng lương tháng 1", msg: "Bảng lương tháng 1/2026 đã được cập nhật.", time: "3h ago", active: false },
    ].map((item, i) => (
      <div key={i} className={`bg-white p-3 rounded-xl border ${item.active ? 'border-l-4 border-l-secondary shadow-md' : 'border-gray-100 shadow-sm'}`}>
        <div className="flex gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.active ? 'bg-secondary/10 text-secondary' : 'bg-gray-100 text-gray-400'}`}>
            <Bell size={14} fill={item.active ? "currentColor" : "none"} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h4 className={`text-sm font-bold ${item.active ? 'text-gray-900' : 'text-gray-600'}`}>{item.title}</h4>
              <span className="text-[10px] text-gray-400">{item.time}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.msg}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ScreenHistory = () => (
  <div className="space-y-4">
    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
      <div className="bg-brandBlue text-white px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shadow-lg shadow-brandBlue/30">Tất cả</div>
      <div className="bg-white text-gray-500 border border-gray-200 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap">Chấm công</div>
      <div className="bg-white text-gray-500 border border-gray-200 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap">Nghỉ phép</div>
    </div>

    <div className="space-y-3">
      {[
        { title: "Chấm công đúng giờ", date: "30/01/2026", status: "Hoàn thành", score: "+10đ" },
        { title: "Nghỉ phép có lương", date: "25/01/2026", status: "Đã duyệt", score: "" },
        { title: "Làm thêm giờ", date: "20/01/2026", status: "Đã duyệt", score: "+5đ" },
      ].map((item, i) => (
        <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-xs font-bold text-gray-400 border border-gray-100">
              <span>{item.date.split('/')[0]}</span>
              <span className="text-[8px] font-normal">T{item.date.split('/')[1]}</span>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">{item.title}</div>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-0.5">
                <CheckCircle2 size={10} /> {item.status}
              </div>
            </div>
          </div>
          {item.score && (
            <div className="text-xs font-bold text-brandBlue bg-brandBlue/5 px-2 py-1 rounded">
              {item.score}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const AppShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, []);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % FEATURES.length);
    }, 10000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleFeatureClick = (index: number) => {
    setActiveIndex(index);
    startTimer();
  };

  return (
    <section className="py-24 bg-offWhite overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-16">
          
          {/* Sticky Phone Mockup */}
          <div className="lg:w-1/2 sticky top-24 h-[650px] flex items-center justify-center">
            <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden z-10 transition-transform duration-500 hover:scale-[1.01]">
              {/* Screen Content */}
              <div className="absolute inset-0 bg-[#F5F7FA] flex flex-col">
                
                {/* Static App Header */}
                <div className="bg-brandBlue h-36 p-6 pt-14 text-white rounded-b-[2.5rem] relative z-10 shadow-lg flex-shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 overflow-hidden">
                        <img src="https://i.pravatar.cc/100?img=12" alt="User" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-xs opacity-70">Xin chào,</div>
                        <div className="font-bold text-sm">Nguyễn Văn A</div>
                      </div>
                    </div>
                    <div className="relative">
                      <Bell size={22} />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brandBlue"></span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Body Content */}
                <div className="flex-1 p-5 overflow-hidden relative -mt-6 z-20">
                  <AnimatePresence mode='wait'>
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="h-full"
                    >
                      {activeIndex === 0 && <ScreenAttendance />}
                      {activeIndex === 1 && <ScreenNotifications />}
                      {activeIndex === 2 && <ScreenHistory />}
                    </motion.div>
                  </AnimatePresence>
                </div>
                
                {/* Bottom Nav */}
                <div className="h-20 bg-white border-t border-gray-100 flex justify-around items-center px-6 pb-2 text-gray-300 flex-shrink-0">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className={`flex flex-col items-center gap-1 transition-colors duration-300 ${activeIndex === idx ? 'text-brandBlue' : 'text-gray-300'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center`}>
                        {idx === 0 && <Fingerprint size={20} />}
                        {idx === 1 && <Bell size={20} />}
                        {idx === 2 && <Calendar size={20} />}
                      </div>
                      <div className={`w-1 h-1 rounded-full ${activeIndex === idx ? 'bg-brandBlue' : 'bg-transparent'}`}></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-xl z-30 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-800 rounded-full opacity-50"></div>
              </div>
            </div>

            {/* Background Decor Behind Phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-brandBlue/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
          </div>

          {/* Feature List (Right Side) */}
          <div className="lg:w-1/2 pt-8 lg:pt-12 space-y-12">
            <div className="mb-10 text-center lg:text-left">
              <span className="text-secondary font-bold uppercase tracking-wider text-sm bg-secondary/10 px-3 py-1 rounded-full">HRMS Mobile App</span>
              <h2 className="text-4xl font-bold mt-4 mb-4 text-primary">Quản lý nhân sự <br/>ngay trên tay bạn</h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Ứng dụng di động được thiết kế tối ưu cho nhân viên, giúp quản lý công việc và không bỏ lỡ bất kỳ thông tin quan trọng nào.
              </p>
            </div>

            <div className="space-y-6 relative">
              {FEATURES.map((feature, index) => (
                <div 
                  key={feature.id}
                  onClick={() => handleFeatureClick(index)}
                  className={`
                    cursor-pointer group relative p-6 rounded-2xl transition-all duration-500 border-2
                    ${activeIndex === index 
                      ? 'bg-white border-brandBlue/10 shadow-xl scale-100 lg:scale-105 z-10' 
                      : 'bg-transparent border-transparent hover:bg-white/50 hover:border-gray-100 opacity-60 hover:opacity-100'
                    }
                  `}
                >
                  {activeIndex === index && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary rounded-l-2xl" 
                    />
                  )}

                  <div className="flex gap-5">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300
                      ${activeIndex === index ? 'bg-brandBlue text-white shadow-lg shadow-brandBlue/30' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-brandBlue'}
                    `}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold mb-2 transition-colors ${activeIndex === index ? 'text-primary' : 'text-gray-600'}`}>
                        {feature.title}
                      </h3>
                      <p className="text-gray-500 leading-relaxed text-sm lg:text-base">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AppShowcase;
