import CraftProfitClient from "@/components/tools/craft-profit/CraftProfitClient";

/** @type {import("next").Metadata} */
export const metadata = {
  title: "Craft Profit",
  description:
    "装備の素材費、原価、売値を見ながら利益を確認できるドラクエ10向け職人ツール。",
  alternates: {
    canonical: "/tools/craft-profit",
  },
  openGraph: {
    title: "Craft Profit | DQX Tools",
    description:
      "装備の素材費、原価、売値を見ながら利益を確認できるドラクエ10向け職人ツール。",
    url: "https://www.dqx-tool.com/tools/craft-profit",
    images: ["/og.png"],
  },
};


export default function CraftProfitPage() {
  return <CraftProfitClient />;
}