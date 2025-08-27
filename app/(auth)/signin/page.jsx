"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import ReCAPTCHA from "react-google-recaptcha";
import { useLoginStore } from "../../../stores/loginStore";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [captcha, setCaptcha] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { username, password, setUsername, setPassword } = useLoginStore();

useEffect(() => {
  if (status !== "authenticated") return;

  const u = session?.user || {};

  // If the flag is missing for any reason, force a clean sign-out to avoid loops
  if (typeof u.is_new === "undefined") {
    try {
      localStorage.removeItem("user_id");
      localStorage.removeItem("prefill_email");
      localStorage.removeItem("prefill_name");
    } catch {}
    import("next-auth/react").then(({ signOut }) =>
      signOut({ callbackUrl: "/signin" })
    );
    return;
  }

  if (u.is_new) {
    // New Google account -> prefill, then onboarding
    if (u.email) localStorage.setItem("prefill_email", u.email);
    if (u.name) localStorage.setItem("prefill_name", u.name);
    router.push("/register");
    return;
  }

  // Returning user must have id to proceed
  if (!u.id) {
    import("next-auth/react").then(({ signOut }) =>
      signOut({ callbackUrl: "/signin" })
    );
    return;
  }

  localStorage.setItem("user_id", u.id);
  router.push("/home");
}, [status, session]);




const handleLogin = async (e) => {
  e?.preventDefault?.();
  setErrorMessage("");

  // Basic form checks (you already render a reCAPTCHA)
  if (!username || !password) {
    setErrorMessage("Please enter both username and password");
    return;
  }
  if (!captcha) {
    setErrorMessage("Please verify CAPTCHA");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/api/accounts/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: username,   // username OR email
        password: password,
      }),
    });

    // Try to parse JSON safely
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : {};

    if (!res.ok) {
      // Backend sends {"error": "..."} on invalid creds
      setErrorMessage(data.error || "Login failed");
      return;
    }

    // Success payload includes user_id/username/email
    // Save what you need
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("username", data.username);
    if (data.first_Name) localStorage.setItem("first_Name", data.first_Name);

    // Navigate to home
    router.push("/home");
  } catch (err) {
    console.error("Login error:", err);
    setErrorMessage("Network error. Please try again.");
  }
};


  const handleGoogleLogin = () => {
     signIn("google", { prompt: "select_account" });
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-no-repeat bg-center bg-cover ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_signin.png')" }}
    >
      <div className="w-full max-w-md px-4 sm:px-6 text-white">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 mb-[20px] ">
          <Image
            src="/assets/logos/Colored=Logo S.png"
            alt="Logo"
            width={100}
            height={100}
            className="rounded-full"
          />
          <h1 className="font-bold text-[22px] sm:text-[25px] mb-[20px]">
            Welcome back, star!
          </h1>
        </div>

        {/* Username */}
        <p className="text-white font-normal mb-[15px]">Username or email address</p>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-[20px] w-full"
        />

        {/* Password */}
        <p className="text-white font-normal mb-[15px]">Password</p>
        <div className="relative mb-[20px]">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10 appearance-none w-full"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* reCAPTCHA */}
        <div className="flex justify-center mb-[20px]">
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            onChange={(value) => setCaptcha(value)}
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <p className="text-red-500 text-sm mb-3">{errorMessage}</p>
        )}

        {/* Remember Me + Forgot Password */}
        <div className="flex justify-between items-center text-[14px] sm:text-[16px] mb-[20px]">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-blue-500" />
            Remember me
          </label>
          <a href="/forgot-password" className="text-white opacity-50 hover:underline">
            Forgot password?
          </a>
        </div>

        {/* Sign In Button */}
        <Button
          className="cursor-pointer flex w-full sm:w-[400px] h-[50px] justify-center items-center px-4 py-3 shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-base sm:text-[20px] font-normal transition rounded-[15px] mb-[20px] mx-auto"
          onClick={handleLogin}
        >
          Sign in
        </Button>

        {/* Google Login */}
        <Button
          variant="outline"
          className="cursor-pointer flex w-full sm:w-[400px] h-[50px] justify-center items-center gap-2 mt-3 text-black text-base sm:text-[20px] font-medium rounded-[15px] border border-gray-300 hover:bg-gray-100 mb-[35px] mx-auto"
          onClick={handleGoogleLogin}
        >
          <img
            src="/assets/google_logo.png"
            alt="Google Logo"
            className="w-5 h-5"
          />
          Sign in with Google
        </Button>

        {/* Register Link */}
        <p className="text-center text-sm sm:text-[16px] mt-4">
          Don’t have an account yet?{" "}
          <a href="/register" className="text-[#6DDFFF] hover:underline">
            Register now!
          </a>
        </p>
      </div>
    </div>
  );
}
