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
import { useAuth } from "@/context/AuthContext";

// Định nghĩa schema bằng zod
const loginSchema = z.object({
  email: z
    .string()
    .nonempty("Email là bắt buộc")
    .email("Email không đúng định dạng"),
  password: z.string().nonempty("Mật khẩu là bắt buộc"),
});

// Suy ra kiểu dữ liệu từ schema
type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  // State để toggle hiện/ẩn mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();
  
  // Tạo form hook
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Hàm toggle mật khẩu
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // Xử lý khi submit
  const onSubmit = async (data: LoginSchema) => {
    try {
      const response = await fetch("http://localhost:5000/api/User/UserLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      console.log(result);
      if(result && result.data && result.data.user && result.data.tokenGen) {
        sessionStorage.setItem("user", JSON.stringify(result.data.user));
        sessionStorage.setItem("token", result.data.tokenGen);
        console.log("token trong login: " + sessionStorage.getItem("token"));
        login(result.data.tokenGen, result.data.user);
        toast({ title: "Đăng nhập thành công!", description: "Chào mừng bạn trở lại!", duration: 4000 });
        window.dispatchEvent(new Event("storageChange"));
        router.push("/profle/saved");
      }
      else {
        toast({
          title: "Đăng nhập thất bại",
          description: "Email hoặc mật khẩu không chính xác",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      toast({ 
        title: "Lỗi", 
        description: "Thông tin đăng nhập không chính xác", 
        variant: "destructive",
        duration: 3000 
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <Card className="w-full max-w-sm border-0 shadow-none">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">
            Đăng nhập All-in Crypto Insights
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                      </FormControl>
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

              <Button
                type="submit"
                className="w-full bg-[#10b981] text-white hover:bg-[#059669]"
              >
                Đăng nhập
              </Button>

              <Separator />

              <Button variant="outline" className="w-full">
                Đăng nhập với Google
              </Button>

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