import CopyButton from './CopyButton';
import { Lightbulb, AlertTriangle, MessageCircle } from 'lucide-react';
interface ResultCardProps { generatedReply: string; replyIntent: string; improvementPoints: string; ngExpressions: string; }
export default function ResultCard({ generatedReply, replyIntent, improvementPoints, ngExpressions }: ResultCardProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-800">おすすめ返信文</h3></div>
          <CopyButton text={generatedReply} />
        </div>
        <div className="bg-gray-50 rounded-lg p-4"><p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{generatedReply}</p></div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">💬 返信文の意図</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{replyIntent}</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2"><Lightbulb className="w-4 h-4 text-blue-500" /><h4 className="text-sm font-semibold text-blue-700">改善ポイント</h4></div>
        <p className="text-sm text-blue-700 leading-relaxed">{improvementPoints}</p>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-500" /><h4 className="text-sm font-semibold text-red-700">避けた方がいい表現</h4></div>
        <p className="text-sm text-red-700 leading-relaxed">{ngExpressions}</p>
      </div>
    </div>
  );
}