import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("两次密码不一致");
      return;
    }
    setLoading(true);
    try {
      const user = await register(form.email, form.password);
      toast.success(`注册成功！你获得了 ${user.quota_remaining} 次免费试用`);
      navigate("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">✨ 注册 RedWriter</h1>
        <p className="text-gray-500 text-sm mt-2">
          新用户免费试用 3 次，满意后升级套餐
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
          <input type="email" className="input-field" placeholder="your@email.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input type="password" className="input-field" placeholder="至少 6 位"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
          <input type="password" className="input-field" placeholder="再次输入密码"
            value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} minLength={6} required />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "注册中..." : "免费注册"}
        </button>
        <p className="text-center text-sm text-gray-500">
          已有账号？ <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium">立即登录</Link>
        </p>
      </form>
    </div>
  );
}
