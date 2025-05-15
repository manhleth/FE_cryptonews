"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

// 1. Định nghĩa schema kiểm tra đầu vào (email, displayName, acceptTerms)
const formSchema = z.object({
  email: z
    .string()
    .nonempty({ message: "Email is required" })
    .email({ message: "Email format is invalid" }),
  displayName: z
    .string()
    .nonempty({ message: "Display name is required" }),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must accept the terms",
    }),
});
export default function SignUpForm() {

    const router = useRouter();
  // 2. Tạo form hook với react-hook-form + zod
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      displayName: "",
      acceptTerms: false,
    },
  });

  // 3. Xử lý khi submit
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Ở đây bạn gọi API hoặc xử lý logic đăng ký
    router.push(`/User/Register/password?email=${encodeURIComponent(
        values.email
      )}&displayName=${encodeURIComponent(values.displayName)}`)
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <Card className="w-full max-w-sm border-0 shadow-none">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto h-8 w-8">
            {/* Logo (tuỳ bạn thay) */}
            <span className="text-2xl">🔶</span>
          </div>
          <CardTitle className="text-2xl font-semibold">
            Join Coin 98
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* 4. Dùng <Form> của shadcn/ui để bọc react-hook-form */}
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
                      <Mail className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <FormControl>
                        <Input
                          placeholder="Email"
                          className="pl-8"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    {/* FormMessage sẽ hiển thị lỗi nếu có */}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display name */}
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your display name</FormLabel>
                    <div className="relative">
                      <User className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <FormControl>
                        <Input
                          placeholder="Display name"
                          className="pl-8"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkbox xác nhận điều khoản */}
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="leading-none">
                      I confirm that I am at least 18 years old and agree to 
                      AmberBlocks Terms of Service, Publisher Terms of Service, 
                      and Privacy Policy
                    </FormLabel>
                    <FormMessage className="!mt-1 block" />
                  </FormItem>
                )}
              />

              {/* Nút Continue */}
              <Button
                type="submit"
                className="w-full bg-[#a67c52] text-white hover:bg-[#936e48]"
              >
                Continue
              </Button>

              {/* Link Sign in */}
              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <a href="#" className="font-medium text-gray-900 hover:underline">
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
