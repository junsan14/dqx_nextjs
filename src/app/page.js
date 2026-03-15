import Link from "next/link";
import {
  FaHammer,
  FaCoins,
  FaMapLocationDot,
  FaChevronRight,
  FaCircleCheck,
  FaWandMagicSparkles,
  FaShieldHalved,
  FaGem,
  FaSackDollar,
  FaDragon,
  FaMap,
} from "react-icons/fa6";

export const metadata = {
  title: "DQX Tools",
  description: "ドラクエ10向け便利ツール集",
};

const tools = [
  {
    title: "Craft Profit",
    description:
      "装備の素材費、原価、売値を見ながら利益を確認できる職人向けツール。",
    href: "/tools/craft-profit",
    badge: "職人向け",
    accent: "from-amber-500 to-orange-500",
    icon: FaHammer,
    soft: "bg-amber-50 text-amber-600",
  },
  {
    title: "モンスター検索",
    description:
      "宝珠・装備・レアドロップから、出現場所やマップ位置まで調べられる検索ツール。",
    href: "/tools/monster-search",
    badge: "検索ツール",
    accent: "from-indigo-500 to-cyan-500",
    icon: FaMapLocationDot,
    soft: "bg-indigo-50 text-indigo-600",
  },
];

const pains = [
  {
    icon: FaShieldHalved,
    title: "装備の数値を見たい",
    text: "最新の装備の職人数値をすぐ確認したい。",
  },
  {
    icon: FaCoins,
    title: "原価を知りたい",
    text: "素材費や原価を見ながら、装備づくりの判断をしたい。",
  },
  {
    icon: FaGem,
    title: "逆引きして探したい",
    text: "宝珠・装備・レアドロップから、モンスターがどのマップのどの位置に出現するか調べたい。",
  },
];

const features = [
  {
    icon: FaSackDollar,
    title: "職人情報の確認",
    text: "装備の原価・売値・利益をまとめて確認できる。",
    soft: "bg-amber-50 text-amber-600",
  },
  {
    icon: FaDragon,
    title: "モンスター検索",
    text: "宝珠・装備・レアドロップからモンスターを逆引きできる。",
    soft: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: FaMap,
    title: "出現位置の確認",
    text: "エリアだけでなく、マップ上の出現位置まで確認できる。",
    soft: "bg-cyan-50 text-cyan-600",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.10),transparent_28%),linear-gradient(to_bottom,#ffffff,#f8fafc)]" />
        <div className="absolute -left-10 top-16 h-56 w-56 rounded-full bg-indigo-100 blur-3xl" />
        <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-cyan-100 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
          

            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              ドラゴンクエスト10を
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                もっと便利に
              </span>
            </h1>


          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            こういった悩み、ありませんか？
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pains.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
              >
                <div className="mb-4 h-1 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon className="text-lg" />
                </div>

                <p className="mt-4 text-base font-bold text-slate-900">
                  {item.title}
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>

      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            使えるツール
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
              >
                <div
                  className={`mb-6 h-2 w-24 rounded-full bg-gradient-to-r ${tool.accent}`}
                />

                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tool.soft}`}
                  >
                    <Icon className="text-xl" />
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    {tool.badge}
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {tool.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                  ツールを開く
                  <FaChevronRight className="transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>


    </main>
  );
}
