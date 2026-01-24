# Home Tuition Management System (HTMS) - Next.js

A comprehensive home tuition management system built with Next.js 16, TypeScript, MongoDB, and Tailwind CSS. This application provides separate interfaces for administrators and parents to manage students, attendance, fees, and academic records.

## 🚀 Features

### Admin Dashboard
- **Dashboard Overview**: Real-time statistics with charts for attendance, fee collection, and student performance
- **Student Management**: Add, view, edit, and manage student profiles with complete information
- **Attendance Management**: Mark daily attendance with P/A/L/H status and bulk operations
- **Fee Management**: Collect fees with auto-generated receipts, payment tracking, and reports
- **Marks Management**: Add exam marks with automatic percentage calculation and grading
- **Collapsible Sidebar**: Responsive admin navigation with 7 main sections

### Parent Portal
- **Child Dashboard**: View all children's information in one place
- **Attendance Tracking**: Monitor child's attendance with percentage and recent records
- **Fee Status**: Check payment status, pending amounts, and payment history
- **Academic Progress**: View recent test results, marks, and performance trends
- **Secure Access**: Role-based authentication with parent-specific data access

### Core Features
- **Authentication**: JWT-based authentication with role management (Admin/Parent)
- **Database**: MongoDB with Mongoose ODM for robust data management
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Charts & Analytics**: Interactive charts using Recharts library
- **Material UI Icons**: Professional icon set for enhanced user experience

## 🛠 Technology Stack

- **Framework**: Next.js 16.1.2 with App Router
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Styling**: Tailwind CSS
- **Authentication**: JWT (JSON Web Tokens)
- **Charts**: Recharts library
- **Icons**: Material-UI Icons
- **Password Hashing**: bcrypt

## 📦 Installation

1. **Clone the repository**
   ```bash
   cd "path/to/your/workspace"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/htms_nextjs
   JWT_SECRET=your_jwt_secret_here_min_32_chars
   JWT_EXPIRE=7d
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```

4. **Seed the database**
   ```bash
   node seed.js
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - Login with the demo credentials below

## 🔐 Demo Credentials

### Admin Access
- **Email**: admin@htms.com
- **Password**: Admin123!

### Parent Access
- **Parent 1**: parent1@gmail.com / Parent123!
- **Parent 2**: parent2@gmail.com / Parent123!
- **Parent 3**: parent3@gmail.com / Parent123!
- **Parent 4**: parent4@gmail.com / Parent123!
- **Parent 5**: parent5@gmail.com / Parent123!

## 📊 Sample Data

The seed script creates:
- 1 Admin user
- 5 Parent users
- 5 Students (one per parent)
- 30 days of attendance records
- 3 months of fee records
- Multiple exam/marks records per student

## 🏗 Project Structure

```
nextjs-htms/
├── src/
│   ├── app/
│   │   ├── admin/                    # Admin pages
│   │   │   ├── page.tsx             # Dashboard
│   │   │   ├── students/page.tsx    # Student management
│   │   │   ├── attendance/mark/     # Attendance marking
│   │   │   ├── fees/collect/        # Fee collection
│   │   │   └── marks/add/           # Marks entry
│   │   ├── parent/page.tsx          # Parent dashboard
│   │   ├── login/page.tsx           # Login page
│   │   ├── api/                     # API routes
│   │   │   ├── auth/               # Authentication
│   │   │   ├── students/           # Student operations
│   │   │   ├── attendance/         # Attendance operations
│   │   │   ├── fees/               # Fee operations
│   │   │   ├── marks/              # Marks operations
│   │   │   └── parent/             # Parent operations
│   ├── components/
│   │   ├── admin/                   # Admin components
│   │   │   ├── AdminLayout.tsx     # Main admin layout
│   │   │   └── AdminSidebar.tsx    # Collapsible sidebar
│   │   └── ProtectedRoute.tsx      # Route protection
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication context
│   ├── lib/
│   │   ├── mongodb.ts              # Database connection
│   │   ├── middleware.ts           # Auth middleware
│   │   └── utils.ts                # Utility functions
│   ├── models/                      # MongoDB schemas
│   │   ├── User.ts                 # User model
│   │   ├── Student.ts              # Student model
│   │   ├── Attendance.ts           # Attendance model
│   │   ├── Fee.ts                  # Fee model
│   │   └── Exam.ts                 # Exam/Marks model
│   └── types/                       # TypeScript types
├── seed.js                         # Database seed script
├── package.json                    # Dependencies
└── README.md                       # This file
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Admin registration

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create new student
- `GET /api/students/[id]` - Get student by ID

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/student/[studentId]` - Get student attendance

### Fees
- `POST /api/fees/pay` - Process fee payment
- `GET /api/fees/student/[studentId]` - Get student fee records

### Marks
- `POST /api/marks` - Add marks
- `GET /api/marks?studentId=[id]` - Get student marks

### Parent
- `GET /api/parent/dashboard` - Get parent dashboard data

## 🔧 Key Features Implementation

### Admin Dashboard
- Real-time statistics cards showing total students, daily attendance, monthly collection, and pending fees
- Interactive charts for attendance trends and fee collection
- Recent activity feed
- Class distribution pie chart

### Attendance System
- Mark attendance with P (Present), A (Absent), L (Late), H (Holiday) status
- Bulk operations to mark all students with same status
- Date selection for marking attendance
- Remarks field for additional notes
- Automatic attendance percentage calculation

### Fee Management
- Collect partial or full payments
- Auto-generated receipt numbers
- Multiple payment methods (Cash, UPI, Card, Bank Transfer, Cheque)
- Transaction reference tracking
- Payment status tracking (Paid/Partial/Pending)

### Marks System
- Subject-wise mark entry
- Automatic percentage calculation
- Grade assignment based on percentage
- Multiple test types support
- Performance remarks

### Parent Portal
- Multi-child support for parents with multiple students
- Attendance overview with visual indicators
- Fee status with pending amounts
- Recent test results and academic progress
- Secure access with parent-specific data

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Support**: Theme toggle for better user experience
- **Material Design**: Professional icons and consistent design language
- **Interactive Charts**: Visual representation of data using Recharts
- **Loading States**: Proper loading indicators for better UX
- **Error Handling**: Comprehensive error handling and user feedback

## 🔒 Security Features

- JWT token-based authentication
- Role-based access control (RBAC)
- Protected API routes with middleware
- Password hashing with bcrypt
- Parent-specific data access restrictions
- Secure MongoDB connection handling

## 🚀 Deployment

### Environment Setup
1. Set up MongoDB database (local or cloud)
2. Configure environment variables
3. Run seed script for initial data

### Build and Deploy
```bash
npm run build
npm start
```

## 📈 Future Enhancements

- [ ] File upload for student photos and documents
- [ ] Email notifications for parents
- [ ] SMS notifications for attendance and fees
- [ ] Advanced reporting and analytics
- [ ] Bulk data import/export
- [ ] Calendar integration
- [ ] Push notifications
- [ ] Mobile app using React Native

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please contact the development team or raise an issue in the repository.

---

**Built with ❤️ using Next.js and MongoDB**
