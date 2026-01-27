'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Calendar, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExpiringContract {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  contractType: string;
  endDate: string;
  daysRemaining: number;
}

export default function ExpiringContracts() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ExpiringContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringContracts();
  }, []);

  const fetchExpiringContracts = async () => {
    try {
      const axiosInstance = (await import('@/lib/axios')).default;
      
      const now = new Date();
      const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      
      // Fetch all contracts
      const response = await axiosInstance.get('/contracts');
      
      if (response.data) {
        const expiringContracts: ExpiringContract[] = [];
        
        response.data.forEach((contract: any) => {
          if (contract.status === 'ACTIVE' && contract.endDate) {
            const endDate = new Date(contract.endDate);
            const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            // Only show contracts expiring in next 60 days
            if (daysRemaining > 0 && daysRemaining <= 60) {
              expiringContracts.push({
                id: contract.id,
                employeeId: contract.employeeId,
                employeeName: contract.employee?.fullName || 'N/A',
                employeeCode: contract.employee?.employeeCode || 'N/A',
                contractType: contract.contractType || 'Hợp đồng',
                endDate: contract.endDate,
                daysRemaining,
              });
            }
          }
        });
        
        // Sort by days remaining (urgent first)
        expiringContracts.sort((a, b) => a.daysRemaining - b.daysRemaining);
        
        setContracts(expiringContracts.slice(0, 5)); // Show top 5
      }
    } catch (error: any) {
      console.error('Failed to fetch expiring contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' };
    if (days <= 30) return { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' };
    return { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'PROBATION': 'Thử việc',
      'FIXED_TERM': 'Có thời hạn',
      'INDEFINITE': 'Không thời hạn',
      'SEASONAL': 'Theo mùa vụ',
      'PART_TIME': 'Bán thời gian',
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-primary">Hợp đồng sắp hết hạn</h3>
          <p className="text-sm text-slate-500 mt-1">60 ngày tới</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
          <AlertTriangle className="text-red-600" size={20} />
        </div>
      </div>

      {/* Contracts List */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {contracts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <FileText className="mx-auto mb-2" size={40} />
            <p>Không có hợp đồng nào sắp hết hạn</p>
          </div>
        ) : (
          contracts.map((contract, index) => {
            const colors = getUrgencyColor(contract.daysRemaining);
            return (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(`/dashboard/employees/${contract.employeeId}`)}
                className={`p-4 rounded-xl border-2 ${colors.border} hover:shadow-md transition-all cursor-pointer`}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <User className={colors.text} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-primary mb-1">{contract.employeeName}</h4>
                    <p className="text-xs text-slate-500">{contract.employeeCode}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full ${colors.bg} ${colors.text} text-xs font-bold`}>
                    {contract.daysRemaining} ngày
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center justify-between text-xs text-slate-500 ml-13">
                  <div className="flex items-center gap-1">
                    <FileText size={12} />
                    <span>{getContractTypeLabel(contract.contractType)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(contract.endDate)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {contracts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Tổng cộng</span>
            <span className="font-bold text-red-600">{contracts.length} hợp đồng</span>
          </div>
        </div>
      )}
    </div>
  );
}
