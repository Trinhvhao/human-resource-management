# Implementation Plan: Hệ Thống Quản Lý Nhân Sự

## Overview

Plan triển khai hệ thống quản lý nhân sự theo từng giai đoạn, từ setup project, xây dựng backend API, frontend UI, đến tích hợp AI chatbot và testing. Mỗi task được thiết kế để build incrementally và có thể test ngay sau khi hoàn thành.

## Tasks

- [ ] 1. Setup Project Structure và Core Infrastructure
  - Khởi tạo monorepo với pnpm workspaces
  - Setup Next.js 14 (frontend) và NestJS (backend)
  - Cấu hình TypeScript, ESLint, Prettier
  - Setup Supabase project và Prisma ORM
  - Cấu hình environment variables
  - _Requirements: 13.5, 13.6_

- [ ] 2. Database Schema và Migrations
  - [ ] 2.1 Tạo Prisma schema với tất cả models
    - Định nghĩa 13 models: User, Employee, Department, Attendance, LeaveRequest, Contract, Payroll, PayrollItem, Reward, Discipline, EmployeeHistory, ChatMessage
    - Định nghĩa relationships và indexes
    - Cấu hình enums
    - _Requirements: 1.1, 1.2, 2.2, 3.1, 4.1, 5.1, 6.1, 10.6_
  
  - [ ]* 2.2 Write property test for database schema
    - **Property 7: Employee-Department Consistency**
    - **Validates: Requirements 2.3**
  
  - [ ] 2.3 Tạo initial migration và seed data
    - Generate migration files
    - Tạo seed script với sample data (departments, users, employees)
    - _Requirements: 2.1, 7.1_

- [ ] 3. Authentication Module (Backend)
  - [ ] 3.1 Implement Auth Service với Supabase Auth
    - SignUp, SignIn, SignOut methods
    - JWT token generation và validation
    - Refresh token logic
    - Password hashing với bcrypt
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.8_
  
  - [ ]* 3.2 Write property tests for authentication
    - **Property 34: Password Encryption**
    - **Property 35: JWT Token Generation on Login**
    - **Property 36: Refresh Token Functionality**
    - **Property 38: Token Invalidation on Logout**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.8**
  
  - [ ] 3.3 Implement Auth Guards và Decorators
    - JwtAuthGuard cho protected routes
    - RolesGuard cho role-based access
    - @CurrentUser decorator
    - _Requirements: 7.5, 7.6_
  
  - [ ]* 3.4 Write property tests for authorization
    - **Property 31: Permission Check on Access**
    - **Property 32: Unauthorized Access Rejection**
    - **Validates: Requirements 7.5, 7.6**
  
  - [ ] 3.5 Implement rate limiting và account lockout
    - Rate limiter cho login endpoint
    - Account lockout sau 5 failed attempts
    - _Requirements: 8.5_
  
  - [ ]* 3.6 Write property test for account lockout
    - **Property 37: Account Lockout After Failed Attempts**
    - **Validates: Requirements 8.5**

- [ ] 4. Employee Module (Backend)
  - [ ] 4.1 Implement Employee Service
    - CRUD operations (create, findAll, findOne, update, delete)
    - generateEmployeeCode method
    - Search và filtering logic
    - Pagination support
    - _Requirements: 1.3, 1.5, 1.7_
  
  - [ ]* 4.2 Write property tests for employee operations
    - **Property 1: Employee Code Uniqueness**
    - **Property 3: Search Result Accuracy**
    - **Property 5: Employee Status Transition**
    - **Validates: Requirements 1.3, 1.5, 1.7**
  
  - [ ] 4.3 Implement Employee History tracking
    - Interceptor để log changes
    - EmployeeHistory repository
    - _Requirements: 1.4_
  
  - [ ]* 4.4 Write property test for audit trail
    - **Property 2: Audit Trail Completeness**
    - **Validates: Requirements 1.4**
  
  - [ ] 4.5 Implement file upload cho avatar và documents
    - Supabase Storage integration
    - File validation (type, size)
    - _Requirements: 1.6_
  
  - [ ]* 4.6 Write property test for file upload
    - **Property 4: File Upload Round-Trip**
    - **Validates: Requirements 1.6**
  
  - [ ] 4.7 Create Employee Controller với DTOs
    - REST endpoints: POST, GET, PUT, DELETE /employees
    - Request validation với class-validator
    - Response serialization
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 5. Department Module (Backend)
  - [ ] 5.1 Implement Department Service
    - CRUD operations
    - getOrganizationChart method (tree structure)
    - assignManager method
    - Referential integrity checks
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 5.2 Write property tests for department operations
    - **Property 6: Department CRUD Consistency**
    - **Property 8: Department Referential Integrity**
    - **Property 9: Manager Assignment Validity**
    - **Validates: Requirements 2.1, 2.5, 2.6**
  
  - [ ] 5.3 Create Department Controller
    - REST endpoints: POST, GET, PUT, DELETE /departments
    - GET /departments/organization-chart
    - _Requirements: 2.1, 2.4_

