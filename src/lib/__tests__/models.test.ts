import { models, getModelById, getModelName } from "../models";

describe("models", () => {
  it("has 3 model entries", () => {
    expect(models).toHaveLength(3);
  });

  it("each model has id, name, description, and provider", () => {
    for (const model of models) {
      expect(model).toHaveProperty("id");
      expect(model).toHaveProperty("name");
      expect(model).toHaveProperty("description");
      expect(model).toHaveProperty("provider");
    }
  });
});

describe("getModelById", () => {
  it("returns ModelOption for a known id", () => {
    const result = getModelById("claude-sonnet-4-6");
    expect(result).toBeDefined();
    expect(result!.name).toBe("Sonnet 4.6");
  });

  it("returns undefined for an unknown id", () => {
    expect(getModelById("nonexistent-model")).toBeUndefined();
  });
});

describe("getModelName", () => {
  it("returns the name for a known model id", () => {
    expect(getModelName("claude-opus-4-6")).toBe("Opus 4.6");
  });

  it('falls back to "Sonnet 4.6" for an unknown id', () => {
    expect(getModelName("unknown-id")).toBe("Sonnet 4.6");
  });
});
