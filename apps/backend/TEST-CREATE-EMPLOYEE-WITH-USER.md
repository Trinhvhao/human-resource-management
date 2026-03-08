# Test: Create Employee with User Account

## Problem
When creating an employee with HR role, no User account is created automatically. This means:
- Employee record is created ✅
- User account for login is NOT created ❌
- HR employee cannot login to the system

## Current Flow
1. POST `/employees` - Creates Employee only
2. Employee has no linked User account
3. Cannot login

## Expected Flow
1. POST `/employees` with optional `createUserAccount` and `userRole` fields
2. If `createUserAccount = true`:
   - Create Employee
   - Create User account with specified role
   - Link User to Employee
   - Send email verification

## Solution Options

### Option 1: Separate endpoint (Current approach - RECOMMENDED)
Keep employee creation separate from user creation:
- POST `/employees` - Create employee only
- POST `/auth/register` - Create user account (links to existing employee)

**Pros:**
- Clear separation of concerns
- Employee can exist without user account (contractors, etc.)
- More flexible

**Cons:**
- Two-step process

### Option 2: Add optional user creation to employee endpoint
Modify CreateEmployeeDto to include optional user fields:

```typescript
export class CreateEmployeeDto {
  // ... existing fields ...
  
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  createUserAccount?: boolean;
  
  @ApiProperty({ required: false, enum: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'])
  userRole?: string;
  
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
```

**Pros:**
- One-step process
- Convenient for HR staff

**Cons:**
- Mixing concerns
- More complex validation
- Password in employee creation endpoint

### Option 3: Auto-create user for certain positions
Automatically create user account if position matches certain criteria:

```typescript
const managerialPositions = ['HR Manager', 'Department Manager', 'Team Lead'];
if (managerialPositions.includes(dto.position)) {
  // Auto-create user account with MANAGER role
}
```

**Pros:**
- Automatic
- No extra fields needed

**Cons:**
- Less flexible
- Hard to maintain position list
- What if position name changes?

## Recommended Solution: Option 1 (Current)

The current approach is actually correct! The issue is the frontend workflow:

### Current Workflow (Correct)
1. Admin creates Employee via `/employees` endpoint
2. Admin creates User account via `/auth/register` endpoint
   - Provide email (must match employee email)
   - Provide password
   - Provide role
   - System links User to Employee automatically

### Frontend Fix Needed
The employee creation form should:
1. Create employee first
2. Show option: "Create user account for this employee?"
3. If yes, show password and role fields
4. Call `/auth/register` with employee email

## Test Cases

### Test 1: Create Employee Only
```typescript
POST /employees
{
  "fullName": "Nguyen Van HR",
  "email": "hr@company.com",
  "dateOfBirth": "1990-01-01",
  "idCard": "001234567890",
  "departmentId": "uuid",
  "position": "HR Manager",
  "startDate": "2024-01-01",
  "baseSalary": 20000000
}

Expected: Employee created, no user account
```

### Test 2: Create User Account for Existing Employee
```typescript
POST /auth/register
{
  "email": "hr@company.com",  // Must match employee email
  "password": "SecurePass123!",
  "role": "HR_MANAGER"
}

Expected: 
- User account created
- Linked to employee with matching email
- Can login with email/password
```

### Test 3: Create Employee + User (Two-step)
```typescript
// Step 1
POST /employees { ... }
Response: { data: { id: "emp-uuid", email: "hr@company.com" } }

// Step 2
POST /auth/register {
  "email": "hr@company.com",
  "password": "SecurePass123!",
  "role": "HR_MANAGER"
}

Expected: Complete setup, can login
```

## Frontend Implementation

### Current Issue
`apps/frontend/app/dashboard/employees/new/page.tsx` only calls:
```typescript
await employeeService.create(data);
```

### Fix Needed
Add checkbox and conditional user creation:

```typescript
const [createUserAccount, setCreateUserAccount] = useState(false);
const [userRole, setUserRole] = useState('EMPLOYEE');
const [password, setPassword] = useState('');

const onSubmit = async (data) => {
  // Step 1: Create employee
  const employee = await employeeService.create(data);
  
  // Step 2: Optionally create user account
  if (createUserAccount && password) {
    await authService.register({
      email: data.email,
      password: password,
      role: userRole
    });
  }
  
  // Success
  router.push('/dashboard/employees');
};
```

## Conclusion

**The backend is working correctly!** The issue is in the frontend workflow. 

**Action Items:**
1. ✅ Document the two-step process
2. ⏳ Update frontend employee creation form to include optional user account creation
3. ⏳ Add UI for password and role selection
4. ⏳ Call `/auth/register` after employee creation if checkbox is checked

**No backend changes needed!**
