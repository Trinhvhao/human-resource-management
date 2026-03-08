/**
 * Automated Test Script for Attendance Corrections
 * Run: npx ts-node test-attendance-corrections.ts
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Test accounts
const ACCOUNTS = {
    employee: {
        email: 'employee1@company.com',
        password: 'Password123!',
    },
    hr: {
        email: 'hr.manager@company.com',
        password: 'Password123!',
    },
    admin: {
        email: 'admin@company.com',
        password: 'Admin@123',
    },
};

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
    duration: number;
}

const results: TestResult[] = [];

async function login(email: string, password: string): Promise<string> {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password,
        });
        return response.data.access_token || response.data.data?.access_token;
    } catch (error: any) {
        throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
    }
}

async function runTest(name: string, testFn: () => Promise<void>) {
    const startTime = Date.now();
    try {
        await testFn();
        const duration = Date.now() - startTime;
        results.push({ name, passed: true, message: 'Passed', duration });
        console.log(`✅ ${name} (${duration}ms)`);
    } catch (error: any) {
        const duration = Date.now() - startTime;
        const message = error.message || String(error);
        results.push({ name, passed: false, message, duration });
        console.log(`❌ ${name} (${duration}ms)`);
        console.log(`   Error: ${message}`);
    }
}

async function testEmployeeCreateCorrection(token: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const data = {
        date: dateStr,
        requestedCheckIn: `${dateStr}T08:30:00Z`,
        requestedCheckOut: `${dateStr}T17:30:00Z`,
        reason: 'Test: Quên check-in do họp khẩn cấp',
    };

    const response = await axios.post(
        `${API_URL}/attendance-corrections`,
        data,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    if (response.data.status !== 'PENDING') {
        throw new Error('Expected status to be PENDING');
    }

    // Store correction ID for later tests
    (global as any).testCorrectionId = response.data.id;
}

async function testEmployeeGetMyCorrections(token: string) {
    const response = await axios.get(
        `${API_URL}/attendance-corrections/my-requests`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    const corrections = response.data.data || response.data;
    if (!Array.isArray(corrections)) {
        throw new Error('Expected array of corrections');
    }
}

async function testValidationFutureDate(token: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    try {
        await axios.post(
            `${API_URL}/attendance-corrections`,
            {
                date: dateStr,
                requestedCheckIn: `${dateStr}T08:30:00Z`,
                reason: 'Test future date',
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        throw new Error('Should have rejected future date');
    } catch (error: any) {
        if (error.response?.status !== 400) {
            throw new Error('Expected 400 Bad Request for future date');
        }
        // Success - validation worked
    }
}

async function testValidationMissingTimes(token: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const dateStr = yesterday.toISOString().split('T')[0];

    try {
        await axios.post(
            `${API_URL}/attendance-corrections`,
            {
                date: dateStr,
                reason: 'Test missing times',
                // No requestedCheckIn or requestedCheckOut
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        throw new Error('Should have rejected missing times');
    } catch (error: any) {
        if (error.response?.status !== 400) {
            throw new Error('Expected 400 Bad Request for missing times');
        }
        // Success - validation worked
    }
}

async function testHRGetPendingCorrections(token: string) {
    const response = await axios.get(
        `${API_URL}/attendance-corrections/pending`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    const corrections = response.data.data || response.data;
    if (!Array.isArray(corrections)) {
        throw new Error('Expected array of corrections');
    }
}

async function testHRApproveCorrection(token: string) {
    const correctionId = (global as any).testCorrectionId;
    if (!correctionId) {
        throw new Error('No correction ID available for approval test');
    }

    const response = await axios.post(
        `${API_URL}/attendance-corrections/${correctionId}/approve`,
        {},
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    if (response.data.status !== 'APPROVED') {
        throw new Error('Expected status to be APPROVED');
    }
}

async function testEmployeeCancelCorrection(token: string) {
    // Create a new correction to cancel
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 3);
    const dateStr = yesterday.toISOString().split('T')[0];

    const createResponse = await axios.post(
        `${API_URL}/attendance-corrections`,
        {
            date: dateStr,
            requestedCheckIn: `${dateStr}T09:00:00Z`,
            reason: 'Test cancel',
        },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    const correctionId = createResponse.data.id;

    // Cancel it
    const cancelResponse = await axios.delete(
        `${API_URL}/attendance-corrections/${correctionId}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    if (cancelResponse.data.status !== 'CANCELLED') {
        throw new Error('Expected status to be CANCELLED');
    }
}

async function testHRRejectCorrection(token: string, employeeToken: string) {
    // Create a new correction to reject
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 4);
    const dateStr = yesterday.toISOString().split('T')[0];

    const createResponse = await axios.post(
        `${API_URL}/attendance-corrections`,
        {
            date: dateStr,
            requestedCheckIn: `${dateStr}T10:00:00Z`,
            reason: 'Test reject',
        },
        {
            headers: { Authorization: `Bearer ${employeeToken}` },
        }
    );

    const correctionId = createResponse.data.id;

    // Reject it
    const rejectResponse = await axios.post(
        `${API_URL}/attendance-corrections/${correctionId}/reject`,
        {
            rejectedReason: 'Không có bằng chứng hợp lệ',
        },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    if (rejectResponse.data.status !== 'REJECTED') {
        throw new Error('Expected status to be REJECTED');
    }
}

async function main() {
    console.log('🧪 Testing Attendance Corrections API\n');
    console.log('⚠️  Make sure backend is running on http://localhost:3001\n');

    try {
        // Login
        console.log('📝 Logging in...');
        const employeeToken = await login(ACCOUNTS.employee.email, ACCOUNTS.employee.password);
        const hrToken = await login(ACCOUNTS.hr.email, ACCOUNTS.hr.password);
        console.log('✅ Login successful\n');

        // Run tests
        console.log('🏃 Running tests...\n');

        await runTest(
            'Employee can create correction request',
            () => testEmployeeCreateCorrection(employeeToken)
        );

        await runTest(
            'Employee can get their corrections',
            () => testEmployeeGetMyCorrections(employeeToken)
        );

        await runTest(
            'Validation: Reject future date',
            () => testValidationFutureDate(employeeToken)
        );

        await runTest(
            'Validation: Reject missing times',
            () => testValidationMissingTimes(employeeToken)
        );

        await runTest(
            'HR can get pending corrections',
            () => testHRGetPendingCorrections(hrToken)
        );

        await runTest(
            'HR can approve correction',
            () => testHRApproveCorrection(hrToken)
        );

        await runTest(
            'Employee can cancel correction',
            () => testEmployeeCancelCorrection(employeeToken)
        );

        await runTest(
            'HR can reject correction',
            () => testHRRejectCorrection(hrToken, employeeToken)
        );

        // Summary
        console.log('\n📊 Test Summary\n');
        const passed = results.filter((r) => r.passed).length;
        const failed = results.filter((r) => !r.passed).length;
        const total = results.length;

        console.log(`Total: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            results
                .filter((r) => !r.passed)
                .forEach((r) => {
                    console.log(`  - ${r.name}`);
                    console.log(`    ${r.message}`);
                });
        }

        process.exit(failed > 0 ? 1 : 0);
    } catch (error: any) {
        console.error('\n💥 Test suite failed:', error.message);
        process.exit(1);
    }
}

main();
