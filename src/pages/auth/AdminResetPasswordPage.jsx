import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { adminAuthService } from "../../services/adminAuthService";
import PujavedaLogo from "../../components/common/PujavedaLogo";

export default function AdminResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email") || "";
  const resetToken = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain uppercase, lowercase, number, and a special character.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      setError("Password reset token is missing. Please restart the recovery flow.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await adminAuthService.resetPassword({
        email: email.trim(),
        resetToken,
        password,
        confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF6F0] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#E8DDCE] bg-[#FFFDF9] p-6 shadow-xl shadow-[#5C0F17]/5 sm:p-9">
        <div className="flex justify-center">
          <PujavedaLogo size="lg" />
        </div>

        {success ? (
          <div className="mt-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-2xl font-black font-devotional text-[#4A0D15]">Password Reset Complete</h1>
            <p className="text-xs sm:text-sm text-[#756255]">
              Your administrator credentials have been updated securely.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5C0F17] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#43080E] shadow-sm"
              >
                Sign In Now <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#5C0F17]/10 px-3 py-1 text-xs font-bold text-[#5C0F17]">
                <ShieldCheck size={14} className="text-[#DA9B26]" /> New Admin Credentials
              </div>
              <h1 className="mt-2 text-2xl font-black font-devotional text-[#4A0D15]">Set New Password</h1>
              <p className="mt-2 text-xs sm:text-sm text-[#756255]">
                Choose a secure password for{" "}
                <span className="font-semibold text-[#2D1C13]">{email || "admin account"}</span>
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-xl bg-red-50 p-3.5 text-xs text-red-600 font-medium border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label htmlFor="password" className="text-xs sm:text-sm font-bold text-[#3D2619]">
                  New Admin Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-[#E8DDCE] bg-white px-4 py-3 pl-11 pr-11 text-sm outline-none transition focus:border-[#DA9B26] focus:ring-2 focus:ring-[#DA9B26]/10"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#756255]" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#756255] hover:text-[#2D1C13]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="text-xs sm:text-sm font-bold text-[#3D2619]">
                  Confirm Admin Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    maxLength={72}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-xl border border-[#E8DDCE] bg-white px-4 py-3 pl-11 pr-11 text-sm outline-none transition focus:border-[#DA9B26] focus:ring-2 focus:ring-[#DA9B26]/10"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#756255]" size={18} />
                </div>
              </div>

              <div className="rounded-xl bg-[#FAF5ED] border border-[#E8DDCE] p-3 text-xs text-[#756255] space-y-1">
                <p className={password.length >= 8 ? "text-emerald-700 font-bold" : ""}>
                  ✓ Minimum 8 characters
                </p>
                <p className={password && password === confirmPassword ? "text-emerald-700 font-bold" : ""}>
                  ✓ Passwords match
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#5C0F17] py-3.5 text-sm font-bold text-white transition hover:bg-[#43080E] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
              >
                {loading ? "Updating..." : "Update Admin Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
