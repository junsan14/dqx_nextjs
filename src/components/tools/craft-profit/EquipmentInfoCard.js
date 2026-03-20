"use client";

export default function EquipmentInfoCard({
  selectedSet,
  displayJobs,
  crystalByEquipLevel,
}) {
  return (
    <section
      className="rounded-2xl p-5 shadow-sm space-y-3"
      style={{
        border: "1px solid var(--card-border)",
        backgroundColor: "var(--card-bg)",
      }}
    >
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--text-title)" }}
        >
          装備情報
        </h2>

        <div
          className="text-sm"
          style={{ color: "var(--text-sub)" }}
        >
          装備Lv：
          <span
            className="font-semibold"
            style={{ color: "var(--text-main)" }}
          >
            {selectedSet?.equipLevel ?? "—"}
          </span>
        </div>
      </div>

      {Array.isArray(selectedSet?.items) && selectedSet.items.length > 1 ? (
        <div
          className="rounded-2xl p-4"
          style={{
            border: "1px solid var(--card-border)",
            backgroundColor: "var(--soft-bg)",
          }}
        >
          <div
            className="text-xs font-extrabold"
            style={{ color: "var(--text-muted)" }}
          >
            セット内容
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {selectedSet.items.map((it) => (
              <span
                key={it.id}
                className="px-3 py-1.5 rounded-full text-[13px] font-extrabold"
                style={{
                  border: "1px solid var(--tag-border)",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--text-main)",
                }}
              >
                {it.slot}：{it.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        <div
          className="rounded-2xl p-4"
          style={{
            border: "1px solid var(--card-border)",
            backgroundColor: "var(--card-bg)",
          }}
        >
          <div
            className="text-xs font-extrabold"
            style={{ color: "var(--text-muted)" }}
          >
            装備可能職業
          </div>

          {displayJobs.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {displayJobs.map((j) => (
                <span
                  key={j}
                  className="px-3 py-1.5 rounded-full text-[13px] font-extrabold"
                  style={{
                    border: "1px solid var(--tag-border)",
                    backgroundColor: "var(--tag-bg)",
                    color: "var(--tag-text)",
                  }}
                >
                  {j}
                </span>
              ))}
            </div>
          ) : (
            <div
              className="mt-2 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              （装備可能職が未設定）
            </div>
          )}
        </div>

        <div
          className="rounded-2xl p-4 space-y-2"
          style={{
            border: "1px solid var(--card-border)",
            backgroundColor: "var(--card-bg)",
          }}
        >
          <div
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            結晶
          </div>

          {crystalByEquipLevel ? (
            <div
              className="text-sm leading-7"
              style={{ color: "var(--text-main)" }}
            >
              なし: {crystalByEquipLevel.plus0}個 ★: {crystalByEquipLevel.plus1}個{" "}
              ★★: {crystalByEquipLevel.plus2}個 ★★★: {crystalByEquipLevel.plus3}個
            </div>
          ) : (
            <div
              className="text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              equipLevel が無いので表示できない
            </div>
          )}
        </div>
      </div>
    </section>
  );
}