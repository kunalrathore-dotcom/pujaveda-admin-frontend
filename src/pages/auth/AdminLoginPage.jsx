import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ExternalLink, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import PujavedaLogo from "../../components/common/PujavedaLogo";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Admin email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    if (!validate()) return;

    try {
      await login({ email: email.trim(), password });

      const redirectPath = location.state?.from?.pathname || "/";
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setServerError(error.message || "Unable to sign in.");
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#E8DDCE] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#DA9B26] focus:ring-2 focus:ring-[#DA9B26]/10";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF6F0] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#E8DDCE] bg-[#FFFDF9] p-6 shadow-xl shadow-[#5C0F17]/5 sm:p-9">
        <div className="flex justify-center">
          <PujavedaLogo size="lg" />
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#5C0F17]/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#5C0F17]">
            <ShieldCheck size={13} className="text-[#DA9B26]" />
            Administrative Portal
          </div>
          <h1 className="mt-3 text-2xl font-black font-devotional text-[#4A0D15]">Store Management Sign In</h1>
          <p className="mt-2 text-xs sm:text-sm text-[#756255]">
            Secure console to manage puja catalog, banners and customer orders
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-xs sm:text-sm font-bold text-[#3D2619]">
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              maxLength={254}
              autoComplete="username"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={inputClass}
              placeholder="admin@pujaveda.in"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs sm:text-sm font-bold text-[#3D2619]">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-[#E85D04] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                maxLength={72}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                className={`${inputClass} pr-12`}
                placeholder="Enter admin password"
                aria-invalid={Boolean(errors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#756255]"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs sm:text-sm font-medium text-red-600 border border-red-200">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#5C0F17] py-3.5 text-sm font-bold text-white transition hover:bg-[#43080E] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
          >
            {loading ? "Authenticating..." : "Sign In to Admin Panel"}
          </button>
        </form>

        <div className="mt-8 border-t border-[#E8DDCE] pt-6 text-center">
          <a
            href={import.meta.env.VITE_USER_URL || "http://localhost:5173"}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5C0F17] hover:text-[#E85D04] transition"
          >
            Open Live Customer Storefront <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </main>
  );
}
