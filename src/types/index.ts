export interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'PARENT';
    phone: string;
    preferences?: {
        theme: 'light' | 'dark';
        language: string;
        notifications: boolean;
    };
}

export interface AuthResponse {
    access_token: string;
    user: User;
}

export const Gender = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
} as const;

export type Gender = typeof Gender[keyof typeof Gender];

export const StudentStatus = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
} as const;

export type StudentStatus = typeof StudentStatus[keyof typeof StudentStatus];

export interface ParentInfo {
    _id: string;
    name: string;
    email: string;
    phone: string;
}

export interface Student {
    _id: string;
    studentId: string;
    admissionNumber: string;
    admissionType: 'PERMANENT' | 'TEMPORARY';
    fullName: string;
    gender: Gender;
    dob: string;
    classGrade: string;
    schoolName?: string;
    subjectsEnrolled: string[];
    tutorAssigned?: string;
    linkedParentId: string | ParentInfo;
    secondaryMobile?: string;
    address: string;
    admissionDate: string;
    monthlyFeeAmount: number;
    studentPhotoUrl?: string;
    parentIdCardPhotoUrl?: string;
    studentIdCardPhotoUrl?: string;
    status: StudentStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateStudentDto {
    fullName: string;
    admissionType: 'PERMANENT' | 'TEMPORARY';
    gender: Gender;
    dob: string;
    classGrade: string;
    schoolName?: string;
    subjectsEnrolled: string[];
    tutorAssigned?: string;
    parentName: string;
    parentEmail: string;
    parentPhone: string;
    secondaryMobile?: string;
    address: string;
    monthlyFeeAmount: number;
    studentPhotoUrl?: string;
    parentIdCardPhotoUrl?: string;
    studentIdCardPhotoUrl?: string;
}

export interface Attendance {
    _id: string;
    studentId: string | Student;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    notes?: string;
}

export interface Fee {
    _id: string;
    studentId: string | Student;
    amount: number;
    paidAmount: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
    dueDate: string;
    paidDate?: string;
    month: string;
    notes?: string;
}

export interface Exam {
    _id: string;
    name: string;
    subject: string;
    date: string;
    totalMarks: number;
    passingMarks: number;
    description?: string;
}

export interface ExamResult {
    examId: string;
    examName: string;
    subject: string;
    date: string;
    totalMarks: number;
    passingMarks: number;
    marksObtained: number;
    grade?: string;
    remarks?: string;
}