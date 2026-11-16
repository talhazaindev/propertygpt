export type MobileUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phoneNumber: string | null;
  image: string | null;
  agentStatus?: string | null;
};

export type MobileLoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: MobileUser;
};
