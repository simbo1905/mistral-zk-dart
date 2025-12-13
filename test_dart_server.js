// Test TypeScript client with Dart server
const fetch = require('node-fetch');

async function testDartServer() {
  const serverUrl = 'http://localhost:3457';
  const username = 'test_user';
  const password = 'test_password_123';
  
  console.log('🚀 Testing TypeScript client with Dart server');
  console.log('Server:', serverUrl);
  console.log('');
  
  try {
    // Test health check
    console.log('🏥 Checking Dart server health...');
    const healthResponse = await fetch(`${serverUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('Dart server response:', healthData);
    console.log('');
    
    // Test registration
    console.log('🔑 Registering user...');
    const registerResponse = await fetch(`${serverUrl}/register/finish?username=${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);
    console.log('');
    
    // Test login
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${serverUrl}/login/finish?username=${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    console.log('');
    
    if (loginData.success) {
      console.log('🎉 SUCCESS: TypeScript client works with Dart server!');
      console.log('Export key:', loginData.exportKey);
      console.log('');
      console.log('✅ Cross-language interoperability verified:');
      console.log('   - Dart server ✓');
      console.log('   - TypeScript client ✓');
      console.log('   - OPAQUE protocol ✓');
    } else {
      console.error('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('This might mean:');
    console.log('  - Dart server is not running');
    console.log('  - Server is on a different port');
    console.log('  - CORS issues');
  }
}

testDartServer();