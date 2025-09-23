"use client";

import { useState } from "react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function VerifyCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      // SKIP validation and API for now
      return true;
    },
    onSuccess: () => {
      setSuccessMessage("Code verified!");
      setTimeout(() => {
        router.push("/reset-password"); // NEXT STEP
      }, 800); // small delay just for feedback
    },
  });

  const handleResend = async () => {
    setSuccessMessage("Code resent!");
  };

  useEffect(() => {
    // You could fetch this from local storage or a store if you wanted to display the email
    // For now, we'll just set the state to show the success message
    setEmailSent(true);
  }, []);

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-cover bg-center text-white px-4 ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_signin.png')" }}
    >
      <div className="z-10 flex flex-col items-center space-y-6 text-center max-w-md w-full">
        <img
          src="/assets/logos/Colored=Logo S.png"
          alt="Logo"
          className="h-12 w-auto mb-[20px]"
        />

        <h1 className="font-bold text-[25px] mb-[20px]">Check your email</h1>
        <p className="text-[16px] text-white/80 mb-[35px]">
          We have sent a password reset link to your email. Please click the
          link to continue.
        </p>

        {/* This entire section replaces the form and "resend" button */}
        <Link
          href="/signin"
          className="text-[#0038FF] hover:underline flex items-center gap-1 text-[20px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="fixed bottom-[62px] left-0 w-full flex justify-center gap-2 z-10">
          <span className="w-[120px] h-[10px] rounded-[15px] bg-white opacity-50" />
          <span className="w-[120px] h-[10px] rounded-[15px] bg-[#0038FF]" />
          <span className="w-[120px] h-[10px] rounded-[15px] bg-white opacity-50" />
        </div>
      </div>
    </div>
  );
}
