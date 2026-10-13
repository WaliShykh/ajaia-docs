"use client";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import {
  Button,
  Text,
  UNSTABLE_Toast as RACToast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastRegion as ToastRegion,
} from "react-aria-components";
import { cx } from "@/client/utils/cx";

type ToastData = { title: string; description?: string; tone: "success" | "error" };

/** App-wide toast queue. Call `toast.success(...)` / `toast.error(...)` from anywhere on the client. */
const queue = new ToastQueue<ToastData>({ maxVisibleToasts: 3 });

export const toast = {
  success: (title: string, description?: string) => queue.add({ title, description, tone: "success" }, { timeout: 4000 }),
  error: (title: string, description?: string) => queue.add({ title, description, tone: "error" }, { timeout: 6000 }),
};

/** Rendered once in the root layout. React Aria handles the live region, focus and keyboard (F6) navigation. */
export function Toaster() {
  return (
    <ToastRegion queue={queue} className="fixed bottom-5 right-5 z-[60] flex w-[min(380px,calc(100vw-2.5rem))] flex-col gap-2 outline-none">
      {({ toast: t }) => (
        <RACToast
          toast={t}
          className={cx(
            "flex items-start gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-2xl ring-1 ring-white/10 outline-none",
            "focus-visible:ring-2 focus-visible:ring-indigo-400",
          )}
        >
          {t.content.tone === "success" ? (
            <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-rose-400" />
          )}
          <ToastContent className="min-w-0 flex-1">
            <Text slot="title" className="block text-sm font-medium">{t.content.title}</Text>
            {t.content.description && (
              <Text slot="description" className="block text-xs text-slate-300">{t.content.description}</Text>
            )}
          </ToastContent>
          <Button slot="close" aria-label="Dismiss" className="rounded p-0.5 text-slate-400 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400">
            <X aria-hidden className="size-4" />
          </Button>
        </RACToast>
      )}
    </ToastRegion>
  );
}
