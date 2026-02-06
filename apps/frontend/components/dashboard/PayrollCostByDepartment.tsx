'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Building2 } from 'lucide-react';
import axiosInstance from '@/lib/axios';

interface DepartmentCost {
  departmentName: string;
  employeeCount: number;
  totalCost: number;
  avgCost: number;
  percentage: number;
  color: string;
}

export default function PayrollCostByDepartment() {
  const [data, setData] = useState<DepartmentCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    fetchPayrollCost();
  }, []);

  const fetchPayrollCost = async () => {
    try {
      const [employeesRes, departmentsRes] = await Promise.all([
        axiosInstance.get('/employees'),
        axiosInstance.get('/departments')
      ]);
      
      if (employeesRes.data && departmentsRes.data) {
        const employees = employeesRes.data;
        const departments = departmentsRes.data;

        // Group employees by department and calculate costs
        const deptCosts: Record<string, { count: number; totalSalary: number }> = {};
        let grandTotal = 0;

        employees.forEach((emp: any) => {
          const deptId = emp.departmentId;
          const salary = emp.salary || 0;
          
          if (!deptCosts[deptId]) {
            deptCosts[deptId] = { count: 0, totalSalary: 0 };
          }
          
          deptCosts[deptId].count++;
          deptCosts[deptId].totalSalary += salary;
          grandTotal += salary;
        });

        // Convert to array with department names
        const costData: DepartmentCost[] = Object.entries(deptCosts)
          .map(([deptId, data], index) => {
            const dept = departments.find((d: any) => d.id === deptId);
            return {
              departmentName: dept?.name || 'Chưa phân bổ',
              employeeCount: data.count,
              totalCost: data.totalSalary,
              avgCost: data.totalSalary / data.count,
              percentage: grandTotal > 0 ? (data.totalSalary / grandTotal) * 100 : 0,
              color: getColor(index),
            };
          })
          .sort((a, b) => b.totalCost - a.totalCost)
          .slice(0, 5); // Top 5 departments

        setData(costData);
        setTotalCost(grandTotal);
      }
    } catch (error) {
      console.error('Failed to fetch payroll cost:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (index: number) => {
    const colors = [
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // emerald
    ];
    return colors[index % colors.length];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-5 bg-slate-100 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-slate-50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Chi phí lương theo phòng ban</h3>
          <p className="text-sm text-slate-500 mt-1">Top 5 phòng ban</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
          <DollarSign className="text-green-600" size={20} />
          <span className="text-sm font-bold text-green-600">
            {(totalCost / 1000000).toFixed(0)}M
          </span>
        </div>
      </div>

      {/* Department List */}
      <div className="space-y-4 flex-1">
        {data.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Building2 size={40} className="mx-auto mb-2" />
            <p>Không có dữ liệu</p>
          </div>
        ) : (
          data.map((dept, index) => (
            <motion.div
              key={dept.departmentName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Department Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dept.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {dept.departmentName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {dept.employeeCount} nhân viên
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-bold text-slate-900">
                    {(dept.totalCost / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-slate-500">
                    {dept.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dept.percentage}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: dept.color }}
                />
              </div>

              {/* Average Cost */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>TB/người:</span>
                <span className="font-semibold">
                  {(dept.avgCost / 1000000).toFixed(1)}M
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <TrendingUp size={16} className="text-green-600" />
            <span className="text-sm">Tổng chi phí</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(totalCost)}
          </span>
        </div>
      </div>
    </div>
  );
}
