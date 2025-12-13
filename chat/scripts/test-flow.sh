#!/bin/bash
set -e

cd "$(dirname "$0")/.."

SERVER="http://localhost:3456"
USERNAME="testuser$$"
PASSWORD="testpass123"

echo "=== OPAQUE-TS Flow Test ==="
echo "Server: $SERVER"
echo "Username: $USERNAME"
echo ""

echo "1. Checking server health..."
curl -s "$SERVER/health" | jq .
echo ""

echo "2. Running Node.js test script..."
node --input-type=module << 'EOF'
import { startRegistration, finishRegistration, startLogin, finishLogin } from './client/dist/opaque-client.js';

const SERVER = 'http://localhost:3456';
const USERNAME = process.env.USERNAME || 'nodetest';
const PASSWORD = process.env.PASSWORD || 'nodepass123';

async function test() {
  console.log(`Testing with user: ${USERNAME}`);
  
  console.log('\n--- Registration ---');
  const regStart = await startRegistration(PASSWORD);
  console.log('Created registration request');
  
  const res1 = await fetch(`${SERVER}/register/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: USERNAME,
      registrationRequest: regStart.registrationRequest
    })
  });
  const { registrationResponse } = await res1.json();
  console.log('Got registration response');
  
  const regFinish = await finishRegistration(PASSWORD, regStart.state, registrationResponse, USERNAME);
  console.log('Finished registration locally');
  
  const res2 = await fetch(`${SERVER}/register/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: USERNAME,
      registrationRecord: regFinish.registrationRecord
    })
  });
  const regResult = await res2.json();
  console.log('Registration result:', regResult);
  
  console.log('\n--- Login ---');
  const loginStart = await startLogin(PASSWORD);
  console.log('Created KE1');
  
  const res3 = await fetch(`${SERVER}/login/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: USERNAME,
      ke1: loginStart.ke1
    })
  });
  const { ke2 } = await res3.json();
  console.log('Got KE2');
  
  const loginFinish = await finishLogin(PASSWORD, loginStart.state, ke2, USERNAME);
  console.log('Created KE3');
  
  const res4 = await fetch(`${SERVER}/login/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: USERNAME,
      ke3: loginFinish.ke3
    })
  });
  const loginResult = await res4.json();
  console.log('Login result:', loginResult);
  
  console.log('\n=== SUCCESS ===');
  console.log('Session key (client):', loginFinish.sessionKey.slice(0, 32) + '...');
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
EOF

echo ""
echo "Test complete!"
