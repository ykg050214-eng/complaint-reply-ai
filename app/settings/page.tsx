'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [keyInput, setKeyInput] = useState('');
  const [keyMasked, setKeyMasked] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  useEffect(() => {
    if (session?.user) fetchKey();
  }, [session]);

  const fetchKey = async () => {
    const res = await fetch('/api/user/apikey');
    if (res.ok) {
      const data = await res.json();
      setHasKey(data.hasKey);
      setKeyMasked(data.maskedKey || '');
    }
  };

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/user/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('APIキーを保存しました。');
        setKeyInput('');
        fetchKey();
      } else {
        setMsg(data.error || '保存に失敗しました。');
      }
    } catch {
      setMsg('エラーが発生しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/user/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: null }),
      });
      if (res.ok) {
        setMsg('APIキーを削除しました。');
        setKeyInput('');
        fetchKey();
      }
    } catch {
      setMsg('エラーが発生しました。');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">設定</h1>

        <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h2 className="text-lg font-semibold mb-1">🔑 Gemini API キー設定</h2>
          <p className="text-sm text-gray-600 mb-3">
            あなた専用の Gemini API キーを設定します。設定すると、あなたのリクエストにはこのキーが使用されます。
          </p>

          {hasKey ? (
            <div className="flex items-center gap-2 mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              <span>✅</span>
              <span>APIキーが設定されています: <span className="font-mono">{keyMasked}</span></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
              <span>⚠️</span>
              <span>APIキーが設定されていません。</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={hasKey ? 'キーを更新する場合は入力' : 'AIza...'}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono bg-white"
            />
            <button
              onClick={handleSave}
              disabled={!keyInput.trim() || saving}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            {hasKey && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-100 text-red-700 border border-red-300 px-3 py-2 rounded text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                削除
              </button>
            )}
          </div>

          {msg && (
            <p className={`mt-2 text-sm ${msg.includes('保存しました') || msg.includes('削除しました') ? 'text-green-600' : 'text-red-600'}`}>
              {msg}
            </p>
          )}
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <p className="font-semibold mb-2">⚠️ 重要な注意事項</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>API 利用料金はご自身の Gemini アカウントに発生します。</li>
            <li>キーはデータベースに保存されます。</li>
            <li>Gemini のダッシュボードで使用量を確認できます。</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
