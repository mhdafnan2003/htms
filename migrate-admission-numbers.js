const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Simple Student Schema
const StudentSchema = new mongoose.Schema({
  studentId: String,
  admissionNumber: String,
  admissionType: String,
  fullName: String,
  createdAt: Date,
}, { timestamps: true });

const Student = mongoose.model('Student', StudentSchema);

async function migrateAdmissionNumbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Find all students without admission numbers
    const studentsWithoutAdmission = await Student.find({
      $or: [
        { admissionNumber: { $exists: false } },
        { admissionNumber: null },
        { admissionNumber: '' }
      ]
    }).sort({ createdAt: 1 });

    console.log(`📋 Found ${studentsWithoutAdmission.length} students without admission numbers`);

    if (studentsWithoutAdmission.length === 0) {
      console.log('✅ All students already have admission numbers!');
      await mongoose.disconnect();
      return;
    }

    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);

    // Get the latest admission numbers for this year
    const latestPermanent = await Student.findOne({
      admissionNumber: { $regex: `^PAC${yearSuffix}/` }
    }).sort({ admissionNumber: -1 });

    const latestTemporary = await Student.findOne({
      admissionNumber: { $regex: `^TAC${yearSuffix}/` }
    }).sort({ admissionNumber: -1 });

    let permanentSerial = 1;
    let temporarySerial = 1;

    if (latestPermanent && latestPermanent.admissionNumber) {
      const match = latestPermanent.admissionNumber.match(/\/(\d+)$/);
      if (match) {
        permanentSerial = parseInt(match[1]) + 1;
      }
    }

    if (latestTemporary && latestTemporary.admissionNumber) {
      const match = latestTemporary.admissionNumber.match(/\/(\d+)$/);
      if (match) {
        temporarySerial = parseInt(match[1]) + 1;
      }
    }

    console.log(`🔢 Starting serial numbers - Permanent: ${permanentSerial}, Temporary: ${temporarySerial}`);

    // Update each student
    for (const student of studentsWithoutAdmission) {
      // Default to PERMANENT if not set
      const admissionType = student.admissionType || 'PERMANENT';
      const prefix = admissionType === 'PERMANENT' ? 'PAC' : 'TAC';
      
      let serialNumber;
      if (admissionType === 'PERMANENT') {
        serialNumber = permanentSerial++;
      } else {
        serialNumber = temporarySerial++;
      }

      const admissionNumber = `${prefix}${yearSuffix}/${serialNumber}`;

      await Student.findByIdAndUpdate(student._id, {
        admissionNumber: admissionNumber,
        admissionType: admissionType
      });

      console.log(`✅ Updated: ${student.fullName} -> ${admissionNumber}`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Updated ${studentsWithoutAdmission.length} students`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
migrateAdmissionNumbers();