- [ ] 6. Attendance Module (Backend)
  - [ ] 6.1 Implement Attendance Service
    - checkIn và checkOut methods
    - Work hours calculation
    - Late/early leave detection
    - Monthly report generation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.9_
  
  - [ ]* 6.2 Write property tests for attendance
    - **Property 10: Check-In Recording**
    - **Property 11: Check-Out Recording**
    - **Property 12: Work Hours Calculation**
    - **Property 13: Late Arrival Detection**
    - **Property 14: Early Leave Detection**
    - **Property 17: Monthly Attendance Report Accuracy**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.9**
  
  - [ ] 6.3 Implement Leave Request Service
    - requestLeave, approveLeave, rejectLeave methods
    - Notification service integration
    - _Requirements: 3.6, 3.7, 3.8_
  
  - [ ]* 6.4 Write property tests for leave requests
    - **Property 15: Leave Request Notification**
    - **Property 16: Leave Approval State Transition**
    - **Validates: Requirements 3.7, 3.8**
  
  - [ ] 6.5 Create Attendance Controller
    - POST /attendance/check-in
    - POST /attendance/check-out
    - POST /leave-requests
    - PUT /leave-requests/:id/approve
    - GET /attendance/report/:employeeId/:month/:year
    - _Requirements: 3.1, 3.2, 3.6, 3.7, 3.8, 3.9_

- [ ] 7. Payroll Module (Backend)
  - [ ] 7.1 Implement Payroll Calculation Service
    - calculateSalary method với đầy đủ logic
    - Tính allowances, rewards, disciplines
    - Tính overtime pay với hệ số
    - Tính bảo hiểm và thuế TNCN
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [ ]* 7.2 Write property tests for salary calculation
    - **Property 18: Salary Calculation Correctness**
    - **Property 19: Insurance and Tax Deduction**
    - **Property 20: Overtime Pay Calculation**
    - **Validates: Requirements 4.2, 4.3, 4.4**
  
  - [ ] 7.3 Implement Payroll Service
    - createPayroll method (batch processing)
    - updatePayrollItem method
    - finalizePayroll method (immutability)
    - getPayslip method
    - exportPayroll method (Excel/PDF)
    - _Requirements: 4.5, 4.6, 4.7, 4.8_
  
  - [ ]* 7.4 Write property tests for payroll operations
    - **Property 21: Payroll Batch Completeness**
    - **Property 22: Payroll Immutability After Finalization**
    - **Property 23: Payslip Data Completeness**
    - **Validates: Requirements 4.5, 4.7, 4.8**
  
  - [ ] 7.5 Create Payroll Controller
    - POST /payroll (create monthly payroll)
    - GET /payroll/:id
    - PUT /payroll/:id/items/:itemId
    - POST /payroll/:id/finalize
    - GET /payroll/:id/export
    - _Requirements: 4.5, 4.6, 4.7, 4.8_

- [ ] 8. Contract, Reward, Discipline Modules (Backend)
  - [ ] 8.1 Implement Contract Service
    - CRUD operations
    - getExpiringContracts method
    - Contract expiry notification scheduler
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 8.2 Write property tests for contracts
    - **Property 24: Contract Expiry Notification**
    - **Property 25: Contract History Preservation**
    - **Validates: Requirements 5.3, 5.5**
  
  - [ ] 8.3 Implement Reward và Discipline Services
    - CRUD operations
    - Notification integration
    - Payroll integration
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 8.4 Write property tests for rewards and disciplines
    - **Property 26: Reward and Discipline Notification**
    - **Property 27: Reward and Discipline Persistence**
    - **Property 28: Payroll Integration of Rewards and Disciplines**
    - **Validates: Requirements 6.3, 6.4, 6.5**
  
  - [ ] 8.5 Create Controllers cho Contract, Reward, Discipline
    - REST endpoints cho tất cả operations
    - _Requirements: 5.1, 5.4, 6.1, 6.2_

