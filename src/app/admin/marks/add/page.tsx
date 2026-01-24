'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import GradeIcon from '@mui/icons-material/Grade';
import SchoolIcon from '@mui/icons-material/School';

interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  classGrade: string;
  section: string;
}

interface MarksData {
  studentId: string;
  subject: string;
  testName: string;
  totalMarks: number;
  obtainedMarks: number;
  examDate: string;
  remarks?: string;
}

const subjects = [
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'Hindi',
  'Computer Science',
  'Physical Education',
  'Art & Craft'
];

const testTypes = [
  'Unit Test 1',
  'Unit Test 2',
  'Mid Term Exam',
  'Final Exam',
  'Monthly Test',
  'Assignment',
  'Project Work',
  'Practical Exam'
];

export default function AddMarksPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMarksForm, setShowMarksForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [marksData, setMarksData] = useState<MarksData>({
    studentId: '',
    subject: subjects[0],
    testName: testTypes[0],
    totalMarks: 100,
    obtainedMarks: 0,
    examDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

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

  const filterStudents = () => {
    if (!searchTerm) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.classGrade.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  const openMarksForm = (student: Student) => {
    setSelectedStudent(student);
    setMarksData({
      studentId: student._id,
      subject: subjects[0],
      testName: testTypes[0],
      totalMarks: 100,
      obtainedMarks: 0,
      examDate: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setShowMarksForm(true);
  };

  const addMarks = async () => {
    if (!selectedStudent) return;
    
    if (marksData.obtainedMarks > marksData.totalMarks) {
      alert('Obtained marks cannot be greater than total marks');
      return;
    }
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(marksData)
      });

      if (response.ok) {
        const result = await response.json();
        const percentage = Math.round((marksData.obtainedMarks / marksData.totalMarks) * 100);
        alert(`Marks added successfully! Percentage: ${percentage}%`);
        setShowMarksForm(false);
        setSelectedStudent(null);
        
        // Reset form
        setMarksData({
          studentId: '',
          subject: subjects[0],
          testName: testTypes[0],
          totalMarks: 100,
          obtainedMarks: 0,
          examDate: new Date().toISOString().split('T')[0],
          remarks: ''
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error adding marks:', error);
      alert('Error adding marks. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const calculatePercentage = () => {
    if (marksData.totalMarks === 0) return 0;
    return Math.round((marksData.obtainedMarks / marksData.totalMarks) * 100);
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-600' };
    if (percentage >= 50) return { grade: 'C+', color: 'text-yellow-600' };
    if (percentage >= 40) return { grade: 'C', color: 'text-yellow-600' };
    if (percentage >= 33) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <AdminLayout title="Add Marks">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading students...</div>
        </div>
      </AdminLayout>
    );
  }

  const percentage = calculatePercentage();
  const gradeInfo = getGrade(percentage);

  return (
    <AdminLayout title="Add Marks">
      <div className="space-y-6">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name, ID, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Students ({filteredStudents.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <div key={student._id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <SchoolIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {student.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ID: {student.studentId} | Class: {student.classGrade}
                        {student.section && ` - ${student.section}`}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => openMarksForm(student)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <GradeIcon className="w-4 h-4" />
                    Add Marks
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {filteredStudents.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'No students found matching your search' : 'No students found'}
            </p>
          </div>
        )}
      </div>

      {/* Marks Modal */}
      {showMarksForm && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-90vh overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Marks</h3>
                <button
                  onClick={() => setShowMarksForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedStudent.fullName}</p>
                  <p className="text-sm text-gray-600">ID: {selectedStudent.studentId}</p>
                  <p className="text-sm text-gray-600">Class: {selectedStudent.classGrade}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <select
                      value={marksData.subject}
                      onChange={(e) => setMarksData({ ...marksData, subject: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test/Exam *
                    </label>
                    <select
                      value={marksData.testName}
                      onChange={(e) => setMarksData({ ...marksData, testName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {testTypes.map(test => (
                        <option key={test} value={test}>
                          {test}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Marks *
                    </label>
                    <input
                      type="number"
                      value={marksData.totalMarks}
                      onChange={(e) => setMarksData({ ...marksData, totalMarks: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Obtained Marks *
                    </label>
                    <input
                      type="number"
                      value={marksData.obtainedMarks}
                      onChange={(e) => setMarksData({ ...marksData, obtainedMarks: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Date *
                  </label>
                  <input
                    type="date"
                    value={marksData.examDate}
                    onChange={(e) => setMarksData({ ...marksData, examDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={marksData.remarks}
                    onChange={(e) => setMarksData({ ...marksData, remarks: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional comments about performance..."
                  />
                </div>
                
                {/* Grade Preview */}
                {marksData.totalMarks > 0 && marksData.obtainedMarks >= 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Percentage</p>
                        <p className="text-lg font-semibold text-gray-900">{percentage}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Grade</p>
                        <p className={`text-lg font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMarksForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addMarks}
                  disabled={processing || marksData.obtainedMarks > marksData.totalMarks}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <AddIcon className="w-4 h-4" />
                  {processing ? 'Adding...' : 'Add Marks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}