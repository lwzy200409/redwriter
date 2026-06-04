import { useState } from "react";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "weekly_trial",
    name: "首周体验",
    price: "¥9.9",
    period: "/周",
    desc: "限时特惠",
    quota: "10 次/天",
    styles: "3 种风格",
    features: ["每天10次生成", "3种文案风格", "图片分析+生图", "历史记录保存"],
  },
  {
    id: "monthly",
    name: "月付版",
    price: "¥59",
    period: "/月",
    desc: "日常运营首选",
    quota: "20 次/天",
    styles: "5 种风格",
    features: ["每天20次生成", "5种文案风格", "图片分析+生图", "历史记录保存", "优先客服"],
  },
  {
    id: "pro",
    name: "专业版",
    price: "¥129",
    period: "/月",
    desc: "无限使用",
    quota: "无限制",
    styles: "9 种全风格",
    features: ["无限使用", "9种文案风格", "图片分析+生图", "历史记录永久保存", "专属客服", "功能优先体验"],
    highlight: true,
  },
];

export default function Upgrade() {
  const { user, getToken, refreshUser } = useAuth();
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("请输入兑换码");
    if (code.trim().length < 15) return toast.error("兑换码为15位，请检查是否输入完整");
    setRedeeming(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "兑换失败");
      toast.success(data.message);
      setCode("");
      refreshUser();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-10">

      {/* ===== 套餐列表 + 联系方式 ===== */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📦 会员套餐</h1>
            <p className="text-gray-500 text-sm mt-1">
              当前：{user?.plan_name || "免费版"} · 剩余 {user?.quota_remaining ?? "—"} 次
            </p>
          </div>
          {/* 微信联系方式 */}
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-lg shrink-0">💬</span>
            <div>
              <p className="text-xs text-green-700 font-medium">开通会员 / 购买兑换码</p>
              <p className="text-sm font-bold text-green-800">微信：lwzy200409</p>
            </div>
          </div>
        </div>

        {/* 三卡 */}
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`card relative flex flex-col ${
                p.highlight ? "ring-2 ring-brand-500 shadow-lg" : ""
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                  👑 推荐
                </span>
              )}
              <h3 className="font-bold text-lg text-gray-800">{p.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
              <div className="mt-3 mb-3">
                <span className="text-3xl font-extrabold text-gray-900">{p.price}</span>
                <span className="text-gray-400 text-sm font-medium">{p.period}</span>
              </div>
              <div className="text-sm font-semibold text-brand-600 mb-3">{p.quota} · {p.styles}</div>
              <ul className="space-y-1.5 mb-4 flex-1 border-t border-gray-100 pt-3">
                {p.features.map((f, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                    <span className="text-emerald-500 text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <div className="bg-gray-50 rounded-xl p-2.5 text-center text-xs text-gray-400">
                联系微信获取兑换码
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 兑换码区域（重点） ===== */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">🎫 兑换码激活</h2>
        <p className="text-gray-500 text-sm mb-5">
          已通过微信购买兑换码？在下方输入即可自动升级套餐
        </p>

        <form onSubmit={handleRedeem} className="card border-2 border-brand-100 bg-gradient-to-r from-brand-50/50 to-white">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                输入 15 位兑换码
              </label>
              <input
                type="text"
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all text-lg text-center font-mono tracking-[0.3em] uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-sm"
                placeholder="XXXXX-XXXXX-XXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                maxLength={15}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              type="submit"
              disabled={redeeming || code.length < 15}
              className="btn-primary text-lg px-8 py-4 mt-6 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {redeeming ? "验证中..." : "激活套餐 →"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            兑换码不区分大小写 · 一码一用 · 激活后即时生效
          </p>
        </form>
      </div>

      {/* ===== 使用说明 ===== */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { step: "1", title: "联系微信购买", desc: "添加微信 lwzy200409，告知要开通的套餐，转账对应金额" },
          { step: "2", title: "获取兑换码", desc: "微信上给你发 15 位兑换码，每个码对应一个套餐" },
          { step: "3", title: "在此激活", desc: "输入兑换码点激活，系统自动升级套餐，刷新即可使用" },
        ].map((s) => (
          <div key={s.step} className="card text-center">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 text-sm font-bold flex items-center justify-center mx-auto mb-2">
              {s.step}
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">{s.title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
