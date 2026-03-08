# Continuous Test Monitor Guide

## Overview

File `continuous-test-corrections.js` là một test monitor chạy liên tục để kiểm tra health và functionality của Attendance Corrections API.

## Features

- ✅ Chạy test suite tự động theo interval
- ✅ Track statistics (success rate, uptime, etc.)
- ✅ Real-time monitoring dashboard
- ✅ Graceful shutdown với summary
- ✅ Error tracking và reporting
- ✅ Health check API endpoint
- ✅ Test tất cả major flows

## Usage

### Start Monitor

```bash
node continuous-test-corrections.js
```

### Stop Monitor

Press `Ctrl+C` để dừng. Script sẽ hiển thị final statistics trước khi thoát.

## Configuration

Có thể customize các settings trong file:

```javascript
const API_HOST = 'localhost';
const API_PORT = 3001;
const TEST_INTERVAL = 30000; // 30 seconds (30000ms)
```

## Test Suite

Monitor chạy các tests sau mỗi interval:

### 1. Health Check
- Kiểm tra API server có đang chạy không
- Endpoint: `GET /api/`

### 2. Authentication Tests
- Employee login
- HR Manager login
- Verify tokens được issue đúng

### 3. Functional Tests
- **Create Correction**: Employee tạo correction request
- **Get My Corrections**: Employee xem corrections của mình
- **Get Pending Corrections**: HR xem pending corrections
- **Approve Correction**: HR approve một correction
- **Validation Tests**: Test các validation rules

## Dashboard Display

```
═══════════════════════════════════════════════════════════
🔄 CONTINUOUS TEST MONITOR - Attendance Corrections
═══════════════════════════════════════════════════════════

📊 Overall Statistics:
   Uptime: 2h 15m 30s
   Total Runs: 150
   Successful: 148 ✅
   Failed: 2 ❌
   Success Rate: 98.7%
   Last Success: 25s ago
   Last Failure: 1200s ago

📋 Test Results:
───────────────────────────────────────────────────────────
✅ Health Check
   Pass: 150 | Fail: 0 | Rate: 100%

✅ Employee Login
   Pass: 149 | Fail: 1 | Rate: 99%

✅ Create Correction
   Pass: 148 | Fail: 2 | Rate: 99%
   Last Error: Request timeout

───────────────────────────────────────────────────────────
⏰ Next run in 30s | Press Ctrl+C to stop
═══════════════════════════════════════════════════════════
```

## Statistics Tracked

### Overall Stats
- **Uptime**: Thời gian monitor đã chạy
- **Total Runs**: Tổng số lần chạy test suite
- **Successful Runs**: Số lần tất cả tests pass
- **Failed Runs**: Số lần có ít nhất 1 test fail
- **Success Rate**: Tỷ lệ thành công (%)
- **Last Success/Failure Time**: Thời gian của lần success/failure gần nhất

### Per-Test Stats
- **Pass Count**: Số lần test pass
- **Fail Count**: Số lần test fail
- **Success Rate**: Tỷ lệ pass của test đó
- **Last Result**: PASS hoặc FAIL
- **Last Error**: Error message của lần fail gần nhất

## Use Cases

### 1. Development Monitoring
Chạy monitor trong khi develop để catch regressions ngay lập tức:

```bash
# Terminal 1: Backend
cd apps/backend
npm run start:dev

# Terminal 2: Monitor
node continuous-test-corrections.js
```

### 2. Load Testing
Giảm interval để test performance:

```javascript
const TEST_INTERVAL = 5000; // 5 seconds
```

### 3. Production Health Check
Chạy trên staging/production để monitor API health:

```javascript
const API_HOST = 'staging.example.com';
const API_PORT = 443;
const TEST_INTERVAL = 60000; // 1 minute
```

### 4. CI/CD Integration
Chạy trong CI pipeline để verify deployment:

```bash
# Run for 5 minutes then exit
timeout 300 node continuous-test-corrections.js
```

