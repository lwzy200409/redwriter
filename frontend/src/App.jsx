import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./AuthContext";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import History from "./pages/History";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Upgrade from "./pages/Upgrade";

const PLAN_BADGES = {
  free: "🆓 免费版",
  weekly_trial: "🔥 首周体验",
  weekly: "📦 周付版",
  monthly: "⭐ 月付版",
  pro: "👑 专业版",
};

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <NavLink to={user ? "/" : "/"} className="flex items-center gap-2 font-bold text-xl text-gray-800">
          <span className="text-2xl">✍️</span>
          RedWriter
        </NavLink>

        <div className="flex items-center gap-1">
          {user ? (
            <>
              <NavLink to="/" end className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:text-gray-700"}`
              }>生成文案</NavLink>
              <NavLink to="/history" className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:text-gray-700"}`
              }>历史记录</NavLink>
              {user?.plan !== "pro" && (
                <NavLink to="/upgrade" className="px-3 py-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                  🚀 升级
                </NavLink>
              )}
              <div className="ml-2 flex items-center gap-2 pl-2 border-l border-gray-200">
                <span className="text-xs text-gray-400">{PLAN_BADGES[user.plan] || user.plan}</span>
                <span className="text-xs text-gray-500 hidden sm:inline">{user.email}</span>
                <button onClick={() => { logout(); navigate("/"); }} className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1">
                  退出
                </button>
              </div>
            </>
          ) : (
            <>
              <a href="/#features" className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hidden md:block">功能</a>
              <a href="/#pricing" className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hidden md:block">定价</a>
              <NavLink to="/login" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800">登录</NavLink>
              <NavLink to="/register" className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors">免费注册</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Routes>
      {/* 公开页面 */}
      <Route path="/" element={user ? <Home /> : <Landing />} />
      <Route path="/login" element={user ? <Home /> : <Login />} />
      <Route path="/register" element={user ? <Home /> : <Register />} />

      {/* 登录后页面 */}
      {user && (
        <>
          <Route path="/history" element={<History />} />
          <Route path="/upgrade" element={<Upgrade />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <NavBar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <AppRoutes />
        </main>
        <Toaster position="top-center" />
      </div>
    </AuthProvider>
  );
}
