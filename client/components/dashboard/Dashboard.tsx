"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Loader2, Upload } from "lucide-react";
import { Button as RACButton, FileTrigger, Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import { Alert } from "../ui/Alert";
import { toast } from "../ui/Toast";
import { DocumentList } from "./DocumentList";
import { cx } from "@/client/utils/cx";
import { documentService } from "@/client/services/documentService";
import { routePaths } from "@/client/config/routePaths";
import { IMPORT_EXTENSIONS, IMPORT_HELP, LIMITS } from "@/shared/limits";
import type { DocumentListItemDTO, Page, UserDTO } from "@/shared/types";

type Props = {
  user: UserDTO;
  initialOwned: Page<DocumentListItemDTO>;
  initialShared: Page<DocumentListItemDTO>;
};

const tabClass = cx(
  "flex cursor-default items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 outline-none transition",
  "hover:text-slate-900 selected:bg-white selected:text-slate-900 selected:shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500",
);

const actionCard = cx(
  "group flex items-center gap-4 rounded-2xl border p-5 text-left outline-none transition",
  "hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60",
);

// First page only; "20+" when more pages exist so the count never under-reports.
function CountPill({ page }: { page: Page<unknown> }) {
  return (
    <span className="rounded-full bg-slate-200/70 px-1.5 text-xs tabular-nums text-slate-600">
      {page.items.length}{page.nextCursor ? "+" : ""}
    </span>
  );
}

export function Dashboard({ user, initialOwned, initialShared }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstName = user.name.split(" ")[0];
  const isNew = initialOwned.items.length === 0 && initialShared.items.length === 0;

  async function createDoc() {
    setCreating(true);
    setError(null);
    try {
      const document = await documentService.create();
      router.push(routePaths.document(document.id));
    } catch (e) {
      setError((e as Error).message);
      setCreating(false);
    }
  }

  async function importFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    // Fast client-side feedback; the server re-validates type, contents and size.
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!(IMPORT_EXTENSIONS as readonly string[]).includes(ext)) return setError(`Unsupported file type. ${IMPORT_HELP}`);
    if (file.size > LIMITS.uploadMaxBytes) return setError(`File is too large. ${IMPORT_HELP}`);

    setImporting(true);
    try {
      const document = await documentService.import(file);
      toast.success("File imported", `“${document.title}” is ready to edit.`);
      router.push(routePaths.document(document.id));
    } catch (e) {
      setError((e as Error).message);
      setImporting(false);
    }
  }

  return (
    <main className="flex-1 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div>
          <p className="text-sm font-medium text-indigo-600">Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            {isNew ? "Welcome" : "Welcome back"}, {firstName}
          </h1>
          <p className="mt-1.5 text-slate-600">Pick up where you left off, or start something new.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
          <RACButton onPress={() => void createDoc()} isDisabled={creating} className={cx(actionCard, "border-indigo-200 bg-white hover:border-indigo-300")}>
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition group-hover:scale-105">
              {creating ? <Loader2 aria-hidden className="size-6 animate-spin" /> : <FilePlus2 aria-hidden className="size-6" />}
            </span>
            <span>
              <span className="block font-semibold text-slate-900">{creating ? "Creating…" : "New document"}</span>
              <span className="block text-sm text-slate-500">Start from a blank page</span>
            </span>
          </RACButton>
          <FileTrigger acceptedFileTypes={[...IMPORT_EXTENSIONS]} onSelect={(f) => void importFile(f)}>
            <RACButton isDisabled={importing} className={cx(actionCard, "border-slate-200 bg-white hover:border-slate-300")}>
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700 transition group-hover:scale-105">
                {importing ? <Loader2 aria-hidden className="size-6 animate-spin" /> : <Upload aria-hidden className="size-6" />}
              </span>
              <span>
                <span className="block font-semibold text-slate-900">{importing ? "Importing…" : "Import file"}</span>
                <span className="block text-sm text-slate-500">.txt, .md or .docx up to 2 MB</span>
              </span>
            </RACButton>
          </FileTrigger>
        </div>

        {error && <div className="mt-4 lg:max-w-3xl"><Alert>{error}</Alert></div>}

        <Tabs className="mt-12">
          <TabList aria-label="Document lists" className="inline-flex gap-1 rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/60">
            <Tab id="owned" className={tabClass}>
              My documents <CountPill page={initialOwned} />
            </Tab>
            <Tab id="shared" className={tabClass}>
              Shared with me <CountPill page={initialShared} />
            </Tab>
          </TabList>
          <TabPanel id="owned" className="pt-6 outline-none">
            <DocumentList
              scope="owned"
              initial={initialOwned}
              emptyTitle="No documents yet"
              emptyText="Create a blank document or import a file to get started."
            />
          </TabPanel>
          <TabPanel id="shared" className="pt-6 outline-none">
            <DocumentList
              scope="shared"
              initial={initialShared}
              emptyTitle="Nothing shared with you yet"
              emptyText="When a teammate shares a document with you, it shows up here."
            />
          </TabPanel>
        </Tabs>
      </div>
    </main>
  );
}
