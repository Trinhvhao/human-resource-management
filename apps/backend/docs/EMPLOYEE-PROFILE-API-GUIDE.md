# 📚 Employee Profile API Guide

## 🎯 Overview

Complete API documentation for the Employee Profile Enhancement system.

---

## 🔐 Authentication

All endpoints require JWT authentication:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 API Endpoints

### 1. Get Employee Profile

**GET** `/employees/:id/profile`

Get full employee profile with extended information and documents.

**Permissions:** ADMIN, HR_MANAGER, MANAGER, EMPLOYEE

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employeeCode": "EMP26001",
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@company.com",
    "phone": "0123456789",
    "avatarUrl": "/uploads/avatars/avatar-123456.jpg",
    "profile": {
      "id": "uuid",
      "employeeId": "uuid",
      "placeOfBirth": "Hà Nội",
      "nationality": "Việt Nam",
      "maritalStatus": "MARRIED",
      "numberOfChildren": 2,
      "emergencyContactName": "Nguyễn Thị B",
      "emergencyContactPhone": "0987654321",
      "emergencyContactRelationship": "Vợ/Chồng",
      "highestEducation": "BACHELOR",
      "major": "Computer Science",
      "university": "HUST",
      "graduationYear": 2020,
      "bankName": "Vietcombank",
      "bankAccountNumber": "1234567890",
      "bankBranch": "Hà Nội",
      "profileCompletionPercentage": 100,
      "lastProfileUpdate": "2026-02-06T10:00:00Z"
    },
    "documents": [
      {
        "id": "uuid",
        "documentType": "RESUME",
        "fileName": "CV_NguyenVanA.pdf",
        "fileUrl": "/uploads/documents/doc-123456.pdf",
        "fileSize": 1024000,
        "mimeType": "application/pdf",
        "uploadedAt": "2026-02-06T10:00:00Z"
      }
    ],
    "department": {
      "id": "uuid",
      "code": "IT",
      "name": "Phòng Công nghệ"
    }
  }
}
```

---

### 2. Update Employee Profile

**PATCH** `/employees/:id/profile`

Update extended employee profile information.

**Permissions:** ADMIN, HR_MANAGER

**Request Body:**
```json
{
  "placeOfBirth": "Hà Nội",
  "nationality": "Việt Nam",
  "maritalStatus": "MARRIED",
  "numberOfChildren": 2,
  "emergencyContactName": "Nguyễn Thị B",
  "emergencyContactPhone": "0987654321",
  "emergencyContactRelationship": "Vợ/Chồng",
  "emergencyContactAddress": "123 Đường ABC, Hà Nội",
  "highestEducation": "BACHELOR",
  "major": "Computer Science",
  "university": "HUST",
  "graduationYear": 2020,
  "bankName": "Vietcombank",
  "bankAccountNumber": "1234567890",
  "bankAccountHolder": "NGUYEN VAN A",
  "bankBranch": "Hà Nội",
  "taxCode": "1234567890",
  "socialInsuranceNumber": "1234567890",
  "healthInsuranceNumber": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "placeOfBirth": "Hà Nội",
    "profileCompletionPercentage": 80,
    "lastProfileUpdate": "2026-02-06T10:00:00Z"
  }
}
```

---

### 3. Upload Employee Avatar

**POST** `/employees/:id/avatar`

Upload or update employee profile picture.

**Permissions:** ADMIN, HR_MANAGER

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Image file (JPG, JPEG, PNG, GIF)
- Max size: 5MB

**Example (cURL):**
```bash
curl -X POST \
  http://localhost:3000/employees/{id}/avatar \
  -H 'Authorization: Bearer <token>' \
  -F 'file=@/path/to/avatar.jpg'
```

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "documentType": "AVATAR",
    "fileName": "avatar.jpg",
    "fileUrl": "/uploads/avatars/avatar-123456.jpg",
    "fileSize": 512000,
    "mimeType": "image/jpeg",
    "uploadedAt": "2026-02-06T10:00:00Z"
  }
}
```

---

### 4. Upload Employee Document

**POST** `/employees/:id/documents`

Upload employee documents (resume, ID card, certificates, etc.).

**Permissions:** ADMIN, HR_MANAGER

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Document file (PDF, JPG, PNG, DOC, DOCX)
- `documentType`: Document type (see types below)
- `description`: Optional description
- Max size: 10MB

**Document Types:**
- `RESUME` - CV/Resume
- `ID_CARD_FRONT` - ID card front
- `ID_CARD_BACK` - ID card back
- `DEGREE` - Educational degrees
- `CERTIFICATE` - Professional certificates
- `CONTRACT` - Employment contracts
- `OTHER` - Other documents

