'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import attendanceService from '@/services/attendanceService';

export default function MyAttendancePage() {
  const { user } = useAuthStore();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    loadMyAttendances();
  }, []);

  const loadMyAttendances = async () => {
    try {
      setLoading(true);
      // Get current month attendances
      const startDate = new Date();
      startDate.setDate(1);
      const endDate = new Date();
      
      const data = await attendanceService.getEmployeeAttendances(
        user?.employeeId || '',
        startDate.getMonth() + 1,
        startDate.getFullYear()
      );
      
      setAttendances(data.data?.data || []);
    } catch (error) {
      console.error('Failed to load attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      await attendanceService.checkIn();
      await loadMyAttendances();
      alert('Chấm công vào thành công!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Chấm công thất bại');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingIn(true);
      await attendanceService.checkOut();
      await loadMyAttendances();
      alert('Chấm công ra thành công!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Chấm công thất bại');
    } finally {
      setCheckingIn(false);
    }
  };

  const todayAttendance = attendances.find(
    a => new Date(a.date).toDateString() === new Date().toDateString()
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Chấm công của tôi</h1>

      {/* Check In/Out Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Chấm công hôm nay</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600">Giờ vào</p>
            <p className="text-xl font-bold">
              {todayAttendance?.checkIn 
                ? new Date(todayAttendance.checkIn).toLocaleTimeString('vi-VN')
                : '--:--'}
            </p>
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-gray-600">Giờ ra</p>
            <p className="text-xl font-bold">
              {todayAttendance?.checkOut 
                ? new Date(todayAttendance.checkOut).toLocaleTimeString('vi-VN')
                : '--:--'}
            </p>
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-600">Số giờ làm</p>
            <p className="text-xl font-bold">
              {todayAttendance?.workHours || 0} giờ
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleCheckIn}
            disabled={checkingIn || !!todayAttendance?.checkIn}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {checkingIn ? 'Đang xử lý...' : 'Chấm công vào'}
          </button>
          
          <button
            onClick={handleCheckOut}
            disabled={checkingIn || !todayAttendance?.checkIn || !!todayAttendance?.checkOut}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {checkingIn ? 'Đang xử lý...' : 'Chấm công ra'}
          </button>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Lịch sử chấm công tháng này</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ vào</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ ra</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số giờ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendances.map((attendance) => (
                  <tr key={attendance.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(attendance.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendance.checkIn 
                        ? new Date(attendance.checkIn).toLocaleTimeString('vi-VN')
                        : '--:--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendance.checkOut 
                        ? new Date(attendance.checkOut).toLocaleTimeString('vi-VN')
                        : '--:--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendance.workHours || 0} giờ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        attendance.isLate 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {attendance.isLate ? 'Đi muộn' : 'Đúng giờ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
