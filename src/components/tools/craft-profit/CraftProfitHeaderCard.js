"use client";

import { TOOLS_BY_CRAFT, TOOL_USES } from "@/app/data/tools";

export default function CraftProfitHeaderCard({
  setQuery,
  setSetQuery,
  openSetList,
  setOpenSetList,
  filteredSets,
  onChangeSet,
  craftType,
  selectedSet,
  toolId,
  setToolId,
  toolOptions,
  toolPrice,
  setToolPriceOverride,
}) {

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 h-full">
      <div className="space-y-3">
        <div className="min-w-0 relative">
          <label className="text-xs text-slate-500 dark:text-slate-400">装備セット</label>
          <input
            type="text"
            value={setQuery}
            placeholder="装備名 or レベルで検索"
            onFocus={() => setOpenSetList(true)}
            onChange={(e) => {
              setSetQuery(e.target.value);
              setOpenSetList(true);
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
          />

          {openSetList && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow max-h-60 overflow-auto">
              {filteredSets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChangeSet(s.id);
                    setOpenSetList(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">職種</div>
          <div className="mt-1 inline-flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
            <span className="text-sm font-semibold">{craftType || "—"}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              必要Lv {selectedSet?.craftLevel ?? "—"}
            </span>
          </div>
        </div>

        {TOOLS_BY_CRAFT[craftType] && (
          <div className="min-w-0">
            <label className="text-xs text-slate-500 dark:text-slate-400">
              使用する道具（{TOOL_USES}回）
            </label>

            <div className="mt-1 grid grid-cols-1 gap-2">
              <select
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                value={toolId}
                onChange={(e) => {
                  setToolId(e.target.value);
                  setToolPriceOverride(null);
                }}
              >
                {toolOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                inputMode="numeric"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                value={toolPrice}
                min={0}
                onChange={(e) => setToolPriceOverride(Number(e.target.value))}
                title="道具価格（変更可能）"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}