'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronRight, Mail, Phone, Calendar, Building, User,
    FolderOpen, MapPin, Clock, MoreHorizontal, Download, Share2, Edit2, Trash2,
    CheckCircle, AlertTriangle, Info, Shield, GraduationCap, CreditCard, DollarSign, Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import employeeService from '@/services/employeeService';
import teamService from '@/services/teamService';
import { employeeProfileService } from '@/services/employeeProfileService';
import { Employee } from '@/types/employee';
import { EmployeeTeam } from '@/types/team';
import { EmployeeProfile, EmployeeDocument, DocumentType, MARITAL_STATUS_LABELS, EDUCATION_LABELS } from '@/types/employee-profile';
import { formatDate, formatCurrency } from '@/utils/formatters';
import SalaryStructure from '@/components/employees/SalaryStructure';
import ProfileCompletionBar from '@/components/employees/ProfileCompletionBar';
import DocumentUpload from '@/components/employees/DocumentUpload';
import DocumentList from '@/components/employees/DocumentList';
import ActivityTimeline from '@/components/employees/ActivityTimeline';
import AvatarUpload from '@/components/employees/AvatarUpload';
import EmployeeRewardsAndDisciplines from '@/components/employees/EmployeeRewardsAndDisciplines';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const { user } = useAuthStore();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [teams, setTeams] = useState<EmployeeTeam[]>([]);
    const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'profile' | 'documents' | 'salary' | 'rewards' | 'activity'>('profile');
    const [activeProfileTab, setActiveProfileTab] = useState<'personal' | 'emergency' | 'education' | 'bank'>('personal');
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [activityRefreshKey, setActivityRefreshKey] = useState(0);

    // Permission checks
    const canViewSalary = ['ADMIN', 'HR_MANAGER'].includes(user?.role || '');
    const canEditProfile = ['ADMIN', 'HR_MANAGER'].includes(user?.role || '') || user?.employee?.id === id;
    const canDeleteEmployee = ['ADMIN', 'HR_MANAGER'].includes(user?.role || '');

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

                // profileRes = { success: true, data: { ...employee, profile: {...}, documents: [...] } }
                const employeeData = profileRes.data || profileRes; // Handle both wrapped and unwrapped

                if (employeeData) {
                    setProfile(employeeData.profile || {});
                    // Filter out AVATAR documents - avatar is not a document
                    const realDocuments = (employeeData.documents || []).filter(
                        (doc: any) => doc.documentType !== 'AVATAR'
                    );
                    setDocuments(realDocuments);
                }
            } catch (profileError) {
                console.error('❌ Profile fetch error:', profileError);
                setProfile({});
                setDocuments([]);
            }
        } catch (error) {
            console.error('Failed to fetch employee:', error);
            toast.error('Không tìm thấy nhân viên');
            router.push('/dashboard/employees');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!canDeleteEmployee) {
            toast.error('Bạn không có quyền xóa nhân viên');
            return;
        }
        if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
        try {
            await employeeService.delete(id);
            toast.success('Xóa nhân viên thành công');
            router.push('/dashboard/employees');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Xóa nhân viên thất bại');
        }
    };

    const handleAvatarUpload = async (file: File) => {
        try {
            console.log('🔄 Starting avatar upload...');
            const response = await employeeProfileService.uploadAvatar(id, file);
            console.log('✅ Avatar upload response:', response);

            // Backend returns: { success: true, message: '...', data: { ...document, avatarUrl } }
            // Check multiple possible response structures
            const avatarUrl = response.data?.avatarUrl || response.data?.fileUrl || response.avatarUrl;

            if (avatarUrl) {
                console.log('📸 New avatar URL:', avatarUrl);

                // Update employee state immediately with new avatar
                setEmployee(prev => prev ? {
                    ...prev,
                    avatarUrl: avatarUrl
                } : null);

                toast.success('Cập nhật ảnh đại diện thành công!');

                // Refresh activity timeline
                setActivityRefreshKey(prev => prev + 1);
            } else {
                console.warn('⚠️ No avatarUrl in response, but upload may have succeeded');
                console.log('Response structure:', JSON.stringify(response, null, 2));

                // Still show success and refresh
                toast.success('Cập nhật ảnh đại diện thành công!');
                setActivityRefreshKey(prev => prev + 1);

                // Force refresh employee data to get new avatar
                await fetchEmployee();
            }
        } catch (error: any) {
            console.error('❌ Avatar upload failed:', error);
            console.error('Error details:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.message || 'Tải ảnh thất bại';
            toast.error(errorMessage);
            throw error;
        }
    };

    const handleProfileSave = async (data: Partial<EmployeeProfile>) => {
        if (!canEditProfile) {
            toast.error('Bạn không có quyền chỉnh sửa hồ sơ');
            return;
        }

        // Optimistic update
        const previousProfile = profile;
        setProfile({ ...profile, ...data });

        try {
            console.log('Saving profile data:', data);
            const response = await employeeProfileService.updateProfile(id, data);
            console.log('Profile save response:', response);

            // Update with server response
            if (response.data) {
                setProfile(response.data);
            }

            toast.success('Cập nhật hồ sơ thành công!');
            // Refresh activity timeline
            setActivityRefreshKey(prev => prev + 1);
        } catch (error: any) {
            // Rollback on error
            setProfile(previousProfile);
            console.error('Profile save failed:', error);
            toast.error(error.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.');
            throw error;
        }
    };

    const handleDocumentUpload = async (file: File, documentType: string, description?: string) => {
        // Optimistic update
        const tempDoc: Partial<EmployeeDocument> = {
            id: `temp-${Date.now()}`,
            employeeId: id,
            fileName: file.name,
            fileUrl: URL.createObjectURL(file), // Temporary URL for preview
            fileSize: file.size,
            mimeType: file.type,
            documentType: documentType as unknown as DocumentType,
            description: description,
            uploadedAt: new Date().toISOString(),
        };
        setDocuments([...documents, tempDoc as EmployeeDocument]);

        try {
            const response = await employeeProfileService.uploadDocument(id, file, documentType, description);
            // Replace temp with real document
            setDocuments(docs => docs.map(d => d.id === tempDoc.id ? response.data : d));
            toast.success('Tải lên tài liệu thành công!');
            // Refresh activity timeline
            setActivityRefreshKey(prev => prev + 1);
        } catch (error: any) {
            // Remove temp document on error
            setDocuments(docs => docs.filter(d => d.id !== tempDoc.id));
            console.error('Document upload failed:', error);
            toast.error(error.response?.data?.message || 'Tải lên thất bại');
            throw error;
        }
    };

    const handleDocumentDelete = async (documentId: string) => {
        // Optimistic update
        const previousDocuments = documents;
        setDocuments(docs => docs.filter(d => d.id !== documentId));

        try {
            await employeeProfileService.deleteDocument(id, documentId);
            toast.success('Xóa tài liệu thành công');
            // Refresh activity timeline
            setActivityRefreshKey(prev => prev + 1);
        } catch (error: any) {
            // Rollback on error
            setDocuments(previousDocuments);
            console.error('Document delete failed:', error);
            toast.error(error.response?.data?.message || 'Xóa tài liệu thất bại');
            throw error;
        }
    };

    if (loading) {
        return (
            <>
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
            </>
        );
    }

    if (!employee) return null;

    return (
        <ProtectedRoute requiredPermission="VIEW_EMPLOYEES">
            <>
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

                    {/* Hero Header - Redesigned */}
                    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl border-2 border-slate-200 p-8 mb-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-8">
                                {/* Avatar - Larger size without status badge */}
                                <div className="relative flex-shrink-0">
                                    <AvatarUpload
                                        currentAvatar={employee.avatarUrl}
                                        employeeName={employee.fullName}
                                        onUpload={handleAvatarUpload}
                                        disabled={!canEditProfile}
                                    />
                                </div>

                                {/* Info Section */}
                                <div className="flex-1 pt-2">
                                    {/* Name and Status */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <h1 className="text-4xl font-bold text-slate-900">{employee.fullName}</h1>
                                        <div className={`px-4 py-1.5 text-white text-sm font-bold rounded-full shadow-md flex items-center gap-2 ${employee.status === 'ACTIVE' ? 'bg-green-500' :
                                            employee.status === 'ON_LEAVE' ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}>
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                            {employee.status === 'ACTIVE' ? 'Active' :
                                                employee.status === 'ON_LEAVE' ? 'On Leave' :
                                                    'Inactive'}
                                        </div>
                                    </div>

                                    {/* Position */}
                                    <p className="text-xl text-brandBlue font-semibold mb-6">{employee.position}</p>

                                    {/* Quick Info Grid */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <Building size={20} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">Phòng ban</p>
                                                <p className="text-sm font-bold text-slate-900">{employee.department?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <Calendar size={20} className="text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">Ngày vào làm</p>
                                                <p className="text-sm font-bold text-slate-900">{formatDate(employee.startDate)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                                                <User size={20} className="text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">Mã NV</p>
                                                <p className="text-sm font-bold text-slate-900">{employee.employeeCode}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => router.push(`/dashboard/employees/${id}/edit`)}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brandBlue to-blue-600 text-white rounded-xl hover:shadow-xl transition-all font-semibold"
                                >
                                    <Edit2 size={18} />
                                    <span>Chỉnh sửa</span>
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowActionMenu(!showActionMenu)}
                                        className="p-3 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-brandBlue transition-all"
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
                                            {canDeleteEmployee && (
                                                <>
                                                    <div className="border-t border-slate-200 my-2"></div>
                                                    <button
                                                        onClick={handleDelete}
                                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-3"
                                                    >
                                                        <Trash2 size={16} />
                                                        Xóa nhân viên
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
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
                                        onClick={() => setActiveSection('profile')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === 'profile'
                                            ? 'bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white shadow-lg'
                                            : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        <User size={18} />
                                        <span>Hồ sơ chi tiết</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveSection('documents')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === 'documents'
                                            ? 'bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white shadow-lg'
                                            : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        <FolderOpen size={18} />
                                        <span>Tài liệu</span>
                                        {documents.length > 0 && (
                                            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${activeSection === 'documents'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                {documents.length}
                                            </span>
                                        )}
                                    </button>
                                    {canViewSalary && (
                                        <button
                                            onClick={() => setActiveSection('salary')}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === 'salary'
                                                ? 'bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white shadow-lg'
                                                : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            <DollarSign size={18} />
                                            <span>Cấu trúc lương</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setActiveSection('rewards')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === 'rewards'
                                            ? 'bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white shadow-lg'
                                            : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Award size={18} />
                                        <span>Thưởng & Phạt</span>
                                        {employee._count && (employee._count.rewards > 0 || employee._count.disciplines > 0) && (
                                            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${activeSection === 'rewards'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                {(employee._count.rewards || 0) + (employee._count.disciplines || 0)}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveSection('activity')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === 'activity'
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
                            {/* Profile Section */}
                            {activeSection === 'profile' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Profile Completion Card - MOVED TO TOP */}
                                    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Tiến độ hoàn thiện hồ sơ</h3>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    <span className="font-bold text-brandBlue">{profile?.profileCompletionPercentage || 0}%</span> hoàn thành
                                                </p>
                                            </div>
                                            {(profile?.profileCompletionPercentage || 0) === 100 && (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                                                    <CheckCircle size={18} />
                                                    <span className="text-sm font-semibold">Hoàn thiện</span>
                                                </div>
                                            )}
                                        </div>

                                        <ProfileCompletionBar
                                            percentage={profile?.profileCompletionPercentage || 0}
                                            showDetails={false}
                                        />

                                        {(profile?.profileCompletionPercentage || 0) < 100 && (
                                            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
                                                <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                                <div>
                                                    <p className="text-sm text-blue-800">
                                                        <strong>Mẹo:</strong> Hoàn thiện đầy đủ hồ sơ giúp quản lý thông tin nhân viên hiệu quả hơn.
                                                        Thông tin cơ bản đã có, hãy bổ sung thêm thông tin cá nhân, liên hệ khẩn cấp, học vấn và ngân hàng.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Basic Employee Information */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-slate-900">Thông tin cơ bản</h3>
                                            <button
                                                onClick={() => router.push(`/dashboard/employees/${id}/edit`)}
                                                className="text-sm text-brandBlue hover:text-blue-700 font-semibold flex items-center gap-1"
                                            >
                                                <Edit2 size={16} />
                                                Chỉnh sửa
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Mail size={16} className="text-blue-600" />
                                                    <p className="text-xs text-slate-500">Email</p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">{employee.email}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Phone size={16} className="text-green-600" />
                                                    <p className="text-xs text-slate-500">Số điện thoại</p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">{employee.phone || 'Chưa cập nhật'}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar size={16} className="text-purple-600" />
                                                    <p className="text-xs text-slate-500">Ngày sinh</p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">{formatDate(employee.dateOfBirth)}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User size={16} className="text-orange-600" />
                                                    <p className="text-xs text-slate-500">Giới tính</p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">{employee.gender || 'Chưa cập nhật'}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CreditCard size={16} className="text-red-600" />
                                                    <p className="text-xs text-slate-500">CMND/CCCD</p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">{employee.idCard}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User size={16} className="text-indigo-600" />
                                                    <p className="text-xs text-slate-500">Mã nhân viên</p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">{employee.employeeCode}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl md:col-span-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MapPin size={16} className="text-pink-600" />
                                                    <p className="text-xs text-slate-500">Địa chỉ</p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {employee.address || 'Chưa cập nhật'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Work Information */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">Thông tin công việc</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Building size={16} className="text-blue-600" />
                                                    <p className="text-xs text-slate-500">Phòng ban</p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">{employee.department?.name}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User size={16} className="text-purple-600" />
                                                    <p className="text-xs text-slate-500">Chức vụ</p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">{employee.position}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar size={16} className="text-green-600" />
                                                    <p className="text-xs text-slate-500">Ngày vào làm</p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">{formatDate(employee.startDate)}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle size={16} className="text-green-600" />
                                                    <p className="text-xs text-slate-500">Trạng thái</p>
                                                </div>
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${employee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                    employee.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {employee.status}
                                                </span>
                                            </div>
                                            {canViewSalary && (
                                                <div className="p-4 bg-slate-50 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CreditCard size={16} className="text-brandBlue" />
                                                        <p className="text-xs text-slate-500">Lương cơ bản</p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-brandBlue">{formatCurrency(Number(employee.baseSalary))}</p>
                                                </div>
                                            )}
                                            {!canViewSalary && (
                                                <div className="p-4 bg-slate-50 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Shield size={16} className="text-slate-400" />
                                                        <p className="text-xs text-slate-500">Lương cơ bản</p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-400">••••••••</p>
                                                </div>
                                            )}
                                            {employee.endDate && (
                                                <div className="p-4 bg-slate-50 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Calendar size={16} className="text-red-600" />
                                                        <p className="text-xs text-slate-500">Ngày kết thúc</p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-900">{formatDate(employee.endDate)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Profile Data Display with Tabs (Read-only) */}
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                                        {/* Tab Headers */}
                                        <div className="border-b border-gray-200">
                                            <div className="flex gap-2 overflow-x-auto p-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveProfileTab('personal')}
                                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${activeProfileTab === 'personal'
                                                        ? 'border-brandBlue text-brandBlue'
                                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <User size={18} />
                                                    Thông tin cá nhân
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveProfileTab('emergency')}
                                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${activeProfileTab === 'emergency'
                                                        ? 'border-brandBlue text-brandBlue'
                                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <AlertTriangle size={18} />
                                                    Liên hệ khẩn cấp
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveProfileTab('education')}
                                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${activeProfileTab === 'education'
                                                        ? 'border-brandBlue text-brandBlue'
                                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <GraduationCap size={18} />
                                                    Học vấn
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveProfileTab('bank')}
                                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${activeProfileTab === 'bank'
                                                        ? 'border-brandBlue text-brandBlue'
                                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <CreditCard size={18} />
                                                    Ngân hàng
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tab Content */}
                                        <div className="p-6">
                                            {/* Edit Button */}
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {activeProfileTab === 'personal' && 'Thông tin cá nhân'}
                                                    {activeProfileTab === 'emergency' && 'Liên hệ khẩn cấp'}
                                                    {activeProfileTab === 'education' && 'Học vấn'}
                                                    {activeProfileTab === 'bank' && 'Thông tin ngân hàng'}
                                                </h3>
                                                {canEditProfile && (
                                                    <button
                                                        onClick={() => router.push(`/dashboard/employees/${id}/edit`)}
                                                        className="text-sm text-brandBlue hover:text-blue-700 font-semibold flex items-center gap-1"
                                                    >
                                                        <Edit2 size={16} />
                                                        Chỉnh sửa
                                                    </button>
                                                )}
                                            </div>

                                            {/* Personal Information Tab */}
                                            {activeProfileTab === 'personal' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Nơi sinh</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.placeOfBirth || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Quốc tịch</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.nationality || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Tình trạng hôn nhân</p>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {profile?.maritalStatus ? MARITAL_STATUS_LABELS[profile.maritalStatus] : 'Chưa cập nhật'}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Số con</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.numberOfChildren ?? 'Chưa cập nhật'}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Emergency Contact Tab */}
                                            {activeProfileTab === 'emergency' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Họ tên người liên hệ</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.emergencyContactName || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Số điện thoại</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.emergencyContactPhone || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Mối quan hệ</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.emergencyContactRelationship || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl md:col-span-2">
                                                        <p className="text-xs text-slate-500 mb-1">Địa chỉ</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.emergencyContactAddress || 'Chưa cập nhật'}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Education Tab */}
                                            {activeProfileTab === 'education' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Trình độ học vấn cao nhất</p>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {profile?.highestEducation ? EDUCATION_LABELS[profile.highestEducation] : 'Chưa cập nhật'}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Chuyên ngành</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.major || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Trường</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.university || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Năm tốt nghiệp</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.graduationYear || 'Chưa cập nhật'}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Bank Information Tab */}
                                            {activeProfileTab === 'bank' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Ngân hàng</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.bankName || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Số tài khoản</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.bankAccountNumber || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Tên chủ tài khoản</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.bankAccountHolder || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Chi nhánh</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.bankBranch || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Mã số thuế</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.taxCode || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Số BHXH</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.socialInsuranceNumber || 'Chưa cập nhật'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs text-slate-500 mb-1">Số BHYT</p>
                                                        <p className="text-sm font-semibold text-slate-900">{profile?.healthInsuranceNumber || 'Chưa cập nhật'}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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

                            {/* Salary Structure Section */}
                            {activeSection === 'salary' && canViewSalary && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <SalaryStructure employeeId={id} canEdit={canEditProfile} />
                                </motion.div>
                            )}

                            {/* Rewards & Disciplines Section */}
                            {activeSection === 'rewards' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <EmployeeRewardsAndDisciplines employeeId={id} canEdit={canEditProfile} />
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
                                    <ActivityTimeline key={activityRefreshKey} employeeId={id} />
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        </ProtectedRoute>
    );
}