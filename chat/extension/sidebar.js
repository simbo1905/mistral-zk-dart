import OpaqueClient from './opaque-client.js';

const SERVER = 'http://localhost:3456';

const $ = (id) => document.getElementById(id);

let serverIdentity = '';

const LETTERS = 'ABCDEFGHJKMNPRTUVWXY';
const DIGITS = '0123456789';

function log(msg, type = 'info') {
  const logEl = $('log');
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function getSelectedFormat() {
  const radio = document.querySelector('input[name="pinFormat"]:checked');
  return radio ? radio.value : 'digits';
}

function generatePin() {
  const format = getSelectedFormat();
  let pin = '';
  if (format === 'mixed') {
    for (let i = 0; i < 2; i++) {
      pin += LETTERS[Math.floor(Math.random() * LETTERS.length)];
    }
    for (let i = 0; i < 4; i++) {
      pin += DIGITS[Math.floor(Math.random() * DIGITS.length)];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      pin += DIGITS[Math.floor(Math.random() * DIGITS.length)];
    }
  }
  return pin;
}

function showPermutations() {
  const format = getSelectedFormat();
  let count;
  if (format === 'mixed') {
    count = Math.pow(LETTERS.length, 2) * Math.pow(10, 4);
  } else {
    count = Math.pow(10, 6);
  }
  $('permutations').textContent = `${count.toLocaleString()} possible combinations`;
}

function displayPin(pin) {
  for (let i = 0; i < 6; i++) {
    const digit = $(`pin${i}`);
    digit.textContent = pin[i] || '';
    digit.classList.toggle('filled', !!pin[i]);
  }
}

function clearPin() {
  for (let i = 0; i < 6; i++) {
    const digit = $(`pin${i}`);
    digit.textContent = '';
    digit.classList.remove('filled');
  }
}

async function checkHealth() {
  try {
    log('Fetching server identity...');
    const res = await fetch(`${SERVER}/health`);
    const data = await res.json();
    serverIdentity = data.serverIdentity;
    log(`Fetched Identity: ${serverIdentity}`, 'success');
    log(`Users: ${data.users.join(', ') || '(none)'}`, 'info');
  } catch (err) {
    log(`Fetch error: ${err.message}`, 'error');
  }
}

async function register() {
  const username = $('username').value.trim();
  
  if (!username) {
    log('Username required', 'error');
    return;
  }
  
  if (!serverIdentity) {
    log('Please fetch server identity first', 'error');
    return;
  }
  
  const pin = generatePin();
  displayPin(pin);
  
  try {
    log(`Starting registration for "${username}" with PIN ${pin}...`);
    
    const registrationRequest = await OpaqueClient.startRegistration(pin);
    log('Created registration request');
    
    const res1 = await fetch(`${SERVER}/register/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        registrationRequest
      })
    });
    
    if (!res1.ok) {
      const err = await res1.json();
      throw new Error(err.error || 'Registration start failed');
    }
    
    const { registrationResponse } = await res1.json();
    log('Received registration response from server');
    
    const finish = await OpaqueClient.finishRegistration(
      registrationResponse,
      serverIdentity
    );
    log('Finished registration locally');
    
    const res2 = await fetch(`${SERVER}/register/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        registrationRecord: finish.registrationRecord
      })
    });
    
    if (!res2.ok) {
      const err = await res2.json();
      throw new Error(err.error || 'Registration finish failed');
    }
    
    log(`Registration complete!`, 'success');
    showMasterKey(finish.exportKey);
    showPermutations();
    
  } catch (err) {
    log(`Registration failed: ${err.message}`, 'error');
  }
}

function showMasterKey(key) {
  $('masterKeyValue').textContent = key;
}

$('btnHealth').addEventListener('click', checkHealth);
$('btnRegister').addEventListener('click', () => { 
  $('masterKeyValue').textContent = ''; 
  register(); 
});
$('clearLog').addEventListener('click', () => { 
  $('log').innerHTML = ''; 
  $('masterKeyValue').textContent = ''; 
  clearPin();
});

checkHealth();
