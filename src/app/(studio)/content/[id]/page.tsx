import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoadError, PageHeader } from "@/components/ui";
import { load } from "@/lib/api/server";
import type { ContentItem } from "@/lib/api/types";
import { Workspace } from "./workspace";

export async function generateMetadata({ params }: PageProps<"/content/[id]">): Promise<Metadata> {
  const { id } = await params;
  const result = await load<ContentItem>(`/content-items/${id}`);
  return { title: result.ok ? result.data.title : "Konten" };
}

export default async function ContentPage({ params }: PageProps<"/content/[id]">) {
  const { id } = await params;
  const result = await load<ContentItem>(`/content-items/${id}`);

  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <>
        <PageHeader eyebrow="Konten" title="Tidak bisa dibuka" />
        <LoadError what="konten" error={result.error} />
      </>
    );
  }

  return <Workspace initialItem={result.data} />;
}
