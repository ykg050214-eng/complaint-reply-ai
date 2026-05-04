'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import {
  Upload, Trash2, FileText, Globe,
  CheckCircle2, AlertCircle, Loader2, Shield,
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  sourceUrl?: string;
}

interface Organization {
  id: string;
  name: string;
  role: string;
}

export default function KnowledgePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [docs, setDocs] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState<'pdf' | 'docx' | 'txt' | 'url'>('pdf');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyMasked, setApiKeyMasked] = useState<string | null>(null);
  const [apiKeyHasKey, setApiKeyHasKey] = useState(false);
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyMsg, setApiKeyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/organizations')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setOrgs(data);
            if (data.length > 0) setSelectedOrgId(data[0].id);
          }
        });
    }
  }, [session]);

  useEffect(() => {
    if (selectedOrgId) {
      fetch(`/api/knowledge?organizationId=${selectedOrgId}`)
        .then(r => r.json())
        .then(setDocs);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    if (!selectedOrgId) return;
    fetch('/api/organizations/apikey?organizationId=' + selectedOrgId)
      .then(r => r.json())
      .then(data => {
        setApiKeyHasKey(data.hasKey);
        setApiKeyMasked(data.maskedKey);
        setApiKeyInput('');
      });
  }, [selectedOrgId]);

  const handleUpload = async () => {
    if (!selectedOrgId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('organizationId', selectedOrgId);
      fd.append('type', type);
      if (type === 'url') fd.append('url', url);
      else if (file) fd.append('file', file);
      const res = await fetch('/api/knowledge', { method: 'POST', body: fd });
      if (res.ok) {
        const doc = await res.json();
        setDocs(prev => [doc, ...prev]);
        setFile(null);
        setUrl('');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ãã®ãã­ã¥ã¡ã³ããåé¤ãã¾ããï¼')) return;
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setCreatingOrg(true);
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newOrgName }),
    });
    const org = await res.json();
    setOrgs(prev => [...prev, { ...org, role: 'owner' }]);
    setSelectedOrgId(org.id);
    setNewOrgName('');
    setCreatingOrg(false);
  };

  const handleSaveApiKey = async () => {
    if (!selectedOrgId) return;
    setApiKeySaving(true);
    setApiKeyMsg(null);
    try {
      const res = await fetch('/api/organizations/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: selectedOrgId, apiKey: apiKeyInput || null }),
      });
      if (res.ok) {
        setApiKeyMsg({ type: 'success', text: 'APIキーを保存しました' });
        setApiKeyHasKey(!!apiKeyInput);
        setApiKeyMasked(apiKeyInput ? 'sk-...' + apiKeyInput.slice(-4) : null);
        setApiKeyInput('');
      } else {
        const err = await res.json();
        setApiKeyMsg({ type: 'error', text: err.error || '保存に失敗しました' });
      }
    } catch {
      setApiKeyMsg({ type: 'error', text: 'ネットワークエラーが発生しました' });
    } finally {
      setApiKeySaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">ãã¬ãã¸ãã¼ã¹ç®¡ç</h1>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">ð ãã©ã¤ãã·ã¼ã«ã¤ãã¦</p>
            <p>
              ã¢ããã­ã¼ããããæå ±ã¯<strong>ãã®ã¢ããªåã®ãã¼ã¿ãã¼ã¹ã«ã®ã¿</strong>ä¿å­ããã¾ãã
              AIçææã¯è³ªåã«é¢é£ããä¸é¨ã®ãã­ã¹ãï¼æå¤§ç´800æå­ï¼ã®ã¿ãOpenAI APIã«éä¿¡ãã¾ãã
              <strong>OpenAIç¤¾ã¯APIã§åãåã£ããã¼ã¿ãå­¦ç¿ã»ä¿å­ãã¾ãã</strong>
              ï¼
              <a
                href="https://openai.com/policies/api-data-usage-policies"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                OpenAIå©ç¨è¦ç´
              </a>
              ããï¼ã
            </p>
          </div>
        </div>

          {/* OpenAI API キー設定 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              OpenAI API キー設定
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              組織専用の OpenAI API キーを設定します。設定すると、この組織のリクエストにのみ使用されます。
            </p>
            {apiKeyHasKey && apiKeyMasked && (
              <p className="text-sm text-gray-600 mb-3">
                現在のキー: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{apiKeyMasked}</span>
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder={apiKeyHasKey ? '新しいキーを入力して上書き' : 'sk-...'}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveApiKey}
                disabled={apiKeySaving || !apiKeyInput}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {apiKeySaving ? '保存中...' : '保存'}
              </button>
            </div>
            {apiKeyMsg && (
              <p className={`mt-2 text-sm ${apiKeyMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {apiKeyMsg.text}
              </p>
            )}
          </div>

        {/* Organization Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">ä¼ç¤¾ã»çµç¹ã®é¸æ</h2>
          {orgs.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {orgs.map(org => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrgId(org.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedOrgId === org.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {org.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={newOrgName}
              onChange={e => setNewOrgName(e.target.value)}
              placeholder="æ°ããä¼ç¤¾åãå¥å..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleCreateOrg()}
            />
            <button
              onClick={handleCreateOrg}
              disabled={creatingOrg || !newOrgName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {creatingOrg ? 'ä½æä¸­...' : 'ä¼ç¤¾ãè¿½å '}
            </button>
          </div>
        </div>

        {selectedOrgId && (
          <>
            {/* Upload Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
              <h2 className="font-semibold text-gray-700 mb-4">ãã­ã¥ã¡ã³ããã¢ããã­ã¼ã</h2>
              <div className="flex gap-2 mb-4">
                {(['pdf', 'docx', 'txt', 'url'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      type === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t === 'url' ? 'ð URL' : t.toUpperCase()}
                  </button>
                ))}
              </div>
              {type === 'url' ? (
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com/about"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
                />
              ) : (
                <input
                  type="file"
                  accept={
                    type === 'pdf' ? '.pdf' : type === 'docx' ? '.docx' : '.txt'
                  }
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm mb-3"
                />
              )}
              <button
                onClick={handleUpload}
                disabled={uploading || (!file && !url)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'ã¢ããã­ã¼ãä¸­...' : 'ã¢ããã­ã¼ã'}
              </button>
            </div>

            {/* Document List */}
            <div className="space-y-3">
              {docs.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {doc.type === 'url' ? (
                      <Globe className="w-5 h-5 text-blue-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 uppercase">{doc.type}</span>
                        {doc.status === 'ready' && (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        )}
                        {doc.status === 'processing' && (
                          <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                        )}
                        {doc.status === 'error' && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                        <span className="text-xs text-gray-400">
                          {doc.status === 'ready'
                            ? 'å®äº'
                            : doc.status === 'processing'
                            ? 'å¦çä¸­'
                            : 'ã¨ã©ã¼'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-400 hover:text-red-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {docs.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">
                  ã¾ã ãã­ã¥ã¡ã³ããããã¾ãã
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
