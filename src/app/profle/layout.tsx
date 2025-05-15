

"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Pencil,
  LayoutGrid,
  User,
  Bookmark,
  Settings
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const { user, token, refreshUser } = useAuth();
  const [fullNameChange, setFullNameChange] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatar, setAvatar] = useState("");
  const { toast } = useToast();
  const [isOpen, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Update form data whenever user data changes
  useEffect(() => {
    console.log("Thông tin: " + user?.birthday);
    if (user) {
      setFullNameChange(user.fullname || "");
      setPhoneNumber(user.phonenumber || "");

      if (user.birthday) {
        const formattedBirthday = new Date(user.birthday)
          .toISOString()
          .split("T")[0];
        setBirthday(formattedBirthday);
      }

      setAvatar(user.avatar ? "Chọn ảnh mới" : "");
    }
  }, [user]);

  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let finalImagePath = avatar; // Dùng avatar ban đầu nếu không có file mới

    // Nếu có file ảnh, tiến hành upload file
    if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", imageFile);
        try {
            const uploadRes = await fetch("/api/upload", { // Thay đổi API endpoint nếu cần
                method: "POST",
                body: imageFormData,
            });
            const uploadResult = await uploadRes.json();
            if (uploadRes.ok) {
                finalImagePath = uploadResult.filePath;
            } else {
                console.error("Image upload failed:", uploadResult.error);
                toast({
                    title: "Upload Failed",
                    description: "Failed to upload avatar",
                    duration: 2000
                })
                return;
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            toast({
                    title: "Upload Error",
                    description: "An error occurred while uploading your avatar",
                    duration: 2000
                })
            return;
        }
    }

    if (!token) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        duration: 2000
      });
      return;
    }

    const updateData = {
      fullName: fullNameChange,
      phoneNumber: phoneNumber,
      birthday,
      avatar
    };

    try {
      const res = await fetch("http://localhost:5000/api/User/UpdateUserInfor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      }).then((data) => data.json()).then((data) => {
        if (data.statusCode === 1) {
          // First close the dialog
          setOpen(false);
  
          // Then refresh the user data
          refreshUser();
  
          // Finally show the success toast
          toast({
            title: "Profile Updated",
            description: "Your profile information has been updated successfully",
            duration: 2000
          });
        } else {
          toast({
            title: "Update Failed",
            description: data.message || "Failed to update profile information",
            duration: 2000
          });
        }
      });


      
    } catch (err) {
      console.error("Error updating profile:", err);
      toast({
        title: "Error",
        description: "An error occurred while updating your profile",
        duration: 2000
      });
    }


    
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 ml-24">
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="space-y-4 px-3">
          <Avatar className="w-24 h-24">
                            {user?.avatar ? (
                                <AvatarImage src={user.avatar} alt={user.fullname} />
                            ) : (
                                <AvatarFallback>
                                    {user?.fullname?.slice(0, 2).toUpperCase() || "LV"}
                                </AvatarFallback>
                            )}
                        </Avatar>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{user?.fullname || "Loading..."}</h2>
              <p className="text-sm text-gray-500">Add your short bio</p>
            </div>
          </div>
          {/* Navigation */}
          <nav className="space-y-1">
            <NavLink href="/profle/contributor" icon={<LayoutGrid className="w-4 h-4" />}>
              Contribution
            </NavLink>
            <NavLink href="/profle/saved" icon={<Bookmark className="w-4 h-4" />}>
              Saved
            </NavLink>
          </nav>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl ml-3 mr-auto p-5">
          {/* Header Actions */}
          <Dialog open={isOpen} onOpenChange={setOpen}>
            <div className="flex justify-end gap-2 mb-6">
              <DialogTrigger asChild>
                <button className="inline-flex items-center text-gray-600 hover:text-gray-900">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit profile
                </button>
              </DialogTrigger>
            </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thông tin cá nhân</DialogTitle>
                <DialogDescription>
                  Chỉnh sửa thông tin cá nhân của bạn tại đây.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fullNameChange" className="text-right">
                      Full name
                    </Label>
                    <Input
                      id="fullNameChange"
                      value={fullNameChange}
                      onChange={(e) => setFullNameChange(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phoneNumber" className="text-right">
                      Phone number
                    </Label>
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  {/* Phần chọn ngày sinh */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="birthday" className="text-right">
                      Birthday
                    </Label>
                    <Input
                      type="date"
                      id="birthday"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  {/* Phần chọn ảnh đại diện */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="avatar" className="text-right">
                      Avatar
                    </Label>
                    <Input
                      type="file"
                      id="avatar"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const fileName = e.target.files[0].name;
                          setAvatar(`/placeholder/400/${fileName}`);
                          setImageFile(e.target.files[0]);
                        }
                      }}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Close
                    </Button>
                  </DialogClose>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          {/* Page Content */}
          {children}
        </div>
      </main>
    </div>
  );
}

// Helper component for navigation links
function NavLink({
  href,
  children,
  icon
}: {
  href: string;
  children: ReactNode;
  icon: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center pl-6 pr-3 py-2 text-sm rounded-lg transition-colors gap-3 ${active ? "bg-yellow-50 text-yellow-800 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
    >
      {icon}
      {children}
    </Link>
  );
}
