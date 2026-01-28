'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define supported languages
export type Language = 'en' | 'ar' | 'hi' | 'ml';

export const languageNames: Record<Language, string> = {
    en: 'English',
    ar: 'العربية',
    hi: 'हिंदी',
    ml: 'മലയാളം'
};

// Translation keys interface
interface Translations {
    // Common
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    view: string;
    add: string;
    search: string;
    submit: string;
    back: string;
    next: string;
    previous: string;
    yes: string;
    no: string;

    // Navigation & Sidebar
    dashboard: string;
    admission: string;
    students: string;
    attendance: string;
    fees: string;
    exams: string;
    settings: string;
    logout: string;

    // Dashboard
    welcomeBack: string;
    totalStudents: string;
    activeStudents: string;
    pendingFees: string;
    todayAttendance: string;

    // Profile Settings
    profileSettings: string;
    personalInfo: string;
    fullName: string;
    email: string;
    phone: string;
    security: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    preferences: string;
    applicationTheme: string;
    themeDescription: string;
    light: string;
    dark: string;
    language: string;
    languageDescription: string;
    notifications: string;
    notificationsDescription: string;
    saveChanges: string;
    profileUpdated: string;

    // Attendance
    markAttendance: string;
    viewAttendance: string;
    attendanceReport: string;
    present: string;
    absent: string;
    late: string;
    excused: string;

    // Fees
    collectFees: string;
    feeReport: string;
    paid: string;
    pending: string;
    overdue: string;

    // Students
    studentList: string;
    addStudent: string;
    editStudent: string;
    studentDetails: string;

    // Exams
    examMarks: string;
    viewResults: string;
    progressReport: string;
}

// English translations (default)
const en: Translations = {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    add: 'Add',
    search: 'Search',
    submit: 'Submit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    yes: 'Yes',
    no: 'No',

    dashboard: 'Dashboard',
    admission: 'Admission',
    students: 'Students',
    attendance: 'Attendance',
    fees: 'Fees',
    exams: 'Exams',
    settings: 'Settings',
    logout: 'Logout',

    welcomeBack: 'Welcome back',
    totalStudents: 'Total Students',
    activeStudents: 'Active Students',
    pendingFees: 'Pending Fees',
    todayAttendance: "Today's Attendance",

    profileSettings: 'Profile Settings',
    personalInfo: 'Personal Information',
    fullName: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    security: 'Security',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    preferences: 'Preferences',
    applicationTheme: 'Application Theme',
    themeDescription: 'Customize the look and feel of your dashboard',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    languageDescription: 'Select your preferred language',
    notifications: 'Notifications',
    notificationsDescription: 'Manage your alert preferences',
    saveChanges: 'Save Changes',
    profileUpdated: 'Profile updated successfully',

    markAttendance: 'Mark Attendance',
    viewAttendance: 'View Attendance',
    attendanceReport: 'Attendance Report',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',

    collectFees: 'Collect Fees',
    feeReport: 'Fee Report',
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',

    studentList: 'Student List',
    addStudent: 'Add Student',
    editStudent: 'Edit Student',
    studentDetails: 'Student Details',

    examMarks: 'Exams & Marks',
    viewResults: 'View Results',
    progressReport: 'Progress Report',
};

// Arabic translations
const ar: Translations = {
    loading: 'جاري التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    add: 'إضافة',
    search: 'بحث',
    submit: 'إرسال',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    yes: 'نعم',
    no: 'لا',

    dashboard: 'لوحة التحكم',
    admission: 'القبول',
    students: 'الطلاب',
    attendance: 'الحضور',
    fees: 'الرسوم',
    exams: 'الامتحانات',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',

    welcomeBack: 'مرحباً بعودتك',
    totalStudents: 'إجمالي الطلاب',
    activeStudents: 'الطلاب النشطين',
    pendingFees: 'الرسوم المعلقة',
    todayAttendance: 'حضور اليوم',

    profileSettings: 'إعدادات الملف الشخصي',
    personalInfo: 'المعلومات الشخصية',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    security: 'الأمان',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور',
    preferences: 'التفضيلات',
    applicationTheme: 'مظهر التطبيق',
    themeDescription: 'تخصيص شكل ومظهر لوحة التحكم',
    light: 'فاتح',
    dark: 'داكن',
    language: 'اللغة',
    languageDescription: 'اختر لغتك المفضلة',
    notifications: 'الإشعارات',
    notificationsDescription: 'إدارة تفضيلات التنبيهات',
    saveChanges: 'حفظ التغييرات',
    profileUpdated: 'تم تحديث الملف الشخصي بنجاح',

    markAttendance: 'تسجيل الحضور',
    viewAttendance: 'عرض الحضور',
    attendanceReport: 'تقرير الحضور',
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
    excused: 'معذور',

    collectFees: 'تحصيل الرسوم',
    feeReport: 'تقرير الرسوم',
    paid: 'مدفوع',
    pending: 'معلق',
    overdue: 'متأخر',

    studentList: 'قائمة الطلاب',
    addStudent: 'إضافة طالب',
    editStudent: 'تعديل الطالب',
    studentDetails: 'تفاصيل الطالب',

    examMarks: 'الامتحانات والدرجات',
    viewResults: 'عرض النتائج',
    progressReport: 'تقرير التقدم',
};

