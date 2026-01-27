'use client';

import React, { useState, useEffect } from 'react';
import ParentLayout from '@/components/parent/ParentLayout';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import CakeIcon from '@mui/icons-material/Cake';

interface StudentInfo {
  _id: string;
  studentId: string;
  fullName: string;
  classGrade: string;
  section?: string;
  dob: string;
  gender: string;
  email?: string;
  secondaryMobile?: string;
  address?: string;
  monthlyFeeAmount: number;
  admissionDate: string;
}

export default function ParentInfoPage() {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentInfo();

    // Listen for student changes
    const handleStorageChange = () => {
      fetchStudentInfo();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event
    window.addEventListener('studentChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('studentChanged', handleStorageChange);
    };
  }, []);

  const fetchStudentInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const selectedStudentId = localStorage.getItem('selectedStudentId');

      const response = await fetch('/api/parent/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const students = data.students || [];

        // Find selected student or use first one
        const studentData = selectedStudentId
          ? students.find((s: StudentInfo) => s._id === selectedStudentId)
          : students[0];

        setStudent(studentData || null);
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <ParentLayout title="Personal Information">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </ParentLayout>
    );
  }

  if (!student) {
    return (
      <ParentLayout title="Personal Information">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No student data available</p>
        </div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout title="Personal Information">
      <div className="space-y-6">
        {/* Student Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <PersonIcon style={{ fontSize: 40 }} className="text-blue-500" />
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{student.fullName}</h2>
                <p className="text-blue-100">Student ID: {student.studentId}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Class Info */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <SchoolIcon className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-semibold text-gray-900">
                    {student.classGrade}
                    {student.section && ` - Section ${student.section}`}
                  </p>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <CakeIcon className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(student.dob)} ({calculateAge(student.dob)} years)
                  </p>
                </div>
              </div>

              {/* Gender */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PersonIcon className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-semibold text-gray-900">{student.gender}</p>
                </div>
              </div>

              {/* Admission Date */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarTodayIcon className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Admission Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(student.admissionDate)}</p>
                </div>
              </div>

              {/* Email */}
              {student.email && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <EmailIcon className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">{student.email}</p>
                  </div>
                </div>
              )}

              {/* Phone */}
              {student.secondaryMobile && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <PhoneIcon className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-semibold text-gray-900">{student.secondaryMobile}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Address */}
            {student.address && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <HomeIcon className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-semibold text-gray-900">{student.address}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Fee Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Information</h3>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm text-blue-600">Monthly Fee</p>
              <p className="text-2xl font-bold text-blue-900">
                ₹{student.monthlyFeeAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Per Month</p>
            </div>
          </div>
        </div>
      </div>
    </ParentLayout>
  );
}