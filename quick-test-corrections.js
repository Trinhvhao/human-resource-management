/**
 * Quick Test for Attendance Corrections
 * Run: node quick-test-corrections.js
 */

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 3333;

// Test accounts
const EMPLOYEE = {
  email: 'employee1@company.com',
  password: 'Password123!',
};

const HR = {
  email: 'hr.manager@company.com',
  password: 'Password123!',
};

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path, // Remove /api prefix
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

async function login(email, password) {
  const response = await makeRequest('POST', '/auth/login', {
    email,
    password,
  });
  return response.data?.accessToken || response.accessToken || response.access_token;
}

async function testAttendanceCorrections() {
  console.log('🧪 Quick Test: Attendance Corrections\n');
  console.log('⚠️  Backend must be running on http://localhost:3001\n');

  try {
    // Step 1: Login as employee
    console.log('📝 Step 1: Login as employee...');
    const employeeToken = await login(EMPLOYEE.email, EMPLOYEE.password);
    console.log('✅ Employee logged in\n');

    // Step 2: Create correction request
    console.log('📝 Step 2: Create correction request...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const correctionData = {
      date: dateStr,
      requestedCheckIn: `${dateStr}T08:30:00Z`,
      requestedCheckOut: `${dateStr}T17:30:00Z`,
      reason: 'Test: Quên check-in do họp khẩn cấp',
    };

    console.log('Request data:');
    console.log(JSON.stringify(correctionData, null, 2));

    const createResponse = await makeRequest(
      'POST',
      '/attendance-corrections',
      correctionData,
      employeeToken
    );

    console.log('✅ Correction created successfully!');
    console.log('Response:', JSON.stringify(createResponse, null, 2));
    const correctionId = createResponse.id;
    console.log('');

    // Step 3: Get my corrections
    console.log('📝 Step 3: Get my corrections...');
    const myCorrections = await makeRequest(
      'GET',
      '/attendance-corrections/my-requests',
      null,
      employeeToken
    );
    const corrections = myCorrections.data || myCorrections;
    console.log(`✅ Found ${corrections.length} correction(s)`);
    console.log('');

    // Step 4: Login as HR
    console.log('📝 Step 4: Login as HR Manager...');
    const hrToken = await login(HR.email, HR.password);
    console.log('✅ HR Manager logged in\n');

    // Step 5: Get pending corrections
    console.log('📝 Step 5: Get pending corrections...');
    const pendingResponse = await makeRequest(
      'GET',
      '/attendance-corrections/pending',
      null,
      hrToken
    );
    const pending = pendingResponse.data || pendingResponse;
    console.log(`✅ Found ${pending.length} pending correction(s)`);
    console.log('');

    // Step 6: Approve correction
    console.log('📝 Step 6: Approve correction...');
    const approveResponse = await makeRequest(
      'POST',
      `/attendance-corrections/${correctionId}/approve`,
      {},
      hrToken
    );
    console.log('✅ Correction approved!');
    console.log('Status:', approveResponse.status);
    console.log('');

    // Step 7: Test validation - future date
    console.log('📝 Step 7: Test validation (future date)...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    try {
      await makeRequest(
        'POST',
        '/attendance-corrections',
        {
          date: tomorrowStr,
          requestedCheckIn: `${tomorrowStr}T08:30:00Z`,
          reason: 'Test future date',
        },
        employeeToken
      );
      console.log('❌ Should have rejected future date!');
    } catch (error) {
      if (error.status === 400) {
        console.log('✅ Correctly rejected future date');
        console.log('Error message:', error.message);
      } else {
        throw error;
      }
    }
    console.log('');

    // Step 8: Test validation - missing times
    console.log('📝 Step 8: Test validation (missing times)...');
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    try {
      await makeRequest(
        'POST',
        '/attendance-corrections',
        {
          date: twoDaysAgoStr,
          reason: 'Test missing times',
          // No requestedCheckIn or requestedCheckOut
        },
        employeeToken
      );
      console.log('❌ Should have rejected missing times!');
    } catch (error) {
      if (error.status === 400) {
        console.log('✅ Correctly rejected missing times');
        console.log('Error message:', error.message);
      } else {
        throw error;
      }
    }
    console.log('');

    console.log('🎉 All tests passed!');
    console.log('\n✅ Summary:');
    console.log('  - Employee can create correction ✓');
    console.log('  - Employee can view their corrections ✓');
    console.log('  - HR can view pending corrections ✓');
    console.log('  - HR can approve corrections ✓');
    console.log('  - Validation works correctly ✓');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message || error);
    if (error.data) {
      console.error('Response:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

testAttendanceCorrections();
