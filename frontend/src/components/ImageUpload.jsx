import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../AuthContext";

const API_BASE = "/api";

export default function ImageUpload({ onResult, disabled }) {
  const { getToken, refreshUser } = useAuth();
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 校验格式
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("仅支持 JPG/PNG/WebP/GIF 格式");
      return;
    }

    // 校验大小
    if (file.size > 10 * 1024 * 1024) {
      toast.error("图片不能超过 10MB");
      return;
    }

    // 预览
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // 上传分析
    handleAnalyze(file);
  };

  const handleAnalyze = async (file) => {
    setAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/analyze-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "分析失败");
      }

      const data = await res.json();

      if (data.scenes?.length > 0) {
        toast.success(`分析完成！生成了 ${data.scenes.length} 个场景方案`);
        onResult(data);
        refreshUser(); // 刷新配额
      } else {
        toast.error("未能识别产品，请换张清晰的图片试试");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    onResult(null);
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">
          📷 上传产品参考图 <span className="text-gray-400 font-normal text-sm">(可选)</span>
        </h3>
        {preview && (
          <button onClick={handleReset} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
            清除图片
          </button>
        )}
      </div>

      {!preview ? (
        <label className={`
          flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl
          cursor-pointer transition-all duration-200
          ${disabled || analyzing
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : "border-gray-300 hover:border-brand-400 hover:bg-brand-50/30"
          }
        `}>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={disabled || analyzing}
            className="hidden"
          />
          {analyzing ? (
            <div className="text-center">
              <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-brand-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-400">AI 正在分析图片...</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-3xl mb-2">🖼️</div>
              <p className="text-sm text-gray-500">点击上传产品照片</p>
              <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG/WebP，最大 10MB</p>
            </div>
          )}
        </label>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="产品预览"
            className="w-full max-h-64 object-contain rounded-lg bg-gray-50"
          />
          {analyzing && (
            <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-brand-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-gray-500">AI 正在分析...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
