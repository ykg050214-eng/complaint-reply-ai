'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Organization {
  id: string;
  name: string;
}

interface KnowledgeDocument {
  id: string;
  title: string;
  fileType: string;
  createdAt: string;
}

export default function KnowledgePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');


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
      fetchDocuments();
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

  const fetchDocuments = async () => {
    const res = await fetch(`/api/knowledge?organizationId=${selectedOrg}`);
    if (res.ok) {
      const data = await res.json();
      setDocuments(data);
    }
  };


  const handleUpload = async () => {
    if (!selectedOrg) return;
    setUploading(true);
    setUploadMsg('');

    try {
      const formData = new FormData();
      formData.append('organizationId', selectedOrg);

      if (activeTab === 'url') {
        if (!urlInput.trim()) {
          setUploadMsg('URLを入力してください。');
          setUploading(false);
          return;
        }
        formData.append('type', 'url');
        formData.append('url', urlInput);
      } else {
        if (!fileInput) {
          setUploadMsg('ファイルを選択してください。');
          setUploading(false);
          return;
        }
        const ext = fileInput.name.split('.').pop()?.toLowerCase();
        const fileType = ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : 'txt';
        formData.append('type', fileType);
        formData.append('file', fileInput);
      }

      const res = await fetch('/api/knowledge', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadMsg('アップロードが完了しました。');
        setUrlInput('');
        setFileInput(null);
        fetchDocuments();
      } else {
        setUploadMsg(data.error || 'アップロードに失敗しました。');
      }
    } catch {
      setUploadMsg('エラーが発生しました。');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('このドキュメントを削除しますか？')) return;
    const res = await fetch(`/api/knowledge/${docId}`, { method: 'DELETE' });
    if (res.ok) fetchDocuments();
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">ナレッジ管理</h1>

      {organizations.length === 0 ? (
        <p className="text-gray-500">組織が見つかりません。まず組織を作成してください。</p>
      ) : (
        <>
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

          {/* ドキュメントアップロード */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>📄</span> ドキュメントを追加
            </h2>

            <div className="flex gap-2 mb-4">
              {(['file', 'url'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded text-sm font-medium ${
                    activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab === 'file' ? 'ファイル' : 'URL'}
                </button>
              ))}
            </div>

            {activeTab === 'file' ? (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">PDFルDOCXルTXT ファイルに対応</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                  className="text-sm"
                />
              </div>
            ) : (
              <div className="mb-3">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/page"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 w-full"
            >
              {uploading ? 'アップロード中...' : 'アップロード'}
            </button>
            {uploadMsg && <p className="mt-2 text-sm text-gray-700">{uploadMsg}</p>}
          </div>

          {/* ドキュメント一覧 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">登録済みドキュメント</h2>
            {documents.length === 0 ? (
              <p className="text-gray-500 text-sm">ドキュメントがありません。</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-gray-500">{doc.fileType} · {new Date(doc.createdAt).toLocaleDateString('ja-JP')}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* プライバシーについて */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-1">🔒 データの取り扱いについて</p>
            <p>アップロードされたドキュメントはこのアプリのデータベースに保存され、AIへの問い合わせ時には関連する一部の情報のみが送信されます。ドキュメント全体がAIに送られることはありません。</p>
          </div>
        </>
      )}
      </main>
    </div>
  );
}
