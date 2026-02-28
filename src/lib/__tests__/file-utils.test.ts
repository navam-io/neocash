import {
  getFileCategory,
  getFileCategoryLabel,
  validateFileSize,
  extractDocumentMetadata,
} from "../file-utils";

describe("getFileCategory", () => {
  it('returns "pdf" for application/pdf', () => {
    expect(getFileCategory("application/pdf")).toBe("pdf");
  });

  it('returns "word" for .docx MIME', () => {
    expect(
      getFileCategory(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("word");
  });

  it('returns "word" for legacy .doc MIME', () => {
    expect(getFileCategory("application/msword")).toBe("word");
  });

  it('returns "excel" for .xlsx MIME', () => {
    expect(
      getFileCategory(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    ).toBe("excel");
  });

  it('returns "csv" for text/csv', () => {
    expect(getFileCategory("text/csv")).toBe("csv");
  });

  it('returns "image" for image/png', () => {
    expect(getFileCategory("image/png")).toBe("image");
  });

  it('returns "image" for image/jpeg', () => {
    expect(getFileCategory("image/jpeg")).toBe("image");
  });

  it('returns "unknown" for unrecognized MIME type', () => {
    expect(getFileCategory("application/octet-stream")).toBe("unknown");
  });
});

describe("getFileCategoryLabel", () => {
  it('returns "PDF" for pdf category', () => {
    expect(getFileCategoryLabel("pdf")).toBe("PDF");
  });

  it('returns "Excel" for excel category', () => {
    expect(getFileCategoryLabel("excel")).toBe("Excel");
  });

  it('returns "File" for unknown category', () => {
    expect(getFileCategoryLabel("unknown")).toBe("File");
  });
});

describe("validateFileSize", () => {
  it("returns null when file is under 10MB", () => {
    const file = { name: "doc.pdf", size: 5 * 1024 * 1024 } as unknown as File;
    expect(validateFileSize(file)).toBeNull();
  });

  it("returns error string with name and MB when over 10MB", () => {
    const file = {
      name: "big.pdf",
      size: 15 * 1024 * 1024,
    } as unknown as File;
    const result = validateFileSize(file);
    expect(result).toContain("big.pdf");
    expect(result).toContain("15.0MB");
    expect(result).toContain("max allowed is 10MB");
  });
});

describe("extractDocumentMetadata", () => {
  it("returns first meaningful sentence (10-120 chars)", () => {
    const text =
      "This document covers investment strategies for retirement planning. Second sentence here.";
    expect(extractDocumentMetadata(text, "report.pdf")).toBe(
      "This document covers investment strategies for retirement planning",
    );
  });

  it("falls back to filename when no meaningful sentence found", () => {
    const text = "short";
    expect(extractDocumentMetadata(text, "data.xlsx")).toBe("data.xlsx");
  });
});
