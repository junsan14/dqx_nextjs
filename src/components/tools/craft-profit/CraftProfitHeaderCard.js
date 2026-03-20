"use client";

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
  const hasToolOptions = Array.isArray(toolOptions) && toolOptions.length > 1;

  return (
    <section
      className="rounded-2xl p-5 shadow-sm space-y-4 h-full"
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        color: "var(--text-main)",
      }}
    >
      <div className="space-y-3">
        <div className="min-w-0 relative">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>
            装備セット
          </label>

          <input
            type="text"
            value={setQuery}
            placeholder="装備名 or レベルで検索"
            onFocus={() => setOpenSetList(true)}
            onChange={(e) => {
              setSetQuery(e.target.value);
              setOpenSetList(true);
            }}
            className="mt-1 w-full rounded-xl px-3 py-2 focus:outline-none"
            style={{
              border: "1px solid var(--input-border)",
              backgroundColor: "var(--input-bg)",
              color: "var(--input-text)",
            }}
          />

          {openSetList && (
            <div
              className="absolute z-20 mt-1 w-full rounded-xl shadow max-h-60 overflow-auto"
              style={{
                border: "1px solid var(--card-border)",
                backgroundColor: "var(--card-bg)",
              }}
            >
              {filteredSets.length > 0 ? (
                filteredSets.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onChangeSet(s.id);
                      setOpenSetList(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm"
                    style={{
                      color: "var(--text-main)",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {s.name}
                  </button>
                ))
              ) : (
                <div
                  className="px-3 py-2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  該当なし
                </div>
              )}
            </div>
              )}
        </div>

        <div className="min-w-0">
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            職種
          </div>

          <div
            className="mt-1 inline-flex w-full items-center justify-between rounded-xl px-3 py-2"
            style={{
              border: "1px solid var(--soft-border)",
              backgroundColor: "var(--soft-bg)",
            }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-main)" }}
            >
              {craftType || "—"}
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              必要Lv {selectedSet?.craftLevel ?? "—"}
            </span>
          </div>
        </div>

        {hasToolOptions && (
          <div className="min-w-0">
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>
              使用する道具（30回）
            </label>

            <div className="mt-1 grid grid-cols-1 gap-2">
              <select
                className="w-full rounded-xl px-3 py-2 focus:outline-none"
                style={{
                  border: "1px solid var(--input-border)",
                  backgroundColor: "var(--input-bg)",
                  color: "var(--input-text)",
                }}
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
                className="w-full rounded-xl px-3 py-2 text-right focus:outline-none"
                style={{
                  border: "1px solid var(--input-border)",
                  backgroundColor: "var(--input-bg)",
                  color: "var(--input-text)",
                }}
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