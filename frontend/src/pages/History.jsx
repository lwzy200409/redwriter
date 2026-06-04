import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";

const API_BASE = "/api";

export default function History() {
  const { getToken } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/history?page=1&page_size=50`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => res.json())
      .then((data) => setRecords(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const styleLabels = {
    grass: "种草型 🌿",
    review: "测评型 🔍",
    knowledge: "干货型 📚",
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="animate-spin h-6 w-6 mx-auto mb-3 border-2 border-brand-500 border-t-transparent rounded-full" />
        加载中...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📝</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">还没有生成记录</h2>
        <p className="text-gray-500">快去首页生成你的第一篇小红书文案吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">📚 历史记录</h1>
      <p className="text-gray-500">共 {records.length} 条生成记录</p>

      {records.map((record) => (
        <div key={record.id} className="card hover:shadow-md transition-shadow">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpanded(expanded === record.id ? null : record.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800 truncate">{record.product_name}</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                  {styleLabels[record.style] || record.style}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {record.created_at ? new Date(record.created_at).toLocaleString("zh-CN") : ""}
              </p>
            </div>
            <span className="text-gray-300 text-sm ml-2 shrink-0">
              {expanded === record.id ? "收起 ▲" : "展开 ▼"}
            </span>
          </div>

          {expanded === record.id && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {record.content}
              </p>
              {record.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {record.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
