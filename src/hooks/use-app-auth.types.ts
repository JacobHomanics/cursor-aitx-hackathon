export type AppAuth = {
  ready: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  email?: string;
  phone?: string;
  displayName?: string;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};
