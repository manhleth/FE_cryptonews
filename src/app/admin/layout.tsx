import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Panel</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link href="/admin/accounts" className="block p-2 hover:bg-gray-200 rounded">
                Bảo trì tài khoản
              </Link>
            </li>
            <li>
              <Link href="/admin/news" className="block p-2 hover:bg-gray-200 rounded">
                Bảo trì tin tức
              </Link>
            </li>
            <li>
              <Link href="/admin/category" className="block p-2 hover:bg-gray-200 rounded">
                Bảo trì danh mục bài viết
              </Link>
            </li>
            <li>
              <Link href="/admin/comments" className="block p-2 hover:bg-gray-200 rounded">
                Quản lý bình luận
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
