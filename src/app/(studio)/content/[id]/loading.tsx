function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse bg-sunk ${className}`} />;
}

export default function ContentLoading() {
  return (
    <div aria-busy="true" aria-label="Memuat konten">
      <div className="border-b border-rule px-6 pb-5 pt-7 lg:px-10">
        <Bar className="h-3 w-32" />
        <Bar className="mt-3 h-6 w-72 max-w-full" />
      </div>
      <div className="grid gap-x-10 px-6 lg:grid-cols-[minmax(240px,340px)_minmax(0,1fr)] lg:px-10">
        <div className="pt-6">
          <div className="mx-auto aspect-[9/16] h-[55dvh] animate-pulse bg-ink/85 lg:h-auto lg:max-h-[70dvh] lg:w-full" />
        </div>
        <div>
          {[3, 6, 2].map((lines, index) => (
            <div key={index} className="border-b border-rule py-6">
              <Bar className="h-3 w-28" />
              {Array.from({ length: lines }, (_, line) => (
                <Bar key={line} className={`mt-3 h-3.5 ${line % 2 ? "w-3/5" : "w-4/5"}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
