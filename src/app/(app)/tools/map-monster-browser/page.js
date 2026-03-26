import MapMonsterBrowserClient from "@/components/tools/map-monster-browser/MapMonsterBrowserClient";
import MapMonsterBrowserSkeleton from "@/components/ui/MapMonsterBrowserSkeleton";
import { Suspense } from "react";

export const metadata = {
  title: "マップ別モンスター検索",
  description:
    "大陸・マップ・モンスター系統から、対象マップに出現するモンスターを探せるページ",
};



export default function MapMonsterBrowserPage() {
  return (
    <Suspense fallback={<MapMonsterBrowserSkeleton />}>
      <MapMonsterBrowserClient />
    </Suspense>
  );
}