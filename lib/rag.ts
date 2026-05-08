import { prisma } from './prisma';

export async function retrieveRelevantChunks(
  query: string,
  organizationId: string,
  _apiKey?: string,
  topK = 5
): Promise<string[]> {
  try {
    const keywords = query
      .split(/[\s、。，．！？!?]+/)
      .filter((k) => k.length > 1)
      .slice(0, 6);

    if (keywords.length === 0) return [];

    const conditions = keywords.map((_, i) => `dc.content ILIKE $${i + 2}`).join(' OR ');
    const params: unknown[] = [organizationId, ...keywords.map((k) => `%${k}%`), topK];

    const results = await prisma.$queryRawUnsafe<{ content: string }[]>(
      `SELECT DISTINCT dc.content
       FROM "DocumentChunk" dc
       JOIN "KnowledgeDocument" kd ON dc."documentId" = kd.id
       WHERE kd."organizationId" = $1
         AND kd.status = 'ready'
         AND (${conditions})
       LIMIT $${keywords.length + 2}`,
      ...params
    );

    return results.map((r) => r.content);
  } catch {
    return [];
  }
}
