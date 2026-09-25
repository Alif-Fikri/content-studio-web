import { ButtonLink, PageHeader } from "@/components/ui";

export default function AppNotFound() {
  return (
    <>
      <PageHeader eyebrow="Apps / 404" title="App tidak ditemukan" />
      <div className="px-6 py-8 lg:px-10">
        <ButtonLink href="/apps">Kembali ke daftar app</ButtonLink>
      </div>
    </>
  );
}
