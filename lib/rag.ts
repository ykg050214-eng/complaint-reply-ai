import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';

export async function retrieveRelevantChunks(
  query: string,
  organizationId: string,
  geminiApiKey: string,
  topK = 5
): Promise<string[]> {
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const embModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const embResult = await embModel.embedContent(query);
    const queryEmbedding = embResult.embedding.values;

    const results = await prisma.$queryRawUnsafe<{ content: string; similarity: number }[]>(
      `SELECT dc.content, 1 - (dc.embedding <=> $1::vector) as similarity
       FROM "DocumentChunk" dc
       JOIN "KnowledgeDocument" kd ON dc."documentId" = kd.id
       WHERE kd."organizationId" = $2
         AND dc.embedding IS NOT NULL
         AND kd.status = 'ready'
       ORDER BY dc.embedding <=> $1::vector
       LIMIT $3`,
      JSON.stringify(queryEmbedding),
      organizationId,
      topK
    );

    return results.filter((r) => r.similarity > 0).map((r) => r.content);
  } catch {
    return [];
  }
}
