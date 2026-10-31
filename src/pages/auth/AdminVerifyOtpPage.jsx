import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, RotateCw, ArrowLeft } from "lucide-react";
import { adminAuthService } from "../../services/adminAuthService";
import PujavedaLogo from "../../components/common/PujavedaLogo";

export default function AdminVerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please provide your admin email address.");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await adminAuthService.verifyResetOtp(cleanEmail, otp);
      setSuccessMessage("Code verified successfully. Proceeding to reset password...");
      setTimeout(() => {
        navigate(
          `/reset-password?email=${encodeURIComponent(cleanEmail)}&token=${encodeURIComponent(
            res.data.resetToken
          )}`
        );
      }, 1000);
    } catch (err) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await adminAuthService.forgotPassword(email.trim());
      setSuccessMessage(res.message || "A new 6-digit code has been sent.");
      setCooldown(60);
    } catch (err) {
      if (err.devOtp) {
        setSuccessMessage(`New reset code: ${err.devOtp}`);
        setCooldown(60);
      } else {
        setError(err.message || "Failed to resend code.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF6F0] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#E8DDCE] bg-[#FFFDF9] p-6 shadow-xl shadow-[#5C0F17]/5 sm:p-9">
        <div className="flex justify-center">
          <PujavedaLogo size="lg" />
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#5C0F17]/10 px-3 py-1 text-xs font-bold text-[#5C0F17]">
            <ShieldCheck size={14} className="text-[#DA9B26]" /> Admin Verification
          </div>
          <h1 className="mt-2 text-2xl font-black font-devotional text-[#4A0D15]">Authorize Password Reset</h1>
          <p className="mt-2 text-xs sm:text-sm text-[#756255]">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-[#2D1C13]">{email || "your admin email"}</span>
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-3.5 text-xs text-red-600 font-medium border border-red-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 font-medium border border-emerald-200">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleVerify} noValidate className="mt-6 space-y-4">
          {!initialEmail && (
            <div>
              <label htmlFor="email" className="text-xs sm:text-sm font-bold text-[#3D2619]">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pujaveda.in"
                className="mt-2 w-full rounded-xl border border-[#E8DDCE] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#DA9B26] focus:ring-2 focus:ring-[#DA9B26]/10"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="otp" className="text-xs sm:text-sm font-bold text-[#3D2619]">
              6-Digit Code
            </label>
            <div className="relative mt-2">
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full tracking-widest text-center text-xl font-bold font-mono rounded-xl border border-[#E8DDCE] bg-white py-3 outline-none transition focus:border-[#DA9B26] focus:ring-2 focus:ring-[#DA9B26]/10"
                required
              />
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#756255]" size={18} />
            </div>
            <p className="mt-1.5 text-xs text-[#756255]">Code expires in 10 minutes</p>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5C0F17] py-3.5 text-sm font-bold text-white transition hover:bg-[#43080E] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
          >
            {loading ? "Validating..." : "Validate Code"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-[#E8DDCE] pt-5 text-xs">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1 font-semibold text-[#756255] hover:text-[#5C0F17]"
          >
            <ArrowLeft size={14} /> Change Email
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="inline-flex items-center gap-1 font-bold text-[#E85D04] hover:underline disabled:text-[#756255] disabled:no-underline"
          >
            <RotateCw size={12} className={resending ? "animate-spin" : ""} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
          </button>
        </div>
      </div>
    </main>
  );
}
