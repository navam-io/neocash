# Document Extraction

Server-side text extraction for DOCX and XLSX uploads so Claude can reason about document contents.

## Problem

The Anthropic API does not natively support DOCX or XLSX file formats -- only images and PDFs. NeoCash UI already accepted these uploads (file picker, colored pills, sidebar), but the content was silently discarded at the API layer, replaced with useless `[Uploaded file: DOCX]` placeholders.

## Approach

Intercept in `message-windowing.ts` where unsupported files are stripped. Instead of discarding DOCX/XLSX, decode the base64 data URL, extract text server-side, and replace the file part with a text part containing the extracted content. Conversion is transparent to the user.

## Implementation

- **`mammoth`** (DOCX to plain text) and **`xlsx`/SheetJS** (XLSX to CSV) -- pure JS, no native deps
- Dynamic `await import()` keeps libraries server-only (no client bundle bloat)
- 50,000 character truncation cap (~12,500 tokens)
- Full error isolation: `{ success, text, truncated, error }` result type
- Extracted text wrapped in `--- Content from filename ---` delimiters
- Extraction failure falls back to `[Uploaded file: name (error reason)]`
- Images and PDFs pass through unchanged

## Key Files

| File | Role |
|------|------|
| `src/lib/document-extraction.ts` | Core extraction module: `extractDocxText`, `extractXlsxText`, `extractFileText` |
| `src/lib/message-windowing.ts` | `convertUnsupportedFileParts()` replaces sync `stripUnsupportedFileParts()` |
| `src/app/api/chat/route.ts` | Added `await` to now-async `prepareMessagesForAPI()` |

## Predecessor

Built on the initial `stripUnsupportedFileParts()` fix (commit `2fc2c76`) which prevented DOCX/XLSX from causing silent API failures (HTTP 200 with empty stream body).
