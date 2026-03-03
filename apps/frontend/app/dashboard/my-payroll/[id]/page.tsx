'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Download, TrendingUp, TrendingDown, Info, DollarSign, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import payrollService from '@/services/payrollService';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function MyPayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [payslip, setPayslip] = useState<any>(null);
    const [comparison, setComparison] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayslip();
    }, [id]);

    const fetchPayslip = async () => {
        try {
            setLoading(true);
            const response = await payrollService.getMyPayslipDetail(id);
            setPayslip(response.data);

            // Fetch previous month for comparison
            const prevMonth = response.data.payroll.month === 1 ? 12 : response.data.payroll.month - 1;
            const prevYear = response.data.payroll.month === 1 ? response.data.payroll.year - 1 : response.data.payroll.year;

            try {
                const allPayslips = await payrollService.getMyPayslips();
                const prevPayslip = allPayslips.data.find((p: any) =>
                    p.month === prevMonth && p.year === prevYear
                );
                if (prevPayslip) {
                    setComparison(prevPayslip);
                }
            } catch (error) {
                // No previous payslip
            }
        } catch (error) {
            console.error('Failed to fetch payslip:', error);
            alert('Không tìm thấy phiếu lương');
            router.push('/dashboard/payroll');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !payslip) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    const totalIncome = Number(payslip.baseSalary) + Number(payslip.allowances) +
        Number(payslip.bonus) + Number(payslip.overtimePay);
    const totalDeductions = Number(payslip.insurance) + Number(payslip.tax) + Number(payslip.deduction);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-primary">
                                Phiếu lương tháng {payslip.payroll.month}/{payslip.payroll.year}
                            </h1>
                            <p className="text-slate-500 mt-1">Chi tiết thu nhập và khấu trừ</p>
                        </div>
                    </div>

                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-brandBlue text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Tải PDF (Coming soon)"
                        disabled
                    >
                        <Download size={18} />
                        Tải PDF
                    </button>
                </div>

                {/* Net Salary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-2xl p-8 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10">
                        <p className="text-white/80 mb-2">Thực lãnh</p>
                        <p className="text-5xl font-bold mb-4">{formatCurrency(Number(payslip.netSalary))}</p>

                        {comparison && (
                            <div className={`flex items-center gap-2 rounded-lg px-4 py-2 w-fit ${Number(payslip.netSalary) > Number(comparison.netSalary)
                                ? 'bg-green-400/20'
                                : 'bg-red-400/20'
                                }`}>
                                {Number(payslip.netSalary) > Number(comparison.netSalary) ? (
                                    <>
                                        <TrendingUp size={20} />
                                        <span>Tăng {formatCurrency(Number(payslip.netSalary) - Number(comparison.netSalary))} so với tháng trước</span>
                                    </>
                                ) : (
                                    <>
                                        <TrendingDown size={20} />
                                        <span>Giảm {formatCurrency(Number(comparison.netSalary) - Number(payslip.netSalary))} so với tháng trước</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl p-6 border-2 border-green-200"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="text-green-600" size={20} />
                            </div>
                            <p className="text-sm text-slate-600">Tổng thu nhập</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl p-6 border-2 border-red-200"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="text-red-600" size={20} />
                            </div>
                            <p className="text-sm text-slate-600">Tổng khấu trừ</p>
                        </div>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDeductions)}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-6 border-2 border-blue-200"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="text-blue-600" size={20} />
                            </div>
                            <p className="text-sm text-slate-600">Ngày công</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                            {payslip.actualWorkDays}/{payslip.workDays}
                        </p>
                    </motion.div>
                </div>

                {/* Detailed Breakdown */}
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <h3 className="text-lg font-bold mb-6">Chi tiết lương</h3>

                    {/* Income Section */}
                    <div className="mb-6">
                        <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                            <div className="w-1 h-5 bg-green-600 rounded"></div>
                            Thu nhập
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-700">Lương cơ bản</span>
                                <span className="font-semibold">{formatCurrency(Number(payslip.baseSalary))}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-700">Phụ cấp</span>
                                <span className="font-semibold text-green-600">+{formatCurrency(Number(payslip.allowances))}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-700">Thưởng</span>
                                <span className="font-semibold text-green-600">+{formatCurrency(Number(payslip.bonus))}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-700">Tăng ca ({payslip.overtimeHours}h)</span>
                                <span className="font-semibold text-green-600">+{formatCurrency(Number(payslip.overtimePay))}</span>
                            </div>
                            <div className="flex justify-between py-3 bg-green-50 px-4 rounded-lg font-bold mt-2">
                                <span>Tổng thu nhập</span>
                                <span className="text-green-600">{formatCurrency(totalIncome)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Deduction Section */}
                    <div>
                        <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                            <div className="w-1 h-5 bg-red-600 rounded"></div>
                            Khấu trừ
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-700">Bảo hiểm (BHXH + BHYT + BHTN)</span>
                                <span className="font-semibold text-red-600">-{formatCurrency(Number(payslip.insurance))}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-700">Thuế thu nhập cá nhân</span>
                                <span className="font-semibold text-red-600">-{formatCurrency(Number(payslip.tax))}</span>
                            </div>
                            {Number(payslip.deduction) > 0 && (
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-700">Khấu trừ khác</span>
                                    <span className="font-semibold text-red-600">-{formatCurrency(Number(payslip.deduction))}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-3 bg-red-50 px-4 rounded-lg font-bold mt-2">
                                <span>Tổng khấu trừ</span>
                                <span className="text-red-600">-{formatCurrency(totalDeductions)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-brandBlue p-4 rounded-r-lg">
                    <div className="flex gap-3">
                        <Info className="text-brandBlue flex-shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-slate-700">
                            <p className="font-semibold mb-2">Thông tin hữu ích:</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Ngày công thực tế: {payslip.actualWorkDays}/{payslip.workDays} ngày</li>
                                <li>Giảm trừ gia cảnh: 11,000,000 VNĐ/tháng</li>
                                <li>Mức đóng BHXH tối đa: 36,000,000 VNĐ</li>
                                <li>Lương được chuyển vào tài khoản ngày 5 hàng tháng</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
