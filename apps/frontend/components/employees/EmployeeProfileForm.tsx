'use client';

import React, { useState } from 'react';
import { EmployeeProfile, MARITAL_STATUS_LABELS, EDUCATION_LABELS, RELATIONSHIP_OPTIONS, VIETNAM_BANKS } from '@/types/employee-profile';

interface EmployeeProfileFormProps {
  profile: Partial<EmployeeProfile>;
  onSave: (data: Partial<EmployeeProfile>) => Promise<void>;
  disabled?: boolean;
}

type TabId = 'personal' | 'emergency' | 'education' | 'bank';

export default function EmployeeProfileForm({ profile, onSave, disabled = false }: EmployeeProfileFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const [formData, setFormData] = useState<Partial<EmployeeProfile>>(profile);
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: 'personal' as TabId, label: 'Thông tin cá nhân', icon: '👤' },
    { id: 'emergency' as TabId, label: 'Liên hệ khẩn cấp', icon: '🚨' },
    { id: 'education' as TabId, label: 'Học vấn', icon: '🎓' },
    { id: 'bank' as TabId, label: 'Ngân hàng', icon: '🏦' },
  ];

  const handleChange = (field: keyof EmployeeProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Personal Information */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nơi sinh
                </label>
                <input
                  type="text"
                  value={formData.placeOfBirth || ''}
                  onChange={(e) => handleChange('placeOfBirth', e.target.value)}
                  placeholder="VD: Hà Nội"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quốc tịch
                </label>
                <input
                  type="text"
                  value={formData.nationality || ''}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  placeholder="VD: Việt Nam"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tình trạng hôn nhân
                </label>
                <select
                  value={formData.maritalStatus || ''}
                  onChange={(e) => handleChange('maritalStatus', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                >
                  <option value="">Chọn tình trạng</option>
                  {Object.entries(MARITAL_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số con
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.numberOfChildren || ''}
                  onChange={(e) => handleChange('numberOfChildren', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        {activeTab === 'emergency' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Liên hệ khẩn cấp</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ tên người liên hệ
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName || ''}
                  onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone || ''}
                  onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                  placeholder="VD: 0987654321"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mối quan hệ
                </label>
                <select
                  value={formData.emergencyContactRelationship || ''}
                  onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                >
                  <option value="">Chọn mối quan hệ</option>
                  {RELATIONSHIP_OPTIONS.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactAddress || ''}
                  onChange={(e) => handleChange('emergencyContactAddress', e.target.value)}
                  placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        )}

        {/* Education */}
        {activeTab === 'education' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Học vấn</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trình độ học vấn cao nhất
                </label>
                <select
                  value={formData.highestEducation || ''}
                  onChange={(e) => handleChange('highestEducation', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                >
                  <option value="">Chọn trình độ</option>
                  {Object.entries(EDUCATION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chuyên ngành
                </label>
                <input
                  type="text"
                  value={formData.major || ''}
                  onChange={(e) => handleChange('major', e.target.value)}
                  placeholder="VD: Công nghệ thông tin"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trường
                </label>
                <input
                  type="text"
                  value={formData.university || ''}
                  onChange={(e) => handleChange('university', e.target.value)}
                  placeholder="VD: Đại học Bách Khoa Hà Nội"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Năm tốt nghiệp
                </label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  value={formData.graduationYear || ''}
                  onChange={(e) => handleChange('graduationYear', parseInt(e.target.value) || undefined)}
                  placeholder="VD: 2020"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bank Information */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin ngân hàng</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngân hàng
                </label>
                <select
                  value={formData.bankName || ''}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                >
                  <option value="">Chọn ngân hàng</option>
                  {VIETNAM_BANKS.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tài khoản
                </label>
                <input
                  type="text"
                  value={formData.bankAccountNumber || ''}
                  onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                  placeholder="VD: 1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên chủ tài khoản
                </label>
                <input
                  type="text"
                  value={formData.bankAccountHolder || ''}
                  onChange={(e) => handleChange('bankAccountHolder', e.target.value)}
                  placeholder="VD: NGUYEN VAN A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chi nhánh
                </label>
                <input
                  type="text"
                  value={formData.bankBranch || ''}
                  onChange={(e) => handleChange('bankBranch', e.target.value)}
                  placeholder="VD: Hà Nội"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã số thuế
                </label>
                <input
                  type="text"
                  value={formData.taxCode || ''}
                  onChange={(e) => handleChange('taxCode', e.target.value)}
                  placeholder="VD: 1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số BHXH
                </label>
                <input
                  type="text"
                  value={formData.socialInsuranceNumber || ''}
                  onChange={(e) => handleChange('socialInsuranceNumber', e.target.value)}
                  placeholder="VD: 1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số BHYT
                </label>
                <input
                  type="text"
                  value={formData.healthInsuranceNumber || ''}
                  onChange={(e) => handleChange('healthInsuranceNumber', e.target.value)}
                  placeholder="VD: 1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={saving || disabled}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Lưu thay đổi
            </>
          )}
        </button>
      </div>
    </form>
  );
}
