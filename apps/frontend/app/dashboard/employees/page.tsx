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
      ACTIVE: 'bg-green-100 text-green-700',
      ON_LEAVE: 'bg-yellow-100 text-yellow-700',
      TERMINATED: 'bg-red-100 text-red-700',
    };
    const labels = {
      ACTIVE: 'Đang làm việc',
      ON_LEAVE: 'Đang nghỉ',
      TERMINATED: 'Đã nghỉ việc',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Quản lý Nhân viên</h1>
            <p className="text-slate-500 mt-1">Tổng số: {total} nhân viên</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/employees/new')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brandBlue to-brandLightBlue text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Thêm nhân viên
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, mã NV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang làm việc</option>
              <option value="ON_LEAVE">Đang nghỉ</option>
              <option value="TERMINATED">Đã nghỉ việc</option>
            </select>

            {/* Export Button */}
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Download size={18} />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Mã NV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Họ tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Chức vụ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ngày vào
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        {employee.employeeCode}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {employee.avatarUrl ? (
                            <img
                              src={employee.avatarUrl}
                              alt={employee.fullName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brandBlue/10 flex items-center justify-center text-brandBlue font-semibold text-xs">
                              {employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-primary">{employee.fullName}</p>
                            <p className="text-xs text-slate-500">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{employee.position}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{employee.department?.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{formatDate(employee.startDate)}</td>
                      <td className="px-6 py-4">{getStatusBadge(employee.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/employees/${employee.id}/edit`)}
                            className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trong tổng số {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Trước
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-1 border rounded-lg text-sm ${page === i + 1
                        ? 'bg-brandBlue text-white border-brandBlue'
                        : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
