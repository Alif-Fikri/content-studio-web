import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { ContentStatusTag, contentStatusLook } from "@/components/status";
import { ButtonLink, LoadError, PageHeader } from "@/components/ui";
import { load } from "@/lib/api/server";
import type { ContentItem, ContentStatus } from "@/lib/api/types";
import { formatRelative } from "@/lib/format";
import { productName } from "@/lib/products";

export const metadata: Metadata = { title: "Konten" };

const order: ContentStatus[] = ["draft", "generating", "ready_to_render", "rendering", "ready", "failed"];

function isStatus(value: unknown): value is ContentStatus {
  return typeof value === "string" && (order as string[]).includes(value);
}

export default async function ContentListPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const filter = isStatus(params.status) ? params.status : null;
  const result = await load<ContentItem[]>("/content-items");

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Konten" actions={<ButtonLink href="/content/new" variant="primary">Upload baru</ButtonLink>} />
        <LoadError what="daftar konten" error={result.error} />
      </>
    );
  }

  const items = result.data ?? [];
  const counts = new Map<ContentStatus, number>();
  items.forEach((item) => counts.set(item.status, (counts.get(item.status) ?? 0) + 1));
  const visible = filter ? items.filter((item) => item.status === filter) : items;
  const live = items.some((item) => item.status === "generating" || item.status === "rendering");

  return (
    <>
      <AutoRefresh active={live} />
      <PageHeader
        eyebrow={`${items.length} item`}
        title="Konten"
        actions={
          <ButtonLink href="/content/new" variant="primary">
            Upload baru
          </ButtonLink>
        }
      >
        {items.length > 0 ? (
          <nav className="-mb-5 mt-5 flex gap-5 overflow-x-auto text-[13px]">
            <FilterLink href="/" active={!filter} label="Semua" count={items.length} />
            {order
              .filter((status) => counts.has(status))
              .map((status) => (
                <FilterLink
                  key={status}
                  href={`/?status=${status}`}
                  active={filter === status}
                  label={contentStatusLook[status].label}
                  count={counts.get(status) ?? 0}
                />
              ))}
          </nav>
        ) : null}
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState />
      ) : visible.length === 0 ? (
        <p className="px-6 py-10 text-ink-2 lg:px-10">Tidak ada konten dengan status ini.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
                <th className="py-2.5 pl-6 pr-4 font-normal lg:pl-10">Judul</th>
                <th className="w-32 px-4 py-2.5 font-normal">Produk</th>
                <th className="w-36 px-4 py-2.5 font-normal">Status</th>
                <th className="w-32 py-2.5 pl-4 pr-6 text-right font-normal lg:pr-10">Diperbarui</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id} className="group relative border-b border-rule hover:bg-panel">
                  <td className="py-3 pl-6 pr-4 lg:pl-10">
                    <Link
                      href={`/content/${item.id}`}
                      className="font-medium after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-0.5 max-w-[60ch] truncate text-[13px] text-ink-2">{item.brief}</div>
                  </td>
                  <td className="px-4 py-3 text-[13px]">{productName(item.product)}</td>
                  <td className="px-4 py-3">
                    <ContentStatusTag status={item.status} />
                    {item.status === "draft" && !item.raw_video_key ? (
                      <div className="mt-0.5 text-[12px] text-ink-3">belum ada video</div>
                    ) : null}
                  </td>
                  <td
                    className="py-3 pl-4 pr-6 text-right font-mono text-[12px] text-ink-2 lg:pr-10"
                    title={item.updated_at}
                  >
                    {formatRelative(item.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function FilterLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={`shrink-0 border-b-2 pb-2.5 ${active ? "border-ink text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
    >
      {label}
      <span className="ml-1.5 font-mono text-[11px] text-ink-3">{count}</span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 lg:px-10">
      <div className="max-w-md">
        <p className="font-medium">Belum ada konten.</p>
        <p className="mt-1 text-ink-2">
          Mulai dengan satu rekaman layar mentah. Caption dan script ditulis setelah videonya ter-upload.
        </p>
        <ButtonLink href="/content/new" variant="primary" className="mt-5">
          Upload rekaman pertama
        </ButtonLink>
      </div>
    </div>
  );
}
