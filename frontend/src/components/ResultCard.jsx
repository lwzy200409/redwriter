import { useState } from "react";
import toast from "react-hot-toast";

export default function ResultCard({ result }) {
  const [copied, setCopied] = useState(false);

  const fullText = result.hashtags?.length
    ? result.content + "\n\n" + result.hashtags.map((t) => "#" + t).join(" ")
    : result.content;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("已复制到剪贴板！");
    setTimeout(() => setCopied(false), 2000);
  };

  if (result.error) {
    return (
      <div className="card border-red-200 bg-red-50">
        <h3 className="font-semibold text-red-600 mb-2">{result.styleLabel}</h3>
        <p className="text-red-500 text-sm">{result.content}</p>
      </div>
    );
  }

  return (
    <div className="card flex flex-col hover:shadow-md transition-shadow">
      {/* 风格标签 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full">
          {result.styleLabel}
        </span>
        <button
          onClick={handleCopy}
          className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
            copied
              ? "bg-green-50 text-green-600"
              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          {copied ? "✅ 已复制" : "📋 复制"}
        </button>
      </div>

      {/* 文案内容 */}
      <div className="flex-1">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {result.content}
        </p>
      </div>

      {/* 标签 */}
      {result.hashtags?.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {result.hashtags.map((tag, i) => (
              <span
                key={i}
                className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
