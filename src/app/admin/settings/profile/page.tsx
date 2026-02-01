'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, languageNames, Language } from '@/contexts/LanguageContext';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SaveIcon from '@mui/icons-material/Save';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LanguageIcon from '@mui/icons-material/Language';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

export default function ProfileSettings() {
    const { user, refreshUser } = useAuth();
    const { language: currentLanguage, setLanguage, t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        profilePhoto: '',
    });

    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [preferences, setPreferences] = useState({
        theme: 'light',
        language: 'en',
        notifications: true
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const userData = data.user;

                setFormData({
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    profilePhoto: userData.profilePhoto || ''
                });

                // Use localStorage values as source of truth (they may have been changed during this session)
                const savedTheme = localStorage.getItem('theme') || userData.preferences?.theme || 'light';
                const savedLanguage = localStorage.getItem('language') || userData.preferences?.language || 'en';

                setPreferences({
                    theme: savedTheme,
                    language: savedLanguage,
                    notifications: userData.preferences?.notifications !== undefined ? userData.preferences.notifications : true
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSecurityData(prev => ({ ...prev, [name]: value }));
    };

    const handlePreferenceChange = (name: string, value: any) => {
        setPreferences(prev => ({ ...prev, [name]: value }));

        // Immediately apply theme change for instant feedback and persist to localStorage
        if (name === 'theme') {
            localStorage.setItem('theme', value);
            if (value === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }

        // Immediately apply language change
        if (name === 'language') {
            setLanguage(value as Language);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        // Valdiate passwords if changing
        if (securityData.newPassword) {
            if (securityData.newPassword !== securityData.confirmPassword) {
                setMessage({ type: 'error', text: 'New passwords do not match' });
                setSaving(false);
                return;
            }
            if (!securityData.currentPassword) {
                setMessage({ type: 'error', text: 'Current password is required to change password' });
                setSaving(false);
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                ...securityData,
                preferences
            };

            const response = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }

            setMessage({ type: 'success', text: 'Profile updated successfully' });

            // Clear sensitive fields
            setSecurityData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            if (refreshUser) refreshUser();

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Profile Settings">
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500">Loading profile...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Profile Settings">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header / Basic Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
                                    {formData.profilePhoto ? (
                                        <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                            <PersonIcon className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition shadow-sm border-2 border-white">
                                    <CameraAltIcon style={{ fontSize: 16 }} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                </label>
                            </div>
                            <div className="mb-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
                                >
                                    {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <SaveIcon className="w-4 h-4" />}
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </div>

                        {message.text && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <PersonIcon className="text-blue-500" /> Personal Information
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInfoChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInfoChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInfoChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <LockIcon className="text-blue-500" /> Security
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={securityData.currentPassword}
                                        onChange={handleSecurityChange}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={securityData.newPassword}
                                            onChange={handleSecurityChange}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={securityData.confirmPassword}
                                            onChange={handleSecurityChange}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Preferences</h3>

                    <div className="space-y-6">
                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${preferences.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                    {preferences.theme === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">Application Theme</h4>
                                    <p className="text-sm text-gray-500">Customize the look and feel of your dashboard</p>
                                </div>
                            </div>
                            <div className="flex bg-gray-200 p-1 rounded-lg">
                                <button
                                    onClick={() => handlePreferenceChange('theme', 'light')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${preferences.theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Light
                                </button>
                                <button
                                    onClick={() => handlePreferenceChange('theme', 'dark')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${preferences.theme === 'dark' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Dark
                                </button>
                            </div>
                        </div>

                        {/* Language */}
                       {/* <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                           <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                    <LanguageIcon />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">Language</h4>
                                    <p className="text-sm text-gray-500">Select your preferred language</p>
                                </div>
                            </div>
                            <select
                                value={preferences.language}
                                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="en">{languageNames.en}</option>
                                <option value="ar">{languageNames.ar}</option>
                                <option value="hi">{languageNames.hi}</option>
                                <option value="ml">{languageNames.ml}</option>
                            </select>
                        </div>

                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                                    <NotificationsIcon />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">Notifications</h4>
                                    <p className="text-sm text-gray-500">Manage your alert preferences</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={preferences.notifications}
                                    onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div> */}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
