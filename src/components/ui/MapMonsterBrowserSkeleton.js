export default function MapMonsterBrowserSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <div className="h-4 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>

          <div className="space-y-2 xl:col-span-2">
            <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-[380px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
        <aside>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-5 p-4">
              <div className="space-y-2">
                <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-7 w-40 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-44 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse" />
              </div>

              <div className="space-y-3">
                <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 h-9 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 rounded-full bg-slate-100 dark:bg-slate-800/80 animate-pulse"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-4 w-28 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 w-20 rounded-full bg-slate-100 dark:bg-slate-800/80 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </aside>

        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="h-5 w-32 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="mt-2 h-4 w-40 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse" />
            </div>

            <div className="p-4">
              <div className="aspect-[4/3] w-full rounded-2xl bg-slate-100 dark:bg-slate-800/80 animate-pulse" />
            </div>

            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
              <div className="md:hidden">
                <div className="flex gap-4 overflow-hidden px-[4%]">
                  {Array.from({ length: 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[92%] shrink-0 rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                    >
                      <SpawnCardSkeleton />
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden md:grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                  >
                    <SpawnCardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="h-5 w-28 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>

            <div className="p-4">
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                  >
                    <SpawnCardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SpawnCardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-5 w-32 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-6 w-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>

      <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800/70">
        <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-7 w-14 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"
            />
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-3 dark:bg-slate-800/70"
          >
            <div className="h-4 w-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="h-9 w-40 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
    </div>
  );
}