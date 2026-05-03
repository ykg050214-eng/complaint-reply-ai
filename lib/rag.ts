import OpenAI from 'openai';
import { prisma } from './prisma';

export async function retrieveRelevantChunks(
  query: string,
  organizationId: string,
  openai: OpenAI,
  topK = 5
): Promise<string[]> {
  try {
    const embRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = embRes.data[0].embedding;

    const results = await prisma.$queryRawUnsafe<Array<{ content: string; similarity: number }>>(
      `
      SELECT dc.content, 1 - (dc.embedding <=> $1::vector) as similarity
      FROM "DocumentChunk" dc
      JOIN "KnowledgeDocument" kd ON dc."documentId" = kd.id
      WHERE kd."organizationId" = $2
        AND dc.embedding IS NOT NULL
        AND kd.status = 'ready'
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $3
      `,
      JSON.stringify(queryEmbedding),
      organizationId,
      topK
    );

    return results.filter(r => r.similarity > 0.3).map(r => r.content);
  } catch {
    return [];
  }
}
