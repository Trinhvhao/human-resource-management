/**
 * Continuous Test Monitor for Attendance Corrections
 * Run: node continuous-test-corrections.js
 * 
 * This script runs tests continuously and monitors the system health
 */

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 3333;
const TEST_INTERVAL = 30000; // 30 seconds

// Test accounts
const ACCOUNTS = {
  employee: { email: 'employee1@company.com', password: 'Password123!' },
  hr: { email: 'hr.manager@company.com', password: 'Password123!' },
  admin: { email: 'admin@company.com', password: 'Admin@123' },
};

// Statistics
const stats = {
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  tests: {},
  startTime: new Date(),
  lastSuccessTime: null,
  lastFailureTime: null,
};

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path, // Remove /api prefix
      method: method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000, // 10 second timeout
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function login(email, password) {
  const response = await makeRequest('POST', '/auth/login', { email, password });
  return response.data?.accessToken || response.accessToken || response.access_token;
}

async function runTest(name, testFn) {
  if (!stats.tests[name]) {
    stats.tests[name] = { passed: 0, failed: 0, lastResult: null, lastError: null };
  }

  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    stats.tests[name].passed++;
    stats.tests[name].lastResult = 'PASS';
    stats.tests[name].lastError = null;
    return { passed: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    stats.tests[name].failed++;
    stats.tests[name].lastResult = 'FAIL';
    stats.tests[name].lastError = error.message || String(error);
    return { passed: false, duration, error: error.message || String(error) };
  }
}

async function testHealthCheck() {
  await makeRequest('GET', '/');
}

async function testEmployeeLogin() {
  await login(ACCOUNTS.employee.email, ACCOUNTS.employee.password);
}

async function testHRLogin() {
  await login(ACCOUNTS.hr.email, ACCOUNTS.hr.password);
}

async function testCreateCorrection(token) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  const dateStr = yesterday.toISOString().split('T')[0];

  const data = {
    date: dateStr,
    requestedCheckIn: `${dateStr}T08:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
    requestedCheckOut: `${dateStr}T17:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
    reason: `Test ${Date.now()}: Automated test correction`,
  };

  const response = await makeRequest('POST', '/attendance-corrections', data, token);
  return response.id;
}

async function testGetMyCorrections(token) {
  const response = await makeRequest('GET', '/attendance-corrections/my-requests', null, token);
  const corrections = response.data || response;
  if (!Array.isArray(corrections)) {
    throw new Error('Expected array of corrections');
  }
  return corrections.length;
}

async function testGetPendingCorrections(token) {
  const response = await makeRequest('GET', '/attendance-corrections/pending', null, token);
  const corrections = response.data || response;
  if (!Array.isArray(corrections)) {
    throw new Error('Expected array of corrections');
  }
  return corrections.length;
}

async function testApproveCorrection(hrToken, employeeToken) {
  // Create a correction first
  const correctionId = await testCreateCorrection(employeeToken);
  
  // Approve it
  const response = await makeRequest(
    'POST',
    `/attendance-corrections/${correctionId}/approve`,
    {},
    hrToken
  );
  
  if (response.status !== 'APPROVED') {
    throw new Error('Expected status to be APPROVED');
  }
}

