'use client';

import { useEffect, useState } from 'react';
import { Award, AlertTriangle, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import rewardService, { Reward } from '@/services/rewardService';
import disciplineService, { Discipline } from '@/services/disciplineService';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { toast } from '@/lib/toast';

interface EmployeeRewardsAndDisciplinesProps {
    employeeId: string;
    canEdit?: boolean;
}

const rewardTypeLabels: Record<string, string> = {
    BONUS: 'Thưởng tiền',
    CERTIFICATE: 'Giấy khen',
    PROMOTION: 'Thăng chức',
    OTHER: 'Khác',
};

const disciplineTypeLabels: Record<string, string> = {
    WARNING: 'Cảnh cáo',
    FINE: 'Phạt tiền',
    DEMOTION: 'Giáng chức',
    TERMINATION: 'Sa thải',
};

export default function EmployeeRewardsAndDisciplines({ employeeId, canEdit = false }: EmployeeRewardsAndDisciplinesProps) {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'rewards' | 'disciplines'>('rewards');

    useEffect(() => {
        fetchData();
    }, [employeeId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rewardsRes, disciplinesRes] = await Promise.all([
                rewardService.getByEmployee(employeeId),
                disciplineService.getByEmployee(employeeId),
            ]);
            setRewards(rewardsRes.data);
            setDisciplines(disciplinesRes.data);
        } catch (error) {
            console.error('Không thể tải dữ liệu:', error);
            toast.error('Không thể tải dữ liệu thưởng/phạt');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReward = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa khen thưởng này?')) return;
        try {
            await rewardService.delete(id);
            toast.success('Xóa thành công');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Xóa thất bại');
        }
    };

    const handleDeleteDiscipline = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa kỷ luật này?')) return;
        try {
            await disciplineService.delete(id);
            toast.success('Xóa thành công');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Xóa thất bại');
        }
    };

    const stats = {
        totalRewards: rewards.length,
        totalRewardAmount: rewards.reduce((sum, r) => sum + Number(r.amount), 0),
        totalDisciplines: disciplines.length,
        totalDisciplineAmount: disciplines.reduce((sum, d) => sum + Number(d.amount), 0),
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-32 bg-slate-100 rounded-xl"></div>
                <div className="h-64 bg-slate-100 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-5 border-2 border-green-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Award className="text-green-600" size={20} />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">Tổng thưởng</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{stats.totalRewards}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                        <p className="text-sm text-white/80 font-medium">Tiền thưởng</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalRewardAmount)}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl p-5 border-2 border-red-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={20} />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">Tổng phạt</p>
                    </div>
                    <p className="text-3xl font-bold text-red-600">{stats.totalDisciplines}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <TrendingDown size={20} />
                        </div>
                        <p className="text-sm text-white/80 font-medium">Tiền phạt</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalDisciplineAmount)}</p>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200">
                    <div className="flex gap-4 px-6">
                        <button
                            onClick={() => setActiveTab('rewards')}
                            className={`py-4 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'rewards'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Award size={18} />
                            Khen thưởng ({stats.totalRewards})
                        </button>
                        <button
                            onClick={() => setActiveTab('disciplines')}
                            className={`py-4 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'disciplines'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <AlertTriangle size={18} />
                            Kỷ luật ({stats.totalDisciplines})
                        </button>
                    </div>
                </div>

                {/* Rewards Tab */}
                {activeTab === 'rewards' && (
                    <div className="p-6">
                        {rewards.length === 0 ? (
                            <div className="text-center py-12">
                                <Award size={48} className="text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium">Chưa có khen thưởng nào</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rewards.map((reward) => (
                                    <motion.div
                                        key={reward.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200 hover:shadow-md transition-all"
                                    >
                                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Award className="text-white" size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{reward.reason}</p>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        {formatDate(reward.rewardDate)} • {rewardTypeLabels[reward.rewardType]}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xl font-bold text-green-600 whitespace-nowrap">
                                                        +{formatCurrency(Number(reward.amount))}
                                                    </p>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleDeleteReward(reward.id)}
                                                            className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Disciplines Tab */}
                {activeTab === 'disciplines' && (
                    <div className="p-6">
                        {disciplines.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertTriangle size={48} className="text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium">Chưa có kỷ luật nào</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {disciplines.map((discipline) => (
                                    <motion.div
                                        key={discipline.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-200 hover:shadow-md transition-all"
                                    >
                                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle className="text-white" size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{discipline.reason}</p>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        {formatDate(discipline.disciplineDate)} • {disciplineTypeLabels[discipline.disciplineType]}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xl font-bold text-red-600 whitespace-nowrap">
                                                        -{formatCurrency(Number(discipline.amount))}
                                                    </p>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleDeleteDiscipline(discipline.id)}
                                                            className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border-l-4 border-brandBlue p-4 rounded-r-lg">
                <h4 className="text-sm font-semibold text-brandBlue mb-2">ℹ️ Lưu ý:</h4>
                <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                    <li>Thưởng và phạt được tự động tính vào bảng lương tháng tương ứng</li>
                    <li>Thưởng sẽ CỘNG vào lương, phạt sẽ TRỪ khỏi lương</li>
                    <li>Chỉ tính các khoản trong kỳ lương (theo ngày thưởng/phạt)</li>
                    <li>Xem chi tiết trong phiếu lương của tháng tương ứng</li>
                </ul>
            </div>
        </div>
    );
}
