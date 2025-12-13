import { OpaqueClient as Client, OpaqueID, getOpaqueConfig, RegistrationRequest, RegistrationResponse, KE1, KE2, RegistrationRecord } from '@cloudflare/opaque-ts';

const config = getOpaqueConfig(OpaqueID.OPAQUE_P256);

function toBase64(arr: Uint8Array | number[]): string {
  const bytes = arr instanceof Uint8Array ? arr : new Uint8Array(arr);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(str: string): number[] {
  const binary = atob(str);
  const arr: number[] = [];
  for (let i = 0; i < binary.length; i++) {
    arr.push(binary.charCodeAt(i));
  }
  return arr;
}

export interface RegistrationResult {
  registrationRecord: string;
  exportKey: string;
}

export interface LoginResult {
  ke3: string;
  sessionKey: string;
  exportKey: string;
}

export async function register(
  password: string,
  serverIdentity: string,
  sendToServer: (request: string) => Promise<string>
): Promise<RegistrationResult> {
  const client = new Client(config);
  
  const request = await client.registerInit(password);
  if (request instanceof Error) throw request;
  
  const responseBase64 = await sendToServer(toBase64(request.serialize()));
  
  const response = RegistrationResponse.deserialize(config, fromBase64(responseBase64));
  
  const result = await client.registerFinish(response, serverIdentity);
  if (result instanceof Error) throw result;
  
  return {
    registrationRecord: toBase64(result.record.serialize()),
    exportKey: toBase64(result.export_key)
  };
}

export async function login(
  password: string,
  serverIdentity: string,
  sendKE1ToServer: (ke1: string) => Promise<string>
): Promise<LoginResult> {
  const client = new Client(config);
  
  const ke1 = await client.authInit(password);
  if (ke1 instanceof Error) throw ke1;
  
  const ke2Base64 = await sendKE1ToServer(toBase64(ke1.serialize()));
  
  const ke2 = KE2.deserialize(config, fromBase64(ke2Base64));
  
  const result = await client.authFinish(ke2, serverIdentity);
  if (result instanceof Error) throw result;
  
  return {
    ke3: toBase64(result.ke3.serialize()),
    sessionKey: toBase64(result.session_key),
    exportKey: toBase64(result.export_key)
  };
}

let pendingClient: Client | null = null;

export async function startRegistration(password: string): Promise<string> {
  pendingClient = new Client(config);
  const request = await pendingClient.registerInit(password);
  if (request instanceof Error) throw request;
  return toBase64(request.serialize());
}

export async function finishRegistration(
  registrationResponseBase64: string,
  serverIdentity: string
): Promise<RegistrationResult> {
  if (!pendingClient) throw new Error('No pending registration');
  const client = pendingClient;
  pendingClient = null;
  
  const response = RegistrationResponse.deserialize(config, fromBase64(registrationResponseBase64));
  const result = await client.registerFinish(response, serverIdentity);
  if (result instanceof Error) throw result;
  
  return {
    registrationRecord: toBase64(result.record.serialize()),
    exportKey: toBase64(result.export_key)
  };
}

export async function startLogin(password: string): Promise<string> {
  pendingClient = new Client(config);
  const ke1 = await pendingClient.authInit(password);
  if (ke1 instanceof Error) throw ke1;
  return toBase64(ke1.serialize());
}

export async function finishLogin(
  ke2Base64: string,
  serverIdentity: string
): Promise<LoginResult> {
  if (!pendingClient) throw new Error('No pending login');
  const client = pendingClient;
  pendingClient = null;
  
  const ke2 = KE2.deserialize(config, fromBase64(ke2Base64));
  const result = await client.authFinish(ke2, serverIdentity);
  if (result instanceof Error) throw result;
  
  return {
    ke3: toBase64(result.ke3.serialize()),
    sessionKey: toBase64(result.session_key),
    exportKey: toBase64(result.export_key)
  };
}

export const OpaqueClientAPI = {
  register,
  login,
  startRegistration,
  finishRegistration,
  startLogin,
  finishLogin
};

export default OpaqueClientAPI;
