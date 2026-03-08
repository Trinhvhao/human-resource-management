'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Users, UserPlus, Trash2, Mail, Calendar, Percent } from 'lucide-react';
import teamService from '@/services/teamService';
import employeeService from '@/services/employeeService';
import { Team, AddTeamMemberData } from '@/types/team';
import { Employee } from '@/types/employee';

export default function TeamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [memberRole, setMemberRole] = useState<'LEAD' | 'SENIOR' | 'MEMBER' | 'CONTRIBUTOR'>('MEMBER');
  const [allocation, setAllocation] = useState(100);

  useEffect(() => {
    fetchTeamDetails();
  }, [teamId]);

  const fetchTeamDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [teamRes, employeesRes] = await Promise.all([
        teamService.getById(teamId),
        employeeService.getAll()
      ]);
      setTeam(teamRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Failed to fetch team details:', error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const handleAddMember = async () => {
    if (!selectedEmployee) return;

    try {
      const data: AddTeamMemberData = {
        employeeId: selectedEmployee,
        role: memberRole,
        allocationPercentage: allocation,
        startDate: new Date().toISOString().split('T')[0]
      };

      await teamService.addMember(teamId, data);
      setShowAddMember(false);
      setSelectedEmployee('');
      setMemberRole('MEMBER');
      setAllocation(100);
      fetchTeamDetails();
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thành viên này khỏi team?')) return;

    try {
      await teamService.removeMember(teamId, memberId);
      fetchTeamDetails();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      LEAD: 'bg-purple-100 text-purple-700 border-purple-300',
      SENIOR: 'bg-blue-100 text-blue-700 border-blue-300',
      MEMBER: 'bg-green-100 text-green-700 border-green-300',
      CONTRIBUTOR: 'bg-slate-100 text-slate-700 border-slate-300'
    };
    return styles[role as keyof typeof styles] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      LEAD: 'Lead',
      SENIOR: 'Senior',
      MEMBER: 'Member',
      CONTRIBUTOR: 'Contributor'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      PERMANENT: 'Cố định',
      PROJECT: 'Dự án',
      CROSS_FUNCTIONAL: 'Liên phòng ban'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const availableEmployees = employees.filter(emp => 
    emp.departmentId === team?.departmentId &&
    !team?.members?.some(m => m.employeeId === emp.id)
  );

  if (loading) {
    return (
      <>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </>
    );
  }

  if (!team) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-slate-500">Team không tồn tại</p>
        </div>
      </>
    );
  }

  return (
    <>
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
              <h1 className="text-3xl font-bold text-slate-900">{team.name}</h1>
              <p className="text-sm text-slate-500 mt-1">{team.code}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brandBlue text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={18} />
            Thêm thành viên
          </button>
        </div>

        {/* Team Info */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Thông tin Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Phòng ban</p>
              <p className="font-semibold text-slate-900">{team.department?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Loại team</p>
              <p className="font-semibold text-slate-900">{getTypeLabel(team.type)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Team Lead</p>
              <p className="font-semibold text-slate-900">{team.teamLead?.fullName || 'Chưa có'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Số thành viên</p>
              <p className="font-semibold text-blue-600">{team.members?.length || 0} người</p>
            </div>
          </div>
          {team.description && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Mô tả</p>
              <p className="text-slate-700">{team.description}</p>
            </div>
          )}
        </div>

        {/* Members List */}
        <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Thành viên ({team.members?.length || 0})</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {team.members && team.members.length > 0 ? (
              team.members.map(member => (
                <div key={member.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-brandBlue text-white flex items-center justify-center font-bold">
                        {member.employee?.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{member.employee?.fullName}</h3>
                        <p className="text-sm text-slate-500">{member.employee?.position}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-600">{member.employee?.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border-2 ${getRoleBadge(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                          <Percent size={14} />
                          <span>{member.allocationPercentage}% allocation</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                          <Calendar size={14} />
                          <span>Từ {new Date(member.startDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Users size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Chưa có thành viên nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Thêm thành viên</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nhân viên
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  >
                    <option value="">Chọn nhân viên</option>
                    {availableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} - {emp.position}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Vai trò
                  </label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="SENIOR">Senior</option>
                    <option value="LEAD">Lead</option>
                    <option value="CONTRIBUTOR">Contributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Allocation (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={allocation}
                    onChange={(e) => setAllocation(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedEmployee}
                  className="flex-1 px-4 py-2 bg-brandBlue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
