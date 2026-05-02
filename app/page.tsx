'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ComplaintForm from '@/components/ComplaintForm';
import ResultCard from '@/components/ResultCard';
import AlertBox from '@/components/AlertBox';
import { CheckCircle2 } from 'lucide-react';
interface GenerateResult { id: string; generatedReply: string; replyIntent: string; improvementPoints: string; ngExpressions: string; modelName: string; }
export default function HomePage() {
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    fetch('/api/check-api-key').then(r => r.json()).then(d => setApiConfigured(d.configured)).catch(() => setApiConfigured(false));
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">クレーム返信AI</h1>
          <p className="text-gray-500 mb-1">クレーム内容を入力するだけで、丁寧で誠実な返信文をAIが作成します。</p>
          <p className="text-sm text-gray-400">メール、LINE、口コミ返信、チャット対応などに使える返信文を、業種やトーンに合わせて自動生成します。</p>
        </div>
        {apiConfigured !== null && (
          <div className="mb-6">
            {apiConfigured
              ? <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2"><CheckCircle2 className="w-4 h-4" />OpenAI APIキーが設定されています。</div>
              : <AlertBox type="warning" message="OpenAI APIキーが未設定です。Vercelの環境変数にOPENAI_API_KEYを設定してください。" />}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4 text-base">クレーム情報を入力</h2>
            <ComplaintForm onSuccess={setResult} />
          </div>
          <div>
            {result ? (
              <div>
                <div className="flex items-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5 text-green-500" /><span className="text-sm text-green-600 font-medium">返信文が生成されました（履歴に自動保存）</span></div>
                <ResultCard generatedReply={result.generatedReply} replyIntent={result.replyIntent} improvementPoints={result.improvementPoints} ngExpressions={result.ngExpressions} />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
                <p className="text-sm text-center">左のフォームを入力して<br />「返信文を生成する」を押すと<br />ここに結果が表示されます</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}