- [ ] 9. Report Module (Backend)
  - [ ] 9.1 Implement Report Service
    - getEmployeeOverview method
    - getAttendanceReport method
    - getPayrollReport method
    - getDepartmentReport method
    - exportReport method (Excel/PDF với ExcelJS và PDFKit)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_
  
  - [ ]* 9.2 Write property tests for reports
    - **Property 39: Employee Overview Report Accuracy**
    - **Property 40: Report Export Data Integrity**
    - **Property 41: Report Filtering Accuracy**
    - **Validates: Requirements 9.1, 9.6, 9.7**
  
  - [ ] 9.3 Implement caching với Redis
    - Cache report data
    - Cache invalidation strategy
    - _Requirements: 9.8_
  
  - [ ] 9.4 Create Report Controller
    - GET /reports/employee-overview
    - GET /reports/attendance
    - GET /reports/payroll
    - GET /reports/export
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 9.7_

- [ ] 10. AI Chatbot Module (Backend)
  - [ ] 10.1 Implement Chatbot Strategy Pattern
    - PolicyQuestionStrategy (trả lời về chính sách)
    - DataQueryStrategy (truy vấn dữ liệu cá nhân)
    - CommandExecutionStrategy (thực thi lệnh)
    - GeneralQuestionStrategy (fallback)
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.8_
  
  - [ ] 10.2 Implement Chatbot Service
    - sendMessage method với strategy selection
    - OpenAI API integration
    - Context management
    - Authorization check cho data queries
    - _Requirements: 10.2, 10.4, 10.5, 10.7_
  
  - [ ]* 10.3 Write property tests for chatbot
    - **Property 42: Chatbot Response Completeness**
    - **Property 43: Chatbot Fallback Handling**
    - **Property 44: Chatbot Data Query Authorization**
    - **Property 46: Chatbot Command Execution**
    - **Validates: Requirements 10.2, 10.4, 10.5, 10.7, 10.8**
  
  - [ ] 10.4 Implement conversation history
    - Save messages to database
    - getChatHistory method
    - _Requirements: 10.6_
  
  - [ ]* 10.5 Write property test for conversation history
    - **Property 45: Chatbot Conversation History**
    - **Validates: Requirements 10.6**
  
  - [ ] 10.6 Create Chatbot Controller
    - POST /chatbot/message
    - GET /chatbot/history
    - POST /chatbot/command
    - _Requirements: 10.2, 10.6, 10.8_

- [ ] 11. Notification và Email Service (Backend)
  - [ ] 11.1 Implement Notification Service
    - Email notification với Resend/SendGrid
    - In-app notification
    - Webhook integration
    - _Requirements: 3.7, 5.3, 6.3, 8.7, 13.3, 13.4_
  
  - [ ]* 11.2 Write property tests for notifications
    - **Property 51: Webhook Event Triggering**
    - **Property 52: Email Notification Delivery**
    - **Validates: Requirements 13.3, 13.4**

- [ ] 12. Error Handling và Logging (Backend)
  - [ ] 12.1 Implement Global Exception Filter
    - AllExceptionsFilter
    - Custom business exceptions
    - Error response formatting
    - _Requirements: 12.7_
  
  - [ ]* 12.2 Write property tests for error handling
    - **Property 49: Error Handling Gracefully**
    - **Property 50: Error Logging Completeness**
    - **Validates: Requirements 12.7, 12.8**
  
  - [ ] 12.3 Implement Logging Service
    - Winston logger configuration
    - Log rotation
    - Error tracking với Sentry
    - _Requirements: 7.7, 12.8_
  
  - [ ]* 12.4 Write property test for audit logging
    - **Property 33: Audit Logging for Sensitive Actions**
    - **Validates: Requirements 7.7**

- [ ] 13. API Documentation (Backend)
  - [ ] 13.1 Setup Swagger/OpenAPI
    - Configure @nestjs/swagger
    - Add API decorators to all controllers
    - Generate API documentation
    - _Requirements: 13.2_

- [ ] 14. Checkpoint - Backend Complete
  - Ensure all backend tests pass
  - Test all API endpoints với Postman/Insomnia
  - Verify database migrations
  - Ask user if questions arise

