export type Product = {
  id: string;
  name: string;
  pitch: string;
  audience: string;
  language: string;
};

export const products: Product[] = [
  {
    id: "produk_a",
    name: "Produk A",
    pitch: "Aplikasi dummy untuk mencatat pengeluaran harian.",
    audience: "Pengguna umum di Indonesia.",
    language: "Bahasa Indonesia santai",
  },
  {
    id: "produk_b",
    name: "Produk B",
    pitch: "Aplikasi dummy untuk belajar kosakata baru setiap hari.",
    audience: "Pelajar dan mahasiswa di Indonesia.",
    language: "Bahasa Indonesia santai",
  },
  {
    id: "produk_c",
    name: "Produk C",
    pitch: "Aplikasi dummy untuk mengatur jadwal dan pengingat.",
    audience: "Pekerja kantoran di Indonesia.",
    language: "Bahasa Indonesia santai",
  },
];

export function productName(id: string): string {
  return products.find((product) => product.id === id)?.name ?? id;
}

export function findProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
