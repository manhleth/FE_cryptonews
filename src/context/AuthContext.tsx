"use client"
import { createContext, useContext, useState, useEffect } from "react";
import { json } from "stream/consumers";
interface User {
  userId: number;
  username: string;
  email: string;
  fullname: string;
  phonenumber: string;
  birthday: string;
  avatar: string;
}
interface AuthContextProps {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
  }
  const AuthContext = createContext<AuthContextProps | undefined>(undefined);
  export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        // Lấy token từ sessionStorage khi component mount
        const storedToken = sessionStorage.getItem("token");
        const storeUser = sessionStorage.getItem("user");
        if (storedToken) {
          setToken(storedToken);
        }
        if(storeUser) {
          setUser(JSON.parse(storeUser));
        }
      }, []);
    
      const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        sessionStorage.setItem("token", newToken);
        sessionStorage.setItem("user", JSON.stringify(newUser));
      };
    
      const logout = () => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      };
    
      return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
          {children}
        </AuthContext.Provider>
      );
    }
    
    export function useAuth() {
      const context = useContext(AuthContext);
      if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
      }
      return context;
    }