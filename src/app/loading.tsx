export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 h-10 w-2/3 rounded bg-muted" />
      <div className="mx-auto mb-6 h-4 w-1/2 rounded bg-muted" />
      <div className="aspect-[21/9] w-full rounded-2xl bg-muted" />
    </div>
  );
}