- [ ] 15. Frontend Setup và Authentication
  - [ ] 15.1 Setup Next.js 14 App Router structure
    - Configure app directory
    - Setup layouts (auth, dashboard)
    - Configure TailwindCSS và Shadcn/ui
    - _Requirements: 11.1, 11.2_
  
  - [ ] 15.2 Implement Auth Context và API client
    - AuthContext với login/logout
    - API client với axios/fetch
    - Token management (localStorage)
    - _Requirements: 8.1, 8.3, 8.4_
  
  - [ ] 15.3 Create Login và Register pages
    - Login form với validation
    - Register form
    - Password reset flow
    - _Requirements: 8.1, 8.6, 8.7_
  
  - [ ]* 15.4 Write component tests for auth pages
    - Test login form validation
    - Test successful login flow
    - Test error handling

- [ ] 16. Dashboard và Layout Components (Frontend)
  - [ ] 16.1 Create Dashboard Layout
    - Sidebar với navigation menu
    - Header với user profile và notifications
    - Responsive design
    - _Requirements: 11.1, 11.3, 11.4_
  
  - [ ] 16.2 Implement Theme Context
    - Dark mode / Light mode toggle
    - Theme persistence
    - _Requirements: 11.6_
  
  - [ ]* 16.3 Write property test for theme persistence
    - **Property 47: Theme Preference Persistence**
    - **Validates: Requirements 11.6**
  
  - [ ] 16.4 Create Dashboard Overview page
    - Statistics cards
    - Charts với Recharts
    - Recent activities
    - _Requirements: 11.5_

- [ ] 17. Employee Management Pages (Frontend)
  - [ ] 17.1 Create Employee List page
    - EmployeeList component với pagination
    - Search và filters
    - Sorting
    - _Requirements: 1.5_
  
  - [ ] 17.2 Create Employee Form (Create/Edit)
    - Form validation với Zod
    - File upload cho avatar
    - Department selection
    - _Requirements: 1.3, 1.6_
  
  - [ ] 17.3 Create Employee Detail page
    - Employee information display
    - Tabs: Overview, Contracts, Attendance, Payroll
    - Edit và Delete actions
    - _Requirements: 1.4, 1.7_
  
  - [ ]* 17.4 Write component tests for employee pages
    - Test employee list rendering
    - Test form validation
    - Test CRUD operations

- [ ] 18. Department Management Pages (Frontend)
  - [ ] 18.1 Create Department List page
    - Department cards
    - Organization chart visualization
    - _Requirements: 2.1, 2.4_
  
  - [ ] 18.2 Create Department Form
    - Create/Edit department
    - Manager assignment
    - _Requirements: 2.1, 2.6_
  
  - [ ]* 18.3 Write component tests for department pages

- [ ] 19. Attendance Pages (Frontend)
  - [ ] 19.1 Create Attendance Dashboard
    - Check-in/Check-out buttons
    - Today's attendance status
    - Attendance calendar
    - _Requirements: 3.1, 3.2_
  
  - [ ] 19.2 Create Leave Request Form
    - Leave type selection
    - Date range picker
    - Reason input
    - _Requirements: 3.6_
  
  - [ ] 19.3 Create Attendance Report page
    - Monthly attendance table
    - Statistics
    - Export functionality
    - _Requirements: 3.9_
  
  - [ ]* 19.4 Write component tests for attendance pages

- [ ] 20. Payroll Pages (Frontend)
  - [ ] 20.1 Create Payroll List page
    - Monthly payroll list
    - Status indicators
    - Create payroll button
    - _Requirements: 4.5_
  
  - [ ] 20.2 Create Payroll Detail page
    - Payroll items table
    - Edit payroll items
    - Finalize payroll button
    - Export payroll
    - _Requirements: 4.6, 4.7, 4.8_
  
  - [ ] 20.3 Create Payslip Viewer
    - Display payslip details
    - Print/Download payslip
    - _Requirements: 4.8_
  
  - [ ]* 20.4 Write component tests for payroll pages

- [ ] 21. Contract, Reward, Discipline Pages (Frontend)
  - [ ] 21.1 Create Contract Management pages
    - Contract list
    - Contract form
    - Contract expiry alerts
    - _Requirements: 5.1, 5.3, 5.4_
  
  - [ ] 21.2 Create Reward và Discipline pages
    - List views
    - Create forms
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 21.3 Write component tests

