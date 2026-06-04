import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import GenerateForm from "../components/GenerateForm";
import ResultCard from "../components/ResultCard";
import ImageUpload from "../components/ImageUpload";
import SceneCard from "../components/SceneCard";

const API_BASE = "/api";

const STYLE_LABELS = {
  grass: "种草型",
  review: "测评型",
  knowledge: "干货型",
  story: "故事型",
  compare: "对比型",
  tutorial: "教程型",
  vlog: "Vlog型",
  qa: "问答型",
  urgent: "限时型",
};

const STYLE_ICONS = {
  grass: "🌿", review: "🔍", knowledge: "📚",
  story: "📖", compare: "⚖️", tutorial: "🎓",
  vlog: "🎬", qa: "💬", urgent: "⏰",
};

export default function Home() {
  const { user, getToken, refreshUser } = useAuth();
  const [textResults, setTextResults] = useState([]);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableStyles, setAvailableStyles] = useState([]);

  // 加载可用风格
  useEffect(() => {
    fetch(`${API_BASE}/styles`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setAvailableStyles(d.styles || []))
      .catch(() => {});
  }, [user?.plan]);

  const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const handleTextGenerate = async (formData) => {
    setLoading(true);
    setTextResults([]);
    try {
      const styles = availableStyles.map(s => s.id);
      const batches = [];
      for (let i = 0; i < styles.length; i += 3) batches.push(styles.slice(i, i + 3));

      // 逐批生成，显示进度
      let allResults = [];
      for (let b = 0; b < batches.length; b++) {
        const res = await fetch(`${API_BASE}/generate-all`, {
          method: "POST", headers: authHeader(),
          body: JSON.stringify({ ...formData, styles: batches[b] }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "生成失败"); }
        const data = await res.json();
        allResults = allResults.concat(data.results || []);
        // 实时更新
        setTextResults(allResults.map(r => ({
          ...r,
          styleLabel: `${STYLE_ICONS[r.style] || "📝"} ${STYLE_LABELS[r.style] || r.style}`,
        })));
      }
      refreshUser();
    } catch (err) {
      setTextResults([{ content: `生成失败: ${err.message}`, hashtags: [], style: "error", styleLabel: "❌ 错误", error: true }]);
    } finally { setLoading(false); }
  };

  const handleImageResult = (data) => {
    setImageAnalysis(data);
    if (data) setTextResults([]);
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">✍️ 小红书AI文案生成器</h1>
        <p className="text-gray-500">
          输入商品信息或上传产品图，一键生成{availableStyles.length}种风格爆款文案
        </p>

        {/* 风格标签 */}
        {availableStyles.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {availableStyles.map(s => (
              <span key={s.id} className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-600">
                {STYLE_ICONS[s.id]} {s.name}
              </span>
            ))}
            {user?.plan !== "pro" && user?.plan !== "monthly" && (
              <span className="text-xs bg-brand-50 text-brand-500 rounded-full px-2.5 py-0.5 cursor-pointer hover:bg-brand-100 transition-colors" title="升级月付版解锁5种，专业版解锁全部9种">
                + 升级解锁更多 →
              </span>
            )}
          </div>
        )}
      </div>

      <ImageUpload onResult={handleImageResult} disabled={loading} />

      {!imageAnalysis && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="bg-gray-50 px-3 text-gray-400">或者手动输入商品信息</span></div>
          </div>
          <GenerateForm onSubmit={handleTextGenerate} loading={loading} />
        </>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 text-gray-500">
            <svg className="animate-spin h-5 w-5 text-brand-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {textResults.length > 0
              ? `AI 正在生成剩余风格...（已完成 ${textResults.length}/${availableStyles.length}）`
              : `AI 正在生成 ${availableStyles.length} 种风格文案...`}
          </div>
        </div>
      )}

      {imageAnalysis && !loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-700">📸 场景方案</h2>
            {imageAnalysis.product_analysis && (
              <span className="text-xs text-gray-400">识别为：{imageAnalysis.product_analysis.type || "产品"}</span>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {(imageAnalysis.scenes || []).map((scene, i) => <SceneCard key={i} scene={scene} index={i} />)}
          </div>
        </div>
      )}

      {textResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">生成结果</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {textResults.map((result, i) => <ResultCard key={i} result={result} />)}
          </div>
        </div>
      )}
    </div>
  );
}
