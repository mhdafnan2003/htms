const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Define schemas (simple version for seeding)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'PARENT'], required: true },
  phone: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const StudentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
  dateOfBirth: { type: Date, required: true },
  classGrade: { type: String, required: true },
  section: { type: String },
  schoolName: String,
  subjects: { type: [String], default: [] },
  parentName: { type: String, required: true },
  parentEmail: { type: String, required: true },
  contactNumber: { type: String, required: true },
  address: { type: String, required: true },
  joinDate: { type: Date, default: Date.now },
  monthlyFeeAmount: { type: Number, required: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true });

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['P', 'A', 'L', 'H'], required: true },
  remarks: String,
}, { timestamps: true });

const FeeSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  month: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  balanceAmount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE'], required: true },
  transactionRef: String,
  receiptNumber: { type: String, required: true },
  status: { type: String, enum: ['PAID', 'PARTIAL', 'PENDING'], required: true },
  remarks: String,
}, { timestamps: true });

const ExamSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  testName: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  obtainedMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  examDate: { type: Date, required: true },
  remarks: String,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Student = mongoose.model('Student', StudentSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);
const Fee = mongoose.model('Fee', FeeSchema);
const Exam = mongoose.model('Exam', ExamSchema);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Attendance.deleteMany({});
    await Fee.deleteMany({});
    await Exam.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create Admin User
    const hashedAdminPassword = await bcrypt.hash('Admin123!', 10);
    const admin = new User({
      email: 'admin@htms.com',
      password: hashedAdminPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
      phone: '9999999999',
    });
    await admin.save();
    console.log('✅ Admin created: admin@htms.com / Admin123!');

    // Create Parent Users
    const parentUsers = [
      {
        email: 'parent1@gmail.com',
        password: await bcrypt.hash('Parent123!', 10),
        fullName: 'Rajesh Sharma',
        role: 'PARENT',
        phone: '9876543210'
      },
      {
        email: 'parent2@gmail.com',
        password: await bcrypt.hash('Parent123!', 10),
        fullName: 'Priya Singh',
        role: 'PARENT',
        phone: '9876543211'
      },
      {
        email: 'parent3@gmail.com',
        password: await bcrypt.hash('Parent123!', 10),
        fullName: 'Amit Kumar',
        role: 'PARENT',
        phone: '9876543212'
      },
      {
        email: 'parent4@gmail.com',
        password: await bcrypt.hash('Parent123!', 10),
        fullName: 'Sunita Gupta',
        role: 'PARENT',
        phone: '9876543213'
      },
      {
        email: 'parent5@gmail.com',
        password: await bcrypt.hash('Parent123!', 10),
        fullName: 'Vikram Patel',
        role: 'PARENT',
        phone: '9876543214'
      }
    ];

    const createdParents = await User.insertMany(parentUsers);
    console.log('✅ Parents created');

    // Create Students
    const studentsData = [
      {
        studentId: 'STU-001',
        fullName: 'Arjun Sharma',
        gender: 'MALE',
        dateOfBirth: new Date('2010-05-15'),
        classGrade: '8',
        section: 'A',
        schoolName: 'ABC Public School',
        subjects: ['Mathematics', 'Science', 'English', 'Hindi'],
        parentName: 'Rajesh Sharma',
        parentEmail: 'parent1@gmail.com',
        contactNumber: '9876543210',
        address: '123 Main Street, Delhi',
        monthlyFeeAmount: 2500,
      },
      {
        studentId: 'STU-002',
        fullName: 'Kavya Singh',
        gender: 'FEMALE',
        dateOfBirth: new Date('2009-08-22'),
        classGrade: '9',
        section: 'B',
        schoolName: 'XYZ Convent School',
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
        parentName: 'Priya Singh',
        parentEmail: 'parent2@gmail.com',
        contactNumber: '9876543211',
        address: '456 Park Avenue, Mumbai',
        monthlyFeeAmount: 3000,
      },
      {
        studentId: 'STU-003',
        fullName: 'Rohit Kumar',
        gender: 'MALE',
        dateOfBirth: new Date('2008-12-10'),
        classGrade: '10',
        section: 'A',
        schoolName: 'Delhi Public School',
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science'],
        parentName: 'Amit Kumar',
        parentEmail: 'parent3@gmail.com',
        contactNumber: '9876543212',
        address: '789 Green Park, Bangalore',
        monthlyFeeAmount: 3500,
      },
      {
        studentId: 'STU-004',
        fullName: 'Sneha Gupta',
        gender: 'FEMALE',
        dateOfBirth: new Date('2011-03-18'),
        classGrade: '7',
        section: 'C',
        schoolName: 'Modern Public School',
        subjects: ['Mathematics', 'Science', 'English', 'Social Studies'],
        parentName: 'Sunita Gupta',
        parentEmail: 'parent4@gmail.com',
        contactNumber: '9876543213',
        address: '321 Cyber City, Gurgaon',
        monthlyFeeAmount: 2200,
      },
      {
        studentId: 'STU-005',
        fullName: 'Dev Patel',
        gender: 'MALE',
        dateOfBirth: new Date('2007-11-05'),
        classGrade: '11',
        section: 'A',
        schoolName: 'International School',
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'],
        parentName: 'Vikram Patel',
        parentEmail: 'parent5@gmail.com',
        contactNumber: '9876543214',
        address: '654 Tech Park, Pune',
        monthlyFeeAmount: 4000,
      }
    ];

    const createdStudents = await Student.insertMany(studentsData);
    console.log('✅ Students created');

    // Create sample attendance records (last 30 days)
    const attendanceRecords = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      for (const student of createdStudents) {
        const statuses = ['P', 'P', 'P', 'P', 'A', 'L']; // Mostly present
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        attendanceRecords.push({
          studentId: student._id,
          date: new Date(date),
          status: randomStatus,
          remarks: randomStatus === 'L' ? 'Came late due to traffic' : randomStatus === 'A' ? 'Sick' : ''
        });
      }
    }
    
    await Attendance.insertMany(attendanceRecords);
    console.log('✅ Attendance records created');

    // Create sample fee records
    const feeRecords = [];
    const currentMonth = new Date();
    
    for (let i = 0; i < 3; i++) { // Last 3 months
      const month = new Date(currentMonth);
      month.setMonth(month.getMonth() - i);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      
      for (const student of createdStudents) {
        const isPaid = Math.random() > 0.3; // 70% chance of being paid
        const paidAmount = isPaid ? student.monthlyFeeAmount : (Math.random() > 0.5 ? student.monthlyFeeAmount / 2 : 0);
        const balanceAmount = student.monthlyFeeAmount - paidAmount;
        
        let status = 'PENDING';
        if (paidAmount === student.monthlyFeeAmount) status = 'PAID';
        else if (paidAmount > 0) status = 'PARTIAL';
        
        feeRecords.push({
          paymentId: `PAY-${String(feeRecords.length + 1).padStart(3, '0')}`,
          studentId: student._id,
          month: monthKey,
          totalAmount: student.monthlyFeeAmount,
          paidAmount,
          balanceAmount,
          paymentDate: new Date(month.getFullYear(), month.getMonth(), Math.floor(Math.random() * 25) + 1),
          paymentMethod: ['CASH', 'UPI', 'CARD'][Math.floor(Math.random() * 3)],
          receiptNumber: `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`,
          status,
          remarks: status === 'PARTIAL' ? 'Partial payment made' : ''
        });
      }
    }
    
    await Fee.insertMany(feeRecords);
    console.log('✅ Fee records created');

    // Create sample exam/marks records
    const examRecords = [];
    const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
    const testTypes = ['Unit Test 1', 'Unit Test 2', 'Mid Term Exam', 'Monthly Test'];
    
    for (const student of createdStudents) {
      for (let i = 0; i < 8; i++) { // 8 test records per student
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const testName = testTypes[Math.floor(Math.random() * testTypes.length)];
        const totalMarks = [50, 75, 100][Math.floor(Math.random() * 3)];
        const obtainedMarks = Math.floor(Math.random() * (totalMarks - 20)) + 20; // At least 20 marks
        const percentage = Math.round((obtainedMarks / totalMarks) * 100);
        
        const examDate = new Date();
        examDate.setDate(examDate.getDate() - Math.floor(Math.random() * 60)); // Random date within 60 days
        
        examRecords.push({
          studentId: student._id,
          subject,
          testName,
          totalMarks,
          obtainedMarks,
          percentage,
          examDate,
          remarks: percentage >= 90 ? 'Excellent performance!' : percentage >= 70 ? 'Good work!' : percentage >= 50 ? 'Needs improvement' : 'Requires extra attention'
        });
      }
    }
    
    await Exam.insertMany(examRecords);
    console.log('✅ Exam records created');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Admin: admin@htms.com / Admin123!');
    console.log('   Parent 1: parent1@gmail.com / Parent123!');
    console.log('   Parent 2: parent2@gmail.com / Parent123!');
    console.log('   Parent 3: parent3@gmail.com / Parent123!');
    console.log('   Parent 4: parent4@gmail.com / Parent123!');
    console.log('   Parent 5: parent5@gmail.com / Parent123!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();