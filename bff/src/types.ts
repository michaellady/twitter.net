export interface Tweet {
  id: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
}

export interface CreateTweetRequest {
  content: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface User {
  userId: string;
  username: string;
  displayName: string;
  createdAt: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
}
