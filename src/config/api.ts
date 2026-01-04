// src/config/api.ts

/**
 * Base URL for the backend API.
 * This can be switched easily for different environments (e.g., production, staging).
 */
export const API_BASE_URL = 'https://underclad-athematic-nguyet.ngrok-free.dev';

/**
 * API Endpoints
 * Use this object to hold specific paths for clear management.
 */
export const API_ENDPOINTS = {
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  SHOPS: `${API_BASE_URL}/api/shops`,
  BARBER: `${API_BASE_URL}/api/barbers`,
  // Add other endpoints here as your app grows:
  GETSHOP: `${API_BASE_URL}/api/shops/:slugOrId`,
  UPDATESHOP: `${API_BASE_URL}/api/shops/update/:id`,
  GETQUEUE: `${API_BASE_URL}/api/shops/:id/queues`,
};