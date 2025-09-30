import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import api from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await api.get("/auth/me");
      if (response.data.success) {
        setUser(response.data.data.student);
      } else {
        logout();
      }
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { token, refreshToken, student } = response.data.data;

      Cookies.set("token", token, { expires: 7 });
      if (refreshToken) {
        Cookies.set("refreshToken", refreshToken, { expires: 30 });
      }
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(student);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (userData) => {
  try {
    // Do NOT remove confirmPassword!
    // Ensure mobile is properly formatted (10 digits)
    if (userData.mobile && !/^\d{10}$/.test(userData.mobile)) {
      return {
        success: false,
        message: "Mobile number must be 10 digits",
      };
    }

    console.log("Sending registration data:", userData);
    const response = await api.post("/auth/register", userData);

    // If backend returns token on registration, auto-login:
    if (response.data.data?.token) {
      const { token, refreshToken, student } = response.data.data;
      Cookies.set("token", token, { expires: 7 });
      if (refreshToken) {
        Cookies.set("refreshToken", refreshToken, { expires: 30 });
      }
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(student);
    }
    return { success: response.data.success, message: response.data.message };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Registration failed",
    };
  }
};

  const logout = () => {
    api.post("/auth/logout").catch(() => {});
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const forgotPassword = async (email) => {
    try {
      await api.post("/auth/forgot-password", { email });
      return { success: true, message: "Reset link sent to your email" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send reset link",
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    isAuthenticated: !!user,
    isStudent: user?.role === "student",
    isAdmin: user?.role === "admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};