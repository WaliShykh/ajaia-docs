"use client";
import type { ReactNode } from "react";
import { Dialog as RACDialog, Heading, Modal, ModalOverlay, type ModalOverlayProps } from "react-aria-components";

/** Accessible modal: focus trap, Esc to close, scroll lock and focus restore come from React Aria. */
export function Dialog({
  title,
  children,
  role,
  ...overlay
}: Omit<ModalOverlayProps, "children"> & {
  title: string;
  role?: "dialog" | "alertdialog";
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
}) {
  return (
    <ModalOverlay
      isDismissable={role !== "alertdialog"}
      {...overlay}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-[12vh] backdrop-blur-sm"
    >
      <Modal className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
        <RACDialog role={role} className="outline-none p-6">
          {({ close }) => (
            <>
              <Heading slot="title" className="text-lg font-semibold text-slate-900">
                {title}
              </Heading>
              <div className="mt-4">{typeof children === "function" ? children({ close }) : children}</div>
            </>
          )}
        </RACDialog>
      </Modal>
    </ModalOverlay>
  );
}
