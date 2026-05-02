'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import ResultCard from '@/components/ResultCard';
import { ArrowLeft, Trash2, Clock } from 'lucide-react';
interface ComplaintResponse { id: string; complaintText: string; industry: string; channel: string; tone: string; stance: string; extraInfo: string | null; companyName: string | null; customerName: string | null; generatedReply: string; replyIntent: string; improvementPoints: string; ngExpressions: string; modelName: string; createdAt: string; }
export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<ComplaintResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/history/${params.id}`).then(r => r.json()).then(d => { setRecord(d); setLoading(false); }).catch(() => { setError('履歴の取得に失敗しました。'); setLoading(false); });
  }, [params.id]);
  const handleDelete = async () => {
    if (!confirm('この履歴を削除しますか？')) return;
    setDeleting(true);
    try { await fetch(`/api/history/${params.id}`, { method: 'DELETE' }); router.push('/history'); }
    catch { alert('削除に失敗しました。'); setDeleting(false); }
  };
  const lc = "text-xs font-medium text-gray-500 uppercase tracking-wide";
  const vc = "text-sm text-gray-800 mt-0.5";
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/history" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"><ArrowLeft className="w-4 h-4" />履歴一覧に戻る</Link>
          {record && <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-lg px-3 py-1.5 disabled:opacity-50"><Trash2 className="w-4 h-4" />{deleting ? '削除中...' : '削除'}</button>}
        </div>
        {loading ? <div className="text-center py-16 text-gray-400 text-sm">読み込み中...</div>
          : error ? <div className="text-center py-16 text-red-500 text-sm">{error}</div>
          : record ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="font-semibold text-gray-700 mb-4">入力情報</h2>
                <div className="space-y-3">
                  <div><p className={lc}>クレーム内容</p><p className={`${vc} whitespace-pre-wrap bg-gray-50 rounded-lg p-3 mt-1`}>{record.complaintText}</p></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className={lc}>業種</p><p className={vc}>{record.industry}</p></div>
                    <div><p className={lc}>返信媒体</p><p className={vc}>{record.channel}</p></div>
                    <div><p className={lc}>トーン</p><p className={vc}>{record.tone}</p></div>
                    <div><p className={lc}>返信の強さ</p><p className={vc}>{record.stance}</p></div>
                  </div>
                  {record.extraInfo && <div><p className={lc}>補足情報</p><p className={vc}>{record.extraInfo}</p></div>}
                  {record.companyName && <div><p className={lc}>会社名・店舗名</p><p className={vc}>{record.companyName}</p></div>}
                  {record.customerName && <div><p className={lc}>相手の呼び方</p><p className={vc}>{record.customerName}</p></div>}
                  <div className="flex items-center gap-1 text-xs text-gray-400 pt-1"><Clock className="w-3 h-3" />{new Date(record.createdAt).toLocaleString('ja-JP')} ／ モデル：{record.modelName}</div>
                </div>
              </div>
              <ResultCard generatedReply={record.generatedReply} replyIntent={record.replyIntent} improvementPoints={record.improvementPoints} ngExpressions={record.ngExpressions} />
            </div>
          ) : null}
      </main>
    </div>
  );
}