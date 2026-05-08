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

  // 個人APIキー
  const [personalKeyInput, setPersonalKeyInput] = useState('');
  const [personalKeyMasked, setPersonalKeyMasked] = useState('');
  const [personalKeyHasKey, setPersonalKeyHasKey] = useState(false);
  const [personalKeySaving, setPersonalKeySaving] = useState(false);
  const [personalKeyMsg, setPersonalKeyMsg] = useState('');

  // 組織APIキー
  const [orgKeyInput, setOrgKeyInput] = useState('');
  const [orgKeyMasked, setOrgKeyMasked] = useState('');
  const [orgKeyHasKey, setOrgKeyHasKey] = useState(false);
  const [orgKeySaving, setOrgKeySaving] = useState(false);
  const [orgKeyMsg, setOrgKeyMsg] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchOrganizations();
      fetchPersonalKey();
    }
  }, [session]);

  useEffect(() => {
    if (selectedOrg) {
      fetchOrgKey();
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

  const fetchPersonalKey = async () => {
    setPersonalKeyMasked('');
    setPersonalKeyHasKey(false);
    const res = await fetch('/api/user/apikey');
    if (res.ok) {
      const data = await res.json();
      setPersonalKeyHasKey(data.hasKey);
      setPersonalKeyMasked(data.maskedKey || '');
    }
  };

  const fetchOrgKey = async () => {
    setOrgKeyMasked('');
    setOrgKeyHasKey(false);
    const res = await fetch(`/api/organizations/apikey?organizationId=${selectedOrg}`);
    if (res.ok) {
      const data = await res.json();
      setOrgKeyHasKey(data.hasKey);
      setOrgKeyMasked(data.maskedKey || '');
    }
  };

  const handleSavePersonalKey = async () => {
    if (!personalKeyInput.trim()) return;
    setPersonalKeySaving(true);
    setPersonalKeyMsg('');
    try {
      const res = await fetch('/api/user/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: personalKeyInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setPersonalKeyMsg('個人APIキーを保存しました。');
        setPersonalKeyInput('');
        fetchPersonalKey();
      } else {
        setPersonalKeyMsg(data.error || '保存に失敗しました。');
      }
    } catch {
      setPersonalKeyMsg('エラーが発生しました。');
    } finally {
      setPersonalKeySaving(false);
    }
  };

  const handleDeletePersonalKey = async () => {
    setPersonalKeySaving(true);
    setPersonalKeyMsg('');
    try {
      const res = await fetch('/api/user/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: null }),
      });
      if (res.ok) {
        setPersonalKeyMsg('個人APIキーを削除しました。');
        setPersonalKeyInput('');
        fetchPersonalKey();
      }
    } catch {
      setPersonalKeyMsg('エラーが発生しました。');
    } finally {
      setPersonalKeySaving(false);
    }
  };

  const handleSaveOrgKey = async () => {
    if (!orgKeyInput.trim()) return;
    setOrgKeySaving(true);
    setOrgKeyMsg('');
    try {
      const res = await fetch('/api/organizations/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: selectedOrg, apiKey: orgKeyInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrgKeyMsg('組織APIキーを保存しました。');
        setOrgKeyInput('');
        fetchOrgKey();
      } else {
        setOrgKeyMsg(data.error || '保存に失敗しました。');
      }
    } catch {
      setOrgKeyMsg('エラーが発生しました。');
    } finally {
      setOrgKeySaving(false);
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

        {/* 個人APIキー設定 */}
        <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h2 className="text-lg font-semibold mb-1">🔑 個人 Gemini API キー（推奨）</h2>
          <p className="text-sm text-gray-600 mb-3">
            あなた専用の Gemini API キーを設定します。設定すると、あなたのリクエストにはこのキーが使用されます。
            <br />
            <span className="text-blue-700 font-medium">個人キーは組織キーより優先されます。</span>
          </p>

          {personalKeyHasKey ? (
            <div className="flex items-center gap-2 mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              <span>✅</span>
              <span>個人APIキーが設定されています: <span className="font-mono">{personalKeyMasked}</span></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
              <span>⚠️</span>
              <span>個人APIキーが設定されていません。</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="password"
              value={personalKeyInput}
              onChange={(e) => setPersonalKeyInput(e.target.value)}
              placeholder={personalKeyHasKey ? 'キーを更新する場合は入力' : 'AIza...'}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono bg-white"
            />
            <button
              onClick={handleSavePersonalKey}
              disabled={!personalKeyInput.trim() || personalKeySaving}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 whitespace-nowrap"
            >
              {personalKeySaving ? '保存中...' : '保存'}
            </button>
            {personalKeyHasKey && (
              <button
                onClick={handleDeletePersonalKey}
                disabled={personalKeySaving}
                className="bg-red-100 text-red-700 border border-red-300 px-3 py-2 rounded text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                削除
              </button>
            )}
          </div>

          {personalKeyMsg && (
            <p className={`mt-2 text-sm ${personalKeyMsg.includes('保存しました') || personalKeyMsg.includes('削除しました') ? 'text-green-600' : 'text-red-600'}`}>
              {personalKeyMsg}
            </p>
          )}
        </div>

        {/* 組織APIキー設定（管理者向け） */}
        {organizations.length > 0 && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="text-lg font-semibold mb-1">🏢 組織 Gemini API キー（管理者向け）</h2>
            <p className="text-sm text-gray-600 mb-3">
              組織全体の共有キーを設定します。個人キーが未設定のメンバーはこのキーを使用します。
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">組織を選択</label>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>

            {orgKeyHasKey ? (
              <div className="flex items-center gap-2 mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                <span>✅</span>
                <span>組織APIキーが設定されています: <span className="font-mono">{orgKeyMasked}</span></span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                <span>⚠️</span>
                <span>組織APIキーが設定されていません。</span>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="password"
                value={orgKeyInput}
                onChange={(e) => setOrgKeyInput(e.target.value)}
                placeholder={orgKeyHasKey ? 'キーを更新する場合は入力' : 'AIza...'}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono bg-white"
              />
              <button
                onClick={handleSaveOrgKey}
                disabled={!orgKeyInput.trim() || orgKeySaving}
                className="bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                {orgKeySaving ? '保存中...' : '保存'}
              </button>
            </div>

            {orgKeyMsg && (
              <p className={`mt-2 text-sm ${orgKeyMsg.includes('保存しました') ? 'text-green-600' : 'text-red-600'}`}>
                {orgKeyMsg}
              </p>
            )}
          </div>
        )}

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <p className="font-semibold mb-2">⚠️ 重要な注意事項</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>APIキーの優先順位：個人キー {'>'} 組織キー {'>'} サーバー設定</li>
            <li>API 利用料金はご自身の Gemini アカウントに発生します。</li>
            <li>キーはデータベースに暗号化されて保存されます。</li>
            <li>Gemini のダッシュボードで使用量を確認できます。</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