async function testValidationFutureDate(token) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  try {
    await makeRequest(
      'POST',
      '/attendance-corrections',
      {
        date: dateStr,
        requestedCheckIn: `${dateStr}T08:30:00Z`,
        reason: 'Test future date',
      },
      token
    );
    throw new Error('Should have rejected future date');
  } catch (error) {
    if (error.status !== 400) {
      throw new Error('Expected 400 Bad Request for future date');
    }
  }
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatUptime() {
  const uptime = Date.now() - stats.startTime.getTime();
  const hours = Math.floor(uptime / 3600000);
  const minutes = Math.floor((uptime % 3600000) / 60000);
  const seconds = Math.floor((uptime % 60000) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

function printStats() {
  console.clear();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔄 CONTINUOUS TEST MONITOR - Attendance Corrections');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📊 Overall Statistics:');
  console.log(`   Uptime: ${formatUptime()}`);
  console.log(`   Total Runs: ${stats.totalRuns}`);
  console.log(`   Successful: ${stats.successfulRuns} ✅`);
  console.log(`   Failed: ${stats.failedRuns} ❌`);
  
  if (stats.totalRuns > 0) {
    const successRate = ((stats.successfulRuns / stats.totalRuns) * 100).toFixed(1);
    console.log(`   Success Rate: ${successRate}%`);
  }
  
  if (stats.lastSuccessTime) {
    const timeSince = Math.floor((Date.now() - stats.lastSuccessTime.getTime()) / 1000);
    console.log(`   Last Success: ${timeSince}s ago`);
  }
  
  if (stats.lastFailureTime) {
    const timeSince = Math.floor((Date.now() - stats.lastFailureTime.getTime()) / 1000);
    console.log(`   Last Failure: ${timeSince}s ago`);
  }

  console.log('\n📋 Test Results:');
  console.log('───────────────────────────────────────────────────────────');
  
  Object.entries(stats.tests).forEach(([name, data]) => {
    const total = data.passed + data.failed;
    const rate = total > 0 ? ((data.passed / total) * 100).toFixed(0) : 0;
    const status = data.lastResult === 'PASS' ? '✅' : '❌';
    
    console.log(`${status} ${name}`);
    console.log(`   Pass: ${data.passed} | Fail: ${data.failed} | Rate: ${rate}%`);
    
    if (data.lastError) {
      console.log(`   Last Error: ${data.lastError.substring(0, 60)}...`);
    }
  });

  console.log('\n───────────────────────────────────────────────────────────');
  console.log(`⏰ Next run in ${TEST_INTERVAL / 1000}s | Press Ctrl+C to stop`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

async function runTestSuite() {
  stats.totalRuns++;
  const results = [];

  console.log(`\n🏃 Running test suite #${stats.totalRuns}...`);

  try {
    // Health check
    results.push(await runTest('Health Check', testHealthCheck));

    // Login tests
    results.push(await runTest('Employee Login', testEmployeeLogin));
    results.push(await runTest('HR Login', testHRLogin));

    // Get tokens for further tests
    const employeeToken = await login(ACCOUNTS.employee.email, ACCOUNTS.employee.password);
    const hrToken = await login(ACCOUNTS.hr.email, ACCOUNTS.hr.password);

    // Functional tests
    results.push(
      await runTest('Create Correction', () => testCreateCorrection(employeeToken))
    );
    
    results.push(
      await runTest('Get My Corrections', () => testGetMyCorrections(employeeToken))
    );
    
    results.push(
      await runTest('Get Pending Corrections', () => testGetPendingCorrections(hrToken))
    );
    
    results.push(
      await runTest('Approve Correction', () => testApproveCorrection(hrToken, employeeToken))
    );
    
    results.push(
      await runTest('Validation: Future Date', () => testValidationFutureDate(employeeToken))
    );

    // Check if all tests passed
    const allPassed = results.every((r) => r.passed);
    
    if (allPassed) {
      stats.successfulRuns++;
      stats.lastSuccessTime = new Date();
    } else {
      stats.failedRuns++;
      stats.lastFailureTime = new Date();
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    stats.failedRuns++;
    stats.lastFailureTime = new Date();
  }

  printStats();
}

async function main() {
  console.log('🚀 Starting Continuous Test Monitor...\n');
  console.log('Configuration:');
  console.log(`  API: http://${API_HOST}:${API_PORT}`);
  console.log(`  Interval: ${TEST_INTERVAL / 1000}s`);
  console.log(`  Start Time: ${stats.startTime.toLocaleString()}\n`);
  console.log('Press Ctrl+C to stop\n');

  // Run first test immediately
  await runTestSuite();

  // Then run periodically
  setInterval(async () => {
    await runTestSuite();
  }, TEST_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping test monitor...');
  console.log('\n📊 Final Statistics:');
  console.log(`   Total Runs: ${stats.totalRuns}`);
  console.log(`   Successful: ${stats.successfulRuns} ✅`);
  console.log(`   Failed: ${stats.failedRuns} ❌`);
  console.log(`   Uptime: ${formatUptime()}`);
  console.log('\n👋 Goodbye!\n');
  process.exit(0);
});

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
