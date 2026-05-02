export interface GenerateRequest {
  complaintText: string; industry: string; channel: string; tone: string; stance: string;
  extraInfo?: string; companyName?: string; customerName?: string;
}
const VALID_INDUSTRIES = ['スクール・教室','店舗・飲食','美容・サロン','EC・通販','営業・法人対応','不動産','医療・整体','士業・コンサル','その他'];
const VALID_CHANNELS = ['メール','LINE','チャット','口コミ返信','電話後のフォロー文','社内共有文'];
const VALID_TONES = ['とても丁寧','やわらかい','誠実','簡潔','やや毅然'];
const VALID_STANCES = ['全面的に謝罪','謝罪しつつ説明','事実確認を挟む','必要以上に謝らない','毅然と対応'];
export function validateGenerateRequest(body: unknown): { valid: boolean; error?: string; data?: GenerateRequest } {
  if (!body || typeof body !== 'object') return { valid: false, error: 'リクエスト形式が正しくありません。' };
  const b = body as Record<string, unknown>;
  if (!b.complaintText || typeof b.complaintText !== 'string') return { valid: false, error: 'クレーム内容を入力してください。' };
  if ((b.complaintText as string).trim().length < 20) return { valid: false, error: 'クレーム内容を20文字以上で入力してください。' };
  if (!b.industry || !VALID_INDUSTRIES.includes(b.industry as string)) return { valid: false, error: '業種を選択してください。' };
  if (!b.channel || !VALID_CHANNELS.includes(b.channel as string)) return { valid: false, error: '返信媒体を選択してください。' };
  if (!b.tone || !VALID_TONES.includes(b.tone as string)) return { valid: false, error: 'トーンを選択してください。' };
  if (!b.stance || !VALID_STANCES.includes(b.stance as string)) return { valid: false, error: '返信の強さを選択してください。' };
  return { valid: true, data: { complaintText: (b.complaintText as string).trim(), industry: b.industry as string, channel: b.channel as string, tone: b.tone as string, stance: b.stance as string, extraInfo: typeof b.extraInfo === 'string' ? b.extraInfo : undefined, companyName: typeof b.companyName === 'string' ? b.companyName : undefined, customerName: typeof b.customerName === 'string' ? b.customerName : undefined } };
}