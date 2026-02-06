'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { 
    ChevronRight, Mail, Phone, Calendar, Building, Briefcase, User,
    FolderOpen, MapPin, Clock, MoreHorizontal, Download, Share2, Edit2, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import employeeService from '@/services/employeeService';
import teamService from '@/services/teamService';
import { employeeProfileService } from '@/services/employeeProfileService';
import { Employee } from '@/types/employee';
import { EmployeeTeam } from '@/types/team';
import { EmployeeProfile, EmployeeDocument } from '@/types/employee-profile';
import { formatDate, formatCurrency } from '@/utils/formatters';
import SalaryStructure from '@/components/employees/SalaryStructure';
import AvatarUpload from '@/components/employees/AvatarUpload';
import ProfileCompletionBar from '@/components/employees/ProfileCompletionBar';
import EmployeeProfileForm from '@/components/employees/EmployeeProfileForm';
import DocumentUpload from '@/components/employees/DocumentUpload';
import DocumentList from '@/components/employees/DocumentList';
import ActivityTimeline from '@/components/employees/ActivityTimeline';

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [teams, setTeams] = useState<EmployeeTeam[]>([]);
    const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'overview' | 'profile' | 'documents' | 'activity'>('overview');
    const [showActionMenu, setShowActionMenu] = useState(false);

    useEffect(() => {
        fetchEmployee();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            setLoading(true);
            const [empRes, teamsRes] = await Promise.all([
                employeeService.getById(id),
                teamService.getEmployeeTeams(id)
            ]);
            setEmployee(empRes.data);
            setTeams(teamsRes.data);
            
            try {
                const profileRes = await employeeProfileService.getProfile(id);
                if (profileRes.data) {
                    setProfile(profileRes.data.profile || {});
                    setDocuments(profileRes.data.documents || []);
                }
            } catch (profileError) {
                setProfile({});
                setDocuments([]);
            }
        } catch (error) {
            console.error('Failed to fetch employee:', error);
            alert('Không tìm thấy nhân viên');
            router.push('/dashboard/employees');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
        try {
            await employeeService.delete(id);
            router.push('/dashboard/employees');
        } catch (error) {
            alert('Xóa nhân viên thất bại');
        }
    };

    const handleAvatarUpload = async (file: File) => {
        try {
            const response = await employeeProfileService.uploadAvatar(id, file);
            if (employee && response.data) {
                setEmployee({
                    ...employee,
                    avatarUrl: response.data.avatarUrl || employee.avatarUrl
                });
            }
        } catch (error) {
            console.error('Avatar upload failed:', error);
            throw error;
        }
    };

    const handleProfileSave = async (data: Partial<EmployeeProfile>) => {
        try {
            await employeeProfileService.updateProfile(id, data);
            await fetchEmployee();
            alert('Cập nhật hồ sơ thành công!');
        } catch (error) {
            console.error('Profile save failed:', error);
            throw error;
        }
    };

    const handleDocumentUpload = async (file: File, documentType: string, description?: string) => {
        try {
            await employeeProfileService.uploadDocument(id, file, documentType, description);
            await fetchEmployee();
            alert('Tải lên tài liệu thành công!');
        } catch (error) {
            console.error('Document upload failed:', error);
            throw error;
        }
    };

    const handleDocumentDelete = async (documentId: string) => {
        try {
            await employeeProfileService.deleteDocument(id, documentId);
            await fetchEmployee();
        } catch (error) {
            console.error('Document delete failed:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-6 bg-slate-200 rounded w-48"></div>
                        <div className="h-32 bg-slate-100 rounded-xl"></div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="h-96 bg-slate-100 rounded-xl"></div>
                            <div className="col-span-2 space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!employee) return null;

    const avatarUrl = employee.avatarUrl 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}${employee.avatarUrl}` 
        : null;

    const initials = employee.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
                    <button 
                        onClick={() => router.push('/dashboard/employees')}
                        className="hover:text-brandBlue transition-colors"
                    >
                        Nhân viên
                    </button>
                    <ChevronRight size={16} />
                    <span className="text-slate-900 font-medium">{employee.fullName}</span>
                </div>

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="relative group">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={employee.fullName}
                                    className="w-24 h-24 rounded-2xl object-cover border-4 border-brandBlue/10"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brandBlue to-blue-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-brandBlue/10">
                                    {initials}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-primary">{employee.fullName}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    employee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                    employee.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {employee.status === 'ACTIVE' ? 'Đang làm việc' :
                                     employee.status === 'ON_LEAVE' ? 'Đang nghỉ' : 'Đã nghỉ việc'}
                                </span>
                            </div>
                            <p className="text-lg text-brandBlue font-medium mb-3">{employee.position}</p>
                            <div className="flex items-center gap-6 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Building size={16} />
                                    <span>{employee.department?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span>Vào làm {formatDate(employee.startDate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User size={16} />
                                    <span>{employee.employeeCode}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push(`/dashboard/employees/${id}/edit`)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                        >
                            <Edit2 size={18} />
                            <span>Chỉnh sửa</span>
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowActionMenu(!showActionMenu)}
                                className="p-2.5 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-brandBlue transition-all"
                            >
                                <MoreHorizontal size={20} />
                            </button>
                            {showActionMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-10">
                                    <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700">
                                        <Download size={16} />
                                        Export PDF
                                    </button>
                                    <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700">
                                        <Share2 size={16} />
                                        Chia sẻ
                                    </button>
                                    <div className="border-t border-slate-200 my-2"></div>
                                    <button 
                                        onClick={handleDelete}
                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-3"
                                    >
                                        <Trash2 size={16} />
                                        Xóa nhân viên
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar Navigation */}
                    <div className="col-span-3">
                        <div className="bg-white rounded-2xl border border-slate-200 p-3 sticky top-6 shadow-sm">
                            <nav className="space-y-1">
                                <button
                                    onClick={() => setActiveSection('overview')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        activeSection === 'overview'
                                            ? 'bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white shadow-lg'
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <Briefcase size={18} />
                                    <span>Tổng quan</span>
                                </button>
                                <button
                                    onClick={() => setActiveSection('profile')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        activeSection === 'profile'
                                            ? 'bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white shadow-lg'
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <User size={18} />
                                    <span>Hồ sơ chi tiết</span>
                                </button>
                                <button
                                    onClick={() => setActiveSection('documents')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        activeSection === 'documents'
                                            ? 'bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white shadow-lg'
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <FolderOpen size={18} />
                                    <span>Tài liệu</span>
                                    {documents.length > 0 && (
                                        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${
                                            activeSection === 'documents' 
                                                ? 'bg-white/20 text-white' 
                                                : 'bg-slate-200 text-slate-700'
                                        }`}>
                                            {documents.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveSection('activity')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        activeSection === 'activity'
                                            ? 'bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white shadow-lg'
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <Clock size={18} />
                                    <span>Hoạt động</span>
                                </button>
                            </nav>

                            {/* Quick Stats */}
                            {employee._count && (
                                <div className="mt-6 pt-6 border-t border-slate-200 space-y-2">
                                    <p className="text-xs font-bold text-slate-500 uppercase px-4 mb-3">Thống kê nhanh</p>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                            <span className="text-sm text-slate-600">Hợp đồng</span>
                                            <span className="text-sm font-bold text-brandBlue">{employee._count.contracts}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                            <span className="text-sm text-slate-600">Ngày công</span>
                                            <span className="text-sm font-bold text-green-600">{employee._count.attendances}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                            <span className="text-sm text-slate-600">Đơn nghỉ</span>
                                            <span className="text-sm font-bold text-orange-600">{employee._count.leaveRequests}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                            <span className="text-sm text-slate-600">Khen thưởng</span>
                                            <span className="text-sm font-bold text-purple-600">{employee._count.rewards}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="col-span-9">
                        {/* Overview Section */}
                        {activeSection === 'overview' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Contact Information */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-primary mb-4">Thông tin liên hệ</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                <Mail className="text-blue-600" size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Email</p>
                                                <p className="text-sm font-semibold text-primary">{employee.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                                <Phone className="text-green-600" size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Số điện thoại</p>
                                                <p className="text-sm font-semibold text-primary">{employee.phone || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="text-purple-600" size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Địa chỉ</p>
                                                <p className="text-sm font-semibold text-primary">{employee.address || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                                                <Calendar className="text-orange-600" size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Ngày sinh</p>
                                                <p className="text-sm font-semibold text-primary">{formatDate(employee.dateOfBirth)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Work Information */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-primary mb-4">Thông tin công việc</h2>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                            <span className="text-sm text-slate-600">Mã nhân viên</span>
                                            <span className="text-sm font-bold text-primary">{employee.employeeCode}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                            <span className="text-sm text-slate-600">Chức vụ</span>
                                            <span className="text-sm font-bold text-primary">{employee.position}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                            <span className="text-sm text-slate-600">Phòng ban</span>
                                            <span className="text-sm font-bold text-primary">{employee.department?.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                            <span className="text-sm text-slate-600">Ngày vào làm</span>
                                            <span className="text-sm font-bold text-primary">{formatDate(employee.startDate)}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3">
                                            <span className="text-sm text-slate-600">Lương cơ bản</span>
                                            <span className="text-sm font-bold text-brandBlue">{formatCurrency(Number(employee.baseSalary))}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-primary mb-4">Thông tin cá nhân</h2>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                            <span className="text-sm text-slate-600">Giới tính</span>
                                            <span className="text-sm font-bold text-primary">{employee.gender || 'Chưa cập nhật'}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                            <span className="text-sm text-slate-600">CMND/CCCD</span>
                                            <span className="text-sm font-bold text-primary">{employee.idCard}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3">
                                            <span className="text-sm text-slate-600">Trạng thái</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                employee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                employee.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {employee.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Teams */}
                                {teams.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                        <h2 className="text-lg font-bold text-primary mb-4">Teams ({teams.length})</h2>
                                        <div className="space-y-3">
                                            {teams.map((team) => (
                                                <div
                                                    key={team.id}
                                                    onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                                                    className="p-4 border-2 border-slate-200 rounded-xl hover:border-brandBlue hover:bg-blue-50/50 hover:shadow-md transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <p className="font-bold text-primary">{team.name}</p>
                                                            <p className="text-xs text-slate-500">{team.code}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            team.membership.role === 'LEAD' ? 'bg-purple-100 text-purple-700' :
                                                            team.membership.role === 'SENIOR' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                            {team.membership.role}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-slate-600">
                                                        <span>{team.department?.name}</span>
                                                        <span>•</span>
                                                        <span className="font-semibold text-brandBlue">{team.membership.allocationPercentage}% allocation</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Salary Structure */}
                                <SalaryStructure employeeId={id} canEdit={true} />
                            </motion.div>
                        )}

                        {/* Profile Section */}
                        {activeSection === 'profile' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Avatar & Completion */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-1">
                                            <AvatarUpload
                                                currentAvatar={employee?.avatarUrl}
                                                employeeName={employee?.fullName || ''}
                                                onUpload={handleAvatarUpload}
                                            />
                                        </div>
                                        <div className="lg:col-span-2">
                                            <h3 className="text-lg font-bold text-primary mb-4">Tiến độ hoàn thiện hồ sơ</h3>
                                            <ProfileCompletionBar
                                                percentage={profile?.profileCompletionPercentage || 0}
                                                showDetails={true}
                                            />
                                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                <p className="text-sm text-blue-800">
                                                    💡 <strong>Mẹo:</strong> Hoàn thiện đầy đủ hồ sơ giúp quản lý thông tin nhân viên hiệu quả hơn.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Form */}
                                <EmployeeProfileForm
                                    profile={profile}
                                    onSave={handleProfileSave}
                                />
                            </motion.div>
                        )}

                        {/* Documents Section */}
                        {activeSection === 'documents' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold text-primary">Tài liệu nhân viên</h2>
                                        <p className="text-sm text-slate-600 mt-1">
                                            Quản lý hồ sơ, chứng chỉ và tài liệu liên quan
                                        </p>
                                    </div>
                                    <DocumentUpload
                                        employeeId={id}
                                        onUpload={handleDocumentUpload}
                                        onSuccess={fetchEmployee}
                                    />
                                </div>
                                <DocumentList
                                    documents={documents}
                                    onDelete={handleDocumentDelete}
                                    onRefresh={fetchEmployee}
                                />
                            </motion.div>
                        )}

                        {/* Activity Section */}
                        {activeSection === 'activity' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                            >
                                <h2 className="text-lg font-bold text-primary mb-6">Hoạt động gần đây</h2>
                                <ActivityTimeline employeeId={id} />
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
