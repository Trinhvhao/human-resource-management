'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Building2, X, AlertCircle, CheckCircle2, Users, Crown, Sparkles, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import departmentService from '@/services/departmentService';
import employeeService from '@/services/employeeService';
import { Department } from '@/types/department';
import { Employee } from '@/types/employee';

const departmentSchema = z.object({
  code: z.string().min(1, 'Mã phòng ban là bắt buộc').max(50, 'Mã phòng ban tối đa 50 ký tự'),
  name: z.string().min(1, 'Tên phòng ban là bắt buộc').max(255, 'Tên phòng ban tối đa 255 ký tự'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  mode: 'create' | 'edit';
  departmentId?: string;
}

export default function DepartmentForm({ mode, departmentId }: DepartmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState(mode === 'edit');
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
  });

  useEffect(() => {
    const loadData = async () => {
      // For edit mode, fetch department first to get parentId
      if (mode === 'edit' && departmentId) {
        const dept = await fetchDepartment();
        // After department is loaded, fetch employees with filter
        await fetchEmployees(dept);
      } else {
        // For create mode, just fetch all employees
        await fetchEmployees();
      }
      
      // Fetch departments list
      await fetchDepartments();
      setLoadingSelects(false);
    };
    
    setLoadingSelects(true);
    loadData();
  }, [mode, departmentId]);

  const fetchDepartment = async () => {
    if (!departmentId) return null;

    try {
      setLoadingData(true);
      const response = await departmentService.getById(departmentId);
      const dept = response.data;
      setCurrentDepartment(dept);
      setSelectedManagerId(dept.managerId || '');
      reset({
        code: dept.code,
        name: dept.name,
        description: dept.description || '',
        parentId: dept.parentId || '',
        managerId: dept.managerId || '',
      });
      return dept; // Return department data
    } catch (error) {
      console.error('Failed to fetch department:', error);
      alert('Không tìm thấy phòng ban');
      router.push('/dashboard/departments');
      return null;
    } finally {
      setLoadingData(false);
    }
  };

  const fetchEmployees = async (deptData?: any) => {
    try {
      // Get all active employees first
      const response: any = await employeeService.getAll({ status: 'ACTIVE', limit: 100 });
      
      // Handle multiple response formats
      let allEmployees: Employee[] = [];
      
      if (response) {
        if (Array.isArray(response.data)) {
          allEmployees = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          allEmployees = response.data.data;
        } else if (response.data?.employees && Array.isArray(response.data.employees)) {
          allEmployees = response.data.employees;
        }
      }
      
      console.log('All employees:', allEmployees.length);
      console.log('Department data for filter:', deptData);
      console.log('Department ID:', departmentId);
      
      // Filter eligible employees:
      // 1. Employees in current department
      // 2. Employees in parent department (if exists)
      let eligibleEmployees = allEmployees;
      
      if (mode === 'edit' && deptData && departmentId) {
        eligibleEmployees = allEmployees.filter(emp => {
          // Get employee's department ID (backend returns department.id, not departmentId)
          const empDeptId = emp.departmentId || emp.department?.id;
          
          // Allow employees from current department
          if (empDeptId === departmentId) {
            console.log('✓ Employee from current dept:', emp.fullName);
            return true;
          }
          
          // Allow employees from parent department
          if (deptData.parentId && empDeptId === deptData.parentId) {
            console.log('✓ Employee from parent dept:', emp.fullName);
            return true;
          }
          
          console.log('✗ Employee filtered out:', emp.fullName, 'dept:', empDeptId);
          return false;
        });
        
        console.log('Eligible employees after filter:', eligibleEmployees.length);
      }
      
      setEmployees(eligibleEmployees);
    } catch (error: any) {
      // Silently fail - form still works without employees list
      setEmployees([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response: any = await departmentService.getAll();
      
      // Handle multiple response formats
      let allDepts: Department[] = [];
      
      if (response) {
        if (Array.isArray(response.data)) {
          allDepts = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          allDepts = response.data.data;
        }
      }
      
      // Filter out current department if editing
      const filtered = mode === 'edit' 
        ? allDepts.filter(d => d.id !== departmentId)
        : allDepts;
      
      setDepartments(filtered);
    } catch (error: any) {
      // Silently fail - form still works without departments list
      setDepartments([]);
    }
  };

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      // Check if manager is changing
      const isManagerChanging = mode === 'edit' && 
        data.managerId !== (currentDepartment?.managerId || '');
      
      // If manager is changing in edit mode, create change request instead
      if (isManagerChanging && mode === 'edit' && departmentId) {
        const oldManager = currentDepartment?.manager;
        const newManager = employees.find(e => e.id === data.managerId);
        
        const confirmMessage = oldManager && newManager
          ? `Bạn đang thay đổi trưởng phòng từ "${oldManager.fullName}" sang "${newManager.fullName}".\n\nĐiều này sẽ tạo YÊU CẦU PHÊ DUYỆT và cần được HR/Admin xét duyệt.\n\nBạn có muốn tiếp tục?`
          : newManager
          ? `Bạn đang chỉ định "${newManager.fullName}" làm trưởng phòng.\n\nĐiều này sẽ tạo YÊU CẦU PHÊ DUYỆT.\n\nBạn có muốn tiếp tục?`
          : `Bạn đang xóa trưởng phòng "${oldManager?.fullName}".\n\nĐiều này sẽ tạo YÊU CẦU PHÊ DUYỆT.\n\nBạn có muốn tiếp tục?`;
        
        if (!confirm(confirmMessage)) {
          return;
        }

        // Prompt for reason
        const reason = prompt('Vui lòng nhập lý do thay đổi (tối thiểu 10 ký tự):');
        if (!reason || reason.length < 10) {
          alert('Lý do thay đổi phải có ít nhất 10 ký tự');
          return;
        }

        // Calculate effective date (7 days from now)
        const effectiveDate = new Date();
        effectiveDate.setDate(effectiveDate.getDate() + 7);

        setLoading(true);

        // Import service dynamically
        const { default: changeRequestService } = await import('@/services/departmentChangeRequestService');
        
        await changeRequestService.createChangeRequest(departmentId, {
          requestType: 'CHANGE_MANAGER',
          newManagerId: data.managerId || undefined,
          reason,
          effectiveDate: effectiveDate.toISOString(),
        });

        alert('Yêu cầu thay đổi trưởng phòng đã được gửi. Vui lòng chờ phê duyệt từ HR/Admin.');
        router.push('/dashboard/departments');
        return;
      }

      // Normal flow for create or non-manager changes
      setLoading(true);

      // Clean up empty strings
      const cleanData = {
        ...data,
        parentId: data.parentId || undefined,
        managerId: data.managerId || undefined,
        description: data.description || undefined,
      };

      if (mode === 'create') {
        await departmentService.create(cleanData);
        alert('Tạo phòng ban thành công');
      } else if (departmentId) {
        await departmentService.update(departmentId, cleanData);
        alert('Cập nhật phòng ban thành công');
      }

      router.push('/dashboard/departments');
    } catch (error: any) {
      console.error('Failed to save department:', error);
      alert(error.response?.data?.message || error.message || 'Lưu phòng ban thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="bg-white rounded-2xl p-8 space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 -mx-6 -my-6 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          {/* Modern Header with Gradient */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            {/* Gradient Background Banner */}
            <div className="bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 rounded-2xl p-8 mb-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => router.back()}
                    className="group p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20 hover:border-white/30 backdrop-blur-sm"
                  >
                    <ArrowLeft size={22} className="text-white" />
                  </button>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-bold text-white">
                        {mode === 'create' ? 'Tạo phòng ban mới' : 'Chỉnh sửa phòng ban'}
                      </h1>
                      {mode === 'edit' && (
                        <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-full border border-white/30">
                          Chế độ chỉnh sửa
                        </span>
                      )}
                    </div>
                    <p className="text-blue-100 text-lg">
                      {mode === 'create' ? 'Thêm phòng ban mới vào cơ cấu tổ chức của công ty' : 'Cập nhật thông tin và cấu trúc phòng ban'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                    <Building2 size={40} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden"
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Form Content */}
              <div className="p-8 space-y-8">
                {/* Section 1: Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-slate-200">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                      <Building2 className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Thông tin cơ bản</h2>
                      <p className="text-sm text-slate-500">Mã và tên phòng ban</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Code */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Mã phòng ban <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('code')}
                          placeholder="FIN"
                          className={`w-full px-4 py-3.5 pl-11 border-2 rounded-xl font-medium transition-all ${
                            errors.code
                              ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                              : 'border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                          }`}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Building2 size={16} className={errors.code ? 'text-red-400' : 'text-slate-400'} />
                        </div>
                      </div>
                      {errors.code && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-red-600 text-sm font-medium"
                        >
                          <AlertCircle size={14} />
                          <span>{errors.code.message}</span>
                        </motion.div>
                      )}
                      <p className="text-xs text-slate-500">Mã viết tắt, VD: FIN, IT, HR</p>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Tên phòng ban <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('name')}
                          placeholder="Phòng Tài chính"
                          className={`w-full px-4 py-3.5 pl-11 border-2 rounded-xl font-medium transition-all ${
                            errors.name
                              ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                              : 'border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                          }`}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Building2 size={16} className={errors.name ? 'text-red-400' : 'text-slate-400'} />
                        </div>
                      </div>
                      {errors.name && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-red-600 text-sm font-medium"
                        >
                          <AlertCircle size={14} />
                          <span>{errors.name.message}</span>
                        </motion.div>
                      )}
                      <p className="text-xs text-slate-500">Tên đầy đủ của phòng ban</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Mô tả
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      placeholder="Mô tả về chức năng, nhiệm vụ của phòng ban..."
                      className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl font-medium bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                    />
                    <p className="text-xs text-slate-500">Mô tả chi tiết về vai trò và trách nhiệm</p>
                  </div>
                </div>

                {/* Section 2: Organization Structure */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-slate-200">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-secondary via-orange-600 to-orange-700 flex items-center justify-center shadow-lg">
                      <Users className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Cơ cấu tổ chức</h2>
                      <p className="text-sm text-slate-500">Phòng ban cấp trên và người quản lý</p>
                    </div>
                  </div>

                  {/* Current Manager Display (Edit mode only) */}
                  {mode === 'edit' && currentDepartment && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Crown className="text-blue-600" size={20} />
                          <h3 className="font-bold text-blue-900">Trưởng phòng hiện tại</h3>
                        </div>
                        {currentDepartment._count && (
                          <div className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-semibold">
                            Quản lý {currentDepartment._count.employees} nhân viên
                          </div>
                        )}
                      </div>
                      
                      {currentDepartment.manager ? (
                        <div className="flex items-center gap-4 bg-white rounded-lg p-4 border border-blue-200">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {currentDepartment.manager.fullName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-900">{currentDepartment.manager.fullName}</p>
                            <p className="text-sm text-slate-600">{currentDepartment.manager.position}</p>
                            <p className="text-xs text-slate-500">Mã NV: {currentDepartment.manager.employeeCode}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-4 border border-blue-200 text-center">
                          <AlertCircle className="mx-auto text-slate-400 mb-2" size={24} />
                          <p className="text-sm text-slate-600">Chưa có trưởng phòng</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Parent Department */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Phòng ban cấp trên
                      </label>
                      <div className="relative">
                        <select
                          {...register('parentId')}
                          disabled={loadingSelects || mode === 'edit'}
                          className="w-full px-4 py-3.5 pl-11 pr-10 border-2 border-slate-200 rounded-xl font-medium bg-white hover:border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                        >
                          <option value="">{loadingSelects ? 'Đang tải...' : 'Không có (cấp cao nhất)'}</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))}
                        </select>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Users size={16} className="text-slate-400" />
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          {loadingSelects ? (
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        {mode === 'edit' 
                          ? 'Không thể thay đổi phòng ban cấp trên khi đã có nhân viên' 
                          : 'Phòng ban mà phòng này trực thuộc'}
                      </p>
                    </div>

                    {/* Manager */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Trưởng phòng {mode === 'edit' && '(Thay đổi)'}
                      </label>
                      <div className="relative">
                        <select
                          {...register('managerId')}
                          disabled={loadingSelects}
                          value={selectedManagerId}
                          onChange={(e) => {
                            setSelectedManagerId(e.target.value);
                            // Also update form value
                            register('managerId').onChange(e);
                          }}
                          className="w-full px-4 py-3.5 pl-11 pr-10 border-2 border-slate-200 rounded-xl font-medium bg-white hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">{loadingSelects ? 'Đang tải...' : 'Chưa chọn'}</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.fullName} - {emp.position}
                            </option>
                          ))}
                        </select>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Crown size={16} className="text-slate-400" />
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          {loadingSelects ? (
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      {/* Manager Change Warning */}
                      {mode === 'edit' && selectedManagerId && selectedManagerId !== (currentDepartment?.managerId || '') && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                            <div className="text-xs text-orange-800">
                              <p className="font-semibold mb-1">Cảnh báo: Thay đổi trưởng phòng</p>
                              <p>Việc thay đổi trưởng phòng sẽ ảnh hưởng đến {currentDepartment?._count?.employees || 0} nhân viên. Đảm bảo có quá trình bàn giao công việc hợp lý.</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      <p className="text-xs text-slate-500">Người quản lý phòng ban này</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 border-t-2 border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="group flex items-center gap-2 px-7 py-3.5 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-white hover:border-slate-400 hover:shadow-lg transition-all font-bold bg-white"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform" />
                  <span>Hủy bỏ</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex items-center gap-3 px-10 py-3.5 bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold shadow-xl"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                      <span>{mode === 'create' ? 'Tạo phòng ban' : 'Lưu thay đổi'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Help Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <AlertCircle className="text-white" size={20} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-blue-900 mb-2">Lưu ý quan trọng</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>Mã phòng ban phải là <strong>duy nhất</strong> trong hệ thống</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>Một nhân viên chỉ có thể làm trưởng phòng của <strong>một phòng ban</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>Cơ cấu phòng ban không được sâu quá <strong>2 cấp</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
