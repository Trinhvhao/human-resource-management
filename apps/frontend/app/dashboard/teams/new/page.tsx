'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Save } from 'lucide-react';
import teamService from '@/services/teamService';
import departmentService from '@/services/departmentService';
import employeeService from '@/services/employeeService';
import { Department } from '@/types/department';
import { Employee } from '@/types/employee';
import { CreateTeamData } from '@/types/team';

export default function NewTeamPage() {
  const router = useRouter();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateTeamData>({
    name: '',
    code: '',
    description: '',
    departmentId: '',
    teamLeadId: '',
    type: 'PERMANENT'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptsRes, empsRes] = await Promise.all([
        departmentService.getAll(),
        employeeService.getAll()
      ]);
      setDepartments(deptsRes.data);
      setEmployees(empsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code || !formData.departmentId) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setLoading(true);
      await teamService.create(formData);
      router.push('/dashboard/teams');
    } catch (error: any) {
      console.error('Failed to create team:', error);
      alert(error.response?.data?.message || 'Tạo team thất bại');
    } finally {
      setLoading(false);
    }
  };

  const availableLeads = employees.filter(emp => 
    emp.departmentId === formData.departmentId && emp.status === 'ACTIVE'
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tạo Team mới</h1>
            <p className="text-sm text-slate-500 mt-1">Thêm team mới vào hệ thống</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border-2 border-slate-200 p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên team <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  placeholder="Backend Team"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mã team <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  placeholder="IT-BE"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue"
                rows={3}
                placeholder="Mô tả về team..."
              />
            </div>

            {/* Department & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phòng ban <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, teamLeadId: '' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  required
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.filter(d => d.isActive).map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Loại team
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue"
                >
                  <option value="PERMANENT">Cố định</option>
                  <option value="PROJECT">Dự án</option>
                  <option value="CROSS_FUNCTIONAL">Liên phòng ban</option>
                </select>
              </div>
            </div>

            {/* Team Lead */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Team Lead
              </label>
              <select
                value={formData.teamLeadId}
                onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue"
                disabled={!formData.departmentId}
              >
                <option value="">Chọn team lead (tùy chọn)</option>
                {availableLeads.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} - {emp.position}
                  </option>
                ))}
              </select>
              {!formData.departmentId && (
                <p className="text-sm text-slate-500 mt-1">Vui lòng chọn phòng ban trước</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brandBlue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {loading ? 'Đang tạo...' : 'Tạo team'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
