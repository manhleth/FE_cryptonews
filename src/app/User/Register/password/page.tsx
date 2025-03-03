"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronLeft } from "lucide-react";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // Hoặc cách merge className tuỳ bạn
import { useToast } from "@/hooks/use-toast";
// 1. Định nghĩa schema cho Bước 2
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must have at least 1 upper case letter")
      .regex(/\d/, "Must have at least 1 digit")
      .regex(/[^A-Za-z0-9]/, "Must have at least 1 special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password doesn't match",
    path: ["confirmPassword"], // lỗi gắn cho confirmPassword
  });

type PasswordSchema = z.infer<typeof passwordSchema>;

export default function RegisterStep2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  console.log("Query string:", searchParams.toString());
  const email = searchParams.get("email") || "";
  const displayName = searchParams.get("displayName") || "";
  // 2. Tạo form
  const form = useForm<PasswordSchema>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // 3. Xem password real-time
  const passwordValue = useWatch({
    control: form.control,
    name: "password",
    defaultValue: "",
  });

  // Các hàm check
  const hasMinLength = passwordValue.length >= 8;
  const hasUpperCase = /[A-Z]/.test(passwordValue);
  const hasDigit = /\d/.test(passwordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);

  // 4. Submit
  const onSubmit = (data: PasswordSchema) => {

    const registrationData = {
      email,
      username: displayName,
      password: data.password,
      fullname: "",
      phonenumber: "",
      birthday: "2025-03-01T11:16:40.089Z",
      avatar: ""
    };
    try {
      const res = fetch("http://localhost:5000/api/User/UserRegister", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(registrationData)
      }).then((data) => data.json()).then((data) => {
        if (data.statusCode === 1) {
          console.log(data.data);
          toast({
            title: "Đăng ký thành công!",
            description: "Tài khoản của bạn đã được tạo.",
            duration: 2
          });
          router.push("/User/Login")
        }
      })
    }
    catch (err) {
      console.log(err);
    }

  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          {/* Nút Back */}
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-0 top-1/2 -translate-y-1/2 ml-2 flex items-center text-sm"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </button>

          <CardTitle className="text-2xl">Join the AmberBlocks</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    {/* Danh sách điều kiện */}
                    <ul className="mt-2 space-y-1 text-sm">
                      <li
                        className={cn(
                          hasMinLength ? "text-green-600" : "text-gray-500"
                        )}
                      >
                        ✓ 8 characters
                      </li>
                      <li
                        className={cn(
                          hasUpperCase ? "text-green-600" : "text-gray-500"
                        )}
                      >
                        ✓ 1 upper case letter
                      </li>
                      <li
                        className={cn(
                          hasDigit ? "text-green-600" : "text-gray-500"
                        )}
                      >
                        ✓ 1 digit
                      </li>
                      <li
                        className={cn(
                          hasSpecial ? "text-green-600" : "text-gray-500"
                        )}
                      >
                        ✓ 1 special character (e.g. @, #, $, %, ^...)
                      </li>
                    </ul>
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nút Sign up */}
              <Button
                type="submit"
                className="w-full bg-[#a67c52] text-white hover:bg-[#936e48]"
              >
                Sign up
              </Button>

              {/* Link Sign in */}
              <p className="text-center text-sm text-gray-500 mt-2">
                Already have an account?{" "}
                <a href="/User/Login" className="font-medium hover:underline">
                  Sign in
                </a>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
