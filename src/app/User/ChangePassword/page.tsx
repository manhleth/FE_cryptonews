"use client"
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Shield
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

// Schema validation
const changePasswordSchema = z
  .object({
    currentPassword: z.string().nonempty("Mật khẩu hiện tại là bắt buộc"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Phải có ít nhất 1 chữ hoa")
      .regex(/\d/, "Phải có ít nhất 1 chữ số")
      .regex(/[^A-Za-z0-9]/, "Phải có ít nhất 1 ký tự đặc biệt"),
    confirmPassword: z.string().nonempty("Xác nhận mật khẩu là bắt buộc"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại",
    path: ["newPassword"],
  });

type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  
  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form setup
  const form = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ChangePasswordSchema) => {
    if (!token) {
      setError("Bạn cần đăng nhập để đổi mật khẩu");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/api/User/ChangePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();
      
      if (result.statusCode === 1 && result.data?.success) {
        setSuccess(true);
        form.reset();
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          router.push("/profle/edit");
        }, 3000);
      } else {
        setError(result.data?.message || "Có lỗi xảy ra khi đổi mật khẩu");
      }
    } catch (error) {
      console.error("Change password error:", error);
      setError("Không thể kết nối đến server. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength checker
  const newPassword = form.watch("newPassword");
  const hasMinLength = newPassword?.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword || "");
  const hasDigit = /\d/.test(newPassword || "");
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword || "");

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Đổi mật khẩu thành công!
              </h2>
              <p className="text-gray-600 mb-6">
                Mật khẩu của bạn đã được cập nhật. Bạn sẽ được chuyển hướng về trang profile.
              </p>
              <Button onClick={() => router.push("/profle/edit")} className="w-full">
                Quay về Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Đổi mật khẩu
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Cập nhật mật khẩu để bảo mật tài khoản của bạn
          </p>
        </CardHeader>

        <CardContent>
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <Form {...form}>
            <div className="space-y-4">
              {/* Current Password */}
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu hiện tại</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pr-10"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          disabled={isSubmitting}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New Password */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pr-10"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          disabled={isSubmitting}
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-gray-700">Yêu cầu mật khẩu:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className={`flex items-center ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${hasMinLength ? 'bg-green-500' : 'bg-gray-300'}`} />
                      8+ ký tự
                    </div>
                    <div className={`flex items-center ${hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${hasUpperCase ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Chữ hoa
                    </div>
                    <div className={`flex items-center ${hasDigit ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${hasDigit ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Số
                    </div>
                    <div className={`flex items-center ${hasSpecial ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${hasSpecial ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Ký tự đặc biệt
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pr-10"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          disabled={isSubmitting}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                onClick={form.handleSubmit(onSubmit)}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Đang cập nhật...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Đổi mật khẩu
                  </div>
                )}
              </Button>
            </div>
          </Form>

          {/* Back Button */}
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
