"use client";

import { useState, useEffect } from "react";

interface User {
  userId: number;
  username: string;
  email: string;
  fullname: string;
  avatar: string;
  phonenumber: string;
  birthday: string;
  roleId: number;
  createdDate: string | null;
  modifiedDate: string | null;
}

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Kiểm tra dữ liệu trong sessionStorage khi ứng dụng khởi động
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    const storedToken = sessionStorage.getItem("token");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Hàm cập nhật thông tin người dùng
  const updateUser = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    sessionStorage.setItem("user", JSON.stringify(newUser));
    sessionStorage.setItem("token", newToken);
  };

  return { user, token, updateUser };
};