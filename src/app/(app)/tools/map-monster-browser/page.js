import MapMonsterBrowserClient from "@/components/tools/map-monster-browser/MapMonsterBrowserClient";

export const metadata = {
  title: "マップ別モンスター検索",
  description:
    "大陸・マップ・モンスター系統から、対象マップに出現するモンスターを探せるページ",
};

export default function MapMonsterBrowserPage() {
  return <MapMonsterBrowserClient />;
}