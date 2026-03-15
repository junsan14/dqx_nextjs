"use client";

export default function CraftProfitSummaryCard({
  selectedSet,
  displayJobs,
  crystalByEquipLevel,
  feeRatePct,
  setFeeRatePct,
  starPrice,
  setStarPrice,
  minRates,
  recommend,
  recommendRate,
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold">装備情報</h2>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            装備Lv：
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedSet?.equipLevel ?? "—"}
            </span>
          </div>
        </div>

        {Array.isArray(selectedSet?.items) && selectedSet.items.length > 1 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold">
              セット内容
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedSet.items.map((it) => (
                <span
                  key={it.id}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[13px] font-extrabold"
                >
                  {it.slot}：{it.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold">
              装備可能職業
            </div>
            {displayJobs.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {displayJobs.map((j) => (
                  <span
                    key={j}
                    className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 text-[13px] font-extrabold"
                  >
                    {j}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                （装備可能職が未設定）
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-2">
            <div className="text-xs text-slate-500 dark:text-slate-400">結晶</div>
            {crystalByEquipLevel ? (
              <div className="text-sm text-slate-800 dark:text-slate-200 leading-7">
                なし: {crystalByEquipLevel.plus0}個 ★: {crystalByEquipLevel.plus1}個
                ★★: {crystalByEquipLevel.plus2}個 ★★★: {crystalByEquipLevel.plus3}個
              </div>
            ) : (
              <div className="text-sm text-slate-400 dark:text-slate-400">
                equipLevel が無いので表示できない
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
          <div className="text-sm font-semibold">売値</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">手数料</span>
            <div className="relative w-20">
              <input
                type="number"
                value={feeRatePct}
                onChange={(e) => setFeeRatePct(Number(e.target.value))}
                className="w-full text-base origin-right scale-90 rounded-lg border border-slate-200 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-2 py-1 pr-5 text-right"
              />
              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                %
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["star0", "星なし"],
            ["star1", "★"],
            ["star2", "★★"],
            ["star3", "★★★"],
          ].map(([k, label]) => (
            <div
              key={k}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
              <input
                type="number"
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-right"
                value={starPrice[k]}
                min={0}
                onChange={(e) =>
                  setStarPrice((prev) => ({
                    ...prev,
                    [k]: Number(e.target.value),
                  }))
                }
              />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                結晶装備おすすめ率
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                おすすめ率が高いほど黒字にしやすい
              </div>
            </div>

            <div
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                minRates?.impossible
                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                  : "border-slate-200 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              }`}
            >
              {recommend.label}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-5 text-center shadow-sm">
            <div className={`text-5xl font-black leading-none tabular-nums ${recommend.tone}`}>
              {recommendRate}%
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { key: "p3", star: "★★★", value: minRates?.p3 ?? 0, note: "必要率" },
              { key: "p2", star: "★★", value: minRates?.p2 ?? 0, note: "必要率" },
              { key: "p1", star: "★", value: minRates?.p1 ?? 0, note: "残り" },
            ].map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 p-3 text-center shadow-sm"
              >
                <div className="text-sm font-black tracking-wider text-slate-900 dark:text-slate-100">
                  {item.star}
                </div>
                <div className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-slate-100">
                  {item.value}%
                </div>
                <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {item.note}
                </div>
              </div>
            ))}
          </div>

          {recommend.sub || minRates?.note ? (
            <div
              className={`rounded-xl border px-3 py-2 text-xs ${
                minRates?.impossible
                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
                  : "border-slate-200 bg-white/70 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
              }`}
            >
              {minRates?.note || recommend.sub}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}