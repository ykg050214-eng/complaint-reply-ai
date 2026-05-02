import { AlertCircle, CheckCircle, Info } from 'lucide-react';
interface AlertBoxProps { type: 'error' | 'success' | 'info' | 'warning'; message: string; }
export default function AlertBox({ type, message }: AlertBoxProps) {
  const styles = { error: 'bg-red-50 border-red-200 text-red-800', success: 'bg-green-50 border-green-200 text-green-800', info: 'bg-blue-50 border-blue-200 text-blue-800', warning: 'bg-yellow-50 border-yellow-200 text-yellow-800' };
  const icons = { error: <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />, success: <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />, info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />, warning: <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" /> };
  return (
    <div className={`flex items-start gap-3 p-4 border rounded-lg ${styles[type]}`}>
      {icons[type]}
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  );
}