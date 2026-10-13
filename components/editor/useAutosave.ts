"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import type { DocumentDTO } from "@/lib/shared/types";

export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict";

type Pending = { title?: string; contentHtml?: string };

const DEBOUNCE_MS = 800;

/**
 * Debounced, coalescing autosave with optimistic concurrency.
 * - At most one request in flight; edits made meanwhile are merged and sent next.
 * - Each save carries the last known `version`; a 409 means someone else saved
 *   first, and we stop rather than overwrite their work.
 */
export function useAutosave(docId: string, initialVersion: number) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const version = useRef(initialVersion);
  const pending = useRef<Pending>({});
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocked = useRef(false);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current || blocked.current) return;
    inFlight.current = true;
    // Keep sending until nothing new arrived while the previous request was in flight.
    while (pending.current.title !== undefined || pending.current.contentHtml !== undefined) {
      const patch = pending.current;
      pending.current = {};
      setStatus("saving");
      try {
        const { document } = await api<{ document: DocumentDTO }>(`/api/documents/${docId}`, {
          method: "PATCH",
          json: { version: version.current, ...patch },
        });
        version.current = document.version;
        setSavedAt(document.updatedAt);
        setError(null);
        setStatus("saved");
      } catch (e) {
        // Put the unsaved changes back (newer edits win) so a retry sends them.
        pending.current = { ...patch, ...pending.current };
        if (e instanceof ApiError && e.status === 409) {
          blocked.current = true;
          setStatus("conflict");
        } else {
          setStatus("error");
        }
        setError((e as Error).message);
        break;
      }
    }
    inFlight.current = false;
  }, [docId]);

  const queue = useCallback(
    (change: Pending) => {
      pending.current = { ...pending.current, ...change };
      if (blocked.current) return;
      setStatus((s) => (s === "saving" ? s : "dirty"));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  // Warn before leaving with unsaved changes; flush on tab hide.
  useEffect(() => {
    const hasUnsaved = () =>
      inFlight.current || pending.current.title !== undefined || pending.current.contentHtml !== undefined;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsaved()) e.preventDefault();
    };
    const onHide = () => document.visibilityState === "hidden" && void flush();
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onHide);
      // Leaving the page (e.g. client-side navigation): send whatever is pending.
      void flush();
    };
  }, [flush]);

  return { status, error, savedAt, queue, retry: flush };
}
