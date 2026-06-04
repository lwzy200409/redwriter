import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

/* ====== 内联 SVG 图标 ====== */
const Icons = {
  check: (props) => (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
  ),
  zap: (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  sparkles: (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/><path d="M18 14l.5 1.5L20 16l-1.5.5L18 18l-.5-1.5L16 16l1.5-.5L18 14z"/><path d="M6 14l.5 1.5L8 16l-1.5.5L6 18l-.5-1.5L4 16l1.5-.5L6 14z"/></svg>),
  feather: (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>),
  camera: (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>),
  layout: (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>),
  copy: (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>),
  clock: (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  shield: (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  crown: (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M3 20h18"/></svg>),
  star: (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>),
  gift: (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>),
  infinity: (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M13.833 8.875S15.085 7 18.043 7C21 7 23 9.5 23 12s-1.784 5-4.864 5c-2.426 0-4.08-2.06-4.08-2.06"/><path d="M10.167 15.125S8.915 17 5.957 17C3 17 1 14.5 1 12s1.784-5 4.864-5c2.426 0 4.08 2.06 4.08 2.06"/></svg>),
};

/* ====== 套餐数据 ====== */
const PLANS = [
  {
    id: "free", icon: "gift", color: "slate",
    name: "免费试用", price: "¥0", period: "",
    desc: "零成本体验 AI 文案",
    quota: "共 3 次生成",
    features: [
      { text: "3 次免费生成", ok: true },
      { text: "3 种文案风格", ok: true },
      { text: "图片识别 + 生图", ok: true },
      { text: "历史记录保存", ok: false },
      { text: "每日无限使用", ok: false },
      { text: "专属客服支持", ok: false },
    ],
    cta: "免费注册", highlight: false,
  },
  {
    id: "weekly_trial", icon: "zap", color: "amber",
    name: "首周体验", price: "¥9.9", period: "/周",
    desc: "限时特惠，完整功能",
    quota: "每天 10 次生成",
    badge: "🔥 限时优惠",
    features: [
      { text: "每天 10 次生成", ok: true },
      { text: "3 种文案风格", ok: true },
      { text: "图片识别 + 生图", ok: true },
      { text: "历史记录保存", ok: true },
      { text: "5/9 种高级风格", ok: false },
      { text: "专属客服支持", ok: false },
    ],
    cta: "立即订阅", highlight: true,
  },
  {
    id: "monthly", icon: "clock", color: "blue",
    name: "月付版", price: "¥59", period: "/月",
    desc: "适合日常内容运营",
    quota: "每天 20 次生成",
    features: [
      { text: "每天 20 次生成", ok: true },
      { text: "5 种文案风格", ok: true },
      { text: "图片识别 + 生图", ok: true },
      { text: "历史记录保存", ok: true },
      { text: "9 种全风格", ok: false },
      { text: "专属客服支持", ok: true },
    ],
    cta: "立即订阅", highlight: false,
  },
  {
    id: "pro", icon: "crown", color: "rose",
    name: "专业版", price: "¥129", period: "/月",
    desc: "专业团队不二之选",
    quota: "无限使用",
    features: [
      { text: "无限制使用", ok: true },
      { text: "9 种文案风格", ok: true },
      { text: "图片识别 + 生图", ok: true },
      { text: "历史记录永久保存", ok: true },
      { text: "每日无限使用", ok: true },
      { text: "专属客服 + 优先体验", ok: true },
    ],
    cta: "立即订阅", highlight: false,
  },
];

const colorMap = {
  slate:  { card: "border-gray-200 hover:border-gray-300", iconBg: "bg-gray-100", iconFg: "text-gray-500",  btn: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
  amber:  { card: "border-amber-200 hover:border-amber-300", iconBg: "bg-amber-100", iconFg: "text-amber-600",  btn: "bg-amber-500 text-white hover:bg-amber-600" },
  blue:   { card: "border-blue-200 hover:border-blue-300",  iconBg: "bg-blue-100",  iconFg: "text-blue-600",   btn: "bg-blue-500 text-white hover:bg-blue-600" },
  rose:   { card: "border-rose-200 hover:border-rose-300",  iconBg: "bg-rose-100",  iconFg: "text-rose-600",   btn: "bg-rose-500 text-white hover:bg-rose-600" },
  brand:  { card: "border-brand-300 ring-2 ring-brand-500",  iconBg: "bg-brand-100",iconFg: "text-brand-600",  btn: "bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-200" },
};

function PlanIcon({ id }) {
  const Icon = Icons[id] || Icons.sparkles;
  return <Icon className="w-5 h-5" />;
}

export default function Landing() {
  const { user } = useAuth();
  const [faqOpen, setFaqOpen] = useState(null);
  if (user) return null;

  return (
    <div className="-mt-8">

      {/* ==================== Hero ==================== */}
      <section className="text-center pt-20 pb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 text-sm font-semibold mb-6 border border-brand-200/50">
          <Icons.sparkles className="w-4 h-4" /> AI 驱动的文案生成器
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-5 leading-tight tracking-tight">
          上传产品图，AI 自动写出<span className="text-brand-500">爆款文案</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          不再为写小红书文案而头疼。输入商品卖点或直接上传产品图，
          AI 秒出 3 种风格文案 + 场景产品图，内容效率提升 10 倍。
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/register" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all shadow-lg shadow-brand-200 hover:shadow-xl hover:shadow-brand-300 active:scale-[0.98]">
            <Icons.zap className="w-5 h-5" /> 免费开始使用
          </Link>
          <a href="#pricing" className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium px-7 py-4 rounded-2xl text-lg border-2 border-gray-200 hover:border-gray-300 transition-all active:scale-[0.98]">
            查看套餐 <span className="text-gray-400">↓</span>
          </a>
        </div>
        <p className="text-sm text-gray-400 mt-4">无需信用卡 · 注册即享 3 次免费生成</p>
      </section>

      {/* ==================== 数据亮点 ==================== */}
      <section className="py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { icon: "zap",      num: "×10",   label: "效率提升" },
            { icon: "layout",   num: "3~9 种", label: "文案风格" },
            { icon: "camera",   num: "AI 生图", label: "场景图生成" },
            { icon: "clock",    num: "<10 秒",  label: "平均耗时" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 text-center hover:shadow-md transition-shadow">
              <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
                <PlanIcon id={s.icon} />
              </div>
              <div className="text-xl font-bold text-gray-800">{s.num}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 功能展示 ==================== */}
      <section className="py-14" id="features">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">为什么超过 500+ 运营者选择 RedWriter</h2>
          <p className="text-gray-500 max-w-lg mx-auto">以下是我们的核心能力</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: "feather", title: "AI 智能文案", desc: "DeepSeek 大模型驱动，深度理解产品卖点，生成的文案符合小红书香调性，种草、测评、干货三种风格随心切换。" },
            { icon: "camera",  title: "图片场景化生成", desc: "上传产品图，AI 自动识别产品特征，生成 3 个不同场景角度的精美产品图，媲美专业商品摄影。" },
            { icon: "layout",  title: "三风格同出", desc: "一次输入，同时生成种草型、测评型、干货型三篇文案，适配不同营销需求，总有一款适合你。" },
            { icon: "copy",    title: "一键复制发布", desc: "文案 + 热门标签，一点即复制到剪贴板，直接粘贴到小红书 App 发布，省去排版烦恼。" },
            { icon: "clock",   title: "历史记录云同步", desc: "所有生成记录自动保存到你的账号，随时回顾、复用优质文案，不会丢失任何灵感。" },
            { icon: "shield",  title: "数据安全保障", desc: "全站 HTTPS 加密传输，生成内容仅你可见。不用于 AI 训练，不分享第三方，隐私无忧。" },
          ].map((f, i) => (
            <div key={i} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 mb-4 group-hover:bg-brand-100 transition-colors">
                <PlanIcon id={f.icon} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 定价（重点） ==================== */}
      <section className="py-14" id="pricing">
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">选择适合你的套餐</h2>
          <p className="text-gray-500">从免费开始，随时升级。无隐藏费用，随时取消。</p>
        </div>

        {/* 四卡网格 */}
        <div className="grid md:grid-cols-4 gap-5 mt-10">
          {PLANS.map((plan) => {
            const cs = plan.highlight ? colorMap.brand : colorMap[plan.color] || colorMap.slate;
            return (
              <div key={plan.id} className={`relative bg-white rounded-2xl border-2 ${cs.card} p-6 flex flex-col transition-all duration-300 ${plan.highlight ? "md:-mt-3 md:mb-3" : ""}`}>

                {/* 限时标 */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap tracking-wide">
                    {plan.badge}
                  </div>
                )}

                {/* 图标 */}
                <div className={`w-11 h-11 rounded-xl ${cs.iconBg} flex items-center justify-center ${cs.iconFg} mb-4`}>
                  <PlanIcon id={plan.icon} />
                </div>

                {/* 标题 */}
                <h3 className="font-bold text-lg text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{plan.desc}</p>

                {/* 价格 */}
                <div className="mb-1">
                  <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-gray-400 text-base font-medium ml-0.5">{plan.period}</span>}
                </div>
                <div className="text-xs text-gray-500 mb-5">{plan.quota}</div>

                {/* 功能列表 */}
                <ul className="space-y-2.5 mb-6 flex-1 border-t border-gray-100 pt-4">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2.5 text-sm ${f.ok ? "text-gray-700" : "text-gray-300 line-through"}`}>
                      {f.ok
                        ? <Icons.check className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <span className="w-4 h-4 rounded-full border border-gray-200 shrink-0" />
                      }
                      {f.text}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to="/register" className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${cs.btn}`}>
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* 对比亮点 */}
        <div className="mt-10 bg-white rounded-2xl border border-gray-100 p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icons.star className="w-4 h-4 text-amber-400" /> 所有套餐均包含
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
            {[
              "HTTPS 加密传输",
              "AI 文案生成",
              "AI 图片场景化",
              "自动热门标签",
              "一键复制文案",
              "响应式网页端",
              "持续功能更新",
              "邮件技术支持",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icons.check className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="py-14 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">常见问题</h2>
        <div className="space-y-3">
          {[
            { q: "生成的文案能直接用吗？", a: "完全可以。AI 生成的文案经过精心调校，符合小红书香平台调性，可以直接复制发布，也可以根据自己需求微调。许多用户反馈生成质量超过人工撰写。" },
            { q: "AI 生图要额外付费吗？", a: "不额外收费。我们使用 Pollinations.ai 提供免费 AI 生图服务，上传产品参考图后自动生成不同场景的产品图。所有套餐均包含此功能。" },
            { q: "支持哪些品类？", a: "几乎所有消费品类都可以——美妆护肤、服饰穿搭、食品饮料、数码家电、家居用品、母婴亲子、运动户外等等。只需要输入卖点即可。" },
            { q: "如何升级套餐？", a: "目前通过人工客服对接。选择套餐后联系客服（微信：lwzy200409），付款后即时开通。后续会上线在线支付。" },
            { q: "不满意能退款吗？", a: "首周体验仅 ¥9.9，不满意不续费即可。月付用户 3 天内使用不超过 10 次可申请全额退款。专业版 7 天无理由退款。" },
            { q: "我的数据安全吗？", a: "非常安全。全站 HTTPS 加密，你的生成内容仅你自己可见。我们不将用户数据用于 AI 训练，不与任何第三方共享数据。" },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:border-gray-200 transition-colors" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-medium text-gray-800 text-sm md:text-base">{item.q}</h3>
                <span className={`text-gray-300 text-sm transition-transform shrink-0 ${faqOpen === i ? "rotate-180" : ""}`}>▼</span>
              </div>
              {faqOpen === i && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 底部 CTA ==================== */}
      <section className="py-12 text-center">
        <div className="bg-gradient-to-br from-brand-500 to-rose-500 rounded-3xl p-10 md:p-14 max-w-2xl mx-auto text-white shadow-xl shadow-brand-200">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
            <Icons.sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">准备好十倍提升你的内容效率？</h2>
          <p className="text-white/80 text-sm md:text-base mb-7 max-w-md mx-auto leading-relaxed">
            注册即享 3 次免费生成，体验 AI 文案的魅力。无需信用卡，无需绑定支付。
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-gray-50 transition-all shadow-lg active:scale-[0.98]">
            <Icons.zap className="w-5 h-5" /> 免费注册开始使用
          </Link>
        </div>
      </section>

      {/* ==================== 页脚 ==================== */}
      <footer className="border-t border-gray-200 pt-10 pb-8 mt-8">
        <div className="grid md:grid-cols-4 gap-8 text-sm">
          <div className="md:col-span-2">
            <h4 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
              ✍️ RedWriter
            </h4>
            <p className="text-gray-500 max-w-xs leading-relaxed">
              AI 驱动的文案生成器。上传产品图，秒出爆款文案 + 场景产品图。让内容营销效率提升 10 倍。
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">产品</h4>
            <div className="space-y-2">
              <a href="#features" className="block text-gray-500 hover:text-brand-500 transition-colors">功能特色</a>
              <a href="#pricing" className="block text-gray-500 hover:text-brand-500 transition-colors">套餐定价</a>
              <Link to="/register" className="block text-gray-500 hover:text-brand-500 transition-colors">免费注册</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">联系</h4>
            <div className="space-y-2 text-gray-500">
              <p>📧 redwriter@proton.me</p>
              <p>💬 微信：lwzy200409</p>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400 mt-10 pt-6 border-t border-gray-100">
          © 2026 RedWriter. All rights reserved. 本站 AI 生成内容仅供营销参考。
        </div>
      </footer>
    </div>
  );
}
