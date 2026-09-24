import { ButtonLink, PageHeader } from "@/components/ui";

export default function AdNotFound() {
  return (
    <>
      <PageHeader eyebrow="Iklan / 404" title="Iklan tidak ditemukan" />
      <div className="px-6 py-8 lg:px-10">
        <ButtonLink href="/ads">Kembali ke daftar iklan</ButtonLink>
      </div>
    </>
  );
}
