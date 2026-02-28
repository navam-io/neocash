/**
 * Server-side text extraction for DOCX and XLSX files.
 * Uses dynamic imports so these libraries never enter the client bundle.
 */

const MAX_EXTRACTED_CHARS = 50_000; // ~12,500 tokens

export interface ExtractionResult {
  success: boolean;
  text: string;
  truncated: boolean;
  error?: string;
}

/** MIME types we can convert to text (DOCX + XLSX variants) */
export const CONVERTIBLE_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc (legacy, best-effort)
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls (legacy, best-effort)
]);

/** Decode a data URL (data:<mediaType>;base64,<data>) into a Buffer */
function decodeDataUrl(dataUrl: string): Buffer {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) {
    throw new Error("Invalid data URL: missing comma separator");
  }
  const base64Data = dataUrl.slice(commaIndex + 1);
  return Buffer.from(base64Data, "base64");
}

/** Extract plain text from a DOCX buffer using mammoth */
async function extractDocxText(buffer: Buffer): Promise<ExtractionResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });

  let text = result.value.trim();
  let truncated = false;

  if (text.length > MAX_EXTRACTED_CHARS) {
    text = text.slice(0, MAX_EXTRACTED_CHARS) + "\n\n[... content truncated]";
    truncated = true;
  }

  return { success: true, text, truncated };
}

/** Extract text from an XLSX buffer by converting each sheet to CSV */
async function extractXlsxText(buffer: Buffer): Promise<ExtractionResult> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const sheets: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) {
      sheets.push(`## Sheet: ${sheetName}\n${csv}`);
    }
  }

  let text = sheets.join("\n\n").trim();
  let truncated = false;

  if (text.length > MAX_EXTRACTED_CHARS) {
    text = text.slice(0, MAX_EXTRACTED_CHARS) + "\n\n[... content truncated]";
    truncated = true;
  }

  return { success: true, text, truncated };
}

function isDocxMime(mediaType: string): boolean {
  return (
    mediaType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mediaType === "application/msword"
  );
}

function isXlsxMime(mediaType: string): boolean {
  return (
    mediaType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mediaType === "application/vnd.ms-excel"
  );
}

/**
 * Extract text from a file given its data URL and media type.
 * Dispatches to the correct extractor based on MIME type.
 */
export async function extractFileText(
  dataUrl: string,
  mediaType: string,
): Promise<ExtractionResult> {
  try {
    const buffer = decodeDataUrl(dataUrl);

    if (isDocxMime(mediaType)) {
      return await extractDocxText(buffer);
    }
    if (isXlsxMime(mediaType)) {
      return await extractXlsxText(buffer);
    }

    return {
      success: false,
      text: "",
      truncated: false,
      error: `Unsupported media type: ${mediaType}`,
    };
  } catch (err) {
    return {
      success: false,
      text: "",
      truncated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
