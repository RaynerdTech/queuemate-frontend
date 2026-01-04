// src/context/AuthContext.tsx
import React, { createContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import {
  getToken,
  setToken,
  setUser,
  getUser,
  clearAll,
} from '../utils/storage';

export type AuthState = {
  token: string | null;
  userId: string | null;
  shopId: string | null;
  userEmail: string | null;
  loading: boolean;
};

export type AuthContextValue = {
  state: AuthState;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signup: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  setShopIdLocally: (shopId: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    shopId: null,
    userEmail: null,
    loading: true,
  });

  // 🔹 Check if JWT token is expired
  const isTokenExpired = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const userJson = await getUser();

        if (token && userJson) {
          // Auto logout if token expired
          if (isTokenExpired(token)) {
            await logout();
            return;
          }

          const parsed = JSON.parse(userJson);
          axios.defaults.headers.common.Authorization = `Bearer ${token}`;
          setState({
            token,
            userId: parsed.userId,
            shopId: parsed.shopId || null,
            userEmail: parsed.userEmail || null,
            loading: false,
          });
        } else {
          setState(s => ({ ...s, loading: false }));
        }
      } catch {
        setState(s => ({ ...s, loading: false }));
      }
    })();
  }, []);

  useEffect(() => {
  const interceptor = axios.interceptors.response.use(
    response => response,
    async error => {
      if (error.response?.status === 401) {
        await logout(); // force logout on 401
      }
      return Promise.reject(error);
    }
  );

  return () => axios.interceptors.response.eject(interceptor);
}, []);


  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(API_ENDPOINTS.LOGIN, { email, password });
      const { token, userId, shopId } = res.data;

      await setToken(token);
      await setUser(JSON.stringify({ userId, shopId: shopId || null, userEmail: email }));
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      setState({
        token,
        userId,
        shopId: shopId || null,
        userEmail: email,
        loading: false,
      });

      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err?.response?.data?.message || 'Login failed' };
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const res = await axios.post(API_ENDPOINTS.SIGNUP, { email, password });
      const { token, userId } = res.data;

      await setToken(token);
      await setUser(JSON.stringify({ userId, shopId: null, userEmail: email }));
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      setState({
        token,
        userId,
        shopId: null,
        userEmail: email,
        loading: false,
      });

      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err?.response?.data?.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    await clearAll();
    delete axios.defaults.headers.common.Authorization;

    setState({
      token: null,
      userId: null,
      shopId: null,
      userEmail: null,
      loading: false,
    });
  };

  const setShopIdLocally = async (shopId: string) => {
    setState(s => ({ ...s, shopId }));

    const userJson = await getUser();
    const parsed = userJson ? JSON.parse(userJson) : {};
    parsed.shopId = shopId;

    await setUser(JSON.stringify({ ...parsed, shopId }));
  };

  return (
    <AuthContext.Provider
      value={{ state, login, signup, logout, setShopIdLocally }}
    >
      {children}
    </AuthContext.Provider>
  );
};
