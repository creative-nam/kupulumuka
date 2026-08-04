// @vitest-environment node
import { describe, expect, it } from "vitest";
import { validateUserContact, UserContactError } from "./user-validation";

describe("validateUserContact", () => {
  it("passes when phone is provided and email is null", () => {
    expect(() =>
      validateUserContact({ phone: "+258840000001", email: null }),
    ).not.toThrow();
  });

  it("passes when email is provided and phone is null", () => {
    expect(() =>
      validateUserContact({ phone: null, email: "test@example.com" }),
    ).not.toThrow();
  });

  it("passes when both phone and email are provided", () => {
    expect(() =>
      validateUserContact({
        phone: "+258840000001",
        email: "test@example.com",
      }),
    ).not.toThrow();
  });

  it("throws UserContactError when both phone and email are null", () => {
    expect(() => validateUserContact({ phone: null, email: null })).toThrow(
      UserContactError,
    );
  });

  it("throws UserContactError when both phone and email are undefined", () => {
    expect(() => validateUserContact({})).toThrow(UserContactError);
  });

  it("throws UserContactError when both phone and email are empty strings", () => {
    expect(() => validateUserContact({ phone: "", email: "" })).toThrow(
      UserContactError,
    );
  });
});
