import { OpaqueServer, OpaqueID, getOpaqueConfig, RegistrationRequest, RegistrationRecord, KE1, KE3, ExpectedAuthResult } from '@cloudflare/opaque-ts';
import { getUser, saveUser, type UserRecord } from './storage.js';
import crypto from 'crypto';

const config = getOpaqueConfig(OpaqueID.OPAQUE_P256);

let server: OpaqueServer | null = null;
let serverIdentity: string = '';

export async function initServer(): Promise<void> {
  const oprfSeed = Array.from(crypto.randomBytes(32));
  const keypair = await config.ake.generateAuthKeyPair();
  
  serverIdentity = 'opaque-demo-server';
  server = new OpaqueServer(config, oprfSeed, keypair, serverIdentity);
  
  console.log('OPAQUE server initialized with P256');
  console.log('Server identity:', serverIdentity);
}

function getServer(): OpaqueServer {
  if (!server) throw new Error('Server not initialized');
  return server;
}

export function getServerIdentity(): string {
  return serverIdentity;
}

export async function handleRegistrationStart(
  username: string,
  registrationRequestBase64: string
): Promise<{ registrationResponse: string }> {
  const srv = getServer();
  
  const request = RegistrationRequest.deserialize(
    config,
    Array.from(Buffer.from(registrationRequestBase64, 'base64'))
  );
  
  const response = await srv.registerInit(request, username);
  
  return {
    registrationResponse: Buffer.from(response.serialize()).toString('base64')
  };
}

export async function handleRegistrationFinish(
  username: string,
  registrationRecordBase64: string
): Promise<{ success: boolean }> {
  const existing = getUser(username);
  if (existing) {
    throw new Error('User already exists');
  }
  
  saveUser(username, { registrationRecord: registrationRecordBase64 });
  return { success: true };
}

interface PendingAuth {
  expected: ExpectedAuthResult;
}

const pendingAuths = new Map<string, PendingAuth>();

export async function handleLoginStart(
  username: string,
  ke1Base64: string
): Promise<{ ke2: string }> {
  const srv = getServer();
  const user = getUser(username);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const ke1 = KE1.deserialize(
    config,
    Array.from(Buffer.from(ke1Base64, 'base64'))
  );
  
  const record = RegistrationRecord.deserialize(
    config,
    Array.from(Buffer.from(user.registrationRecord, 'base64'))
  );
  
  const { ke2, expected } = await srv.authInit(ke1, record, username);
  
  pendingAuths.set(username, { expected });
  
  return {
    ke2: Buffer.from(ke2.serialize()).toString('base64')
  };
}

export async function handleLoginFinish(
  username: string,
  ke3Base64: string
): Promise<{ success: boolean; sessionKey: string }> {
  const srv = getServer();
  const pending = pendingAuths.get(username);
  
  if (!pending) {
    throw new Error('No pending login');
  }
  
  const ke3 = KE3.deserialize(
    config,
    Array.from(Buffer.from(ke3Base64, 'base64'))
  );
  
  const result = srv.authFinish(ke3, pending.expected);
  
  pendingAuths.delete(username);
  
  if (result instanceof Error) {
    throw new Error('Login failed - invalid credentials');
  }
  
  const sessionKeyArray = result instanceof Uint8Array 
    ? Array.from(result) 
    : Array.isArray(result) 
      ? result 
      : Array.from(Object.values(result) as number[]);
  
  return {
    success: true,
    sessionKey: Buffer.from(sessionKeyArray).toString('base64')
  };
}
