"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  KeyRound, 
  Mail, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

// Schema validation cho email
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .nonempty("Email là bắt buộc")
    .email("Email không đúng định dạng"),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  // Form setup
  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ForgotPasswordSchema) => {
    setIsSubmitting(true);
    
    try {
      // Gọi API quên mật khẩu
      const response = await fetch("http://localhost:5000/api/User/ForgotPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        throw new Error("Có lỗi xảy ra khi gửi yêu cầu");
      }

      const result = await response.json();
      
      if (result.statusCode === 1) {
        // Thành công
        setSubmittedEmail(data.email);
        setIsEmailSent(true);
        toast({
          title: "Email đã được gửi",
          description: `Vui lòng kiểm tra hộp thư của ${data.email}`,
          duration: 5000
        });
      } else {
        throw new Error(result.message || "Không thể gửi email reset password");
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi email. Vui lòng thử lại sau.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend email
  const handleResendEmail = async () => {
    if (!submittedEmail) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/User/ForgotPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: submittedEmail }),
      });

      if (response.ok) {
        toast({
          title: "Email đã được gửi lại",
          description: `Vui lòng kiểm tra hộp thư của ${submittedEmail}`,
          duration: 3000
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể gửi lại email",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-100 opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-100 opacity-20"></div>
      </div>

      <div className="relative bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Link 
            href="/User/Login" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Quay lại</span>
          </Link>
        </div>

        {!isEmailSent ? (
          // Form nhập email
          <>
            {/* Header */}
            <div className="text-center mb-8 mt-8">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <KeyRound className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu?</h2>
              <p className="text-gray-600">
                Không sao cả! Nhập email để nhận liên kết đặt lại mật khẩu
              </p>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Địa chỉ email
                      </FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            className="pl-11 h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-emerald-600 text-white hover:bg-emerald-700 font-medium rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Đang gửi...
                    </div>
                  ) : (
                    "Gửi liên kết đặt lại"
                  )}
                </Button>
              </form>
            </Form>

            {/* Footer links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Nhớ mật khẩu rồi?{" "}
                <Link href="/User/Login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </>
        ) : (
          // Success state - Email đã gửi
          <>
            {/* Success Header */}
            <div className="text-center mb-8 mt-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Email đã được gửi!</h2>
              <p className="text-gray-600 mb-4">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến
              </p>
              <p className="font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
                {submittedEmail}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Hướng dẫn:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Kiểm tra hộp thư đến và thư mục spam</li>
                    <li>• Click vào liên kết trong email để đặt lại mật khẩu</li>
                    <li>• Liên kết có hiệu lực trong 15 phút</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={isSubmitting}
                variant="outline"
                className="w-full h-12 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Đang gửi lại...
                  </div>
                ) : (
                  "Gửi lại email"
                )}
              </Button>
              
              <Button
                onClick={() => router.push("/User/Login")}
                variant="ghost"
                className="w-full h-12 text-gray-600 hover:text-gray-900"
              >
                Quay lại đăng nhập
              </Button>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Cần hỗ trợ? Liên hệ{" "}
            <a href="mailto:support@cryptoinsights.com" className="text-emerald-600 hover:underline">
              support@cryptoinsights.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}