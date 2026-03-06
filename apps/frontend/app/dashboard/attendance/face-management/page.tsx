'use client';

import { useState, useEffect } from 'react';
import {
  ScanFace,
  Search,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import faceRecognitionService from '@/services/faceRecognitionService';
import { FaceRegistration } from '@/components/face-recognition';
import Avatar from '@/components/common/Avatar';

interface EmployeeWithFaceStatus {
  id: string;
  fullName: string;
  employeeCode: string;
  avatarUrl: string | null;
  department: { name: string } | null;
  _count: { faceDescriptors: number };
}

export default function FaceManagementPage() {
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeWithFaceStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-xl bg-linear-to-br from-blue-500 to-purple-600 p-3">
          <ScanFace className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý nhận diện khuôn mặt
          </h1>
          <p className="text-gray-500">
            Đăng ký và quản lý khuôn mặt nhân viên cho chấm công
          </p>
        </div>
      </div>

      {selectedEmployee ? (
        /* Employee face registration detail */
        <div>
          <button
            onClick={() => setSelectedEmployee(null)}
            className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại danh sách
          </button>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <Avatar
                src={selectedEmployee.avatarUrl}
                name={selectedEmployee.fullName}
                size="lg"
                alt={selectedEmployee.fullName}
              />
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedEmployee.fullName}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedEmployee.employeeCode} •{' '}
                  {selectedEmployee.department?.name || 'Chưa có phòng ban'}
                </p>
              </div>
            </div>

            <FaceRegistration
              employeeId={selectedEmployee.id}
              employeeName={selectedEmployee.fullName}
            />
          </div>
        </div>
      ) : (
        /* Employee list */
        <EmployeeList
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectEmployee={setSelectedEmployee}
        />
      )}
    </div>
  );
}

function EmployeeList({
  searchTerm,
  onSearchChange,
  onSelectEmployee,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectEmployee: (employee: EmployeeWithFaceStatus) => void;
}) {
  const [employees, setEmployees] = useState<EmployeeWithFaceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      // We'll use a simple fetch approach since we need employee list with face descriptor count
      const axiosInstance = (await import('@/lib/axios')).default;
      const response = await axiosInstance.get('/employees', {
        params: { page: 1, limit: 200 },
      });
      const data = (response as any).data || (response as any);
      const employeeList = Array.isArray(data) ? data : data.data || [];
      setEmployees(employeeList);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginatedEmployees = filteredEmployees.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);

  const registeredCount = employees.filter(
    (e) => e._count?.faceDescriptors > 0,
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng nhân viên</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đã đăng ký</p>
              <p className="text-2xl font-bold text-green-600">
                {registeredCount}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2">
              <XCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chưa đăng ký</p>
              <p className="text-2xl font-bold text-yellow-600">
                {employees.length - registeredCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã nhân viên..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Mã NV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Phòng ban
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">
                    Số ảnh
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedEmployees.map((emp) => {
                  const faceCount = emp._count?.faceDescriptors || 0;
                  const isRegistered = faceCount > 0;

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={emp.avatarUrl}
                            name={emp.fullName}
                            size="sm"
                            alt={emp.fullName}
                          />
                          <span className="font-medium text-gray-900">
                            {emp.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {emp.employeeCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {emp.department?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isRegistered
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isRegistered ? 'Đã đăng ký' : 'Chưa đăng ký'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        <span
                          className={`font-medium ${faceCount > 0 ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          {faceCount}/5
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => onSelectEmployee(emp)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {isRegistered ? 'Xem / Sửa' : 'Đăng ký'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-3">
                <p className="text-sm text-gray-500">
                  Hiển thị {(page - 1) * pageSize + 1} -{' '}
                  {Math.min(page * pageSize, filteredEmployees.length)} /{' '}
                  {filteredEmployees.length} nhân viên
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border p-1.5 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border p-1.5 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
