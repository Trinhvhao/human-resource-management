'use client';

import { FileSignature, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContractStatsBarProps {
    total: number;
    active: number;
    expired: number;
    expiringSoon: number;
}

export default function ContractStatsBar({ total, active, expired, expiringSoon }: ContractStatsBarProps) {
    const stats = [
        {
            label: 'Tổng hợp đồng',
            value: total,
            icon: FileSignature,
            gradient: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-600',
        },
        {
            label: 'Đang hiệu lực',
            value: active,
            icon: CheckCircle,
            gradient: 'from-green-500 to-emerald-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-600',
        },
        {
            label: 'Sắp hết hạn',
            value: expiringSoon,
            icon: Clock,
            gradient: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            textColor: 'text-orange-600',
        },
        {
            label: 'Đã hết hạn',
            value: expired,
            icon: XCircle,
            gradient: 'from-red-500 to-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-600',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`group bg-white rounded-xl p-6 border-2 ${stat.borderColor} hover:shadow-lg transition-all cursor-pointer`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                <Icon className="text-white" size={24} />
                            </div>
                            <div className={`px-2 py-1 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}>
                                <TrendingUp className={stat.textColor} size={14} />
                            </div>
                        </div>
                        <p className="text-sm font-semibold text-slate-600 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    </motion.div>
                );
            })}
        </div>
    );
}
