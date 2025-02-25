"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";



// promp dùng để chat AI: Sửa đoạn mã sau để thành giao diện động, gọi api từ link https://localhost:7290/api/User/UserLogin + mẫu json gửi đi
  // mẫu gửi đi
  // {
  //   "email": "123",
  //   "password": "123"
  // }
  // mẫu dữ liệu trả về là
  // {
  //   "data": {
  //     "tokenGen": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9zaWQiOiIxMSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiIxMjMiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiIxMjMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiIwIiwiZXhwIjoxNzQwNDk1ODU1LCJpc3MiOiJuZXdzcGFwZXIuY29tIiwiYXVkIjoidXNlciJ9.48NK9Nr0OJqx4WK7FY9_CCSu42lKU69B-op_viO6SXM",
  //     "user": {
  //       "userId": 11,
  //       "username": "123",
  //       "password": "123",
  //       "email": "123",
  //       "fullname": "1",
  //       "phonenumber": "123",
  //       "birthday": "2025-02-25T09:26:01.241",
  //       "avatar": "string",
  //       "roleId": 0,
  //       "createdDate": null,
  //       "modifiedDate": null
  //     }
  //   },
  //   "statusCode": 1
  // }

// Import form components của shadcn/ui
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// 1. Định nghĩa schema bằng zod
const loginSchema = z.object({
  email: z
    .string()
    .nonempty("Email is required")
    .email("Invalid email format"),
  password: z.string().nonempty("Password is required"),
});

// Suy ra kiểu dữ liệu từ schema
type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  // State để toggle hiện/ẩn mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  // 2. Tạo form hook
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });


  // 3. Hàm toggle mật khẩu
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // 4. Xử lý khi submit
  const onSubmit = async (data: LoginSchema) => {
    // Ở đây bạn gọi API hoặc xử lý logic đăng nhập
    try {
      const response = await fetch("https://localhost:7290/api/User/UserLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result) {
        sessionStorage.setItem("user", JSON.stringify(result));
        toast({ title: "Login successful!", description: "Welcome back!" });
        router.push("/profile/saved");
      } else {
        toast({ title: "Login failed", description: "Invalid email or password", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <Card className="w-full max-w-sm border-0 shadow-none">
        <CardHeader className="space-y-2 text-center">
          {/* Logo hoặc icon nhỏ ở trên cùng (tùy bạn) */}
          <div className="mx-auto h-8 w-8">
            <span className="text-2xl">🔶</span>
          </div>
          <CardTitle className="text-2xl font-semibold">
            Sign in to AmberBlocks
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* 5. Dùng Form bọc react-hook-form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter your email</FormLabel>
                    <div className="relative">
                      <Mail
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <FormControl>
                        <Input
                          placeholder="Email"
                          className="pl-8"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <Lock
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          className="pl-8 pr-10"
                          // Nếu showPassword = true => type="text", ngược lại type="password"
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                      </FormControl>
                      {/* Nút hiển thị/ẩn mật khẩu */}
                      <button
                        type="button"
                        onClick={handleTogglePassword}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="text-right">
                      <a
                        href="#"
                        className="text-sm text-gray-500 hover:underline"
                      >
                        Forgot password
                      </a>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nút Sign in (màu nâu mô phỏng) */}
              <Button
                type="submit"
                className="w-full bg-[#a67c52] text-white hover:bg-[#936e48]"
              >
                Sign in
              </Button>

              <Separator />

              {/* Nút Continue with Google */}
              <Button variant="outline" className="w-full">
                Continue with Google
              </Button>

              {/* Link Sign up */}
              <div className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <a
                  href="/User/Register"
                  className="font-medium text-gray-900 hover:underline"
                >
                  Sign up
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
