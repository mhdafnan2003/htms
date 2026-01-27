'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SchoolIcon from '@mui/icons-material/School';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SettingsIcon from '@mui/icons-material/Settings';

export default function SystemSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        schoolName: '',
        address: '',
        email: '',
        phone: '',
        website: '',
        currentSession: '',
        currencySymbol: '₹'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/settings/system', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFormData({
                    schoolName: data.schoolName || '',
                    address: data.address || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    website: data.website || '',
                    currentSession: data.currentSession || '',
                    currencySymbol: data.currencySymbol || '₹'
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/settings/system', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update settings');
            }

            setMessage({ type: 'success', text: 'System settings updated successfully' });

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="System Settings">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading settings...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="System Settings">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <BusinessIcon className="text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">System Configuration</h2>
                            <p className="text-sm text-gray-500">Manage institution details and global settings</p>
                        </div>
                    </div>

                    <div className="p-6">
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Institution Information */}
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <SchoolIcon className="text-gray-400 w-5 h-5" />
                                    Institution Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Institute Name
                                        </label>
                                        <input
                                            type="text"
                                            name="schoolName"
                                            value={formData.schoolName}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            required
                                            placeholder="e.g. Excellence Tuition Center"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address
                                        </label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            required
                                            placeholder="Full address of the institution"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <div className="flex items-center gap-1">
                                                <EmailIcon className="w-4 h-4 text-gray-400" />
                                                <span>Contact Email</span>
                                            </div>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <div className="flex items-center gap-1">
                                                <PhoneIcon className="w-4 h-4 text-gray-400" />
                                                <span>Contact Phone</span>
                                            </div>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <div className="flex items-center gap-1">
                                                <LanguageIcon className="w-4 h-4 text-gray-400" />
                                                <span>Website</span>
                                            </div>
                                        </label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleChange}
                                            placeholder="https://..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                            </div>



                            <div className="border-t border-gray-200 pt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <SaveIcon className="w-5 h-5" />
                                    )}
                                    <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
