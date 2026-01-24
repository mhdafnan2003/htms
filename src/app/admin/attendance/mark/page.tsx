'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HomeIcon from '@mui/icons-material/Home';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  classGrade: string;
  section: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'P' | 'A' | 'L' | 'H';
  remarks?: string;
}

export default function MarkAttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const statusOptions = [
    { value: 'P', label: 'Present', color: 'bg-green-500', icon: CheckCircleIcon },
    { value: 'A', label: 'Absent', color: 'bg-red-500', icon: CancelIcon },
    { value: 'L', label: 'Late', color: 'bg-yellow-500', icon: AccessTimeIcon },
    { value: 'H', label: 'Holiday', color: 'bg-blue-500', icon: HomeIcon }
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendanceForDate();
    }
  }, [selectedDate, students]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDate = async () => {
    // Initialize all students as present by default
    const initialRecords: Record<string, AttendanceRecord> = {};
    students.forEach(student => {
      initialRecords[student._id] = {
        studentId: student._id,
        status: 'P',
        remarks: ''
      };
    });
    setAttendanceRecords(initialRecords);
    
    // TODO: Fetch existing attendance for the selected date
    // This would check if attendance is already marked for this date
  };

  const updateAttendance = (studentId: string, status: 'P' | 'A' | 'L' | 'H', remarks?: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        status,
        remarks
      }
    }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const promises = Object.values(attendanceRecords).map(record => 
        fetch('/api/attendance/mark', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            studentId: record.studentId,
            date: selectedDate,
            status: record.status,
            remarks: record.remarks
          })
        })
      );

      await Promise.all(promises);
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const markAllAs = (status: 'P' | 'A' | 'L' | 'H') => {
    const updatedRecords: Record<string, AttendanceRecord> = {};
    students.forEach(student => {
      updatedRecords[student._id] = {
        studentId: student._id,
        status,
        remarks: ''
      };
    });
    setAttendanceRecords(updatedRecords);
  };

  if (loading) {
    return (
      <AdminLayout title="Mark Attendance">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading students...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Mark Attendance">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="attendance-date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                {statusOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => markAllAs(option.value as 'P' | 'A' | 'L' | 'H')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm hover:opacity-90 ${option.color}`}
                      title={`Mark all as ${option.label}`}
                    >
                      <IconComponent className="w-4 h-4" />
                      All {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={fetchAttendanceForDate}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <RefreshIcon className="w-4 h-4" />
                Refresh
              </button>
              
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <SaveIcon className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Students ({students.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {students.map((student) => {
              const currentRecord = attendanceRecords[student._id] || { studentId: student._id, status: 'P' as const };
              
              return (
                <div key={student._id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {student.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ID: {student.studentId} | Class: {student.classGrade}
                        {student.section && ` - ${student.section}`}
                      </p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex gap-2">
                        {statusOptions.map((option) => {
                          const IconComponent = option.icon;
                          const isSelected = currentRecord.status === option.value;
                          
                          return (
                            <button
                              key={option.value}
                              onClick={() => updateAttendance(student._id, option.value as 'P' | 'A' | 'L' | 'H')}
                              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                                isSelected
                                  ? `${option.color} text-white`
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="md:min-w-0 md:w-48">
                        <input
                          type="text"
                          placeholder="Remarks (optional)"
                          value={currentRecord.remarks || ''}
                          onChange={(e) => updateAttendance(student._id, currentRecord.status, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {students.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No students found</p>
            <p className="text-gray-400 text-sm mt-2">Please add students first to mark attendance</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}