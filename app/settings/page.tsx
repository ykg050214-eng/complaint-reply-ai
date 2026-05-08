'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Organization {
  id: string;
  name: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyMasked, setApiKeyMasked] = useState('');
  const [apiKeyHasKey, setApiKeyHasKey] = useState(false);
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyMsg, setApiKeyMsg] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchOrganizations();
    }
  }, [session]);

  useEffect(() => {
    if (selectedOrg) {
      fetchApiKey();
    }
  }, [selectedOrg]);

  const fetchOrganizations = async () => {
    const res = await fetch('/api/organizations');
    if (res.ok) {
      const data = await res.json();
      setOrganizations(data);
      if (data.length > 0) setSelectedOrg(data[0].id);
    }
  };

  const fetchApiKey = async () => {
    setApiKeyMasked('');
    setApiKeyHasKey(false);
    const res = await fetch(`/api/organizations/apikey?organizationId=${selectedOrg}`);
    if (res.ok) {
      const data = await res.json();
      setApiKeyHasKey(data.hasKey);
      setApiKeyMasked(data.maskedKey || '');
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setApiKeySaving(true);
    setApiKeyMsg('');
    try {
      const res = await fetch('/api/organizations/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: selectedOrg, apiKey: apiKeyInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiKeyMsg('APIキーを保存しました。');
        setApiKeyInput('');
        fetchApiKey();
      } else {
        setApiKeyMsg(data.error || '保存に失敗しました。');
      }
    } catch {
      setApiKeyMsg('エラーが発生しました。');
    } finally {
      setApiKeySaving(false);
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

      {organizations.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">組織を選択</label>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-1">🔑 Anthropic API キー設定</h2>
        <p className="text-sm text-gray-600 mb-3">
          組織専用の Anthropic API キーをここで設定・変更できます。設定したキーはこの組織のリクエストにのみ使用されます。
        </p>

        {selectedOrg ? (
          <>
            {apiKeyHasKey ? (
              <div className="flex items-center gap-2 mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                <span>✅</span>
                <span>APIキーが設定されています: <span className="font-mono">{apiKeyMasked}</span></span>
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
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={apiKeyHasKey ? 'キーを更新する場合は入力' : 'sk-ant-...'}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono"
              />
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim() || apiKeySaving}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                {apiKeySaving ? '保存中...' : '保存'}
              </button>
            </div>

            {apiKeyMsg && (
              <p className={`mt-2 text-sm ${apiKeyMsg.includes('保存しました') ? 'text-green-600' : 'text-red-600'}`}>
                {apiKeyMsg}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">組織を選択してください。</p>
        )}
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
        <p className="font-semibold mb-2">⚠️ 重要な注意事項</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>このアプリはご自身の Anthropic API キーを使用します。</li>
          <li>API 利用料金はご自身の Anthropic アカウントに発生します。</li>
          <li>キーはデータベースに保存され、この組織のリクエストにのみ使用されます。</li>
          <li>Anthropic のダッシュボードで使用量を確認できます。</li>
        </ul>
      </div>
    </main>
    </div>
  );
}