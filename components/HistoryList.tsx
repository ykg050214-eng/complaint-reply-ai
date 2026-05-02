'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Trash2, ExternalLink, Clock } from 'lucide-react';
import EmptyState from './EmptyState';
interface HistoryItem { id: string; complaintText: string; industry: string; channel: string; tone: string; stance: string; createdAt: string; }
interface HistoryListProps { items: HistoryItem[]; onDelete: (id: string) => void; }
export default function HistoryList({ items, onDelete }: HistoryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const handleDelete = async (id: string) => {
    if (!confirm('この履歴を削除しますか？')) return;
    setDeletingId(id);
    try { const res = await fetch(`/api/history/${id}`, { method: 'DELETE' }); if (res.ok) onDelete(id); else alert('削除に失敗しました。'); }
    catch { alert('削除に失敗しました。'); } finally { setDeletingId(null); }
  };
  if (items.length === 0) return <EmptyState />;
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 font-medium truncate mb-2">{item.complaintText.slice(0, 60)}{item.complaintText.length > 60 ? '...' : ''}</p>
              <div className="flex flex-wrap gap-2 mb-2">{[item.industry, item.channel, item.tone, item.stance].map((tag, i) => (<span key={i} className="inline-block bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{tag}</span>))}</div>
              <div className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" />{new Date(item.createdAt).toLocaleString('ja-JP')}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/history/${item.id}`} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-2 py-1.5 transition-colors"><ExternalLink className="w-3 h-3" />詳細</Link>
              <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded-lg px-2 py-1.5 transition-colors disabled:opacity-50"><Trash2 className="w-3 h-3" />{deletingId === item.id ? '...' : '削除'}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
