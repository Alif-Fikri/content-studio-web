function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse bg-sunk ${className}`} />;
}

export default function StudioLoading() {
  return (
    <div aria-busy="true" aria-label="Memuat">
      <div className="border-b border-rule px-6 pb-5 pt-7 lg:px-10">
        <Bar className="h-3 w-24" />
        <Bar className="mt-3 h-6 w-56" />
      </div>
      <div>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-6 border-b border-rule px-6 py-4 lg:px-10">
            <div className="min-w-0 flex-1">
              <Bar className="h-3.5 w-2/5" />
              <Bar className="mt-2 h-3 w-3/5" />
            </div>
            <Bar className="hidden h-3 w-20 sm:block" />
            <Bar className="hidden h-3 w-16 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