// Hindi translations
const hi: Translations = {
    loading: 'लोड हो रहा है...',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    view: 'देखें',
    add: 'जोड़ें',
    search: 'खोजें',
    submit: 'जमा करें',
    back: 'वापस',
    next: 'अगला',
    previous: 'पिछला',
    yes: 'हां',
    no: 'नहीं',

    dashboard: 'डैशबोर्ड',
    admission: 'प्रवेश',
    students: 'छात्र',
    attendance: 'उपस्थिति',
    fees: 'शुल्क',
    exams: 'परीक्षाएं',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',

    welcomeBack: 'वापस स्वागत है',
    totalStudents: 'कुल छात्र',
    activeStudents: 'सक्रिय छात्र',
    pendingFees: 'बकाया शुल्क',
    todayAttendance: 'आज की उपस्थिति',

    profileSettings: 'प्रोफ़ाइल सेटिंग्स',
    personalInfo: 'व्यक्तिगत जानकारी',
    fullName: 'पूरा नाम',
    email: 'ईमेल पता',
    phone: 'फोन नंबर',
    security: 'सुरक्षा',
    currentPassword: 'वर्तमान पासवर्ड',
    newPassword: 'नया पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    preferences: 'प्राथमिकताएं',
    applicationTheme: 'एप्लिकेशन थीम',
    themeDescription: 'अपने डैशबोर्ड का रूप अनुकूलित करें',
    light: 'लाइट',
    dark: 'डार्क',
    language: 'भाषा',
    languageDescription: 'अपनी पसंदीदा भाषा चुनें',
    notifications: 'सूचनाएं',
    notificationsDescription: 'अपनी अलर्ट प्राथमिकताएं प्रबंधित करें',
    saveChanges: 'परिवर्तन सहेजें',
    profileUpdated: 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई',

    markAttendance: 'उपस्थिति दर्ज करें',
    viewAttendance: 'उपस्थिति देखें',
    attendanceReport: 'उपस्थिति रिपोर्ट',
    present: 'उपस्थित',
    absent: 'अनुपस्थित',
    late: 'देर से',
    excused: 'माफ़',

    collectFees: 'शुल्क वसूली',
    feeReport: 'शुल्क रिपोर्ट',
    paid: 'भुगतान',
    pending: 'लंबित',
    overdue: 'अतिदेय',

    studentList: 'छात्र सूची',
    addStudent: 'छात्र जोड़ें',
    editStudent: 'छात्र संपादित करें',
    studentDetails: 'छात्र विवरण',

    examMarks: 'परीक्षा और अंक',
    viewResults: 'परिणाम देखें',
    progressReport: 'प्रगति रिपोर्ट',
};

