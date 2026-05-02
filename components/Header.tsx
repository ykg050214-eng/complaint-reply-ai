import Link from 'next/link';
import { MessageSquareWarning } from 'lucide-react';
export default function Header() {
  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
          <MessageSquareWarning className="w-6 h-6" />
          <span>クレーム返信AI</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:opacity-80 transition-opacity">トップ</Link>
          <Link href="/history" className="hover:opacity-80 transition-opacity">履歴</Link>
          <Link href="/settings" className="hover:opacity-80 transition-opacity">設定</Link>
        </nav>
      </div>
    </header>
  );
}