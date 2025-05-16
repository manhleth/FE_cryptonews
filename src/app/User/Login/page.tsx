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
import { json } from "stream/consumers";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/context/AuthContext";

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
  const {login} = useAuth();
  // 2. Tạo form hook
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const [formData, setFormData] = useState({ email: "", password: "" });

  // 3. Hàm toggle mật khẩu
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // 4. Xử lý khi submit
  const onSubmit = async (data: LoginSchema) => {
    try {
      const response = await fetch("http://localhost:5000/api/User/UserLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      console.log(result);
      if(result && result.data.user && result.data && result.data.tokenGen)
      {
        sessionStorage.setItem("user", JSON.stringify(result.data.user));
        sessionStorage.setItem("token", result.data.tokenGen);
        console.log("token trong login: " + sessionStorage.getItem("token"));
        login(result.data.tokenGen, result.data.user);
        toast({ title: "Login successful!", description: "Welcome back!",duration: 4 });
        window.dispatchEvent(new Event("storageChange"));
        router.push("/profle/saved");
      }
      else
      {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Thông tin đăng nhập không chính xác", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <Card className="w-full max-w-sm border-0 shadow-none">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">
            Sign in to All-in Crypto Insights
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
                    <FormLabel>Email đăng nhập</FormLabel>
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
                    <FormLabel>Mật khẩu</FormLabel>
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
                        Quên mật khẩu?
                      </a>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nút Sign in) */}
              <Button
                type="submit"
                className="w-full bg-[#10b981] text-white hover:bg-[#059669]"
              >
                Đăng nhập
              </Button>

              <Separator />

              {/* Nút Continue with Google */}
              <Button variant="outline" className="w-full">
                Continue with Google
              </Button>

              {/* Link Sign up */}
              <div className="text-center text-sm text-gray-500">
                Bạn chưa có tài khoản?{" "}
                <a
                  href="/User/Register"
                  className="font-medium text-gray-900 hover:underline"
                >
                  Đăng ký
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
