/**
 * Test Employee Creation API
 * Run: node test-employee-api.js <JWT_TOKEN>
 */

const http = require('http');

const token = process.argv[2];
if (!token) {
  console.error('❌ Usage: node test-employee-api.js <JWT_TOKEN>');
  console.error('');
  console.error('To get token:');
  console.error('1. Login to frontend');
  console.error('2. Open DevTools (F12) → Application → Local Storage');
  console.error('3. Copy value of "token" key');
  process.exit(1);
}

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3333,
      path: `/api${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing Employee Creation API');
  console.log('================================\n');

  try {
    // Step 1: Get departments
    console.log('📋 Step 1: Getting departments...');
    const deptRes = await request('GET', '/departments');
    
    if (deptRes.status !== 200) {
      console.error('❌ Failed to get departments:', deptRes.data);
      return;
    }

    const departments = deptRes.data.data;
    if (!departments || departments.length === 0) {
      console.error('❌ No departments found!');
      return;
    }

    const dept = departments[0];
    console.log(`✅ Found department: ${dept.name} (${dept.id})\n`);

    // Step 2: Create employee
    console.log('📋 Step 2: Creating employee...');
    const timestamp = Date.now();
    const employeeData = {
      fullName: 'Nguyễn Văn Test API',
      email: `test.api.${timestamp}@company.com`,
      phone: '0901234567',
      dateOfBirth: '1995-05-15',
      gender: 'MALE',
      idCard: timestamp.toString().slice(-12),
      address: '123 Test Street, Hanoi',
      departmentId: dept.id,
      position: 'Software Engineer',
      startDate: '2024-01-01',
      baseSalary: 15000000,
    };

    console.log('Request payload:');
    console.log(JSON.stringify(employeeData, null, 2));
    console.log('');

    const createRes = await request('POST', '/employees', employeeData);

    if (createRes.status === 201 || createRes.status === 200) {
      console.log('✅ SUCCESS! Employee created:');
      console.log(JSON.stringify(createRes.data, null, 2));
      console.log('\n🎉 Backend API is working correctly!');
      console.log('\n📝 Summary:');
      console.log(`   - Employee Code: ${createRes.data.data.employeeCode}`);
      console.log(`   - Full Name: ${createRes.data.data.fullName}`);
      console.log(`   - Email: ${createRes.data.data.email}`);
      console.log(`   - Department: ${createRes.data.data.department.name}`);
      console.log(`   - Base Salary: ${createRes.data.data.baseSalary.toLocaleString()} VNĐ`);
    } else {
      console.error('❌ Failed to create employee');
      console.error('Status:', createRes.status);
      console.error('Response:', JSON.stringify(createRes.data, null, 2));
      
      if (createRes.status === 401) {
        console.error('\n⚠️  Token invalid or expired. Please get a new token.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
