import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { CoreServiceClient } from '../../src/clients/CoreServiceClient';

// Mock the CoreServiceClient
jest.mock('../../src/clients/CoreServiceClient');

describe('Auth Routes', () => {
  let app: Application;
  let mockRegister: jest.Mock;
  let mockLogin: jest.Mock;
  let mockGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRegister = jest.fn();
    mockLogin = jest.fn();
    mockGetUser = jest.fn();

    (CoreServiceClient as jest.Mock).mockImplementation(() => ({
      postTweet: jest.fn(),
      getTweets: jest.fn(),
      register: mockRegister,
      login: mockLogin,
      getUser: mockGetUser,
    }));

    app = createApp({ coreServiceUrl: 'http://mock-core:3001' });
  });

  describe('POST /api/auth/register', () => {
    const mockUser = {
      userId: 'user-123',
      username: 'testuser',
      displayName: 'Test User',
      createdAt: '2026-01-26T00:00:00Z',
    };

    it('should register a new user and return token', async () => {
      mockRegister.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
          displayName: 'Test User',
        })
        .expect(201);

      expect(response.body.user).toEqual(mockUser);
      expect(response.body.token).toBeDefined();
      expect(mockRegister).toHaveBeenCalledWith('testuser', 'password123', 'Test User');
    });

    it('should set httpOnly cookies', async () => {
      mockRegister.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(201);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('auth_token'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('refresh_token'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
    });

    it('should return 400 when username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.message).toBe('Username is required');
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body.message).toBe('Password is required');
    });

    it('should return 409 when username is taken', async () => {
      mockRegister.mockRejectedValue(new Error('Username is already taken'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          password: 'password123',
        })
        .expect(409);

      expect(response.body.message).toBe('Username is already taken');
    });
  });

  describe('POST /api/auth/login', () => {
    const mockUser = {
      userId: 'user-123',
      username: 'testuser',
      displayName: 'Test User',
      createdAt: '2026-01-26T00:00:00Z',
    };

    it('should login user and return token', async () => {
      mockLogin.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.user).toEqual(mockUser);
      expect(response.body.token).toBeDefined();
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });

    it('should set httpOnly cookies on login', async () => {
      mockLogin.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('auth_token'))).toBe(true);
    });

    it('should return 400 when username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.message).toBe('Username is required');
    });

    it('should return 401 with invalid credentials', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid username or password'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid username or password');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear cookies and return success', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toEqual({ success: true });

      const cookies = response.headers['set-cookie'];
      if (cookies) {
        // Check that cookies are cleared (expires in the past)
        expect(cookies.some((c: string) => c.includes('auth_token=;'))).toBe(true);
      }
    });
  });

  describe('GET /api/auth/me', () => {
    const mockUser = {
      userId: 'user-123',
      username: 'testuser',
      displayName: 'Test User',
      createdAt: '2026-01-26T00:00:00Z',
    };

    it('should return current user when authenticated', async () => {
      mockLogin.mockResolvedValue(mockUser);
      mockGetUser.mockResolvedValue(mockUser);

      // First login to get a valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.userId).toBe('user-123');
      expect(response.body.username).toBe('testuser');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toBe('Not authenticated');
    });
  });
});
