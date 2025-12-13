export interface UserRecord {
  registrationRecord: string;
  serverLoginState?: string;
}

const users = new Map<string, UserRecord>();

export function getUser(username: string): UserRecord | undefined {
  return users.get(username);
}

export function saveUser(username: string, record: UserRecord): void {
  users.set(username, record);
}

export function updateUserLoginState(username: string, serverLoginState: string): boolean {
  const user = users.get(username);
  if (!user) return false;
  user.serverLoginState = serverLoginState;
  return true;
}

export function clearUserLoginState(username: string): void {
  const user = users.get(username);
  if (user) {
    delete user.serverLoginState;
  }
}

export function listUsers(): string[] {
  return Array.from(users.keys());
}
