'use client';

import { Employee } from '@/types/employee';
import { Mail, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '@/utils/formatters';

interface EmployeeKanbanViewProps {
  employees: Employee[];
  onView: (id: string) => void;
}

export default function EmployeeKanbanView({ employees, onView }: EmployeeKanbanViewProps) {
  const columns = [
    { id: 'ACTIVE', label: 'Active', color: 'border-green-500', bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50', headerBg: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { id: 'ON_LEAVE', label: 'On Leave', color: 'border-amber-500', bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50', headerBg: 'bg-gradient-to-r from-amber-500 to-orange-500' },
    { id: 'TERMINATED', label: 'Terminated', color: 'border-red-500', bgColor: 'bg-gradient-to-br from-red-50 to-rose-50', headerBg: 'bg-gradient-to-r from-red-500 to-rose-500' },
  ];

  const getEmployeesByStatus = (status: string) => {
    return employees.filter((emp) => emp.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => {
        const columnEmployees = getEmployeesByStatus(column.id);
        
        return (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className={`${column.headerBg} text-white rounded-t-2xl px-5 py-4 shadow-lg`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{column.label}</h3>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold shadow-md">
                  {columnEmployees.length}
                </span>
              </div>
            </div>

            {/* Column Body */}
            <div className={`flex-1 ${column.bgColor} rounded-b-2xl p-4 space-y-3 min-h-[400px] border-2 ${column.color}`}>
              {columnEmployees.map((employee, index) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border-2 border-slate-200 p-4 hover:shadow-xl hover:border-brandBlue hover:scale-105 transition-all duration-300 cursor-pointer group"
                  onClick={() => onView(employee.id)}
                  title="Click để xem chi tiết"
                >
                  {/* Employee Info */}
                  <div className="flex items-start gap-3 mb-3">
                    {employee.avatarUrl ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}${employee.avatarUrl}`}
                        alt={employee.fullName}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-brandBlue transition-colors">{employee.fullName}</h4>
                      <p className="text-xs text-brandBlue font-semibold">{employee.employeeCode}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={12} />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={12} />
                      <span>{formatDate(employee.startDate)}</span>
                    </div>
                  </div>

                  {/* Position & Department */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-700">{employee.position}</p>
                    <p className="text-xs text-slate-500">{employee.department?.name}</p>
                  </div>
                </motion.div>
              ))}

              {columnEmployees.length === 0 && (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                  No employees
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
