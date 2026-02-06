'use client';

import { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, UserPlus, Info } from 'lucide-react';
import { Attendance } from '@/types/attendance';
import { formatTime } from '@/utils/formatters';

interface TodayAttendanceTableProps {
  attendances: Attendance[];
  loading?: boolean;
  onViewDetail?: (attendance: Attendance) => void;
  onManualCheckIn?: (employeeId: string) => void;
  // Pagination props
  currentPage?: number;
  itemsPerPage?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

import Pagination from '@/components/common/Pagination';

// Simple Tooltip Component
function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
}

export default function TodayAttendanceTable({
  attendances,
  loading = false,
  onViewDetail,
  onManualCheckIn,
  currentPage = 1,
  itemsPerPage = 20,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}: TodayAttendanceTableProps) {
  const [sortBy, setSortBy] = useState<'name' | 'checkIn' | 'status'>('checkIn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const calculateLateMinutes = (checkIn: string) => {
    const checkInTime = new Date(checkIn);
    const workStart = new Date(checkInTime);
    workStart.setHours(8, 30, 0, 0); // 8:30 AM
    
    const diffMs = checkInTime.getTime() - workStart.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    return diffMins > 0 ? diffMins : 0;
  };

  const getStatusBadge = (attendance: Attendance) => {
    if (attendance.status === 'ABSENT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium border border-red-200">
          <XCircle size={14} strokeWidth={2} />
          Vắng mặt
        </span>
      );
    }

    if (attendance.isLate && attendance.checkIn) {
      const lateMinutes = calculateLateMinutes(attendance.checkIn);
      return (
        <Tooltip
          content={
            <div className="text-center">
              <p className="font-semibold">Đi muộn {lateMinutes} phút</p>
              <p className="text-[10px] mt-0.5 opacity-80">Check-in: {formatTime(attendance.checkIn)}</p>
              <p className="text-[10px] opacity-80">Giờ chuẩn: 8:30 AM</p>
            </div>
          }
        >
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-md text-xs font-medium border border-orange-200 cursor-help">
            <Clock size={14} strokeWidth={2} />
            Đi muộn
            <Info size={12} className="opacity-60" />
          </span>
        </Tooltip>
      );
    }

    if (attendance.checkIn) {
      return (
        <Tooltip
          content={
            <div className="text-center">
              <p className="font-semibold">Đúng giờ</p>
              <p className="text-[10px] mt-0.5 opacity-80">Check-in: {formatTime(attendance.checkIn)}</p>
            </div>
          }
        >
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-200 cursor-help">
            <CheckCircle size={14} strokeWidth={2} />
            Đúng giờ
          </span>
        </Tooltip>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">
        <AlertCircle size={14} strokeWidth={2} />
        Chưa check-in
      </span>
    );
  };

  const sortedAttendances = [...attendances].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = (a.employee?.fullName || '').localeCompare(b.employee?.fullName || '');
        break;
      case 'checkIn':
        comparison = (a.checkIn || '').localeCompare(b.checkIn || '');
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'name' | 'checkIn' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg">
        <div className="p-6">
          <div className="h-6 bg-slate-100 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-32"></div>
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Chấm công hôm nay</h3>
            <p className="text-sm text-slate-600 mt-0.5">Danh sách nhân viên và trạng thái check-in</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-slate-700">Live</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('name')}
              >
                Nhân viên
                {sortBy === 'name' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Phòng ban
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('checkIn')}
              >
                Check-in
                {sortBy === 'checkIn' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Check-out
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Giờ làm
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('status')}
              >
                Trạng thái
                {sortBy === 'status' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedAttendances.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Clock className="text-slate-400" size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">Chưa có dữ liệu chấm công</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedAttendances.map((attendance) => (
                <tr key={attendance.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-brandBlue rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {attendance.employee?.fullName?.charAt(0) || '?'}
                        </div>
                        {attendance.checkIn && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {attendance.employee?.fullName || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {attendance.employee?.employeeCode || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 font-medium">
                      {attendance.employee?.department?.name || 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {attendance.checkIn ? formatTime(attendance.checkIn) : '--:--'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {attendance.checkOut ? formatTime(attendance.checkOut) : '--:--'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {attendance.workHours ? (
                      <Tooltip
                        content={
                          <div className="text-center">
                            <p className="font-semibold">{Number(attendance.workHours).toFixed(1)} giờ làm việc</p>
                            <p className="text-[10px] mt-0.5 opacity-80">
                              {attendance.checkIn && formatTime(attendance.checkIn)} - {attendance.checkOut ? formatTime(attendance.checkOut) : '...'}
                            </p>
                          </div>
                        }
                      >
                        <div className="cursor-help">
                          <p className="text-sm font-semibold text-slate-900">{Number(attendance.workHours).toFixed(1)}h</p>
                          <p className="text-xs text-slate-500">
                            {attendance.checkIn && attendance.checkOut ? 'Hoàn thành' : 'Đang làm'}
                          </p>
                        </div>
                      </Tooltip>
                    ) : (
                      <p className="text-sm text-slate-400">--</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(attendance)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {onViewDetail && (
                        <button
                          onClick={() => onViewDetail(attendance)}
                          className="p-2 text-brandBlue hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} strokeWidth={2} />
                        </button>
                      )}
                      {onManualCheckIn && !attendance.checkIn && (
                        <button
                          onClick={() => onManualCheckIn(attendance.employeeId)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Check-in thủ công"
                        >
                          <UserPlus size={16} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {sortedAttendances.length > 0 && onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil((totalItems || attendances.length) / itemsPerPage)}
          totalItems={totalItems || attendances.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
    </div>
  );
}
