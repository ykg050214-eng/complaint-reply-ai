'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
interface CopyButtonProps { text: string; className?: string; }
export default function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { alert('コピーに失敗しました。'); }
  };
  return (
    <button onClick={handleCopy} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${copied ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-blue-600 text-white hover:bg-blue-700'} ${className}`}>
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? 'コピーしました' : 'コピー'}
    </button>
  );
}