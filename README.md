# Tennis Academy MVP

A comprehensive web platform for tennis academies to manage scheduling, attendance, and payment tracking with real users (students/parents/coaches).

## 🏗️ Tech Stack

- **Frontend**: React with Vite, Material-UI
- **Backend**: FastAPI (Python)
- **Database**: SQLite (development) / PostgreSQL (production)
- **QR Code**: qrcode.react (frontend), qrcode (backend)
- **Email**: SendGrid integration
- **Authentication**: Simple password-based for coaches

## 🚀 Features

### Student/Parent Features
- **Package Browsing**: View available tennis packages with pricing
- **Registration**: Register for packages with user information
- **QR Code Generation**: Generate personal QR codes for attendance
- **Email Notifications**: Receive confirmation emails and invoices

### Coach Features
- **Authentication**: Secure coach portal with password protection
- **Attendance Tracking**: Scan QR codes to mark student attendance
- **Class Management**: Cancel classes with automatic notifications
- **Real-time Updates**: Live attendance list and status updates

### Admin Features
- **User Management**: Create and manage students, parents, and coaches
- **Package Management**: Create and configure tennis packages
- **Billing System**: Automated monthly invoice generation
- **Payment Tracking**: Manual payment matching for Zelle/Venmo

## 📋 Database Schema

### Core Models
- **Users**: Students, parents, and coaches
- **Packages**: Tennis lesson packages with pricing
- **Registrations**: User enrollments in packages
- **Classes**: Scheduled tennis classes
- **Attendance**: Student attendance records
- **Payments**: Invoice and payment tracking

## 🛠️ Setup Instructions

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Seed the database**:
   ```bash
   python seed_data.py
   ```

6. **Run the backend server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=sqlite:///./tennis_academy.db

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@tennisacademy.com

# Coach Authentication
COACH_PASSWORD=tennis123

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

### Default Credentials

- **Coach Password**: `tennis123` (change in production)

## 📱 User Flows

### Student Registration Flow
1. Browse packages on the homepage
2. Select a package and click "Register Now"
3. Fill out registration form with name, email, and role
4. Receive confirmation email
5. Generate QR code for attendance

### Coach Attendance Flow
1. Login to coach portal with password
2. Select package and date for class
3. Start QR code scanner
4. Scan student QR codes to mark attendance
5. View real-time attendance list

### Class Cancellation Flow
1. Login to coach portal
2. Navigate to "Cancel Class" section
3. Select package, date, and specific class
4. Confirm cancellation
5. Students receive email notification

## 🔌 API Endpoints

### Authentication
- `POST /api/coach/auth` - Coach authentication

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create new user

### Packages
- `GET /api/packages` - List all packages
- `POST /api/packages` - Create new package

### Registration
- `POST /api/register` - Register user for package
- `GET /api/registrations/user/{user_id}` - Get user registrations

### Classes
- `GET /api/classes` - List classes with filtering
- `POST /api/classes` - Create new class
- `POST /api/cancel_class/{class_id}` - Cancel class

### QR Codes & Attendance
- `POST /api/generate_qr` - Generate QR code for user
- `POST /api/attendance` - Mark attendance from QR scan
- `GET /api/attendance/class/{class_id}` - Get class attendance

### Payments
- `POST /api/send_invoices` - Generate monthly invoices
- `GET /api/payments/user/{user_id}` - Get user payments
- `POST /api/payments/{payment_id}/update` - Update payment status

## 🚀 Deployment

### Backend Deployment (Render/Heroku)
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy FastAPI application
4. Set up SendGrid email service

### Frontend Deployment (Vercel/Netlify)
1. Build the React application
2. Deploy to hosting platform
3. Configure environment variables
4. Set up custom domain (optional)

## 🔒 Security Considerations

- Coach authentication should use proper session management in production
- API keys and passwords should be stored securely
- Implement rate limiting for API endpoints
- Add input validation and sanitization
- Use HTTPS in production

## 📈 Future Enhancements

- **Advanced Authentication**: JWT tokens, role-based access
- **Payment Integration**: Stripe/PayPal integration
- **Mobile App**: React Native mobile application
- **Analytics Dashboard**: Attendance and payment analytics
- **Automated Scheduling**: AI-powered class scheduling
- **Student Portal**: Individual student dashboards
- **Parent Portal**: Parent-specific features and notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/docs` endpoint
