import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Upload baru" };

export default function NewContentPage() {
  return (
    <>
      <PageHeader eyebrow="Konten / baru" title="Upload rekaman" />
      <div className="px-6 py-8 lg:px-10">
        <UploadForm />
      </div>
    </>
  );
}
