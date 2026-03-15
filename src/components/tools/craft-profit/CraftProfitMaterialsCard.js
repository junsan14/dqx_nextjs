"use client";

import { useEffect, useMemo, useRef } from "react";
import { clamp0, yen } from "@/lib/money";
import { getSlotItemName } from "./craftProfitHelpers";

function SlotGridView({ grid }) {
  if (!grid) return null;

  const is2DArray =
    Array.isArray(grid) && grid.every((row) => Array.isArray(row));

  if (!is2DArray) return null;

  const rows = grid.length;
  const cols = Math.max(...grid.map((row) => row.length), 0);

  const normalized = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => grid?.[r]?.[c] ?? null)
  );

  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <div
        className="grid gap-2 w-full min-w-0"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {normalized.flat().map((value, i) => {
          const disabled = value == null || value === "";
          return (
            <div
              key={i}
              className={`min-h-[48px] rounded-xl border px-2 py-2 flex items-center justify-center text-center ${
                disabled
                  ? "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                  : "border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              }`}
            >
              <div className="text-sm font-semibold leading-tight tabular-nums break-words">
                {disabled ? "" : value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileSlotTabs({ slots, activeSlot, onChange }) {
  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
      <div className="flex gap-2 py-1">
        {slots.map((s) => {
          const isActive = s === activeSlot;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={
                "shrink-0 rounded-full border px-3 py-1 text-sm font-semibold " +
                (isActive
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200")
              }
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileMaterialsList({ slot, rows, unitCostMap, onChangeUnitCost, toolRow }) {
  const items = useMemo(() => {
    const out = [];

    if (toolRow) {
      out.push({
        key: "__tool__",
        name: toolRow.name,
        qty: null,
        unit: toolRow.toolPrice,
        amount: toolRow.toolCostPerCraft,
        isTool: true,
        onChangeToolPrice: toolRow.onChangeToolPrice,
      });
    }

    for (const r of rows) {
      const qty = Number(r.perSlotQty?.[slot] || 0);
      if (!qty) continue;

      const unit = clamp0(unitCostMap[r.materialKey] ?? 0);

      out.push({
        key: r.materialKey,
        name: r.materialName,
        qty,
        unit,
        amount: qty * unit,
        isTool: false,
      });
    }

    return out;
  }, [slot, rows, unitCostMap, toolRow]);

  const totalAmount = useMemo(
    () => items.reduce((sum, x) => sum + clamp0(x.amount), 0),
    [items]
  );

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-[11px] bg-white dark:bg-slate-900">
      <div className="grid grid-cols-[minmax(120px,1fr)_32px_56px_56px] items-center gap-1 py-2 text-[11px] font-semibold text-center bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="text-left px-2 text-slate-900 dark:text-slate-100">素材名</div>
        <div className="text-slate-900 dark:text-slate-100">必要</div>
        <div className="text-slate-900 dark:text-slate-100">金額</div>
        <div className="text-slate-900 dark:text-slate-100">単価</div>
      </div>

      {items.length ? (
        items.map((x) => (
          <div
            key={x.key}
            className="grid grid-cols-[minmax(120px,1fr)_32px_56px_56px] items-center gap-1 py-1 border-t border-slate-100 dark:border-slate-800"
          >
            <div className="truncate font-medium px-2 text-slate-900 dark:text-slate-100">
              {x.name}
            </div>

            <div className="text-center text-slate-500 dark:text-slate-400">
              {x.isTool ? "-" : x.qty}
            </div>

            <div className="text-center tabular-nums text-slate-900 dark:text-slate-100">
              {yen(x.amount)}
            </div>

            <div className="pr-2">
              <input
                type="number"
                inputMode="numeric"
                className="h-7 w-full text-right border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded px-1 text-[16px] scale-[0.8] origin-right"
                value={x.unit}
                min={0}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (x.isTool) x.onChangeToolPrice(v);
                  else onChangeUnitCost(x.key, v);
                }}
              />
            </div>
          </div>
        ))
      ) : (
        <div className="px-3 py-4 text-xs text-slate-500 dark:text-slate-400">
          この部位で使う素材はない。
        </div>
      )}

      <div className="flex justify-end items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100">
        <span>合計: {yen(totalAmount)}G</span>
      </div>
    </div>
  );
}

function MobileSlotCarousel({
  slots,
  activeSlot,
  onChange,
  slotGrids,
  slotItemMap,
  children,
}) {
  const scrollerRef = useRef(null);
  const lastActiveRef = useRef(activeSlot);
  const setByScrollRef = useRef(false);
  const scrollEndTimerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    if (setByScrollRef.current) {
      setByScrollRef.current = false;
      lastActiveRef.current = activeSlot;
      return;
    }

    if (lastActiveRef.current === activeSlot) return;
    lastActiveRef.current = activeSlot;

    const escapedSlot =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(activeSlot)
        : String(activeSlot).replace(/"/g, '\\"');

    const card = el.querySelector(`[data-slot="${escapedSlot}"]`);
    if (!card) return;

    const targetLeft = card.offsetLeft - (el.clientWidth / 2 - card.offsetWidth / 2);

    el.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
  }, [activeSlot]);

  const syncActiveFromCenter = () => {
    const el = scrollerRef.current;
    if (!el) return;

    const cards = Array.from(el.querySelectorAll("[data-slot]"));
    if (!cards.length) return;

    const center = el.scrollLeft + el.clientWidth / 2;
    let bestSlot = activeSlot;
    let bestDist = Infinity;

    for (const c of cards) {
      const cCenter = c.offsetLeft + c.offsetWidth / 2;
      const d = Math.abs(cCenter - center);
      if (d < bestDist) {
        bestDist = d;
        bestSlot = c.getAttribute("data-slot");
      }
    }

    if (bestSlot && bestSlot !== activeSlot) {
      setByScrollRef.current = true;
      onChange(bestSlot);
    }
  };

  const onScroll = () => {
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = setTimeout(() => {
      syncActiveFromCenter();
    }, 140);
  };

  return (
    <div className="-mx-4 px-4">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
      >
        <div className="shrink-0 w-4" />

        {slots.map((slot) => {
          const grid = slotGrids?.[slot] ?? null;

          return (
            <div
              key={slot}
              data-slot={slot}
              className="shrink-0 w-[92%] snap-center"
            >
              <div className="space-y-3">
                {grid ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-2">
                    <div className="text-xs font-semibold text-center text-slate-700 dark:text-slate-200 truncate px-2">
                      {slotItemMap?.[slot] || slot}
                    </div>

                    <div className="min-h-[184px] flex items-center">
                      <div className="w-full">
                        <SlotGridView grid={grid} />
                      </div>
                    </div>
                  </div>
                ) : null}

                {children(slot)}
              </div>
            </div>
          );
        })}

        <div className="shrink-0 w-4" />
      </div>

      <div className="text-center text-[11px] text-slate-500 dark:text-slate-400">
        ← 横スワイプで部位切替 →
      </div>
    </div>
  );
}

export default function CraftProfitMaterialsCard({
  slots,
  rows,
  slotGrids,
  selectedSet,
  activeSlot,
  setActiveSlot,
  unitCostMap,
  updateUnitCost,
  mobileToolRow,
  toolEnabled,
  selectedTool,
  toolPrice,
  setToolPriceOverride,
  toolCostPerCraft,
  slotTotalsWithTool,
  avgMaterialCostPerPart,
  costPerItem,
}) {
  const slotItemMap = useMemo(() => {
    const map = {};
    for (const it of selectedSet?.items || []) {
      map[it.slot] = it.name;
    }
    return map;
  }, [selectedSet]);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">職人情報</h2>
      </div>

      <div className="sm:hidden space-y-3">
        <MobileSlotTabs
          slots={slots}
          activeSlot={activeSlot}
          onChange={setActiveSlot}
        />

        <MobileSlotCarousel
          slots={slots}
          activeSlot={activeSlot}
          onChange={setActiveSlot}
          slotGrids={slotGrids}
          slotItemMap={slotItemMap}
        >
          {(slot) => (
            <MobileMaterialsList
              slot={slot}
              rows={rows}
              unitCostMap={unitCostMap}
              onChangeUnitCost={updateUnitCost}
              toolRow={mobileToolRow}
            />
          )}
        </MobileSlotCarousel>
      </div>

      <div className="hidden sm:block space-y-3">
        <div className="text-xs text-slate-500 dark:text-slate-400">基準値</div>

        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max pb-2">
            {slots.map((slot) => {
              const grid = slotGrids?.[slot] ?? null;
              const itemName = getSlotItemName(selectedSet, slot);

              if (!grid) return null;

              return (
                <div
                  key={slot}
                  className="w-[220px] shrink-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {slot}
                    <br />
                    {itemName ? itemName : ""}
                  </div>

                  <SlotGridView grid={grid} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                    素材
                  </th>
                  {slots.map((slot) => (
                    <th
                      key={slot}
                      className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200"
                    >
                      {slot}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                    合計
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                    単価
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                    金額
                  </th>
                </tr>
              </thead>

              <tbody>
                {toolEnabled && selectedTool?.id !== "none" && (
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                      【道具】{selectedTool.name}
                    </td>
                    {slots.map((slot) => (
                      <td
                        key={slot}
                        className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200"
                      >
                        —
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      —
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        inputMode="numeric"
                        className="w-24 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                        value={toolPrice}
                        min={0}
                        onChange={(e) => setToolPriceOverride(Number(e.target.value))}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {yen(toolCostPerCraft)}
                    </td>
                  </tr>
                )}

                {rows.map((r) => {
                  const unit = clamp0(unitCostMap[r.materialKey] ?? 0);
                  const amount = clamp0(r.totalQty) * unit;

                  return (
                    <tr
                      key={r.materialKey}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {r.materialName}
                        </span>
                      </td>

                      {slots.map((slot) => (
                        <td
                          key={slot}
                          className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200"
                        >
                          {r.perSlotQty[slot] ? r.perSlotQty[slot] : ""}
                        </td>
                      ))}

                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {r.totalQty}
                      </td>

                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          inputMode="numeric"
                          className="w-24 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                          value={unitCostMap[r.materialKey] ?? 0}
                          min={0}
                          onChange={(e) => updateUnitCost(r.materialKey, e.target.value)}
                        />
                      </td>

                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {yen(amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="bg-slate-50 dark:bg-slate-800/40">
                <tr>
                  <td className="px-3 py-2 font-semibold border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    合計（道具込）
                  </td>

                  {slots.map((slot) => (
                    <td
                      key={slot}
                      className="px-3 py-2 text-right font-semibold tabular-nums border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      {slotTotalsWithTool.amount[slot]
                        ? yen(slotTotalsWithTool.amount[slot])
                        : ""}
                    </td>
                  ))}

                  <td className="px-3 py-2 text-right font-semibold tabular-nums border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    {yen(slotTotalsWithTool.total)}
                  </td>
                  <td className="px-3 py-2 text-right border-t border-slate-200 dark:border-slate-700">
                    —
                  </td>
                  <td className="px-3 py-2 text-right font-semibold border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    {yen(slotTotalsWithTool.total)}
                  </td>
                </tr>

                <tr>
                  <td className="px-3 py-2 font-semibold border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    参考（1部位あたり）
                  </td>
                  <td
                    className="px-3 py-2 text-right font-semibold tabular-nums border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    colSpan={slots.length + 2}
                  >
                    平均材料 {yen(avgMaterialCostPerPart)} + 道具 {yen(toolEnabled ? toolCostPerCraft : 0)} = 原価 {yen(costPerItem)}
                  </td>
                  <td className="px-3 py-2 text-right border-t border-slate-200 dark:border-slate-700">
                    —
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}