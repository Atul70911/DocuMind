

interface Chunk {
  text: string;
  index: number;
}

const CHARS_PER_TOKEN = 4;
const CHUNK_SIZE_TOKENS = 512;
const OVERLAP_TOKENS = 50;

export function chunkText(text: string): Chunk[] {
  const chunkSizeChars = CHUNK_SIZE_TOKENS * CHARS_PER_TOKEN;
  const overlapChars = OVERLAP_TOKENS * CHARS_PER_TOKEN;

  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSizeChars, text.length);
    let chunkEnd = end;

    if (end < text.length) {
      const nextPeriod = text.indexOf('.', end);
      const nextNewline = text.indexOf('\n', end);
      const boundary = [nextPeriod, nextNewline]
        .filter((i) => i !== -1 && i - end < 200)
        .sort((a, b) => a - b)[0];

      if (boundary !== undefined) {
        chunkEnd = boundary + 1;
      }
    }

    const chunkContent = text.slice(start, chunkEnd).trim();

    if (chunkContent.length > 0) {
      chunks.push({ text: chunkContent, index });
      index++;
    }

    const nextStart = chunkEnd - overlapChars;

    start = nextStart > start ? nextStart : chunkEnd;
  }

  return chunks;
}