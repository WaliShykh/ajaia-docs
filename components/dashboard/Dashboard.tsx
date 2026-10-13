"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Upload } from "lucide-react";
import { FileTrigger, Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { cx } from "../ui/cx";
import { DocumentList } from "./DocumentList";
import { api } from "@/lib/client/api";
import { IMPORT_EXTENSIONS, IMPORT_HELP, LIMITS } from "@/lib/shared/limits";
import type { DocumentDTO, DocumentSummaryDTO, Page } from "@/lib/shared/types";

type Props = { initialOwned: Page<DocumentSummaryDTO>; initialShared: Page<DocumentSummaryDTO> };

const tabClass = cx(
  "relative cursor-default px-1 pb-3 text-sm font-medium text-slate-500 outline-none transition-colors",
  "hover:text-slate-800 selected:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm",
  "selected:after:absolute selected:after:inset-x-0 selected:after:-bottom-px selected:after:h-0.5 selected:after:bg-blue-600",
);

export function Dashboard({ initialOwned, initialShared }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createDoc() {
    setCreating(true);
    setError(null);
    try {
      const { document } = await api<{ document: DocumentDTO }>("/api/documents", { method: "POST", json: {} });
      router.push(`/docs/${document.id}`);
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
      const body = new FormData();
      body.append("file", file);
      const { document } = await api<{ document: DocumentDTO }>("/api/documents/import", { method: "POST", body });
      router.push(`/docs/${document.id}`);
    } catch (e) {
      setError((e as Error).message);
      setImporting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-slate-600">{IMPORT_HELP.replace("Supports", "Create a blank document or import")}</p>
        </div>
        <div className="flex gap-2">
          <FileTrigger acceptedFileTypes={[...IMPORT_EXTENSIONS]} onSelect={(f) => void importFile(f)}>
            <Button variant="secondary" isPending={importing}>
              <Upload aria-hidden className="size-4" /> {importing ? "Importing…" : "Import file"}
            </Button>
          </FileTrigger>
          <Button onPress={() => void createDoc()} isPending={creating}>
            <FilePlus2 aria-hidden className="size-4" /> {creating ? "Creating…" : "New document"}
          </Button>
        </div>
      </div>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      <Tabs className="mt-6">
        <TabList aria-label="Document lists" className="flex gap-6 border-b border-slate-200">
          <Tab id="owned" className={tabClass}>My documents</Tab>
          <Tab id="shared" className={tabClass}>Shared with me</Tab>
        </TabList>
        <TabPanel id="owned" className="outline-none pt-4">
          <DocumentList
            scope="owned"
            initial={initialOwned}
            emptyText="You don't have any documents yet. Create one or import a file to get started."
          />
        </TabPanel>
        <TabPanel id="shared" className="outline-none pt-4">
          <DocumentList
            scope="shared"
            initial={initialShared}
            emptyText="Nothing has been shared with you yet. When someone shares a document, it shows up here."
          />
        </TabPanel>
      </Tabs>
    </main>
  );
}
