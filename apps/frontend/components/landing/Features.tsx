import React from 'react';
import { Clock, ShieldCheck, BarChart3, Users, FileText, Calendar, Smartphone, TrendingUp, CheckCircle, Lock, Mail, Layout } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Visual Components for Cards ---

const AttendanceVisual = () => (
  <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
    
    <div className="w-24 h-24 bg-white rounded-lg p-2 relative z-10 flex items-center justify-center">
      <Clock size={48} className="text-brandBlue" />
    </div>

    <motion.div 
      animate={{ opacity: [0, 0, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity, times: [0, 0.45, 0.5, 1] }}
      className="absolute inset-0 bg-green-500/20 z-30 flex items-center justify-center"
    >
        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Chấm công thành công</div>
    </motion.div>
  </div>
);

const ChartVisual = () => (
  <div className="w-full h-full flex items-end justify-between gap-2 px-4 pb-4 pt-8 bg-white rounded-xl border border-slate-100 relative overflow-hidden">
     <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-brandLightBlue/10"></div>
     {[40, 70, 50, 90, 60].map((h, i) => (
        <motion.div
            key={i}
            initial={{ height: '10%' }}
            whileInView={{ height: `${h}%` }}
            transition={{ duration: 1, delay: i * 0.1, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
            className="w-full bg-brandBlue rounded-t-sm opacity-80"
        />
     ))}
  </div>
);

const SecurityVisual = () => (
  <div className="w-full h-full flex items-center justify-center bg-brandBlue rounded-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brandLightBlue/20 to-transparent"></div>
      
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute w-40 h-40 border border-dashed border-white/20 rounded-full m-auto inset-0"
      ></motion.div>

      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="relative z-10"
      >
        <ShieldCheck size={72} className="text-white" />
      </motion.div>
  </div>
);

const ReportVisual = () => (
  <div className="w-full h-full bg-offWhite rounded-xl p-4 relative border border-slate-200 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-3/4 aspect-[1.4] bg-white shadow-xl shadow-slate-200/50 border border-slate-100 p-4 flex flex-col gap-3 rounded-lg"
      >
          <div className="h-2 w-1/3 bg-slate-200 rounded"></div>
          <div className="h-1 w-3/4 bg-slate-100 rounded"></div>
          <div className="h-1 w-2/3 bg-slate-100 rounded"></div>
          <div className="mt-auto flex justify-between items-end">
             <div className="w-10 h-10 rounded-full bg-brandBlue flex items-center justify-center shadow-lg shadow-brandBlue/30">
                 <FileText size={20} className="text-white" />
             </div>
             <div className="h-8 w-16 bg-slate-100 rounded"></div>
          </div>
      </motion.div>
      <div className="absolute top-3 right-3">
         <Mail size={18} className="text-slate-300" />
      </div>
  </div>
);

const WebAppVisual = () => (
  <div className="w-full h-full bg-slate-50 rounded-xl p-4 relative border border-slate-200 overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      
      <motion.div 
         initial={{ y: 20, opacity: 0 }}
         whileInView={{ y: 0, opacity: 1 }}
         transition={{ duration: 0.5 }}
         className="w-5/6 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden"
      >
          <div className="h-6 bg-slate-100 border-b border-slate-200 flex items-center px-2 gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <div className="ml-2 w-full h-3 bg-white rounded-sm"></div>
          </div>
          <div className="p-3 space-y-2">
              <div className="flex gap-2">
                   <div className="w-8 h-8 rounded bg-brandBlue/10"></div>
                   <div className="flex-1 space-y-1">
                       <div className="w-2/3 h-2 bg-slate-100 rounded"></div>
                       <div className="w-1/2 h-2 bg-slate-100 rounded"></div>
                   </div>
              </div>
              <div className="h-16 bg-slate-50 rounded border border-slate-100 border-dashed flex items-center justify-center">
                  <Users size={24} className="text-brandBlue/20" />
              </div>
          </div>
      </motion.div>

      <motion.div
         animate={{ y: [0, -10, 0] }}
         transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
         className="absolute -right-2 -bottom-2 w-20 h-32 bg-slate-800 rounded-xl border-4 border-slate-900 shadow-2xl p-1"
      >
          <div className="w-full h-full bg-white rounded-lg opacity-90"></div>
      </motion.div>
  </div>
);

// --- Main Feature Card Component ---

const BentoCard: React.FC<{
  title: string;
  desc: string;
  className?: string;
  visual?: React.ReactNode;
  icon?: React.ReactNode;
  delay?: number;
}> = ({ title, desc, className = "", visual, icon, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden relative group ${className}`}
    >
      <div className="flex-1 min-h-[180px] mb-6 relative rounded-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
         {visual ? visual : (
            <div className="w-full h-full bg-offWhite flex items-center justify-center">
                <div className="p-4 bg-white rounded-2xl shadow-sm text-brandBlue">
                    {icon}
                </div>
            </div>
         )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
           {icon && <span className="text-secondary">{React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}</span>}
           {title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
};

const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-offWhite relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-secondary font-bold tracking-wider uppercase text-xs bg-orange-50 px-3 py-1 rounded-full border border-orange-100"
          >
            Tính năng nổi bật
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-primary mt-4 mb-6 tracking-tight"
          >
            Giải pháp <span className="text-brandBlue">toàn diện</span>
          </motion.h2>
          <p className="text-slate-500 text-lg">
             Tối ưu hóa mọi quy trình quản lý nhân sự trong doanh nghiệp của bạn.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Row 1 */}
            <BentoCard 
               className="md:col-span-7 bg-gradient-to-br from-white to-orange-50/30"
               title="Chấm công thông minh"
               desc="Hệ thống chấm công tự động với nhiều phương thức: vân tay, khuôn mặt, GPS. Tích hợp cảnh báo đi muộn, về sớm và tính toán công tự động."
               visual={<AttendanceVisual />}
               icon={<CheckCircle />}
               delay={0.1}
            />
            
            <BentoCard 
               className="md:col-span-5"
               title="Dashboard Real-time"
               desc="Theo dõi chỉ số nhân sự, biểu đồ xu hướng và xuất báo cáo chỉ với 1 cú click chuột."
               visual={<ChartVisual />}
               icon={<BarChart3 />}
               delay={0.2}
            />

            {/* Row 2 */}
            <BentoCard 
               className="md:col-span-4"
               title="Bảo mật tuyệt đối"
               desc="Mã hóa dữ liệu chuẩn AES-256. Phân quyền đa cấp độ cho Admin, Manager và Nhân viên."
               visual={<SecurityVisual />}
               icon={<Lock />}
               delay={0.3}
            />

            <BentoCard 
               className="md:col-span-4"
               title="Báo cáo tự động"
               desc="Hệ thống tự động tạo và gửi báo cáo chấm công, nghỉ phép, làm thêm giờ định kỳ qua email."
               visual={<ReportVisual />}
               icon={<FileText />}
               delay={0.4}
            />
            
            <BentoCard 
               className="md:col-span-4"
               title="Cổng Web Nhân viên"
               desc="Trải nghiệm Mobile Web mượt mà, không cần cài đặt. Nhân viên quản lý công việc mọi lúc mọi nơi."
               visual={<WebAppVisual />}
               icon={<Layout />}
               delay={0.5}
            />
        </div>
      </div>
    </section>
  );
};

export default Features;
