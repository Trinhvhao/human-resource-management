'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Settings, Bell, Shield, Palette, Globe, Key, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      leaveApproval: true,
      overtimeApproval: true,
      payroll: false,
    },
    language: 'vi',
    theme: 'light',
  });

  const tabs = [
    { id: 'general', label: 'Chung', icon: Settings },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'security', label: 'Bảo mật', icon: Shield },
    { id: 'appearance', label: 'Giao diện', icon: Palette },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary">Cài đặt</h1>
          <p className="text-slate-500 mt-1">Tùy chỉnh hệ thống theo nhu cầu của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabs Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-brandBlue to-[#0047b3] text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-8"
            >
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-primary mb-6">Cài đặt chung</h2>

                  {/* Language */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                      <Globe size={18} className="text-brandBlue" />
                      Ngôn ngữ
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brandBlue transition-all"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  {/* Time Zone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Múi giờ
                    </label>
                    <select className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brandBlue">
                      <option>GMT+7 (Bangkok, Hanoi, Jakarta)</option>
                    </select>
                  </div>

                  {/* Date Format */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Định dạng ngày
                    </label>
                    <select className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brandBlue">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-primary mb-6">Thông báo</h2>

                  {/* Notification Channels */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700">Kênh thông báo</h3>

                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          📧
                        </div>
                        <div>
                          <p className="font-medium text-primary">Email</p>
                          <p className="text-sm text-slate-500">Nhận thông báo qua email</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email: e.target.checked }
                        })}
                        className="w-5 h-5 rounded border-slate-300 text-brandBlue focus:ring-2 focus:ring-brandBlue/20"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          🔔
                        </div>
                        <div>
                          <p className="font-medium text-primary">Push Notifications</p>
                          <p className="text-sm text-slate-500">Thông báo trên trình duyệt</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.push}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, push: e.target.checked }
                        })}
                        className="w-5 h-5 rounded border-slate-300 text-brandBlue focus:ring-2 focus:ring-brandBlue/20"
                      />
                    </label>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4 pt-6 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-700">Loại thông báo</h3>

                    {[
                      { key: 'leaveApproval', label: 'Duyệt nghỉ phép', desc: 'Khi có đơn nghỉ phép mới' },
                      { key: 'overtimeApproval', label: 'Duyệt tăng ca', desc: 'Khi có đơn tăng ca mới' },
                      { key: 'payroll', label: 'Lương', desc: 'Thông báo về lương hàng tháng' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-primary">{item.label}</p>
                          <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                          onChange={(e) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, [item.key]: e.target.checked }
                          })}
                          className="w-5 h-5 rounded border-slate-300 text-brandBlue focus:ring-2 focus:ring-brandBlue/20"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-primary mb-6">Bảo mật</h2>

                  {/* Change Password */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                      <Key size={18} className="text-brandBlue" />
                      Đổi mật khẩu
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Mật khẩu hiện tại"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brandBlue"
                      />
                      <input
                        type="password"
                        placeholder="Mật khẩu mới"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brandBlue"
                      />
                      <input
                        type="password"
                        placeholder="Xác nhận mật khẩu mới"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brandBlue"
                      />
                      <button className="px-6 py-2 bg-gradient-to-r from-brandBlue to-[#0047b3] text-white rounded-lg hover:shadow-lg transition-all">
                        Cập nhật mật khẩu
                      </button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="pt-6 border-t border-slate-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-700">Xác thực 2 lớp (2FA)</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Tăng cường bảo mật tài khoản với xác thực 2 yếu tố
                        </p>
                      </div>
                      <button className="px-4 py-2 border-2 border-brandBlue text-brandBlue rounded-lg hover:bg-brandBlue/5 transition-all font-medium">
                        Bật 2FA
                      </button>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-700 mb-4">Phiên đăng nhập</h3>
                    <div className="space-y-3">
                      {[
                        { device: 'Chrome on Windows', location: 'Vietnam', time: 'Hiện tại', active: true },
                        { device: 'Firefox on MacOS', location: 'Vietnam', time: '2 giờ trước', active: false },
                      ].map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-primary">{session.device}</p>
                            <p className="text-sm text-slate-500">{session.location} • {session.time}</p>
                          </div>
                          {session.active ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Đang hoạt động
                            </span>
                          ) : (
                            <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                              Đăng xuất
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-primary mb-6">Giao diện</h2>

                  {/* Theme */}
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-4">Chế độ hiển thị</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Sáng', icon: '☀️' },
                        { value: 'dark', label: 'Tối', icon: '🌙' },
                        { value: 'auto', label: 'Tự động', icon: '⚙️' },
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => setSettings({ ...settings, theme: theme.value })}
                          className={`p-4 rounded-xl border-2 transition-all ${settings.theme === theme.value
                              ? 'border-brandBlue bg-brandBlue/5'
                              : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                          <div className="text-3xl mb-2">{theme.icon}</div>
                          <p className="font-medium text-primary">{theme.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sidebar Color */}
                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-700 mb-4">Màu thanh bên</h3>
                    <div className="flex gap-3">
                      {['#00358F', '#f66600', '#10b981', '#8b5cf6', '#ef4444'].map((color) => (
                        <button
                          key={color}
                          className="w-12 h-12 rounded-xl shadow-md hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-brandRed text-white rounded-xl hover:shadow-lg transition-all font-semibold">
                  <Save size={20} />
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
