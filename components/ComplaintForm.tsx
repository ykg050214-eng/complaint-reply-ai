'use client';
import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import AlertBox from './AlertBox';
interface FormData { complaintText: string; industry: string; channel: string; tone: string; stance: string; extraInfo: string; companyName: string; customerName: string; }
interface GenerateResult { id: string; generatedReply: string; replyIntent: string; improvementPoints: string; ngExpressions: string; modelName: string; }
interface ComplaintFormProps { onSuccess: (result: GenerateResult) => void; }
const industries = ['スクール・教室','店舗・飲食','美容・サロン','EC・通販','営業・法人対応','不動産','医療・整体','士業・コンサル','その他'];
const channels = ['メール','LINE','チャット','口コミ返信','電話後のフォロー文','社内共有文'];
const tones = ['とても丁寧','やわらかい','誠実','簡潔','やや毅然'];
const stances = ['全面的に謝罪','謝罪しつつ説明','事実確認を挟む','必要以上に謝らない','毅然と対応'];
export default function ComplaintForm({ onSuccess }: ComplaintFormProps) {
  const [formData, setFormData] = useState<FormData>({ complaintText: '', industry: '', channel: '', tone: '', stance: '', extraInfo: '', companyName: '', customerName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setValidationError(null); setError(null);
    if (formData.complaintText.trim().length < 20) { setValidationError('クレーム内容を20文字以上で入力してください。'); return; }
    if (!formData.industry) { setValidationError('業種を選択してください。'); return; }
    if (!formData.channel) { setValidationError('返信媒体を選択してください。'); return; }
    if (!formData.tone) { setValidationError('トーンを選択してください。'); return; }
    if (!formData.stance) { setValidationError('返信の強さを選択してください。'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '生成に失敗しました。'); return; }
      onSuccess(data);
    } catch { setError('通信エラーが発生しました。もう一度お試しください。'); } finally { setLoading(false); }
  };
  const ic = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const lc = "block text-sm font-medium text-gray-700 mb-1";
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className={lc}>クレーム内容 <span className="text-red-500">*</span></label><textarea value={formData.complaintText} onChange={e => setFormData(p => ({ ...p, complaintText: e.target.value }))} placeholder="例：保護者の方から「説明が足りなかった」「対応が遅かった」とご指摘をいただきました。" className={`${ic} min-h-[120px] resize-y`} required /><p className="text-xs text-gray-400 mt-1">{formData.complaintText.length}文字（20文字以上必要）</p></div>
      <div><label className={lc}>業種 <span className="text-red-500">*</span></label><select value={formData.industry} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))} className={ic} required><option value="">選択してください</option>{industries.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
      <div><label className={lc}>返信媒体 <span className="text-red-500">*</span></label><select value={formData.channel} onChange={e => setFormData(p => ({ ...p, channel: e.target.value }))} className={ic} required><option value="">選択してください</option>{channels.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
      <div><label className={lc}>トーン <span className="text-red-500">*</span></label><select value={formData.tone} onChange={e => setFormData(p => ({ ...p, tone: e.target.value }))} className={ic} required><option value="">選択してください</option>{tones.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
      <div><label className={lc}>返信の強さ <span className="text-red-500">*</span></label><select value={formData.stance} onChange={e => setFormData(p => ({ ...p, stance: e.target.value }))} className={ic} required><option value="">選択してください</option>{stances.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
      <div><label className={lc}>補足情報（任意）</label><textarea value={formData.extraInfo} onChange={e => setFormData(p => ({ ...p, extraInfo: e.target.value }))} placeholder="例：事前にLINEでは案内済みです。" className={`${ic} min-h-[80px] resize-y`} /></div>
      <div><label className={lc}>会社名・店舗名（任意）</label><input type="text" value={formData.companyName} onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))} placeholder="例：SIGNONスクール" className={ic} /></div>
      <div><label className={lc}>相手の呼び方（任意）</label><input type="text" value={formData.customerName} onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))} placeholder="例：〇〇様、保護者様" className={ic} /></div>
      {validationError && <AlertBox type="error" message={validationError} />}
      {error && <AlertBox type="error" message={error} />}
      <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />生成中...</> : <><Send className="w-4 h-4" />返信文を生成する</>}
      </button>
    </form>
  );
}