import apiClient from "./client";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  jwt: string;
  userId: string;
  username?: string;
  roles?: string[];
}

export interface SignupRequest {
  username: string;
  password: string;
  name: string;
  roles: string[];
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data),

  signup: (data: SignupRequest) =>
    apiClient.post("/auth/signup", data),
};
