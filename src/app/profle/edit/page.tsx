"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  FileText,
  Camera,
  Loader2
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
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user data
  useEffect(() => {
    if (!user) {
      // Redirect if not logged in
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

    setImageFile(file);
    
    try {
      setIsUploading(true);
      
      // Upload file ngay lập tức
      const formData = new FormData();
      formData.append("image", file);
      
      console.log("Đang upload file:", file.name);
      
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error("Upload error:", errorText);
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }
      
      const uploadResult = await uploadRes.json();
      console.log("Upload result:", uploadResult);
      
      if (uploadResult.success && uploadResult.filePath) {
        // Cập nhật avatar state với đường dẫn mới
        setAvatar(uploadResult.filePath);
        
        toast({
          title: "Tải ảnh thành công",
          description: "Ảnh đại diện đã được tải lên",
          duration: 3000
        });
      } else {
        throw new Error("Upload không thành công");
      }
      
    } catch (error) {
      console.error("Lỗi khi tải ảnh:", error);
      toast({
        title: "Lỗi tải ảnh",
        description: "Không thể tải ảnh lên. Vui lòng thử lại.",
        variant: "destructive",
        duration: 3000
      });
      
      // Reset file input nếu upload thất bại
      setImageFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng đăng nhập lại",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Nếu có file ảnh mới chưa được upload, upload trước
      let finalAvatarPath = avatar;
      
      if (imageFile && !avatar.startsWith('/placeholder/400/')) {
        console.log("Đang upload ảnh mới...");
        const formData = new FormData();
        formData.append("image", imageFile);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadResult = await uploadRes.json();
          if (uploadResult.success && uploadResult.filePath) {
            finalAvatarPath = uploadResult.filePath;
            console.log("Ảnh đã được upload:", finalAvatarPath);
          }
        } else {
          console.warn("Không thể upload ảnh, sử dụng ảnh hiện tại");
        }
      }
      
      // Chuẩn bị dữ liệu cập nhật
      const updateData = {
        fullname: fullName || "",
        phoneNumber: phoneNumber || "",
        birthday: birthday ? new Date(birthday).toISOString() : null,
        avatar: finalAvatarPath || ""
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
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (data.statusCode === 1) {
        // Cập nhật thành công
        await refreshUser();
        
        // Cập nhật state local với dữ liệu mới
        setAvatar(finalAvatarPath);
        
        toast({
          title: "Cập nhật thành công",
          description: "Thông tin cá nhân của bạn đã được cập nhật",
          duration: 3000
        });
        
        // Reset imageFile sau khi thành công
        setImageFile(null);
        
        // Điều hướng về trang edit (theo yêu cầu của bạn)
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center mb-6">
        <Link 
          href="/" 
          className="p-2 mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Chỉnh sửa thông tin cá nhân</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <Avatar className="w-24 h-24 border-2 border-white shadow">
              {avatar || imageFile ? (
                <AvatarImage 
                  src={imageFile ? URL.createObjectURL(imageFile) : avatar} 
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

        {/* Thông tin cá nhân */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-medium mb-4">Thông tin cá nhân</h3>
          <Separator className="mb-4" />
          
          <div className="space-y-4">
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
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                required
              />
            </div>
            
            {/* Email - Disabled */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-gray-100 text-gray-500 cursor-not-allowed"
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
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
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
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/profle")}
            disabled={isLoading}
            className="flex-1"
          >
            Hủy
          </Button>
          
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 flex-1"
            disabled={isLoading || isUploading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang cập nhật...
              </>
            ) : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}