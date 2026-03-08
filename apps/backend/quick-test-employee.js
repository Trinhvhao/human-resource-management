/**
 * Quick test script for employee creation
 * Run: node quick-test-employee.js
 * 
 * BEFORE RUNNING:
 * 1. Replace YOUR_JWT_TOKEN with actual token
 * 2. Make sure backend is running on port 3001
 */

const https = require('http');

// ⚠️ REPLACE THIS WITH YOUR ACTUAL TOKEN
const AUTH_TOKEN = 'YOUR_JWT_TOKEN';
const API_HOST = 'localhost';
const API_PORT = 3001;

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `/api${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject({ status: res.statusCode, data: parsed });
          }
        } catch (e) {
          reject({ status: res.statusCode, data: body });
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

async function testEmployeeCreation() {
  console.log('🧪 Testing Employee Creation API\n');
  console.log('⚠️  Make sure you replaced YOUR_JWT_TOKEN with actual token!\n');

  try {
    // Step 1: Get departments
    console.log('📋 Step 1: Getting departments...');
    const deptResponse = await makeRequest('GET', '/departments');
    const departments = deptResponse.data;
    
    if (!departments || departments.length === 0) {
      console.error('❌ No departments found!');
      return;
    }
    
    const dept = departments[0];
    console.log(`✅ Found department: ${dept.name} (${dept.id})\n`);

    // Step 2: Create employee with valid data
    console.log('📋 Step 2: Creating employee...');
    const timestamp = Date.now();
    const employeeData = {
      fullName: 'Test Employee Backend',
      email: `test.${timestamp}@company.com`,
      phone: '0901234567',
      dateOfBirth: '1995-05-15',
      gender: 'MALE',
      idCard: timestamp.toString().slice(-12),
      address: '123 Test Street',
      departmentId: dept.id,
      position: 'Software Engineer',
      startDate: '2024-01-01',
      baseSalary: 15000000,
    };

    console.log('Request data:');
    console.log(JSON.stringify(employeeData, null, 2));
    console.log('');

    const createResponse = await makeRequest('POST', '/employees', employeeData);
    
    console.log('✅ SUCCESS! Employee created:');
    console.log(JSON.stringify(createResponse, null, 2));
    console.log('\n🎉 Backend API is working correctly!');

  } catch (error) {
    console.error('❌ ERROR:', error.message || error);
    if (error.status) {
      console.error('Status:', error.status);
      console.error('Response:', JSON.stringify(error.data, null, 2));
    }
    
    if (error.status === 401) {
      console.error('\n⚠️  Authentication failed! Please update YOUR_JWT_TOKEN in the script.');
    }
  }
}

// Run test
testEmployeeCreation();
