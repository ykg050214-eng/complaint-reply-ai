'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { MessageSquareWarning, BookOpen, History, Settings, LogOut, LogIn, User } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: '/', label: '返信生成', icon: MessageSquareWarning },
    { href: '/knowledge', label: 'ナレッジ', icon: BookOpen },
    { href: '/history', label: '履歴', icon: History },
    { href: '/settings', label: '設定', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-gray-800 font-bold text-lg">
            <MessageSquareWarning className="w-5 h-5 text-blue-600" />
            <span className="hidden sm:inline">クレーム返信AI</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <User className="w-3.5 h-3.5" />
                <span className="hidden md:inline truncate max-w-[140px]">
                  {session.user?.name || session.user?.email}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>ログイン</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
