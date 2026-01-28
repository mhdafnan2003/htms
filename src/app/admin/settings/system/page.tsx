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
        logoUrl: '',
        currentSession: '',
        currencySymbol: '₹'
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');

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
                    logoUrl: data.logoUrl || '',
                    currentSession: data.currentSession || '',
                    currencySymbol: data.currencySymbol || '₹'
                });
                if (data.logoUrl) {
                    setLogoPreview(data.logoUrl);
                }
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

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setLogoFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setLogoPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select an image file');
            }
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview('');
        setFormData(prev => ({ ...prev, logoUrl: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            
            // Append all form fields
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });
            
            // Append logo file if selected
            if (logoFile) {
                formDataToSend.append('logo', logoFile);
            }

            const response = await fetch('/api/admin/settings/system', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update settings');
            }

            setMessage({ type: 'success', text: 'System settings updated successfully' });
            
            if (data.settings?.logoUrl) {
                setFormData(prev => ({ ...prev, logoUrl: data.settings.logoUrl }));
                setLogoPreview(data.settings.logoUrl);
            }
            setLogoFile(null);

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
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Institution Logo (for receipts)
                                        </label>
                                        {logoPreview ? (
                                            <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                                                <img 
                                                    src={logoPreview} 
                                                    alt="Logo Preview" 
                                                    className="w-24 h-24 object-contain border border-gray-200 rounded-lg bg-white"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-700 font-medium">Current Logo</p>
                                                    <p className="text-xs text-gray-500 mt-1">This logo will appear on fee receipts</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={removeLogo}
                                                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                                <input
                                                    type="file"
                                                    id="logoUpload"
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                    className="hidden"
                                                />
                                                <label htmlFor="logoUpload" className="cursor-pointer">
                                                    <div className="text-gray-400 mb-2">
                                                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-sm text-gray-600">Click to upload logo</p>
                                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                                                </label>
                                            </div>
                                        )}
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
