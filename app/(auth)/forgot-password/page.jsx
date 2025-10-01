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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!email) {
        throw new Error("Please enter your email.");
      }

      // API call to your Django backend
      const response = await fetch("http://127.0.0.1:8000/forgot-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to send password reset link."
        );
      }

      return response.json();
    },
    onSuccess: () => {
      router.push("/verify-code");
    },
    onError: (error) => {
      console.warn("Error:", error.message);
      // You can also set a user-facing error message here if needed
      setErrorMessage(error.message);
    },
  });

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
        <h1 className="font-bold text-[25px] mb-[20px]">Forgot password?</h1>
        <p className="text-[16px] text-white/80 mb-[35px]">
          We got you, star — we’ll send you reset instructions.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMessage("");
            mutation.mutate();
          }}
          className="w-full space-y-4 flex flex-col items-center"
        >
          <p className="text-white font-normal mb-[15px] self-start pl-6">
            Email
          </p>
          <Input
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-[20px] w-[400px] max-w-full"
            required
          />

          {/* Error message */}
          {errorMessage && (
            <p className="text-red-500 text-sm mb-2 w-[400px] max-w-full text-left">
              {errorMessage}
            </p>
          )}

          <Button
            type="submit"
            className="flex w-[400px] max-w-full h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[15px] mb-[20px]"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Sending..." : "Reset password"}
          </Button>
        </form>

        <Link
          href="/signin"
          className="text-[#0038FF] hover:underline flex items-center gap-1 text-[20px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="fixed bottom-[62px] left-0 w-full flex justify-center gap-2 z-10">
          <span className="w-[120px] h-[10px] rounded-[15px] bg-[#0038FF]" />
          <span className="w-[120px] h-[10px] rounded-[15px] bg-white opacity-50" />
          <span className="w-[120px] h-[10px] rounded-[15px] bg-white opacity-50" />
        </div>
      </div>
    </div>
  );
}
