"use client";

import { useState, useRef, useEffect } from "react";
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
  ChevronLeft,
  Lock,
  Eye,
  EyeOff
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

// Schema validation cho OTP
const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "OTP phải có 6 số")
    .max(6, "OTP phải có 6 số")
    .regex(/^\d{6}$/, "OTP phải là 6 chữ số"),
});

// Schema validation cho mật khẩu mới
const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Phải có ít nhất 1 chữ hoa")
      .regex(/\d/, "Phải có ít nhất 1 chữ số")
      .regex(/[^A-Za-z0-9]/, "Phải có ít nhất 1 ký tự đặc biệt"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
type OtpSchema = z.infer<typeof otpSchema>;
type NewPasswordSchema = z.infer<typeof newPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // States để điều khiển flow
  const [currentStep, setCurrentStep] = useState<'email' | 'otp' | 'newPassword' | 'success'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP input refs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);

  // Form setups
  const emailForm = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<OtpSchema>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const passwordForm = useForm<NewPasswordSchema>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle email submission
  const onEmailSubmit = async (data: ForgotPasswordSchema) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/User/Request-forgot-password?email=${data.email}`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();
      
      if (response.ok) {
        
          // Lưu email đã submit để dùng cho các bước sau
          setSubmittedEmail(data.email);
          // Chuyển sang bước nhập OTP
          setCurrentStep('otp');
          // Set countdown cho OTP
          setCountdown(300);
          
          toast({
            title: "Thành công",
            description: "Mã OTP đã được gửi đến email của bạn",
            duration: 3000
          });
        
      } else {
        throw new Error("Có lỗi xảy ra khi gửi yêu cầu");
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

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newValues = [...otpValues];
    newValues[index] = value;
    setOtpValues(newValues);
    
    // Auto focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    
    // Update form value
    const otpString = newValues.join('');
    otpForm.setValue('otp', otpString);
  };

  // Handle OTP submission
  const onOtpSubmit = async (data: OtpSchema) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/User/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          otp: data.otp 
        }),
        credentials: "include",
      });

      const result = await response.json();
      
      
        // Chuyển sang bước nhập mật khẩu mới
        setCurrentStep('newPassword');
        toast({
          title: "Xác thực thành công",
          description: "Vui lòng nhập mật khẩu mới",
          duration: 3000
        });
      
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: "Lỗi xác thực",
        description: error.message || "Mã OTP không đúng. Vui lòng thử lại.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle new password submission
  const onNewPasswordSubmit = async (data: NewPasswordSchema) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/User/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Có lỗi xảy ra khi đặt lại mật khẩu");
      }

      const result = await response.json();
      

        setCurrentStep('success');
        toast({
          title: "Đặt lại mật khẩu thành công",
          description: "Bạn có thể đăng nhập với mật khẩu mới",
          duration: 5000
        });
        router.push("/User/Login");
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/User/ForgotPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submittedEmail }),
      });

      if (response.ok) {
        setCountdown(300);
        setOtpValues(['', '', '', '', '', '']);
        otpForm.reset();
        toast({
          title: "OTP đã được gửi lại",
          description: `Mã OTP mới đã được gửi đến ${submittedEmail}`,
          duration: 3000
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể gửi lại OTP",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format countdown time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

        {/* Step 1: Email Input */}
        {currentStep === 'email' && (
          <>
            <div className="text-center mb-8 mt-8">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <KeyRound className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu?</h2>
              <p className="text-gray-600">
                Không sao cả! Nhập email để nhận mã OTP đặt lại mật khẩu
              </p>
            </div>

            <Form {...emailForm}>
              <div className="space-y-6">
                <FormField
                  control={emailForm.control}
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
                  onClick={emailForm.handleSubmit(onEmailSubmit)}
                  disabled={isSubmitting}
                  className="w-full h-12 bg-emerald-600 text-white hover:bg-emerald-700 font-medium rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Đang gửi...
                    </div>
                  ) : (
                    "Gửi mã OTP"
                  )}
                </Button>
              </div>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Nhớ mật khẩu rồi?{" "}
                <Link href="/User/Login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </>
        )}

        {/* Step 2: OTP Input */}
        {currentStep === 'otp' && (
          <>
            <div className="text-center mb-8 mt-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Nhập mã OTP</h2>
              <p className="text-gray-600 mb-4">
                Chúng tôi đã gửi mã 6 số đến
              </p>
              <p className="font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
                {submittedEmail}
              </p>
            </div>

            <Form {...otpForm}>
              <div className="space-y-6">
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Mã OTP (6 số)
                  </FormLabel>
                  <div className="flex gap-2 justify-center">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <Input
                        key={index}
                        type="text"
                        maxLength={1}
                        value={otpValues[index]}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
                            otpInputRefs.current[index - 1]?.focus();
                          }
                        }}
                        className="w-12 h-12 text-center text-lg font-bold border-gray-300 focus:border-emerald-500"
                        disabled={isSubmitting}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>

                <Button
                  onClick={otpForm.handleSubmit(onOtpSubmit)}
                  disabled={isSubmitting || otpValues.join('').length !== 6}
                  className="w-full h-12 bg-emerald-600 text-white hover:bg-emerald-700 font-medium rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Đang xác thực...
                    </div>
                  ) : (
                    "Xác thực OTP"
                  )}
                </Button>
              </div>
            </Form>

            {/* Countdown and Resend */}
            <div className="mt-6 text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-600">
                  Gửi lại OTP sau: <span className="font-mono text-emerald-600">{formatTime(countdown)}</span>
                </p>
              ) : (
                <Button
                  onClick={handleResendOtp}
                  variant="ghost"
                  disabled={isSubmitting}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  Gửi lại mã OTP
                </Button>
              )}
            </div>
          </>
        )}

        {/* Step 3: New Password */}
        {currentStep === 'newPassword' && (
          <>
            <div className="text-center mb-8 mt-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Đặt mật khẩu mới</h2>
              <p className="text-gray-600">
                Tạo mật khẩu mạnh để bảo vệ tài khoản của bạn
              </p>
            </div>

            <Form {...passwordForm}>
              <div className="space-y-6">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Mật khẩu mới
                      </FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <FormControl>
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Nhập mật khẩu mới"
                            className="pl-11 pr-11 h-12 border-gray-300 focus:border-emerald-500"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Xác nhận mật khẩu
                      </FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Nhập lại mật khẩu"
                            className="pl-11 pr-11 h-12 border-gray-300 focus:border-emerald-500"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  onClick={passwordForm.handleSubmit(onNewPasswordSubmit)}
                  disabled={isSubmitting}
                  className="w-full h-12 bg-emerald-600 text-white hover:bg-emerald-700 font-medium rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Đang cập nhật...
                    </div>
                  ) : (
                    "Đặt lại mật khẩu"
                  )}
                </Button>
              </div>
            </Form>
          </>
        )}

        {/* Step 4: Success */}
        {currentStep === 'success' && (
          <>
            <div className="text-center mb-8 mt-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Thành công!</h2>
              <p className="text-gray-600 mb-6">
                Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.
              </p>
            </div>

            <Button
              onClick={() => router.push("/User/Login")}
              className="w-full h-12 bg-emerald-600 text-white hover:bg-emerald-700 font-medium rounded-lg transition-colors"
            >
              Đến trang đăng nhập
            </Button>
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