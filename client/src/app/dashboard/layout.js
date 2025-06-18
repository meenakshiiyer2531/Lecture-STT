import Link from "next/link";
import "../globals.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-black">
      <aside className="w-64 bg-black text-white p-4 flex flex-col justify-between">
        {/* Top Section: Logo and Nav */}
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <Link
             href="/dashboard/courses">
            <img src="/logo1.png" alt="Logo" className="w-30 h-30 rounded-md" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <Link
              href="/dashboard/courses"
              className="block px-3 py-2 rounded-md hover:bg-purple-600 hover:text-white transition duration-200"
            >
              📚 Courses
            </Link>
            <Link
              href="/dashboard/ask-me-bot"
              className="block px-3 py-2 rounded-md hover:bg-purple-600 hover:text-white transition duration-200"
            >
              🤖 Ask Me Bot
            </Link>
          </nav>
        </div>

        {/* Logout at Bottom */}
        <div>
          <Link
            href="/"
            className="block px-3 py-2 rounded-md text-red-300 hover:bg-red-600 hover:text-white transition duration-200"
          >
            🚪 Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-scroll bg-gray-50">
        {children}
      </main>
    </div>
  );
}
