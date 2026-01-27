'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  classGrade: string;
  section: string;
}

interface AttendanceCell {
  status: 'P' | 'A' | 'L' | 'H';
  entryTime?: string;
  exitTime?: string;
  isManualOverride?: boolean;
  inPending?: boolean;  // Marked IN but not saved yet
  outPending?: boolean; // Marked OUT but not saved yet
}

interface AttendanceMap {
  [studentId: string]: {
    [day: number]: AttendanceCell;
  };
}

interface ModalData {
  studentId: string;
  studentName: string;
  day: number;
}

export default function MarkAttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [editModal, setEditModal] = useState<ModalData | null>(null);
  const [manualIn, setManualIn] = useState('');
  const [manualOut, setManualOut] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const dayHeaders = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchMonthlyData();
    }
  }, [selectedClass, selectedMonth, selectedYear]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const studentList: any[] = data.students || [];
        const uniqueClasses = Array.from(new Set(studentList.map((s: any) => s.classGrade as string))).sort();
        setClasses(uniqueClasses);

        if (uniqueClasses.length > 0 && !selectedClass) {
          setSelectedClass(uniqueClasses[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/attendance/monthly?class=${selectedClass}&month=${selectedMonth}&year=${selectedYear}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setAttendanceMap(data.attendanceMap || {});
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark IN as pending (time will be recorded on save)
  const handleInClick = (studentId: string, day: number) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [day]: {
          ...(prev[studentId]?.[day] || { status: 'P' }),
          status: 'P',
          inPending: true
        }
      }
    }));
  };

  // Mark OUT as pending (time will be recorded on save)
  const handleOutClick = (studentId: string, day: number) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [day]: {
          ...(prev[studentId]?.[day] || { status: 'P' }),
          outPending: true
        }
      }
    }));
  };

  // Bulk mark all students for a specific date
  // Mark all students as present for a specific day (without requiring times)
  // Smart bulk mark: First time -> IN, Second time -> OUT
  const bulkMarkAllPresent = (day: number) => {
    const updates = { ...attendanceMap };
    students.forEach(student => {
      if (!updates[student._id]) updates[student._id] = {};

      const existingCell = updates[student._id][day];
      const hasEntryTime = existingCell?.entryTime;
      const hasExitTime = existingCell?.exitTime;
      const inPending = existingCell?.inPending;

      let newCell = { ...(existingCell || {}) };
      newCell.status = 'P';

      if (!hasEntryTime && !inPending) {
        // First click (or if nothing recorded): Mark IN pending
        newCell.inPending = true;
        newCell.outPending = false;
      } else if (hasEntryTime && !hasExitTime) {
        // Has entry time: Mark OUT pending
        newCell.inPending = false;
        newCell.outPending = true;
      }
      // If has both times or just inPending, keep as is (user can save to confirm IN)

      updates[student._id][day] = newCell;
    });
    setAttendanceMap(updates);
  };

  const bulkMarkAllAbsent = (day: number) => {
    const updates = { ...attendanceMap };
    students.forEach(student => {
      if (!updates[student._id]) updates[student._id] = {};
      updates[student._id][day] = {
        status: 'A',
        entryTime: undefined,
        exitTime: undefined,
        inPending: false,
        outPending: false
      };
    });
    setAttendanceMap(updates);
  };

  const bulkMarkHoliday = (day: number) => {
    const updates = { ...attendanceMap };
    students.forEach(student => {
      if (!updates[student._id]) updates[student._id] = {};
      updates[student._id][day] = {
        status: 'H',
        entryTime: undefined,
        exitTime: undefined,
        inPending: false,
        outPending: false
      };
    });
    setAttendanceMap(updates);
  };

  const openEditModal = (student: Student, day: number) => {
    const cell = attendanceMap[student._id]?.[day];
    setManualIn(cell?.entryTime || '');
    setManualOut(cell?.exitTime || '');
    setEditModal({
      studentId: student._id,
      studentName: student.fullName,
      day
    });
  };

  const applyManualTimes = () => {
    if (!editModal) return;

    setAttendanceMap(prev => ({
      ...prev,
      [editModal.studentId]: {
        ...(prev[editModal.studentId] || {}),
        [editModal.day]: {
          status: 'P',
          entryTime: manualIn || undefined,
          exitTime: manualOut || undefined,
          isManualOverride: true,
          inPending: false,
          outPending: false
        }
      }
    }));
    setEditModal(null);
  };

  const markAsAbsent = () => {
    if (!editModal) return;

    setAttendanceMap(prev => ({
      ...prev,
      [editModal.studentId]: {
        ...(prev[editModal.studentId] || {}),
        [editModal.day]: {
          status: 'A',
          entryTime: undefined,
          exitTime: undefined,
          inPending: false,
          outPending: false
        }
      }
    }));
    setEditModal(null);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // "HH:MM"
  };

  const saveAttendance = async () => {
    setSaving(true);
    const currentTime = getCurrentTime();

    try {
      const token = localStorage.getItem('token');
      const promises: Promise<any>[] = [];

      // Process attendance map and apply current time for pending entries
      const updatedMap = { ...attendanceMap };

      Object.entries(attendanceMap).forEach(([studentId, days]) => {
        Object.entries(days).forEach(([day, cell]) => {
          // Construct date string manually in YYYY-MM-DD format to avoid timezone shifts
          // Note: month is 1-indexed in our state but 0-indexed in Date constructor, 
          // however for string construction we want 1-indexed (01, 02, etc)
          const dayNum = parseInt(day);
          const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

          // Set current time for pending entries
          let entryTime = cell.entryTime;
          let exitTime = cell.exitTime;

          if (cell.inPending && !cell.entryTime) {
            entryTime = currentTime;
          }
          if (cell.outPending && !cell.exitTime) {
            exitTime = currentTime;
          }

          // Update local state
          if (!updatedMap[studentId]) updatedMap[studentId] = {};
          updatedMap[studentId][parseInt(day)] = {
            ...cell,
            entryTime,
            exitTime,
            inPending: false,
            outPending: false
          };

          promises.push(
            fetch('/api/attendance/mark', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                studentId,
                date: dateStr,
                status: cell.status,
                classGrade: selectedClass,
                entryTime,
                exitTime,
                isManualOverride: cell.isManualOverride
              })
            })
          );
        });
      });

      await Promise.all(promises);

      // Update state with applied times
      setAttendanceMap(updatedMap);

      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && students.length === 0) {
    return (
      <AdminLayout title="Mark Attendance">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Mark Attendance">
      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                {months.map((month, idx) => (
                  <option key={idx + 1} value={idx + 1}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto">
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <SaveIcon className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        {students.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300 min-w-[180px]">
                      Student
                    </th>
                    {dayHeaders.map(day => (
                      <th key={day} colSpan={2} className="px-2 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-200 min-w-[120px] relative group">
                        <div className="flex items-center justify-center gap-1">
                          <span>{day}</span>
                          {/* Bulk Action Dropdown */}
                          <div className="relative inline-block">
                            <button className="text-gray-400 hover:text-gray-600 text-xs">▼</button>
                            <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 p-2 z-30 min-w-[130px]">
                              <div className="text-xs text-gray-500 px-2 py-1 border-b mb-1">Mark All:</div>
                              <button
                                onClick={() => bulkMarkAllPresent(day)}
                                className="block w-full text-left px-3 py-2 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded mb-1"
                              >
                                ✓ All Present
                              </button>
                              <button
                                onClick={() => bulkMarkAllAbsent(day)}
                                className="block w-full text-left px-3 py-2 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded mb-1"
                              >
                                ✗ All Absent
                              </button>
                              <button
                                onClick={() => bulkMarkHoliday(day)}
                                className="block w-full text-left px-3 py-2 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded"
                              >
                                📅 Holiday
                              </button>
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="sticky left-0 bg-gray-100 z-10 px-4 py-1 border-r border-gray-300"></th>
                    {dayHeaders.map(day => (
                      <React.Fragment key={day}>
                        <th className="px-2 py-1 text-xs text-green-700 font-medium">IN</th>
                        <th className="px-2 py-1 text-xs text-red-700 font-medium border-r border-gray-200">OUT</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    return (
                      <tr key={student._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="sticky left-0 bg-white z-10 px-4 py-3 border-r border-gray-300">
                          <div className="font-medium text-gray-900 text-sm">{student.fullName}</div>
                          <div className="text-xs text-gray-500">{student.studentId}</div>
                        </td>
                        {dayHeaders.map(day => {
                          const cell = attendanceMap[student._id]?.[day];
                          const isAbsent = cell?.status === 'A';
                          const isHoliday = cell?.status === 'H';
                          const inPending = cell?.inPending && !cell?.entryTime;
                          const outPending = cell?.outPending && !cell?.exitTime;

                          if (isAbsent || isHoliday) {
                            return (
                              <td
                                key={day}
                                colSpan={2}
                                className={`px-1 py-2 text-center border-r border-gray-200 relative ${isAbsent ? 'bg-red-50' : 'bg-blue-50'
                                  }`}
                              >
                                {isAbsent ? (
                                  <span className="text-xs font-semibold text-red-600">Absent</span>
                                ) : (
                                  <span className="text-xs font-semibold text-blue-600">Holiday</span>
                                )}

                                <button
                                  onClick={() => openEditModal(student, day)}
                                  className="absolute top-0 right-0 p-0.5 opacity-50 hover:opacity-100"
                                  title="Manual edit"
                                >
                                  <EditIcon style={{ fontSize: 12 }} className="text-gray-400 hover:text-blue-500" />
                                </button>
                              </td>
                            );
                          }

                          return (
                            <React.Fragment key={day}>
                              {/* IN Column */}
                              <td className={`px-1 py-2 text-center ${inPending ? 'bg-yellow-100' :
                                cell?.entryTime ? 'bg-green-50' : 'bg-white'
                                }`}>
                                <button
                                  onClick={() => handleInClick(student._id, day)}
                                  className={`text-xs px-2 py-1 rounded ${cell?.entryTime
                                    ? 'text-green-700 font-medium'
                                    : inPending
                                      ? 'text-yellow-700 font-medium'
                                      : 'text-gray-400 hover:bg-green-100'
                                    }`}
                                >
                                  {cell?.entryTime || (inPending ? '✓' : 'IN')}
                                </button>
                              </td>

                              {/* OUT Column */}
                              <td className={`px-1 py-2 text-center border-r border-gray-200 relative ${outPending ? 'bg-yellow-100' :
                                cell?.exitTime ? 'bg-green-50' : 'bg-white'
                                }`}>
                                <button
                                  onClick={() => handleOutClick(student._id, day)}
                                  className={`text-xs px-2 py-1 rounded ${cell?.exitTime
                                    ? 'text-red-700 font-medium'
                                    : outPending
                                      ? 'text-yellow-700 font-medium'
                                      : 'text-gray-400 hover:bg-red-100'
                                    }`}
                                >
                                  {cell?.exitTime || (outPending ? '✓' : 'OUT')}
                                </button>

                                {/* Edit Icon */}
                                <button
                                  onClick={() => openEditModal(student, day)}
                                  className="absolute top-0 right-0 p-0.5 opacity-50 hover:opacity-100"
                                  title="Manual edit"
                                >
                                  <EditIcon style={{ fontSize: 12 }} className="text-gray-400 hover:text-blue-500" />
                                </button>
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No students found in this class</p>
          </div>
        )}
      </div>

      {/* Manual Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Manual Entry</h3>
              <button onClick={() => setEditModal(null)} className="p-1 hover:bg-gray-100 rounded">
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600">
                <strong>{editModal.studentName}</strong> — {months[selectedMonth - 1]} {editModal.day}, {selectedYear}
              </div>

              {/* Manual IN Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manual IN Time</label>
                <input
                  type="time"
                  value={manualIn}
                  onChange={(e) => setManualIn(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>

              {/* Manual OUT Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manual OUT Time</label>
                <input
                  type="time"
                  value={manualOut}
                  onChange={(e) => setManualOut(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>

              {/* Apply Manual Times */}
              <button
                onClick={applyManualTimes}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Apply Times
              </button>

              <div className="border-t pt-4">
                {/* Mark Absent */}
                <button
                  onClick={markAsAbsent}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Mark as Absent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}