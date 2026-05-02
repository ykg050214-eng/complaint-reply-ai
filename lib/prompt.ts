export interface PromptInput {
  complaintText: string; industry: string; channel: string; tone: string; stance: string;
  extraInfo?: string; companyName?: string; customerName?: string;
}
export function buildSystemPrompt(): string {
  return `あなたは企業のカスタマーサポート責任者であり、クレーム対応、謝罪文作成、炎上防止、顧客心理に詳しい専門家です。\n\nユーザーが入力したクレーム内容に対して、相手の感情に配慮しながら、誠実で丁寧な返信文を作成してください。\n\nただし、以下を必ず守ってください。\n・必要以上に非を認めすぎない\n・法的責任を勝手に認めない\n・返金、補償、無料対応などを勝手に約束しない\n・事実確認が必要な内容は断定しない\n・相手を責めない\n・言い訳に聞こえない\n・感情的な表現を避ける\n・選択された媒体に合う自然な文体にする\n・そのまま送れる完成文にする\n\n必ず以下のJSON形式のみで返してください。\n\n{\n  "generatedReply": "そのまま送れる返信文",\n  "replyIntent": "この返信文がどのような意図で作られているか",\n  "improvementPoints": "この返信文の良いポイントを3つ程度で説明",\n  "ngExpressions": "避けた方がいい表現を3つ程度で説明"\n}`;
}
export function buildUserPrompt(input: PromptInput): string {
  return `以下の条件でクレーム返信文を作成してください。\n\nクレーム内容：\n${input.complaintText}\n\n業種：\n${input.industry}\n\n返信媒体：\n${input.channel}\n\nトーン：\n${input.tone}\n\n返信の強さ：\n${input.stance}\n\n補足情報：\n${input.extraInfo || 'なし'}\n\n会社名・店舗名：\n${input.companyName || 'なし'}\n\n相手の呼び方：\n${input.customerName || 'なし'}\n\n出力条件：\n・相手の不満や不安にまず寄り添う\n・言い訳に聞こえない\n・必要以上に謝罪しすぎない\n・返金、補償、無料対応を勝手に約束しない\n・事実確認が必要な部分は断定しない\n・媒体に合う長さにする\n・ビジネス文として自然にする\n・そのまま送れる完成文にする`;
}