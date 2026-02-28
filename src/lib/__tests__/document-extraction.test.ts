const { mockMammoth, mockXLSX } = vi.hoisted(() => ({
  mockMammoth: { extractRawText: vi.fn() },
  mockXLSX: {
    read: vi.fn(),
    utils: { sheet_to_csv: vi.fn() },
  },
}));

vi.mock("mammoth", () => ({ default: mockMammoth, ...mockMammoth }));
vi.mock("xlsx", () => ({ default: mockXLSX, ...mockXLSX }));

import { extractFileText, CONVERTIBLE_MIME_TYPES } from "../document-extraction";

function makeDataUrl(mediaType: string, content: string): string {
  const base64 = Buffer.from(content).toString("base64");
  return `data:${mediaType};base64,${base64}`;
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const XLS_MIME = "application/vnd.ms-excel";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("extractFileText — DOCX", () => {
  it("extracts text from a valid DOCX", async () => {
    mockMammoth.extractRawText.mockResolvedValue({
      value: "Hello world from document.",
    });

    const result = await extractFileText(makeDataUrl(DOCX_MIME, "fake"), DOCX_MIME);

    expect(result.success).toBe(true);
    expect(result.text).toBe("Hello world from document.");
    expect(result.truncated).toBe(false);
  });

  it("handles legacy .doc MIME type", async () => {
    mockMammoth.extractRawText.mockResolvedValue({ value: "Legacy doc." });

    const result = await extractFileText(makeDataUrl(DOC_MIME, "fake"), DOC_MIME);
    expect(result.success).toBe(true);
    expect(result.text).toBe("Legacy doc.");
  });

  it("truncates at 50K characters", async () => {
    const longText = "a".repeat(60_000);
    mockMammoth.extractRawText.mockResolvedValue({ value: longText });

    const result = await extractFileText(makeDataUrl(DOCX_MIME, "fake"), DOCX_MIME);
    expect(result.truncated).toBe(true);
    expect(result.text).toContain("[... content truncated]");
    expect(result.text.length).toBeLessThan(60_000);
  });

  it("returns error on mammoth failure", async () => {
    mockMammoth.extractRawText.mockRejectedValue(new Error("Corrupt file"));

    const result = await extractFileText(makeDataUrl(DOCX_MIME, "fake"), DOCX_MIME);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Corrupt file");
  });
});

describe("extractFileText — XLSX", () => {
  it("extracts text from a valid XLSX", async () => {
    mockXLSX.read.mockReturnValue({
      SheetNames: ["Sheet1"],
      Sheets: { Sheet1: {} },
    });
    mockXLSX.utils.sheet_to_csv.mockReturnValue("A,B\n1,2");

    const result = await extractFileText(makeDataUrl(XLSX_MIME, "fake"), XLSX_MIME);
    expect(result.success).toBe(true);
    expect(result.text).toContain("A,B");
  });

  it("handles legacy .xls MIME type", async () => {
    mockXLSX.read.mockReturnValue({
      SheetNames: ["Data"],
      Sheets: { Data: {} },
    });
    mockXLSX.utils.sheet_to_csv.mockReturnValue("X,Y\n3,4");

    const result = await extractFileText(makeDataUrl(XLS_MIME, "fake"), XLS_MIME);
    expect(result.success).toBe(true);
  });

  it("includes sheet names in output", async () => {
    mockXLSX.read.mockReturnValue({
      SheetNames: ["Revenue", "Expenses"],
      Sheets: { Revenue: {}, Expenses: {} },
    });
    mockXLSX.utils.sheet_to_csv
      .mockReturnValueOnce("Q1,Q2\n100,200")
      .mockReturnValueOnce("Rent,Salary\n5000,8000");

    const result = await extractFileText(makeDataUrl(XLSX_MIME, "fake"), XLSX_MIME);
    expect(result.text).toContain("## Sheet: Revenue");
    expect(result.text).toContain("## Sheet: Expenses");
  });

  it("truncates at 50K characters", async () => {
    mockXLSX.read.mockReturnValue({
      SheetNames: ["Big"],
      Sheets: { Big: {} },
    });
    mockXLSX.utils.sheet_to_csv.mockReturnValue("x".repeat(60_000));

    const result = await extractFileText(makeDataUrl(XLSX_MIME, "fake"), XLSX_MIME);
    expect(result.truncated).toBe(true);
  });
});

describe("extractFileText — Edge cases", () => {
  it("returns error for unsupported MIME type", async () => {
    const result = await extractFileText(
      makeDataUrl("text/plain", "hello"),
      "text/plain",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unsupported media type");
  });

  it("returns error for invalid data URL (no comma)", async () => {
    const result = await extractFileText("data:application/pdf;base64", DOCX_MIME);
    expect(result.success).toBe(false);
    expect(result.error).toContain("missing comma");
  });
});
