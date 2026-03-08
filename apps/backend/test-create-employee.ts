/**
 * Test script to verify employee creation API
 * Run: npx ts-node test-create-employee.ts
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Replace with your actual token
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
    },
});

async function testCreateEmployee() {
    console.log('🧪 Testing Employee Creation API\n');

    try {
        // Step 1: Get departments
        console.log('📋 Step 1: Fetching departments...');
        const deptResponse = await axiosInstance.get('/departments');
        const departments = deptResponse.data.data;

        if (!departments || departments.length === 0) {
            console.error('❌ No departments found. Please create a department first.');
            return;
        }

        const firstDept = departments[0];
        console.log(`✅ Found department: ${firstDept.name} (ID: ${firstDept.id})\n`);

        // Step 2: Test with valid data
        console.log('📋 Step 2: Creating employee with valid data...');
        const validEmployee = {
            fullName: 'Nguyễn Văn Test Backend',
            email: `test.backend.${Date.now()}@company.com`,
            phone: '0901234567',
            dateOfBirth: '1995-05-15',
            gender: 'MALE',
            idCard: `${Date.now().toString().slice(-12)}`,
            address: '123 Test Street, Hanoi',
            departmentId: firstDept.id,
            position: 'Software Engineer',
            startDate: '2024-01-01',
            baseSalary: 15000000,
        };

        console.log('Request payload:', JSON.stringify(validEmployee, null, 2));

        const createResponse = await axiosInstance.post('/employees', validEmployee);
        console.log('✅ Employee created successfully!');
        console.log('Response:', JSON.stringify(createResponse.data, null, 2));
        console.log('\n');

        // Step 3: Test with minimal data
        console.log('📋 Step 3: Creating employee with minimal required fields...');
        const minimalEmployee = {
            fullName: 'Trần Thị Minimal',
            email: `minimal.${Date.now()}@company.com`,
            dateOfBirth: '1990-01-01',
            idCard: `${Date.now().toString().slice(-12)}`,
            departmentId: firstDept.id,
            position: 'Tester',
            startDate: '2024-01-01',
            baseSalary: 10000000,
        };

        console.log('Request payload:', JSON.stringify(minimalEmployee, null, 2));

        const minimalResponse = await axiosInstance.post('/employees', minimalEmployee);
        console.log('✅ Minimal employee created successfully!');
        console.log('Response:', JSON.stringify(minimalResponse.data, null, 2));
        console.log('\n');

        // Step 4: Test with baseSalary = 0
        console.log('📋 Step 4: Creating employee with baseSalary = 0...');
        const zeroSalaryEmployee = {
            fullName: 'Zero Salary Test',
            email: `zero.${Date.now()}@company.com`,
            dateOfBirth: '1990-01-01',
            idCard: `${Date.now().toString().slice(-12)}`,
            departmentId: firstDept.id,
            position: 'Intern',
            startDate: '2024-01-01',
            baseSalary: 0,
        };

        console.log('Request payload:', JSON.stringify(zeroSalaryEmployee, null, 2));

        const zeroResponse = await axiosInstance.post('/employees', zeroSalaryEmployee);
        console.log('✅ Zero salary employee created successfully!');
        console.log('Response:', JSON.stringify(zeroResponse.data, null, 2));
        console.log('\n');

        // Step 5: Test with invalid gender (should fail)
        console.log('📋 Step 5: Testing with invalid gender (should fail)...');
        const invalidGenderEmployee = {
            fullName: 'Invalid Gender Test',
            email: `invalid.${Date.now()}@company.com`,
            dateOfBirth: '1990-01-01',
            gender: 'Nam', // Vietnamese value - should fail
            idCard: `${Date.now().toString().slice(-12)}`,
            departmentId: firstDept.id,
            position: 'Tester',
            startDate: '2024-01-01',
            baseSalary: 10000000,
        };

        try {
            await axiosInstance.post('/employees', invalidGenderEmployee);
            console.log('❌ Should have failed but succeeded!');
        } catch (error: any) {
            console.log('✅ Correctly rejected invalid gender');
            console.log('Error:', error.response?.data?.message || error.message);
        }
        console.log('\n');

        // Step 6: Test with missing required field (should fail)
        console.log('📋 Step 6: Testing with missing email (should fail)...');
        const missingEmailEmployee = {
            fullName: 'Missing Email Test',
            dateOfBirth: '1990-01-01',
            idCard: `${Date.now().toString().slice(-12)}`,
            departmentId: firstDept.id,
            position: 'Tester',
            startDate: '2024-01-01',
            baseSalary: 10000000,
        };

        try {
            await axiosInstance.post('/employees', missingEmailEmployee);
            console.log('❌ Should have failed but succeeded!');
        } catch (error: any) {
            console.log('✅ Correctly rejected missing email');
            console.log('Error:', error.response?.data?.message || error.message);
        }
        console.log('\n');

        console.log('🎉 All tests completed!');

    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testCreateEmployee();
