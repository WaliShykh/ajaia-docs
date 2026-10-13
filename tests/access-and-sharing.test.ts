import { beforeAll, describe, expect, it } from "vitest";
import { demoUser } from "./helpers";
import {
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument,
} from "@/server/services/documents";
import { changeShareRole, listShares, removeShare, shareDocument } from "@/server/services/shares";
import { Conflict, Forbidden, NotFound, ValidationError } from "@/server/errors";
import type { UserDTO } from "@/shared/types";

let alice: UserDTO, bob: UserDTO, carol: UserDTO;

beforeAll(async () => {
  [alice, bob, carol] = await Promise.all([demoUser("alice"), demoUser("bob"), demoUser("carol")]);
});

describe("document access policy", () => {
  it("owner shares with an editor and a viewer; each gets exactly their permissions", async () => {
    const doc = await createDocument(alice, { title: "Roadmap", contentHtml: "<p>v1</p>" });
    await shareDocument(alice, doc.id, { email: bob.email, role: "editor" });
    await shareDocument(alice, doc.id, { email: carol.email, role: "viewer" });

    // Editor: can read and edit, cannot share or delete.
    const asBob = await getDocument(bob, doc.id);
    expect(asBob.role).toBe("editor");
    const edited = await updateDocument(bob, doc.id, { version: asBob.version, contentHtml: "<p>v2</p>" });
    expect(edited.contentHtml).toBe("<p>v2</p>");
    expect(edited.version).toBe(asBob.version + 1);
    await expect(shareDocument(bob, doc.id, { email: carol.email, role: "editor" })).rejects.toBeInstanceOf(Forbidden);
    await expect(deleteDocument(bob, doc.id)).rejects.toBeInstanceOf(Forbidden);

    // Viewer: read-only.
    const asCarol = await getDocument(carol, doc.id);
    expect(asCarol.role).toBe("viewer");
    expect(asCarol.contentHtml).toBe("<p>v2</p>");
    await expect(
      updateDocument(carol, doc.id, { version: asCarol.version, title: "Hijacked" }),
    ).rejects.toBeInstanceOf(Forbidden);
  });

  it("hides documents from users without access (404, not 403)", async () => {
    const doc = await createDocument(bob, { title: "Private" });
    await expect(getDocument(alice, doc.id)).rejects.toBeInstanceOf(NotFound);
    await expect(updateDocument(alice, doc.id, { version: 1, title: "x" })).rejects.toBeInstanceOf(NotFound);
    await expect(listShares(alice, doc.id)).rejects.toBeInstanceOf(NotFound);
  });

  it("revoking access and changing roles take effect immediately", async () => {
    const doc = await createDocument(alice, { title: "Temp" });
    await shareDocument(alice, doc.id, { email: carol.email, role: "viewer" });
    await changeShareRole(alice, doc.id, carol.id, "editor");
    expect((await getDocument(carol, doc.id)).role).toBe("editor");

    await removeShare(alice, doc.id, carol.id);
    await expect(getDocument(carol, doc.id)).rejects.toBeInstanceOf(NotFound);
    await expect(removeShare(alice, doc.id, carol.id)).rejects.toBeInstanceOf(NotFound);
  });

  it("rejects sharing with unknown users or with the owner", async () => {
    const doc = await createDocument(alice, {});
    await expect(shareDocument(alice, doc.id, { email: "nobody@ajaia.test", role: "viewer" })).rejects.toBeInstanceOf(ValidationError);
    await expect(shareDocument(alice, doc.id, { email: alice.email, role: "viewer" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("re-sharing updates the role instead of duplicating the grant", async () => {
    const doc = await createDocument(alice, {});
    await shareDocument(alice, doc.id, { email: bob.email, role: "viewer" });
    await shareDocument(alice, doc.id, { email: bob.email, role: "editor" });
    const shares = await listShares(alice, doc.id);
    expect(shares).toHaveLength(1);
    expect(shares[0].role).toBe("editor");
  });
});

describe("dashboard lists", () => {
  it("separates owned and shared documents and paginates with a stable cursor", async () => {
    const titles = ["P1", "P2", "P3", "P4", "P5"];
    for (const title of titles) {
      const d = await createDocument(carol, { title });
      await shareDocument(carol, d.id, { email: bob.email, role: "viewer" });
    }

    const owned = await listDocuments(carol, "owned");
    expect(owned.items.every((d) => d.role === "owner" && d.owner.id === carol.id)).toBe(true);

    const seen: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await listDocuments(bob, "shared", { cursor, limit: 2 });
      expect(page.items.length).toBeLessThanOrEqual(2);
      seen.push(...page.items.filter((d) => d.owner.id === carol.id).map((d) => d.title));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    expect(seen.sort()).toEqual(titles);
    expect(new Set(seen).size).toBe(seen.length); // no duplicates across pages
  });
});

describe("concurrent edits", () => {
  it("rejects a save based on a stale version instead of overwriting", async () => {
    const doc = await createDocument(alice, { contentHtml: "<p>base</p>" });
    await shareDocument(alice, doc.id, { email: bob.email, role: "editor" });

    await updateDocument(alice, doc.id, { version: doc.version, contentHtml: "<p>alice</p>" });
    await expect(
      updateDocument(bob, doc.id, { version: doc.version, contentHtml: "<p>bob</p>" }),
    ).rejects.toBeInstanceOf(Conflict);
    expect((await getDocument(alice, doc.id)).contentHtml).toBe("<p>alice</p>");
  });
});
