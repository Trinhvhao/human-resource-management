'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Search, Filter, Plus, Edit, Trash2, Eye, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import employeeService from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { formatDate } from '@/utils/formatters';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchEmployees();
  }, [page, searchTerm, statusFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getAll({
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });

      setEmployees(response.data);
      setTotal(response.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;

    try {
      await employeeService.delete(id);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Xóa nhân viên thất bại');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-700 border-2 border-green-200',
      ON_LEAVE: 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200',
      TERMINATED: 'bg-red-100 text-red-700 border-2 border-red-200',
    };
    const labels = {
      ACTIVE: 'Hoạt động',
      ON_LEAVE: 'Nghỉ phép',
      TERMINATED: 'Đã nghỉ',
    };
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border-2 border-slate-100">
            <p className="text-sm text-slate-600 font-medium">Tổng số</p>
            <p className="text-2xl font-bold text-brandBlue">{total}</p>
          </div>
        </div>

        {/* Modern Filters */}
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brandBlue" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, mã NV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brandBlue/30 focus:border-brandBlue transition-all font-medium"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-brandBlue" size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brandBlue/30 focus:border-brandBlue appearance-none bg-white cursor-pointer font-medium text-slate-700 transition-all"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang làm việc</option>
                <option value="ON_LEAVE">Đang nghỉ</option>
                <option value="TERMINATED">Đã nghỉ việc</option>
              </select>
            </div>

            {/* Export & Add Button */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-brandBlue text-brandBlue rounded-xl hover:bg-brandBlue hover:text-white transition-all font-semibold">
                <Download size={18} />
                <span className="hidden sm:inline">Xuất</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/employees/new')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brandBlue text-white rounded-xl hover:bg-blue-700 hover:shadow-xl transition-all font-semibold shadow-lg shadow-brandBlue/20"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Thêm</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modern Table */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-brandBlue to-blue-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Mã NV
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Họ tên
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Chức vụ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Ngày vào
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded"></div></td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Không tìm thấy nhân viên nào
                    </td>
                  </tr>
                ) : (
                  employees.map((employee, index) => (
                    <motion.tr
                      key={employee.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-blue-50/50 transition-all border-b border-slate-100 last:border-0"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-brandBlue">
                        {employee.employeeCode}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {employee.avatarUrl ? (
                            <img
                              src={employee.avatarUrl}
                              alt={employee.fullName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-brandBlue/20"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brandBlue to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              {employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-800">{employee.fullName}</p>
                            <p className="text-xs text-slate-500">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{employee.position}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{employee.department?.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(employee.startDate)}</td>
                      <td className="px-6 py-4">{getStatusBadge(employee.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                            className="p-2 hover:bg-blue-100 rounded-lg text-brandBlue transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/employees/${employee.id}/edit`)}
                            className="p-2 hover:bg-yellow-100 rounded-lg text-yellow-600 transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modern Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t-2 border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-600 font-medium">
                Hiển thị <span className="font-bold text-brandBlue">{(page - 1) * limit + 1}</span> - <span className="font-bold text-brandBlue">{Math.min(page * limit, total)}</span> trong tổng số <span className="font-bold text-brandBlue">{total}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border-2 border-slate-200 rounded-lg hover:bg-brandBlue hover:text-white hover:border-brandBlue disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all"
                >
                  Trước
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 border-2 rounded-lg text-sm font-bold transition-all ${page === i + 1
                        ? 'bg-brandBlue text-white border-brandBlue shadow-lg'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border-2 border-slate-200 rounded-lg hover:bg-brandBlue hover:text-white hover:border-brandBlue disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
