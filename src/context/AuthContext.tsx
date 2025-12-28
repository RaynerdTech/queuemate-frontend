// src/context/AuthContext.tsx

import React, { createContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import {
  getToken,
  setToken,
  removeToken,
  setUser,
  getUser,
  clearAll,
} from '../utils/storage';

// 🔥 CORRECTED AuthState: Removed userName, kept userEmail
type AuthState = {
  token: string | null;
  userId: string | null;
  shopId: string | null;
  userEmail: string | null; // <-- Kept this to fix the Drawer error
  loading: boolean;
};

type AuthContextValue = {
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
    userEmail: null, // 🔥 INITIALIZE
    loading: true,
  });

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const userJson = await getUser();

        if (token && userJson) {
          const parsed = JSON.parse(userJson);
          axios.defaults.headers.common.Authorization = `Bearer ${token}`;

          setState({
            token,
            userId: parsed.userId,
            shopId: parsed.shopId || null,
            userEmail: parsed.userEmail || null, // 🔥 LOAD
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

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(API_ENDPOINTS.LOGIN, { email, password });
      const { token, userId, shopId } = res.data;

      await setToken(token);
      // 🔥 SAVE userEmail to storage
      await setUser(JSON.stringify({ userId, shopId: shopId || null, userEmail: email }));
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      setState({
        token,
        userId,
        shopId: shopId || null,
        userEmail: email, // 🔥 UPDATE STATE
        loading: false,
      });

      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        message: err?.response?.data?.message || 'Login failed',
      };
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const res = await axios.post(API_ENDPOINTS.SIGNUP, { email, password });
      const { token, userId } = res.data;

      await setToken(token);
      // 🔥 SAVE userEmail to storage
      await setUser(JSON.stringify({ userId, shopId: null, userEmail: email }));
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      setState({
        token,
        userId,
        shopId: null,
        userEmail: email, // 🔥 UPDATE STATE
        loading: false,
      });

      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        message: err?.response?.data?.message || 'Signup failed',
      };
    }
  };

  const logout = async () => {
    await clearAll();
    delete axios.defaults.headers.common.Authorization;

    setState({
      token: null,
      userId: null,
      shopId: null,
      userEmail: null, // 🔥 CLEAR
      loading: false,
    });
  };

  const setShopIdLocally = async (shopId: string) => {
    setState(s => ({ ...s, shopId }));

    const userJson = await getUser();
    const parsed = userJson ? JSON.parse(userJson) : {};
    parsed.shopId = shopId;

    // 🔥 Make sure we preserve the userEmail when saving back
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