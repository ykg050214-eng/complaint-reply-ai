'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HistoryList from '@/components/HistoryList';
import { History } from 'lucide-react';
interface HistoryItem { id: string; complaintText: string; industry: string; channel: string; tone: string; stance: string; createdAt: string; }
export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/history').then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => { setError('履歴の取得に失敗しました。'); setLoading(false); });
  }, []);
  const handleDelete = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <History className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">生成履歴</h1>
          {!loading && <span className="text-sm text-gray-400 ml-auto">{items.length}件</span>}
        </div>
        {loading ? <div className="text-center py-16 text-gray-400 text-sm">読み込み中...</div>
          : error ? <div className="text-center py-16 text-red-500 text-sm">{error}</div>
          : <HistoryList items={items} onDelete={handleDelete} />}
      </main>
    </div>
  );
}