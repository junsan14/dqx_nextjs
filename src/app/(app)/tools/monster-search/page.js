import MonstersSearchClient from "@/components/tools/monsters/MonstersSearchClient";

/** @type {import("next").Metadata} */
export const metadata = {
  title: "モンスター検索",
  description:
    "宝珠・装備・レアドロップから、対象モンスターの出現場所やマップ位置を調べられる検索ツール。",
  alternates: {
    canonical: "/tools/monster-search",
  },
  openGraph: {
    title: "モンスター検索 | DQX Tools",
    description:
      "宝珠・装備・レアドロップから、対象モンスターの出現場所やマップ位置を調べられる検索ツール。",
    url: "https://www.dqx-tool.com/tools/monster-search",
    images: ["/og.png"],
  },
};


export default function Page() {
  return <MonstersSearchClient />;
}