- [ ] 22. Report Pages (Frontend)
  - [ ] 22.1 Create Report Dashboard
    - Report type selection
    - Filter controls
    - _Requirements: 9.7_
  
  - [ ] 22.2 Implement Chart Components
    - Employee overview charts (pie, bar)
    - Attendance charts
    - Payroll charts
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [ ] 22.3 Implement Report Export
    - Export to Excel
    - Export to PDF
    - _Requirements: 9.6_
  
  - [ ]* 22.4 Write component tests for reports

- [ ] 23. AI Chatbot Widget (Frontend)
  - [ ] 23.1 Create ChatWidget component
    - Floating chat button
    - Chat window với minimize/maximize
    - Message list
    - Input field
    - _Requirements: 10.1_
  
  - [ ] 23.2 Implement Chatbot Context
    - WebSocket/polling cho real-time
    - Message state management
    - _Requirements: 10.2_
  
  - [ ] 23.3 Implement Suggested Actions
    - Display suggested questions
    - Quick command buttons
    - _Requirements: 10.4, 10.8_
  
  - [ ] 23.4 Integrate Chatbot với backend API
    - Send message API
    - Get history API
    - Execute command API
    - _Requirements: 10.2, 10.6, 10.8_
  
  - [ ]* 23.5 Write component tests for chatbot widget

- [ ] 24. Internationalization (Frontend)
  - [ ] 24.1 Setup i18n với next-intl
    - Configure locales (vi, en)
    - Create translation files
    - _Requirements: 11.8_
  
  - [ ]* 24.2 Write property test for i18n
    - **Property: All UI text must have translations**
    - **Validates: Requirements 11.8**

- [ ] 25. Checkpoint - Frontend Complete
  - Ensure all frontend tests pass
  - Test responsive design on mobile/tablet
  - Test all user flows
  - Ask user if questions arise

- [ ] 26. Integration Testing
  - [ ]* 26.1 Write integration tests cho critical flows
    - Employee creation flow (API + DB)
    - Attendance check-in/out flow
    - Payroll calculation flow
    - Leave request approval flow
    - Chatbot query flow
  
  - [ ]* 26.2 Write E2E tests với Playwright
    - Login flow
    - Employee management flow
    - Attendance flow
    - Payroll flow
    - Report generation flow

- [ ] 27. Security Hardening
  - [ ] 27.1 Implement data encryption
    - Encrypt sensitive fields (salary, idCard)
    - _Requirements: 12.4_
  
  - [ ]* 27.2 Write property test for encryption
    - **Property 48: Sensitive Data Encryption**
    - **Validates: Requirements 12.4**
  
  - [ ] 27.3 Security audit
    - CORS configuration
    - Rate limiting
    - Input sanitization
    - SQL injection prevention
    - _Requirements: 12.5_

- [ ] 28. Performance Optimization
  - [ ] 28.1 Implement caching strategy
    - Redis caching cho reports
    - API response caching
    - _Requirements: 12.1, 12.2_
  
  - [ ] 28.2 Database optimization
    - Add indexes
    - Query optimization
    - Connection pooling
    - _Requirements: 12.3_
  
  - [ ] 28.3 Frontend optimization
    - Code splitting
    - Image optimization
    - Lazy loading
    - _Requirements: 12.1_

- [ ] 29. Deployment Setup
  - [ ] 29.1 Setup CI/CD pipeline
    - GitHub Actions workflow
    - Automated testing
    - Automated deployment
  
  - [ ] 29.2 Deploy Backend
    - Deploy to Railway/Render
    - Configure environment variables
    - Setup database backups
    - _Requirements: 12.6_
  
  - [ ] 29.3 Deploy Frontend
    - Deploy to Vercel
    - Configure custom domain
    - Setup CDN
  
  - [ ] 29.4 Setup monitoring
    - Sentry for error tracking
    - Uptime monitoring
    - Performance monitoring

- [ ] 30. Final Testing và Documentation
  - [ ]* 30.1 Run full test suite
    - All unit tests
    - All property tests
    - All integration tests
    - All E2E tests
  
  - [ ] 30.2 Create user documentation
    - User manual
    - Admin guide
    - API documentation
  
  - [ ] 30.3 Create developer documentation
    - Setup guide
    - Architecture documentation
    - Deployment guide

- [ ] 31. Final Checkpoint
  - Verify all requirements are met
  - Verify all tests pass
  - Verify deployment is successful
  - Demo to stakeholders
  - Gather feedback

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties (52 properties total)
- Unit tests validate specific examples and edge cases
- Integration tests validate API + Database interactions
- E2E tests validate complete user flows
- Checkpoints ensure incremental validation and user feedback
