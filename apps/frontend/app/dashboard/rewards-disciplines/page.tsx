'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Plus, Award, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import rewardService, { Reward } from '@/services/rewardService';
import disciplineService, { Discipline } from '@/services/disciplineService';

export default function RewardsDisciplinesPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<'rewards' | 'disciplines'>('rewards');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rewardsRes, disciplinesRes] = await Promise.all([
                rewardService.getAll(),
                disciplineService.getAll()
            ]);
            setRewards(rewardsRes.data);
            setDisciplines(disciplinesRes.data);
        } catch (error) {
            console.error('Không thể tải dữ liệu:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        totalRewards: rewards.length,
        totalRewardAmount: rewards.reduce((sum, r) => sum + Number(r.amount), 0),
        totalDisciplines: disciplines.length,
        totalDisciplineAmount: disciplines.reduce((sum, d) => sum + Number(d.amount), 0),
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">Thưởng & Phạt</h1>
                        <p className="text-slate-500 mt-1">Quản lý khen thưởng và kỷ luật nhân viên</p>
                    </div>

                    <button
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brandBlue to-blue-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all font-semibold shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={20} />
                        Thêm mới
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 border-2 border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Award className="text-green-600" size={20} />
                            </div>
                            <p className="text-sm text-slate-600">Tổng thưởng</p>
                        </div>
                        <p className="text-3xl font-bold text-green-600">{stats.totalRewards}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <TrendingUp size={20} />
                            </div>
                            <p className="text-sm text-white/80">Tổng tiền thưởng</p>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(stats.totalRewardAmount)}</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border-2 border-red-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={20} />
                            </div>
                            <p className="text-sm text-slate-600">Tổng phạt</p>
                        </div>
                        <p className="text-3xl font-bold text-red-600">{stats.totalDisciplines}</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <TrendingDown size={20} />
                            </div>
                            <p className="text-sm text-white/80">Tổng tiền phạt</p>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(stats.totalDisciplineAmount)}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-200">
                        <div className="flex gap-4 px-6">
                            <button
                                onClick={() => setSelectedTab('rewards')}
                                className={`py-4 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 ${selectedTab === 'rewards'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Award size={18} />
                                Khen thưởng ({stats.totalRewards})
                            </button>
                            <button
                                onClick={() => setSelectedTab('disciplines')}
                                className={`py-4 px-4 font-semibold border-b-2 transition-colors flex items-center gap-2 ${selectedTab === 'disciplines'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <AlertTriangle size={18} />
                                Kỷ luật ({stats.totalDisciplines})
                            </button>
                        </div>
                    </div>

                    {/* Rewards Table */}
                    {selectedTab === 'rewards' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nhân viên</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phòng ban</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Lý do</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Loại</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Số tiền</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Ngày</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="flex items-center justify-center">
                                                    <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : rewards.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <Award size={48} className="text-slate-300 mx-auto mb-3" />
                                                <p className="text-slate-400 font-medium">Chưa có khen thưởng nào</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        rewards.map((reward) => (
                                            <tr key={reward.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-primary">{reward.employee.fullName}</p>
                                                        <p className="text-sm text-slate-500">{reward.employee.employeeCode}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {reward.employee.department?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700">{reward.reason}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        {reward.rewardType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-green-600">
                                                        +{formatCurrency(Number(reward.amount))}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-slate-600">
                                                    {new Date(reward.rewardDate).toLocaleDateString('vi-VN')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Disciplines Table */}
                    {selectedTab === 'disciplines' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nhân viên</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phòng ban</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Lý do</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Loại</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Số tiền</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Ngày</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="flex items-center justify-center">
                                                    <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : disciplines.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <AlertTriangle size={48} className="text-slate-300 mx-auto mb-3" />
                                                <p className="text-slate-400 font-medium">Chưa có kỷ luật nào</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        disciplines.map((discipline) => (
                                            <tr key={discipline.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-primary">{discipline.employee.fullName}</p>
                                                        <p className="text-sm text-slate-500">{discipline.employee.employeeCode}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {discipline.employee.department?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700">{discipline.reason}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                        {discipline.disciplineType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-red-600">
                                                        -{formatCurrency(Number(discipline.amount))}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-slate-600">
                                                    {new Date(discipline.disciplineDate).toLocaleDateString('vi-VN')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="bg-blue-50 border-l-4 border-brandBlue p-4 rounded-r-lg">
                    <h4 className="text-sm font-semibold text-brandBlue mb-2">ℹ️ Lưu ý:</h4>
                    <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                        <li>Thưởng và phạt sẽ được tính vào bảng lương tháng tương ứng</li>
                        <li>Thưởng sẽ CỘNG vào lương, phạt sẽ TRỪ khỏi lương</li>
                        <li>Chỉ tính các khoản trong kỳ lương (theo ngày thưởng/phạt)</li>
                        <li>Có thể xem chi tiết trong phiếu lương của nhân viên</li>
                    </ul>
                </div>
            </div>
        </DashboardLayout>
    );
}
