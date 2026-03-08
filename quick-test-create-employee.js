/**
 * Quick Test: Create Employee (HR Role)
 * Test tạo nhân viên mới với role HR_MANAGER
 * Run: node quick-test-create-employee.js
 */

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 3333;

// Test credentials
const HR_CREDENTIALS = {
  email: 'hr.manager@company.com',
  password: 'Password123!',
};

let hrToken = null;
let testDepartmentId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`TEST: ${testName}`, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Helper: Make HTTP request
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject({
              status: res.statusCode,
              data: parsed,
              message: parsed.message || 'Request failed',
            });
          }
        } catch (e) {
          reject({ status: res.statusCode, data: body, message: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Helper: Login
async function login(email, password) {
  const response = await makeRequest('POST', '/auth/login', {
    email,
    password,
  });
  return response.data?.accessToken || response.accessToken || response.access_token;
}

// Helper: Get first department
async function getFirstDepartment(token) {
  const response = await makeRequest('GET', '/departments?page=1&limit=1', null, token);
  const departments = Array.isArray(response) ? response : (response.data || []);
  if (departments.length === 0) {
    throw new Error('No departments found');
  }
  return departments[0].id;
}

// Helper: Generate unique email
function generateUniqueEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test.employee.${timestamp}.${random}@company.com`;
}

// Helper: Generate unique ID card
function generateUniqueIdCard() {
  const timestamp = Date.now().toString().slice(-9);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${timestamp}${random}`;
}

// Test 1: Login as HR
async function testHRLogin() {
  logTest('HR Login');
  try {
    hrToken = await login(HR_CREDENTIALS.email, HR_CREDENTIALS.password);
    logSuccess(`HR logged in successfully`);
    logInfo(`Token: ${hrToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    logError(`HR login failed: ${error.message}`);
    return false;
  }
}

// Test 2: Get department for employee
async function testGetDepartment() {
  logTest('Get Department');
  try {
    testDepartmentId = await getFirstDepartment(hrToken);
    logSuccess(`Got department ID: ${testDepartmentId}`);
    return true;
  } catch (error) {
    logError(`Get department failed: ${error.message}`);
    return false;
  }
}

// Test 3: Generate employee code
async function testGenerateEmployeeCode() {
  logTest('Generate Employee Code');
  try {
    const response = await makeRequest('GET', '/employees/generate-code', null, hrToken);
    const employeeCode = response.data?.employeeCode || response.employeeCode;
    logSuccess(`Generated employee code: ${employeeCode}`);
    return employeeCode;
  } catch (error) {
    logError(`Generate code failed: ${error.message}`);
    return null;
  }
}

// Test 4: Create employee with all required fields
async function testCreateEmployeeComplete() {
  logTest('Create Employee - Complete Data');
  
  // Use current date for startDate
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  
  const employeeData = {
    fullName: 'Nguyễn Văn Test',
    dateOfBirth: '1995-05-15',
    gender: 'MALE',
    idCard: generateUniqueIdCard(),
    address: '123 Đường Test, Quận Test, Hà Nội',
    phone: '0912345678',
    email: generateUniqueEmail(),
    departmentId: testDepartmentId,
    position: 'Software Engineer',
    startDate: startDate,
    baseSalary: 15000000,
  };

  logInfo('Employee data:');
  console.log(JSON.stringify(employeeData, null, 2));

  try {
    const response = await makeRequest('POST', '/employees', employeeData, hrToken);
    const employee = response.data || response;
    
    logSuccess(`Employee created successfully!`);
    logInfo(`Employee ID: ${employee.id}`);
    logInfo(`Employee Code: ${employee.employeeCode}`);
    logInfo(`Full Name: ${employee.fullName}`);
    logInfo(`Email: ${employee.email}`);
    logInfo(`Position: ${employee.position}`);
    logInfo(`Base Salary: ${employee.baseSalary?.toLocaleString('vi-VN')} VND`);
    
    return { success: true, employee };
  } catch (error) {
    logError(`Create employee failed!`);
    logError(`Error: ${JSON.stringify(error.data || error.message, null, 2)}`);
    return { success: false, error: error.data || error.message };
  }
}

// Test 5: Create employee with minimal fields
async function testCreateEmployeeMinimal() {
  logTest('Create Employee - Minimal Data');
  
  // Use current date for startDate
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  
  const employeeData = {
    fullName: 'Trần Thị Test',
    dateOfBirth: '1998-08-20',
    idCard: generateUniqueIdCard(),
    email: generateUniqueEmail(),
    departmentId: testDepartmentId,
    position: 'Tester',
    startDate: startDate,
    baseSalary: 12000000,
  };

  logInfo('Employee data (minimal):');
  console.log(JSON.stringify(employeeData, null, 2));

  try {
    const response = await makeRequest('POST', '/employees', employeeData, hrToken);
    const employee = response.data || response;
    
    logSuccess(`Employee created successfully with minimal data!`);
    logInfo(`Employee ID: ${employee.id}`);
    logInfo(`Employee Code: ${employee.employeeCode}`);
    logInfo(`Full Name: ${employee.fullName}`);
    
    return { success: true, employee };
  } catch (error) {
    logError(`Create employee failed!`);
    logError(`Error: ${JSON.stringify(error.data || error.message, null, 2)}`);
    return { success: false, error: error.data || error.message };
  }
}

// Test 6: Create employee with invalid data (should fail)
async function testCreateEmployeeInvalid() {
  logTest('Create Employee - Invalid Data (Should Fail)');
  
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  
  const employeeData = {
    fullName: 'Test Invalid',
    dateOfBirth: 'invalid-date',
    idCard: generateUniqueIdCard(),
    email: 'invalid-email',
    departmentId: 'invalid-uuid',
    position: 'Test',
    startDate: startDate,
    baseSalary: -1000,
  };

  logInfo('Employee data (invalid):');
  console.log(JSON.stringify(employeeData, null, 2));

  try {
    await makeRequest('POST', '/employees', employeeData, hrToken);
    logError(`Should have failed but succeeded!`);
    return { success: false, error: 'Validation should have failed' };
  } catch (error) {
    logSuccess(`Correctly rejected invalid data`);
    logInfo(`Validation errors: ${JSON.stringify(error.data, null, 2)}`);
    return { success: true };
  }
}

// Test 7: Create employee with duplicate email (should fail)
async function testCreateEmployeeDuplicateEmail() {
  logTest('Create Employee - Duplicate Email (Should Fail)');
  
  const duplicateEmail = 'hr.manager@company.com'; // Existing email
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  
  const employeeData = {
    fullName: 'Test Duplicate',
    dateOfBirth: '1995-05-15',
    idCard: generateUniqueIdCard(),
    email: duplicateEmail,
    departmentId: testDepartmentId,
    position: 'Test',
    startDate: startDate,
    baseSalary: 10000000,
  };

  logInfo(`Trying to create with duplicate email: ${duplicateEmail}`);

  try {
    await makeRequest('POST', '/employees', employeeData, hrToken);
    logError(`Should have failed but succeeded!`);
    return { success: false, error: 'Duplicate email should have been rejected' };
  } catch (error) {
    logSuccess(`Correctly rejected duplicate email`);
    logInfo(`Error: ${JSON.stringify(error.data, null, 2)}`);
    return { success: true };
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     QUICK TEST: CREATE EMPLOYEE (HR ROLE)                 ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // Run tests
  const tests = [
    { name: 'HR Login', fn: testHRLogin },
    { name: 'Get Department', fn: testGetDepartment },
    { name: 'Generate Employee Code', fn: testGenerateEmployeeCode },
    { name: 'Create Employee (Complete)', fn: testCreateEmployeeComplete },
    { name: 'Create Employee (Minimal)', fn: testCreateEmployeeMinimal },
    { name: 'Create Employee (Invalid)', fn: testCreateEmployeeInvalid },
    { name: 'Create Employee (Duplicate)', fn: testCreateEmployeeDuplicateEmail },
  ];

  for (const test of tests) {
    results.total++;
    try {
      const result = await test.fn();
      if (result === true || result?.success === true) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
      logError(`Test "${test.name}" threw error: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log('TEST SUMMARY', 'cyan');
  console.log('='.repeat(60));
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
    results.failed === 0 ? 'green' : 'yellow');
  console.log('='.repeat(60) + '\n');

  if (results.failed === 0) {
    log('✓ ALL TESTS PASSED! Backend is working correctly.', 'green');
    log('→ If frontend has issues, the problem is in the frontend code.', 'yellow');
  } else {
    log('✗ SOME TESTS FAILED! Check backend implementation.', 'red');
  }
}

// Run
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
