export interface AuthenticatedUser {
  id: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  mustChangePassword: boolean;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
  ip?: string;
  get(name: string): string | undefined;
}