// Malayalam translations
const ml: Translations = {
    loading: 'ലോഡ് ചെയ്യുന്നു...',
    save: 'സേവ് ചെയ്യുക',
    cancel: 'റദ്ദാക്കുക',
    delete: 'ഇല്ലാതാക്കുക',
    edit: 'എഡിറ്റ് ചെയ്യുക',
    view: 'കാണുക',
    add: 'ചേർക്കുക',
    search: 'തിരയുക',
    submit: 'സമർപ്പിക്കുക',
    back: 'മടങ്ങുക',
    next: 'അടുത്തത്',
    previous: 'മുമ്പത്തെ',
    yes: 'അതെ',
    no: 'ഇല്ല',

    dashboard: 'ഡാഷ്‌ബോർഡ്',
    admission: 'പ്രവേശനം',
    students: 'വിദ്യാർത്ഥികൾ',
    attendance: 'ഹാജർ',
    fees: 'ഫീസ്',
    exams: 'പരീക്ഷകൾ',
    settings: 'ക്രമീകരണങ്ങൾ',
    logout: 'ലോഗ് ഔട്ട്',

    welcomeBack: 'തിരികെ സ്വാഗതം',
    totalStudents: 'മൊത്തം വിദ്യാർത്ഥികൾ',
    activeStudents: 'സജീവ വിദ്യാർത്ഥികൾ',
    pendingFees: 'ബാക്കിയുള്ള ഫീസ്',
    todayAttendance: 'ഇന്നത്തെ ഹാജർ',

    profileSettings: 'പ്രൊഫൈൽ ക്രമീകരണങ്ങൾ',
    personalInfo: 'വ്യക്തിഗത വിവരങ്ങൾ',
    fullName: 'മുഴുവൻ പേര്',
    email: 'ഇമെയിൽ വിലാസം',
    phone: 'ഫോൺ നമ്പർ',
    security: 'സുരക്ഷ',
    currentPassword: 'നിലവിലെ പാസ്‌വേഡ്',
    newPassword: 'പുതിയ പാസ്‌വേഡ്',
    confirmPassword: 'പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക',
    preferences: 'മുൻഗണനകൾ',
    applicationTheme: 'ആപ്ലിക്കേഷൻ തീം',
    themeDescription: 'നിങ്ങളുടെ ഡാഷ്‌ബോർഡിന്റെ രൂപം ഇഷ്ടാനുസൃതമാക്കുക',
    light: 'ലൈറ്റ്',
    dark: 'ഡാർക്ക്',
    language: 'ഭാഷ',
    languageDescription: 'നിങ്ങൾക്ക് ഇഷ്ടമുള്ള ഭാഷ തിരഞ്ഞെടുക്കുക',
    notifications: 'അറിയിപ്പുകൾ',
    notificationsDescription: 'നിങ്ങളുടെ അലേർട്ട് മുൻഗണനകൾ നിയന്ത്രിക്കുക',
    saveChanges: 'മാറ്റങ്ങൾ സേവ് ചെയ്യുക',
    profileUpdated: 'പ്രൊഫൈൽ വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു',

    markAttendance: 'ഹാജർ രേഖപ്പെടുത്തുക',
    viewAttendance: 'ഹാജർ കാണുക',
    attendanceReport: 'ഹാജർ റിപ്പോർട്ട്',
    present: 'ഹാജർ',
    absent: 'അസാന്നിധ്യം',
    late: 'വൈകി',
    excused: 'ക്ഷമിച്ചു',

    collectFees: 'ഫീസ് ശേഖരിക്കുക',
    feeReport: 'ഫീസ് റിപ്പോർട്ട്',
    paid: 'അടച്ചു',
    pending: 'തീർപ്പുകൽപ്പിക്കാത്ത',
    overdue: 'കാലഹരണപ്പെട്ട',

    studentList: 'വിദ്യാർത്ഥി ലിസ്റ്റ്',
    addStudent: 'വിദ്യാർത്ഥിയെ ചേർക്കുക',
    editStudent: 'വിദ്യാർത്ഥിയെ എഡിറ്റ് ചെയ്യുക',
    studentDetails: 'വിദ്യാർത്ഥി വിവരങ്ങൾ',

    examMarks: 'പരീക്ഷകളും മാർക്കുകളും',
    viewResults: 'ഫലങ്ങൾ കാണുക',
    progressReport: 'പുരോഗതി റിപ്പോർട്ട്',
};

const translations: Record<Language, Translations> = { en, ar, hi, ml };

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Load language from localStorage on mount
        const savedLanguage = localStorage.getItem('language') as Language;
        if (savedLanguage && translations[savedLanguage]) {
            setLanguageState(savedLanguage);
            applyLanguageSettings(savedLanguage);
        }
    }, []);

    const applyLanguageSettings = (lang: Language) => {
        // Set document direction for RTL languages (Arabic)
        const isRTL = lang === 'ar';
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    };

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        applyLanguageSettings(lang);
    };

    const value: LanguageContextType = {
        language,
        setLanguage,
        t: translations[language],
        isRTL: language === 'ar'
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

export type { Translations };
