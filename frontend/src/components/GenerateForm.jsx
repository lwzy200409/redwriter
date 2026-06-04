import { useState } from "react";

export default function GenerateForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    product_name: "",
    selling_points: "",
    target_audience: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.product_name.trim() || !form.selling_points.trim()) return;
    onSubmit(form);
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          商品名称 <span className="text-brand-500">*</span>
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="例如：兰蔻持妆粉底液"
          value={form.product_name}
          onChange={handleChange("product_name")}
          maxLength={100}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          核心卖点 <span className="text-brand-500">*</span>
        </label>
        <textarea
          className="input-field min-h-[100px] resize-y"
          placeholder="例如：持妆12小时不脱妆、轻薄透气不闷痘、遮瑕力强但又自然、适合油皮混油皮"
          value={form.selling_points}
          onChange={handleChange("selling_points")}
          maxLength={1000}
          required
        />
        <p className="text-xs text-gray-400 mt-1">{form.selling_points.length}/1000</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          目标人群 <span className="text-gray-400 font-normal">(选填)</span>
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="例如：上班族、学生党、宝妈"
          value={form.target_audience}
          onChange={handleChange("target_audience")}
          maxLength={200}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full text-lg">
        {loading ? "生成中..." : "🚀 一键生成文案"}
      </button>
    </form>
  );
}
