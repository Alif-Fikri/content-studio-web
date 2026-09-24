import { ButtonLink, PageHeader } from "@/components/ui";

export default function ContentNotFound() {
  return (
    <>
      <PageHeader eyebrow="Konten / 404" title="Konten tidak ditemukan" />
      <div className="px-6 py-8 lg:px-10">
        <p className="text-ink-2">Mungkin sudah dihapus, atau link-nya salah.</p>
        <ButtonLink href="/" className="mt-4">
          Kembali ke daftar
        </ButtonLink>
      </div>
    </>
  );
}
