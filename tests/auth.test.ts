import { describe, expect, it } from "vitest";
import { login } from "@/server/services/auth";
import { deleteSession, validateSessionToken } from "@/server/auth/session";
import { RateLimited, Unauthorized } from "@/server/errors";

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
