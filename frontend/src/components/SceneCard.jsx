import { useState } from "react";
import toast from "react-hot-toast";

export default function SceneCard({ scene, index }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const imageUrl = scene.image_url || "";
  const portraitUrl = scene.image_url_portrait || imageUrl;

  const handleCopy = async (text, label) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label}已复制！`);
  };

  return (
    <div className="card hover:shadow-md transition-shadow overflow-hidden">
      {/* 场景编号和名称 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <h4 className="font-semibold text-gray-800 truncate">{scene.name}</h4>
      </div>

      {/* AI 生成的产品图 */}
      {imageUrl && !imgError ? (
        <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-100 aspect-[4/3]">
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs">AI 生成中...</span>
              </div>
            </div>
          )}
          <img
            src={imageUrl}
            alt={scene.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      ) : imgError ? (
        <div className="mb-4 rounded-lg bg-gray-50 aspect-[4/3] flex items-center justify-center">
          <p className="text-xs text-gray-400">图片生成失败</p>
        </div>
      ) : null}

      {/* 场景描述 */}
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{scene.description}</p>

      {/* 图片生成提示词（可展开） */}
      <div className="mb-3">
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="text-xs text-gray-400 hover:text-brand-500 flex items-center gap-1 transition-colors"
        >
          {showPrompt ? "收起" : "查看"} 生图提示词 🎨
        </button>
        {showPrompt && (
          <div className="mt-2 relative">
            <pre className="text-xs bg-gray-50 rounded-lg p-2.5 text-gray-500 whitespace-pre-wrap border border-gray-100 max-h-32 overflow-y-auto">
              {scene.image_prompt}
            </pre>
            <button
              onClick={() => handleCopy(scene.image_prompt, "提示词")}
              className="absolute top-2 right-2 text-xs bg-white border px-2 py-0.5 rounded hover:bg-gray-50"
            >
              📋
            </button>
          </div>
        )}
      </div>

      {/* 配套文案 */}
      <div className="border-t border-gray-100 pt-3 mt-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400 font-medium">配套小红书香文案</span>
          <button
            onClick={() => handleCopy(scene.copywriting, "文案")}
            className="text-xs text-brand-500 hover:text-brand-600"
          >
            📋 复制
          </button>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{scene.copywriting}</p>
      </div>
    </div>
  );
}
