export const DOCUMENT_ACCEPT = ".pdf,.docx,.xlsx,.csv,.md,.txt,.json";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

type FileCategory =
  | "pdf"
  | "word"
  | "excel"
  | "csv"
  | "markdown"
  | "text"
  | "json"
  | "image"
  | "unknown";

export function getFileCategory(mediaType: string): FileCategory {
  if (mediaType === "application/pdf") return "pdf";
  if (
    mediaType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mediaType === "application/msword"
  )
    return "word";
  if (
    mediaType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mediaType === "application/vnd.ms-excel"
  )
    return "excel";
  if (mediaType === "text/csv") return "csv";
  if (mediaType === "text/markdown") return "markdown";
  if (mediaType === "text/plain") return "text";
  if (mediaType === "application/json") return "json";
  if (mediaType.startsWith("image/")) return "image";
  return "unknown";
}

export function getFileCategoryLabel(category: FileCategory): string {
  const labels: Record<FileCategory, string> = {
    pdf: "PDF",
    word: "Word",
    excel: "Excel",
    csv: "CSV",
    markdown: "Markdown",
    text: "Text",
    json: "JSON",
    image: "Image",
    unknown: "File",
  };
  return labels[category];
}

export function validateFileSize(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `${file.name} is ${sizeMB}MB — max allowed is 10MB`;
  }
  return null;
}

export function extractDocumentMetadata(
  responseText: string,
  filename: string,
): string {
  // Extract first meaningful sentence referencing the document content
  const sentences = responseText
    .replace(/[#*_`]/g, "")
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 120);

  if (sentences.length > 0) {
    return sentences[0];
  }
  return filename;
}
