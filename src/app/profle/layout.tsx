import React, { ReactNode } from "react";
import Link from "next/link";
import { 
  Pencil, 
  Link as LinkIcon,
  LayoutGrid,
  User,
  Bookmark,
  Users,
  GraduationCap,
  History,
  Settings
} from "lucide-react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 ml-24">
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="space-y-4 px-3">
            <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center text-2xl font-semibold text-yellow-800">
              LV
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Lăng Văn</h2>
              <p className="text-sm text-gray-500">Add your short bio</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavLink href="/profile" icon={<LayoutGrid className="w-4 h-4" />}>
              Contribution
            </NavLink>
            <NavLink href="/profile/about" icon={<User className="w-4 h-4" />}>
              About
            </NavLink>
            <NavLink href="/profile/saved" icon={<Bookmark className="w-4 h-4" />} active>
              Saved
            </NavLink>
            <NavLink href="/profile/following" icon={<Users className="w-4 h-4" />}>
              Following
            </NavLink>
            <NavLink href="/profile/learning" icon={<GraduationCap className="w-4 h-4" />}>
              Learning
            </NavLink>
            <NavLink href="/profile/history" icon={<History className="w-4 h-4" />}>
              Viewing history
            </NavLink>
            <NavLink href="/profile/settings" icon={<Settings className="w-4 h-4" />}>
              Settings
            </NavLink>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl ml-3 mr-auto p-5">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 mb-6">
            <Link
              href="/profile/edit"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit profile
            </Link>
            
          </div>

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
  icon,
  active = false 
}: { 
  href: string;
  children: ReactNode;
  icon: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center pl-6 pr-3 py-2 text-sm rounded-lg transition-colors gap-3 ${
        active 
          ? "bg-yellow-50 text-yellow-800 font-medium" 
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}