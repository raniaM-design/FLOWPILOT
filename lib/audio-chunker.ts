/**
 * Taille recommandée par chunk pour rester sous la limite Vercel (~4,5 Mo).
 * `splitAudioIntoChunks` garde un défaut de 10 Mo ; l’UI doit appeler avec cette constante.
 */
export const CHUNK_SIZE_MB_FOR_VERCEL = 4;

export function splitAudioIntoChunks(
  file: File,
  chunkSizeMB: number = 10
): Blob[] {
  const chunkSizeBytes = Math.floor(chunkSizeMB * 1024 * 1024);
  if (chunkSizeBytes <= 0) {
    throw new Error("chunkSizeMB doit être positif");
  }

  const chunks: Blob[] = [];
  let offset = 0;

  while (offset < file.size) {
    const end = Math.min(offset + chunkSizeBytes, file.size);
    const slice = file.slice(offset, end);
    chunks.push(slice);
    offset = end;
  }

  return chunks;
}