## Troubleshooting

### Issue: "Connection refused"
**Cause**: Backend không chạy
**Solution**: Start backend server trước

```bash
cd apps/backend
npm run start:dev
```

### Issue: "Request timeout"
**Cause**: Backend quá chậm hoặc bị hang
**Solution**: 
- Check backend logs
- Increase timeout trong code
- Check database connection

### Issue: "Login failed"
**Cause**: Test accounts không tồn tại hoặc password sai
**Solution**: 
- Verify accounts trong database
- Check seeding script đã chạy chưa
- Update credentials trong file

### Issue: High failure rate
**Cause**: API có issues hoặc database problems
**Solution**:
- Check backend logs
- Check database connection
- Review failed test errors
- Check network connectivity

## Advanced Configuration

### Custom Test Interval

```javascript
// Run every 10 seconds
const TEST_INTERVAL = 10000;

// Run every 2 minutes
const TEST_INTERVAL = 120000;
```

### Add Custom Tests

```javascript
async function testCustomScenario(token) {
  // Your test logic here
  const response = await makeRequest('GET', '/your-endpoint', null, token);
  // Assertions
}

// Add to test suite
results.push(
  await runTest('Custom Test', () => testCustomScenario(employeeToken))
);
```

### Change Timeout

```javascript
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      // ... other options
      timeout: 20000, // 20 seconds instead of 10
    };
    // ...
  });
}
```

## Monitoring Best Practices

1. **Start with longer intervals** (30-60s) để không overload server
2. **Monitor during development** để catch issues early
3. **Check stats regularly** để identify patterns
4. **Investigate failures immediately** khi success rate drops
5. **Keep logs** của failed runs để analysis
6. **Use in staging** trước khi deploy production

## Integration with Other Tools

### Slack Notifications

```javascript
async function sendSlackAlert(message) {
  // Send to Slack webhook
  await fetch('https://hooks.slack.com/...', {
    method: 'POST',
    body: JSON.stringify({ text: message })
  });
}

// Call when failure rate is high
if (stats.failedRuns / stats.totalRuns > 0.1) {
  await sendSlackAlert('⚠️ High failure rate detected!');
}
```

### Logging to File

```javascript
const fs = require('fs');

function logToFile(message) {
  fs.appendFileSync('test-monitor.log', 
    `${new Date().toISOString()} - ${message}\n`
  );
}
```

### Metrics Export

```javascript
function exportMetrics() {
  return {
    timestamp: new Date().toISOString(),
    uptime: Date.now() - stats.startTime.getTime(),
    totalRuns: stats.totalRuns,
    successRate: stats.successfulRuns / stats.totalRuns,
    tests: stats.tests
  };
}

// Export every hour
setInterval(() => {
  fs.writeFileSync('metrics.json', 
    JSON.stringify(exportMetrics(), null, 2)
  );
}, 3600000);
```

## Exit Codes

- `0`: Normal exit (Ctrl+C)
- `1`: Fatal error occurred

## Performance Impact

Monitor có minimal impact:
- Memory: ~20MB
- CPU: <1% (khi idle)
- Network: ~10KB per test run
- Database: Tạo test data nhưng cleanup sau approve

## Security Notes

- Test accounts nên có limited permissions
- Không hardcode production credentials
- Use environment variables cho sensitive data
- Monitor logs không chứa passwords

## Example Output

```
🚀 Starting Continuous Test Monitor...

Configuration:
  API: http://localhost:3001
  Interval: 30s
  Start Time: 3/8/2026, 10:30:00 AM

Press Ctrl+C to stop

🏃 Running test suite #1...

[Dashboard updates every 30s]

^C
🛑 Stopping test monitor...

📊 Final Statistics:
   Total Runs: 45
   Successful: 44 ✅
   Failed: 1 ❌
   Uptime: 0h 22m 30s

👋 Goodbye!
```