**Example (cURL):**
```bash
curl -X POST \
  http://localhost:3000/employees/{id}/documents \
  -H 'Authorization: Bearer <token>' \
  -F 'file=@/path/to/resume.pdf' \
  -F 'documentType=RESUME' \
  -F 'description=Updated CV 2026'
```

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "documentType": "RESUME",
    "fileName": "resume.pdf",
    "fileUrl": "/uploads/documents/doc-123456.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "description": "Updated CV 2026",
    "uploadedAt": "2026-02-06T10:00:00Z"
  }
}
```

---

### 5. Get Employee Documents

**GET** `/employees/:id/documents?type=RESUME`

Get all documents for an employee, optionally filtered by type.

**Permissions:** ADMIN, HR_MANAGER, MANAGER

**Query Parameters:**
- `type` (optional): Filter by document type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "documentType": "RESUME",
      "fileName": "resume.pdf",
      "fileUrl": "/uploads/documents/doc-123456.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "description": "Updated CV 2026",
      "uploadedAt": "2026-02-06T10:00:00Z",
      "uploader": {
        "id": "uuid",
        "email": "admin@company.com"
      }
    }
  ]
}
```

---

### 6. Delete Employee Document

**DELETE** `/employees/:id/documents/:documentId`

Delete a specific employee document.

**Permissions:** ADMIN, HR_MANAGER

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

### 7. Get Profile Completion Statistics

**GET** `/employees/stats/profile-completion`

Get statistics about employee profile completion.

**Permissions:** ADMIN, HR_MANAGER

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 73,
    "complete": 45,
    "incomplete": 28,
    "avgCompletion": 75
  }
}
```

---

## 📊 Profile Completion Logic

Profile completion is calculated based on 5 groups (20% each):

### 1. Personal Information (20%)
- ✅ Place of birth
- ✅ Nationality
- ✅ Marital status

### 2. Emergency Contact (20%)
- ✅ Emergency contact name
- ✅ Emergency contact phone
- ✅ Emergency contact relationship

### 3. Education (20%)
- ✅ Highest education
- ✅ Major
- ✅ University

### 4. Bank Information (20%)
- ✅ Bank name
- ✅ Bank account number
- ✅ Bank branch

### 5. Documents (20%)
- ✅ Resume uploaded
- ✅ ID card front uploaded

**Total:** 100%

---

## 🧪 Testing with Postman/Thunder Client

### Step 1: Login
```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "your_password"
}
```

Copy the `accessToken` from response.

### Step 2: Get Employee Profile
```
GET http://localhost:3000/employees/{employee_id}/profile
Authorization: Bearer {accessToken}
```

### Step 3: Update Profile
```
PATCH http://localhost:3000/employees/{employee_id}/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "placeOfBirth": "Hà Nội",
  "nationality": "Việt Nam",
  "maritalStatus": "MARRIED"
}
```

### Step 4: Upload Avatar
```
POST http://localhost:3000/employees/{employee_id}/avatar
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

file: [Select image file]
```

### Step 5: Upload Document
```
POST http://localhost:3000/employees/{employee_id}/documents
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

file: [Select document file]
documentType: RESUME
description: Updated CV 2026
```

---

## ⚠️ Error Responses

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Employee not found",
  "error": "Not Found"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Only image files are allowed!",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## 📁 File Storage

### Current Implementation:
- **Local Storage** in `uploads/` directory
- Folders: `avatars/`, `documents/`
- URLs: `/uploads/{folder}/{filename}`

### File Naming:
- Avatars: `avatar-{timestamp}-{random}.{ext}`
- Documents: `doc-{timestamp}-{random}-{sanitized_name}.{ext}`

### File Limits:
- Avatars: 5MB max
- Documents: 10MB max

### Allowed Types:
- **Avatars:** JPG, JPEG, PNG, GIF
- **Documents:** PDF, JPG, PNG, DOC, DOCX

---

## 🔒 Security Notes

1. **Authentication Required:** All endpoints require valid JWT token
2. **Role-Based Access:** Different roles have different permissions
3. **File Validation:** File type and size are validated
4. **Sanitized Filenames:** Special characters are removed from filenames
5. **Unique Filenames:** Timestamp + random number prevents collisions

---

## 🚀 Next Steps

After testing the APIs, proceed to **Phase 3: Frontend UI**:
- Avatar upload component
- Profile form with tabs
- Document management UI
- Profile completion progress bar

---

**Last Updated:** February 6, 2026
**Version:** 1.0.0
