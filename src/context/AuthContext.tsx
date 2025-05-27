"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface User {
  userId: number;
  username: string;
  email: string;
  fullname: string;
  phonenumber: string;
  birthday: string;
  avatar: string;
  roleId: number;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: (customToken?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("token");
    const storedUser = sessionStorage.getItem("user");
    
    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // If user is an admin, store token as adminToken as well
          if (parsedUser.roleId === 1) {
            localStorage.setItem("tokenAdmin", storedToken);
          }
        } catch (e) {
          console.error("Failed to parse stored user:", e);
        }
      }
      refreshUser(storedToken);
    }
    
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    sessionStorage.setItem("token", newToken);
    sessionStorage.setItem("user", JSON.stringify(newUser));
    
    // If the user is an admin, also store the token in localStorage for admin access
    if (newUser.roleId === 1) {
      localStorage.setItem("tokenAdmin", newToken);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    
    // Also clear admin token
    localStorage.removeItem("tokenAdmin");
  };

  const refreshUser = async (customToken?: string) => {
    const tokenToUse = customToken || token;
    
    if (!tokenToUse) {
      console.log("No token available for refreshing user data");
      return;
    }
    
    try {
      console.log("Refreshing user with token:", tokenToUse);
      const res = await fetch("http://localhost:5000/api/User/GetUserInfor", {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      console.log("Phản hồi từ server: " + res);
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      
      const contentType = res.headers.get("Content-Type") || "";
      
      if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }
      
      const data = await res.json();
      console.log("Data cập nhật: " +data);
      if (data.statusCode === 1 && data.data) {
        // Update the user state with the new data
        setUser(data.data);
        
        // Also update sessionStorage
        sessionStorage.setItem("user", JSON.stringify(data.data));
        
        // If user is an admin, ensure admin token is set
        if (data.data.roleId === 1) {
          localStorage.setItem("tokenAdmin", tokenToUse);
        }
        
        console.log("User data refreshed successfully:", data.data);
        return data.data;
      } else {
        console.error("Invalid response format:", data);
        throw new Error(data.message || "Failed to refresh user data");
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}