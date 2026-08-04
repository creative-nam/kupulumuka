import { describe, it, expect } from "vitest";
import { uuidv5, stableId } from "./deterministic-id";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("deterministic id generation", () => {
  it("returns a UUIDv5-formatted string", () => {
    expect(uuidv5("provincia:Cidade de Maputo")).toMatch(UUID_PATTERN);
  });

  it("is deterministic — the same key yields the same id across calls", () => {
    const key =
      "shelter:Província de Maputo:Matola:Khongolote:EPC Khongolote";
    expect(uuidv5(key)).toBe(uuidv5(key));
  });

  it("produces different ids for different keys", () => {
    expect(uuidv5("provincia:Sofala")).not.toBe(uuidv5("provincia:Gaza"));
  });

  it("distinguishes entity types that share a natural name", () => {
    const bairro = stableId("bairro", "Cidade de Maputo", "Kampfumo", "Central");
    const quarteirao = stableId(
      "quarteirao",
      "Cidade de Maputo",
      "Kampfumo",
      "Central",
      "Quarteirão A",
    );
    expect(bairro).not.toBe(quarteirao);
  });

  it("encodes the UUIDv5 version and RFC 4122 variant bits", () => {
    const id = uuidv5("provincia:Cidade de Maputo");
    expect(id[14]).toBe("5");
    expect(["8", "9", "a", "b"]).toContain(id[19]);
  });

  it("freezes the id for a known natural key (seed stability contract)", () => {
    expect(uuidv5("provincia:Cidade de Maputo")).toBe(
      "f211ec1b-964d-56aa-9bad-b0a44156e7cc",
    );
    expect(
      stableId(
        "shelter",
        "Província de Maputo",
        "Matola",
        "Khongolote",
        "EPC Khongolote",
      ),
    ).toBe("7b87d0a5-5663-510e-b0e3-4177d36d2240");
  });
});
