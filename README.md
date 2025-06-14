# Medical Records Management System

A full-stack medical records management application built with .NET 9 and Next.js 15, featuring secure file upload, user authentication, and comprehensive profile management with real-time file previews.

## 🌟 Live Demo

- **Frontend**: [https://hf-developer-demo.vercel.app](https://hf-developer-demo.vercel.app)
- **Backend API**: [https://hf-developer-demo.onrender.com](https://hf-developer-demo.onrender.com)
- **Health Check**: [https://hf-developer-demo.onrender.com/health](https://hf-developer-demo.onrender.com/health)

## 🏗️ Architecture

### Backend (.NET 9)

- **Clean Architecture** with separation of concerns
- **Entity Framework Core** with PostgreSQL for both development and production
- **Session-based Authentication** with secure token management
- **File Storage Service** with comprehensive validation
- **RESTful API** with robust error handling and health checks

### Frontend (Next.js 15)

- **React 19** with TypeScript for type safety
- **Tailwind CSS 4** for modern, responsive styling
- **Context-based State Management** for auth and file operations
- **Real-time File Previews** with grid and list views
- **Responsive Design** optimized for mobile and desktop

## 📁 Project Structure

```
HF-developer-demo/
├── backend/
│   └── src/
│       ├── MedicalRecords.API/          # Web API layer with controllers
│       ├── MedicalRecords.Application/   # Business logic & services
│       ├── MedicalRecords.Core/         # Domain entities & interfaces
│       └── MedicalRecords.Infrastructure/ # Data access & external services
└── frontend/
    └── src/
        ├── app/                         # Next.js app router pages
        ├── api/                         # API utilities & type definitions
        ├── components/                  # Reusable UI components
        └── contexts/                    # React contexts for state management
```

## 🛠️ Technology Stack

### Backend

- **.NET 9** - Latest .NET framework
- **Entity Framework Core 9** - ORM for database operations
- **PostgreSQL** - Database for both development and production
- **BCrypt.Net** - Secure password hashing
- **Npgsql** - PostgreSQL driver for .NET

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with enhanced features
- **TypeScript** - Static type checking
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Modern icon library

### Deployment

- **Backend**: Render.com with PostgreSQL database
- **Frontend**: Vercel with automatic deployments
- **File Storage**: Server-side file system with secure access

## 🚀 Getting Started

### Prerequisites

- **.NET 9 SDK** ([Download](https://dotnet.microsoft.com/download/dotnet/9.0))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **PostgreSQL 15+** ([Download](https://www.postgresql.org/download/))

### Database Setup

1. **Install PostgreSQL** (if not already installed)

   ```bash
   # Windows (using Chocolatey)
   choco install postgresql

   # macOS (using Homebrew)
   brew install postgresql@15
   brew services start postgresql@15

   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

2. **Create development database**

   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database and user
   CREATE DATABASE medical_records_dev;
   CREATE USER medical_user WITH PASSWORD 'medical_pass123';
   GRANT ALL PRIVILEGES ON DATABASE medical_records_dev TO medical_user;
   \q
   ```

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd backend/src/MedicalRecords.API
   ```

2. **Install dependencies**

   ```bash
   dotnet restore
   ```

3. **Configure database connection**

   ```json
   // appsettings.Development.json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=medical_records_dev;Username=medical_user;Password=medical_pass123;SSL Mode=Disable"
     }
   }
   ```

4. **Run database migrations**

   ```bash
   dotnet ef database update
   ```

5. **Start the API server**
   ```bash
   dotnet run
   ```
   API available at `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   # .env.local
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   App available at `http://localhost:3000`

## 📋 Features

### 🔐 Authentication & User Management

- **Secure Registration** with email validation and password strength requirements
- **Session-based Login** with automatic session management
- **Profile Management** with profile picture upload and validation
- **Secure Logout** with session cleanup
- **Auto-redirect** based on authentication state

### 📄 Advanced File Management

- **Multi-format Support**: PDF, JPEG, PNG, GIF, DOC, DOCX
- **Smart File Categorization**: Lab Reports, Prescriptions, X-rays, Blood Reports, MRI/CT Scans
- **Real-time File Validation** with size and type checking (10MB limit)
- **Dual View Modes**: Grid view with thumbnails and detailed list view
- **Inline File Preview** with modal viewer for images and PDFs
- **Secure Download** with proper file headers
- **Drag & Drop Upload** (coming soon)

### 🛡️ Security & Validation

- **BCrypt Password Hashing** with salt rounds
- **Session Token Authentication** with expiration handling
- **MIME Type Validation** with file extension verification
- **File Size Limiting** (10MB default, configurable)
- **User Isolation** - users can only access their own files
- **SQL Injection Protection** via Entity Framework
- **CORS Configuration** for secure cross-origin requests

### 🎨 User Experience

- **Responsive Design** - mobile-first approach
- **Loading States** with spinners and progress indicators
- **Error Handling** with user-friendly messages
- **File Thumbnails** for quick visual identification
- **Search & Filter** capabilities (coming soon)
- **Accessibility** with proper ARIA labels and keyboard navigation

## 🏗️ Backend Architecture Details

### Core Layer (`MedicalRecords.Core`)

```csharp
// Domain entities with relationships
public class User { /* User profile and authentication */ }
public class MedicalFile { /* File metadata and associations */ }
public class UserSession { /* Session management */ }

// Repository interfaces for data access
public interface IUserRepository { /* User CRUD operations */ }
public interface IMedicalFileRepository { /* File CRUD operations */ }
public interface ISessionRepository { /* Session management */ }
```

### Application Layer (`MedicalRecords.Application`)

```csharp
// Business services with validation
public class AuthService { /* Authentication logic */ }
public class FileService { /* File operations and validation */ }

// DTOs for API communication
public class FileUploadRequest { /* File upload data */ }
public class UserProfileResponse { /* User profile data */ }
```

### Infrastructure Layer (`MedicalRecords.Infrastructure`)

```csharp
// Repository implementations
public class UserRepository : IUserRepository { /* EF Core implementation */ }
public class MedicalFileRepository : IMedicalFileRepository { /* File data access */ }

// External services
public class FileStorageService : IFileStorageService { /* File system operations */ }
public class PasswordService : IPasswordService { /* BCrypt operations */ }
```

## 🔧 Configuration

### File Storage Settings

```json
{
  "FileStorage": {
    "BasePath": "uploads",
    "MaxFileSize": 10485760,
    "AllowedExtensions": [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".doc",
      ".docx"
    ]
  }
}
```

### Database Configuration

#### Development Environment

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=medical_records_dev;Username=medical_user;Password=medical_pass123;SSL Mode=Disable"
  }
}
```

#### Production Environment (Render)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "${DATABASE_URL}"
  }
}
```

### CORS Settings

```json
{
  "Cors": {
    "Origins": [
      "https://hf-developer-demo.vercel.app",
      "https://*.vercel.app",
      "http://localhost:3000"
    ]
  }
}
```

## 🚀 Deployment

### Backend Deployment (Render.com)

- **Auto-deployment** from GitHub main branch
- **PostgreSQL database** automatically provisioned
- **Environment variables** configured for production
- **Health check endpoint**: `/health`
- **Port configuration**: Dynamic port binding via `$PORT`

### Frontend Deployment (Vercel)

- **Auto-deployment** from GitHub with preview branches
- **Environment variables** for API endpoints
- **Static optimization** and image optimization
- **Edge runtime** for optimal performance

### Environment Variables

#### Backend (Render)

```bash
DATABASE_URL=postgresql://user:pass@host:port/db
ASPNETCORE_ENVIRONMENT=Production
PORT=8080
```

#### Frontend (Vercel)

```bash
NEXT_PUBLIC_API_BASE_URL=https://hf-developer-demo.onrender.com
```

## 📡 API Documentation

### Authentication Endpoints

```
POST /api/auth/login          # User authentication
POST /api/auth/signup         # User registration
POST /api/auth/logout         # Session termination
GET  /api/auth/current-user   # Get authenticated user info
```

### Profile Management

```
PUT  /api/profile/update      # Update user profile with optional profile picture
```

### File Operations

```
POST   /api/files/upload         # Upload medical file with metadata
GET    /api/files               # Get user's files with pagination
GET    /api/files/{id}/view     # View file inline (browser preview)
GET    /api/files/{id}/download # Download file with proper headers
DELETE /api/files/{id}          # Delete user's file
```

### Static File Serving

```
GET /staticfiles/{*filePath}    # Serve uploaded files securely
```

### System Health

```
GET /health                     # Health check with system information
```

## 🗄️ Database Schema

### Users Table

```sql
Users (
  Id VARCHAR PRIMARY KEY,
  FullName VARCHAR NOT NULL,
  Email VARCHAR UNIQUE NOT NULL,
  PhoneNumber VARCHAR,
  Gender VARCHAR CHECK (Gender IN ('Male', 'Female')),
  PasswordHash VARCHAR NOT NULL,
  ProfileImage VARCHAR,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  LastLoginAt TIMESTAMP,
  IsActive BOOLEAN DEFAULT true
)
```

### MedicalFiles Table

```sql
MedicalFiles (
  Id VARCHAR PRIMARY KEY,
  FileName VARCHAR NOT NULL,
  FilePath VARCHAR NOT NULL,
  ContentType VARCHAR NOT NULL,
  FileType VARCHAR NOT NULL CHECK (FileType IN ('LabReport', 'Prescription', 'XRay', 'BloodReport', 'MRIScan', 'CTScan')),
  FileSize BIGINT NOT NULL,
  UploadDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UserId VARCHAR NOT NULL REFERENCES Users(Id) ON DELETE CASCADE
)
```

### UserSessions Table

```sql
UserSessions (
  Id VARCHAR PRIMARY KEY,
  SessionToken VARCHAR UNIQUE NOT NULL,
  UserId VARCHAR NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ExpiresAt TIMESTAMP NOT NULL,
  LastAccessedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  IpAddress VARCHAR,
  UserAgent TEXT,
  IsActive BOOLEAN DEFAULT true
)
```

## 🧪 Development Workflow

### Backend Development

```bash
# Start with hot reload
dotnet watch run

# Run tests (when available)
dotnet test

# Create new migration
dotnet ef migrations add "MigrationName"

# Apply migrations
dotnet ef database update

# Check API health
curl http://localhost:8080/health
```

### Frontend Development

```bash
# Start with Turbopack (faster builds)
npm run dev

# Build for production
npm run build

# Start production build locally
npm start

# Lint and format
npm run lint
npm run lint:fix
```

### Database Management

```bash
# Connect to PostgreSQL
psql -U medical_user -d medical_records_dev

# Reset database (development)
dotnet ef database drop
dotnet ef database update

# Generate migration script
dotnet ef migrations script

# View connection string
dotnet ef dbcontext info

# Backup database
pg_dump -U medical_user medical_records_dev > backup.sql

# Restore database
psql -U medical_user medical_records_dev < backup.sql
```

## 🔍 Monitoring & Logging

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "Production",
  "version": "1.0.0",
  "database": "PostgreSQL",
  "hasDbUrl": true,
  "port": "8080"
}
```

### File Upload Validation

- **File size**: Maximum 10MB
- **File types**: PDF, JPEG, PNG, GIF, DOC, DOCX
- **MIME validation**: Server-side verification
- **Virus scanning**: Planned for future releases

### Database Performance Monitoring

- **Connection pooling**: Enabled via Npgsql
- **Query logging**: Available in development mode
- **Migration tracking**: Automatic schema versioning
- **Backup strategy**: Daily automated backups (production)

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies for both backend and frontend
4. Set up PostgreSQL database locally
5. Make changes with proper testing
6. Commit with descriptive messages: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open Pull Request with detailed description

### Code Standards

- **Backend**: Follow .NET coding conventions with XML documentation
- **Frontend**: Use TypeScript with strict mode, ESLint configuration
- **Database**: Use Entity Framework migrations for schema changes
- **Testing**: Write unit tests for business logic (in development)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support & Issues

### Getting Help

1. Check existing [Issues](../../issues) for solutions
2. Review API documentation and error responses
3. Verify environment variables and configuration
4. Create detailed issue with:
   - Error messages and stack traces
   - Steps to reproduce
   - Environment details (OS, .NET version, Node version, PostgreSQL version)
   - Expected vs actual behavior

### Common Issues

- **Database connection**: Verify PostgreSQL service is running and credentials are correct
- **File upload errors**: Check file size limits and allowed types
- **CORS issues**: Verify frontend URL in backend CORS configuration
- **Session expiration**: Check session timeout settings
- **Migration errors**: Ensure PostgreSQL user has proper permissions

## 🎯 Roadmap

### Short Term (Next Release)

- [ ] **Email notifications** for file uploads and profile changes
- [ ] **Advanced file search** with filters by type, date, and content
- [ ] **Bulk file operations** (upload multiple files, bulk delete)
- [ ] **File sharing** between users with permission controls

### Medium Term

- [ ] **Medical data analytics** with charts and insights
- [ ] **Integration with healthcare APIs** (HL7 FHIR)
- [ ] **Advanced security** with two-factor authentication
- [ ] **Audit logging** for compliance requirements

### Long Term

- [ ] **Mobile application** (React Native)
- [ ] **Offline capabilities** with sync
- [ ] **AI-powered** document analysis and categorization
- [ ] **Multi-tenant architecture** for healthcare organizations



### Test Credentials

You can create a new account or use the demo credentials (if available):

- Email: rupin360@gmail.com
- Password: 123456

---

**Built with ❤️ by Rupin Desai** - _Secure, scalable medical records management for the modern healthcare industry_
