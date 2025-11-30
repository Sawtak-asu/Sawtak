export interface AuthUser {
  email: string;
  providerId: string;
  name?: string;
  picture?: string;
}

export interface IAuthProvider {
  verifyToken(token: string): Promise<AuthUser>;
}
