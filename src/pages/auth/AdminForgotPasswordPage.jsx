import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import { adminAuthService } from "../../services/adminAuthService";
import PujavedaLogo from "../../components/common/PujavedaLogo";

export default function AdminForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your registered administrator email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await adminAuthService.forgotPassword(trimmedEmail);
      setSuccessMessage(res.message || "Authorization code sent successfully.");
      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(trimmedEmail)}`);
      }, 1500);
    } catch (err) {
      if (err.devOtp) {
        setSuccessMessage(`Reset code generated: ${err.devOtp}`);
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(trimmedEmail)}`);
        }, 2000);
      } else {
        setError(err.message || "Unable to request administrator password reset code.");
      }
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

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#5C0F17]/10 px-3 py-1 text-xs font-bold text-[#5C0F17]">
            <ShieldCheck size={14} className="text-[#DA9B26]" /> Admin Security
          </div>
          <h1 className="mt-2 text-2xl font-black font-devotional text-[#4A0D15]">Admin Password Recovery</h1>
          <p className="mt-2 text-xs sm:text-sm text-[#756255]">
            Enter your admin email to receive an authorization code
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-3.5 text-xs text-red-600 font-medium border border-red-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 font-medium border border-emerald-200">
            {successMessage} Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-xs sm:text-sm font-bold text-[#3D2619]">
              Admin Email Address
            </label>
            <div className="relative mt-2">
              <input
                id="email"
                type="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pujaveda.in"
                className="w-full rounded-xl border border-[#E8DDCE] bg-white px-4 py-3 pl-11 text-sm outline-none transition focus:border-[#DA9B26] focus:ring-2 focus:ring-[#DA9B26]/10"
                required
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#756255]" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5C0F17] py-3.5 text-sm font-bold text-white transition hover:bg-[#43080E] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
          >
            {loading ? "Verifying..." : "Send Reset Code"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#756255] hover:text-[#5C0F17]"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
