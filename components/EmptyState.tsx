import { Inbox } from 'lucide-react';
interface EmptyStateProps { title?: string; description?: string; }
export default function EmptyState({ title = '履歴がありません', description = 'まだ返信文を生成していません。トップページからクレーム内容を入力してください。' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Inbox className="w-16 h-16 mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-500 mb-2">{title}</h3>
      <p className="text-sm text-center max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}