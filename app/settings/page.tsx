'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { CheckCircle2, XCircle, ExternalLink, Key, AlertTriangle } from 'lucide-react';
export default function SettingsPage() {
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    fetch('/api/check-api-key').then(r => r.json()).then(d => setApiConfigured(d.configured)).catch(() => setApiConfigured(false));
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">設定</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-3"><Key className="w-5 h-5 text-blue-600" /><h2 className="font-semibold text-gray-700">OpenAI APIキー設定状況</h2></div>
          {apiConfigured === null ? <p className="text-sm text-gray-400">確認中...</p>
            : apiConfigured
              ? <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-4 py-3"><CheckCircle2 className="w-5 h-5" /><span className="text-sm font-medium">APIキーが設定されています。</span></div>
              : <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg px-4 py-3"><XCircle className="w-5 h-5" /><span className="text-sm font-medium">APIキーが設定されていません。Vercelの環境変数に設定してください。</span></div>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">環境変数の設定方法</h2>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">1.</span><span>Vercelのダッシュボード → プロジェクト → Settings → Environment Variables</span></li>
            <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">2.</span><span>OPENAI_API_KEY にAPIキーを設定<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-1 ml-2">APIキーを取得 <ExternalLink className="w-3 h-3" /></a></span></li>
            <li className="flex gap-2"><span className="font-bold text-blue-600 flex-shrink-0">3.</span><span>設定後、Vercelでプロジェクトを再デプロイ</span></li>
          </ol>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5 text-yellow-600" /><h2 className="font-semibold text-yellow-700">重要な注意事項</h2></div>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• このアプリはご自身のOpenAI APIキーを使用します。</li>
            <li>• API利用料金はご自身のOpenAIアカウントに発生します。</li>
            <li>• ChatGPT PlusやProへの加入とAPI料金は別です。</li>
            <li>• APIキーは第三者に共有しないでください。</li>
          </ul>
        </div>
      </main>
    </div>
  );
}