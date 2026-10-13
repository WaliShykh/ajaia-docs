import { describe, expect, it } from "vitest";
import { login, signup } from "@/server/services/auth";
import { deleteSession, validateSessionToken } from "@/server/auth/session";
import { RateLimited, Unauthorized, ValidationError } from "@/server/errors";
import { signupSchema } from "@/shared/schemas";

describe("authentication", () => {
  it("issues a session that validates, and revokes it on logout", async () => {
    const { user, token } = await login({ email: "alice@ajaia.test", password: "demo1234" }, "10.0.0.1");
    expect((await validateSessionToken(token))?.id).toBe(user.id);
    await deleteSession(token);
    expect(await validateSessionToken(token)).toBeNull();
  });

  it("gives the same generic error for a wrong password and an unknown email", async () => {
    const wrong = login({ email: "bob@ajaia.test", password: "nope" }, "10.0.0.2");
    const unknown = login({ email: "ghost@ajaia.test", password: "nope" }, "10.0.0.2");
    await expect(wrong).rejects.toThrow(new Unauthorized("Invalid email or password."));
    await expect(unknown).rejects.toThrow(new Unauthorized("Invalid email or password."));
  });

  it("rate-limits repeated attempts on one account from one IP", async () => {
    const attempt = () => login({ email: "carol@ajaia.test", password: "wrong" }, "10.0.0.3");
    for (let i = 0; i < 5; i++) await expect(attempt()).rejects.toBeInstanceOf(Unauthorized);
    await expect(attempt()).rejects.toBeInstanceOf(RateLimited);
    // Even the right password is refused while limited.
    await expect(login({ email: "carol@ajaia.test", password: "demo1234" }, "10.0.0.3")).rejects.toBeInstanceOf(RateLimited);
  });

  it("rejects garbage and oversized tokens without touching other sessions", async () => {
    expect(await validateSessionToken(undefined)).toBeNull();
    expect(await validateSessionToken("not-a-real-token")).toBeNull();
    expect(await validateSessionToken("x".repeat(500))).toBeNull();
  });
});

describe("sign-up", () => {
  it("creates an account, signs it in, and lets it log in later", async () => {
    const input = signupSchema.parse({ name: "  Dana Lee ", email: "Dana@Example.com", password: "correct horse" });
    const { user, token } = await signup(input, "10.0.1.1");
    expect(user).toMatchObject({ name: "Dana Lee", email: "dana@example.com" });
    expect((await validateSessionToken(token))?.id).toBe(user.id);
    const again = await login({ email: "dana@example.com", password: "correct horse" }, "10.0.1.1");
    expect(again.user.id).toBe(user.id);
  });

  it("rejects duplicate emails (case-insensitive) and weak passwords", async () => {
    await expect(
      signup(signupSchema.parse({ name: "Imposter", email: "ALICE@ajaia.test", password: "whatever123" }), "10.0.1.2"),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(signupSchema.safeParse({ name: "x", email: "x@y.co", password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ name: " ", email: "x@y.co", password: "longenough" }).success).toBe(false);
  });

  it("rate-limits account creation per IP", async () => {
    for (let i = 0; i < 10; i++) {
      await signup(signupSchema.parse({ name: `Bot ${i}`, email: `bot${i}@spam.test`, password: "password123" }), "10.0.1.3");
    }
    await expect(
      signup(signupSchema.parse({ name: "Bot", email: "bot-x@spam.test", password: "password123" }), "10.0.1.3"),
    ).rejects.toBeInstanceOf(RateLimited);
  });
});
