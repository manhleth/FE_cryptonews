"use client"
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  FileText,
  Camera,
  Loader2,
  Shield,
  Lock,
  ArrowRight,
  Eye
} from "lucide-react";
import Link from "next/link";

export default function EditProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("Thêm tiểu sử ngắn của bạn");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user data
  useEffect(() => {
    if (!user) {
      router.push("/User/Login");
      return;
    }

    setFullName(user.fullname || "");
    setPhoneNumber(user.phonenumber || "");
    setAvatar(user.avatar || "");
    
    if (user.birthday) {
      try {
        const formattedBirthday = new Date(user.birthday)
          .toISOString()
          .split("T")[0];
        setBirthday(formattedBirthday);
      } catch (e) {
        console.error("Lỗi định dạng ngày sinh:", e);
      }
    }
  }, [user, router]);

  // Handle avatar change với upload ngay lập tức
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Lỗi định dạng file",
        description: "Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WEBP)",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File quá lớn",
        description: "Kích thước file không được vượt quá 5MB",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    setIsUploading(true);
    setImageFile(file);
    
    // Create temporary preview
    setPreviewUrl(URL.createObjectURL(file));
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", file);
      
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Lỗi upload file");
      }
      
      const uploadData = await uploadResponse.json();
      console.log("Upload response:", uploadData);
      
      if (uploadData.success && uploadData.filePath) {
        const uploadedImagePath = uploadData.filePath;
        
        // Update avatar in database
        const updateData = {
          fullname: fullName,
          phoneNumber: phoneNumber,
          birthday: birthday ? new Date(birthday).toISOString() : null,
          avatar: uploadedImagePath
        };
        
        const updateResponse = await fetch("http://localhost:5000/api/User/UpdateUserInfor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updateData),
        });
        
        if (!updateResponse.ok) {
          throw new Error("Lỗi cập nhật thông tin");
        }
        
        const updateResult = await updateResponse.json();
        
        if (updateResult.statusCode === 1) {
          // Update local state with new avatar path
          setAvatar(uploadedImagePath);
          // Refresh user data
          await refreshUser();
          
          toast({
            title: "Cập nhật thành công",
            description: "Avatar của bạn đã được cập nhật",
            duration: 3000
          }); 
        }
      }
    } catch (error: any) {
      console.error("Lỗi upload avatar:", error);
      toast({
        title: "Lỗi upload",
        description: error.message || "Không thể upload avatar. Vui lòng thử lại.",
        variant: "destructive",
        duration: 3000
      });
      // Reset preview on error
      setPreviewUrl("");
    } finally {
      setIsUploading(false);
      setImageFile(null);
    }
  };

  // Handle form submission for other fields
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare update data
      const updateData = {
        fullname: fullName,
        phoneNumber: phoneNumber,
        birthday: birthday ? new Date(birthday).toISOString() : null,
        avatar: avatar || ""
      };
      
      console.log("Dữ liệu gửi đi:", updateData);
      
      const response = await fetch("http://localhost:5000/api/User/UpdateUserInfor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.statusCode === 1) {
        await refreshUser();
        
        toast({
          title: "Cập nhật thành công",
          description: "Thông tin cá nhân của bạn đã được cập nhật",
          duration: 3000
        });
        
        router.push("/profle/edit");
      } else {
        throw new Error(data.message || "Lỗi không xác định");
      }
    } catch (error: any) {
      console.error("Lỗi cập nhật thông tin:", error);
      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Không thể cập nhật thông tin. Vui lòng thử lại.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this useEffect for cleanup
  useEffect(() => {
    return () => {
      // Cleanup preview URL when component unmounts
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center mb-6">
        <Link 
          href="/" 
          className="p-2 mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Chỉnh sửa thông tin cá nhân</h1>
      </div>

      <div className="space-y-8">
        {/* Avatar Section */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <Avatar className="w-24 h-24 border-2 border-white shadow">
              {previewUrl || avatar ? (
                <AvatarImage 
                  src={previewUrl || avatar} 
                  alt={fullName || "Avatar"} 
                />
              ) : (
                <AvatarFallback className="bg-emerald-100 text-emerald-800 text-2xl">
                  {user?.fullname?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            
            <button
              type="button"
              className="absolute bottom-0 right-0 bg-emerald-600 text-white rounded-full p-1.5 shadow-md hover:bg-emerald-700 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Personal Information Card */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-emerald-600" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Họ và tên */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                Họ và tên
              </Label>
              <Input
                id="fullName"
                placeholder="Nhập họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-gray-300 focus:border-emerald-500"
                disabled={isLoading}
              />
            </div>

            {/* Email (readonly) */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                value={user.email}
                disabled
                className="bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Email không thể thay đổi</p>
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                Số điện thoại
              </Label>
              <Input
                id="phoneNumber"
                placeholder="Nhập số điện thoại"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="border-gray-300 focus:border-emerald-500"
                disabled={isLoading}
              />
            </div>

            {/* Ngày sinh */}
            <div className="space-y-1.5">
              <Label htmlFor="birthday" className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                Ngày sinh
              </Label>
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="border-gray-300 focus:border-emerald-500"
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings Card */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-emerald-600" />
              Cài đặt bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Lock className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Đổi mật khẩu</h3>
                  <p className="text-sm text-gray-500">Cập nhật mật khẩu để bảo mật tài khoản</p>
                </div>
              </div>
              <Link 
                href="/User/ChangePassword"
                className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium">Đổi mật khẩu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Additional Security Options */}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12"
            onClick={handleSubmit}
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Đang cập nhật...
              </div>
            ) : (
              "Lưu thông tin"
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
            className="px-8 h-12"
          >
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
}