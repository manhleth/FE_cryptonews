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
  const onSubmit = (data: LoginSchema) => {
    // Ở đây bạn gọi API hoặc xử lý logic đăng nhập
    toast({
      title: "Đăng ký thành công!",
      description: "Tài khoản của bạn đã được tạo.",
      duration: 2
    });
    router.push("/profle/saved")
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
