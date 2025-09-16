"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import Image from "next/image";
import { Eye, EyeOff, ChevronRight, Check, X } from "lucide-react";
import { Inter } from "next/font/google";
import { signOut } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export default function Step1({ step1Data, onDataSubmit, onNext }) {
  const [firstName, setFirstName] = useState(step1Data?.firstname || "");
  const [lastName, setLastName] = useState(step1Data?.lastname || "");
  const [email, setEmail] = useState(step1Data?.email || "");
  const [username, setUsername] = useState(step1Data?.username || "");
  const [password, setPassword] = useState(step1Data?.password || "");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
  if (step1Data) {
    setFirstName(step1Data.firstname || "");
    setLastName(step1Data.lastname || "");
    setEmail(step1Data.email || "");
    setUsername(step1Data.username || "");
    setPassword(step1Data.password || "");
  }
}, [step1Data]);
  
  const passwordRules = [
    { label: "At least one lowercase letter", test: /[a-z]/ },
    { label: "At least one uppercase letter", test: /[A-Z]/ },
    { label: "At least one number", test: /\d/ },
    { label: "Minimum 8 characters", test: /.{8,}/ },
  ];

  const isEmailValid = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    if (!firstName || !lastName || !email || !username || !password || !repeatPassword) {
      setErrorMessage("Please fill in all fields.");
      return false;
    }

    if (!isEmailValid(email)) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }

    if (password !== repeatPassword) {
      setErrorMessage("Passwords do not match.");
      return false;
    }

    const allValid = passwordRules.every(rule => rule.test.test(password));
    if (!allValid) {
      setErrorMessage("Password does not meet all requirements.");
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const handleContinue = () => {
  if (!validateForm()) return;

  onDataSubmit?.({
    firstName,
    lastName,
    email,
    username,
    password,
  });

  onNext?.();
};

  const isFormValid = () => {
    return (
      firstName &&
      lastName &&
      email &&
      username &&
      password &&
      repeatPassword &&
      isEmailValid(email) &&
      password === repeatPassword &&
      passwordRules.every(rule => rule.test.test(password))
    );
  };

  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center px-4 ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      <div className="relative z-10 w-full max-w-4xl text-center">
        {/* Header */}
        <div className="flex flex-col items-center">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={250}
            height={76}
            className="rounded-full mb-[30px]"
          />
          <h1 className="font-[600] text-[25px] text-center mb-[90px]">
            Let’s get your account started.
          </h1>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[44px] gap-y-[20px] justify-center">
          {/* First Name */}
          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">First name</p>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full h-[50px] p-4"
            />
          </div>

          {/* Last Name */}
          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Last name</p>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full h-[50px] p-4"
            />
          </div>

          {/* Username */}
          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Username</p>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-[50px] p-4"
            />
          </div>

          {/* Email */}
          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Email address</p>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[50px] p-4"
            />
          </div>

          {/* Password */}
          <div className="relative w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Password</p>
            <div className="relative flex items-center">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[50px] p-4 pr-12"
              />
              <div className="absolute right-4 top-0 h-full flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password checklist (fixed height) */}
            <div className="mt-2 space-y-1 text-sm min-h-[90px]">
              {password &&
                passwordRules.map((rule, idx) => {
                  const valid = rule.test.test(password);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      {valid ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <X size={16} className="text-red-400" />
                      )}
                      <span className={valid ? "text-green-400" : "text-red-400"}>
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Repeat Password */}
          <div className="relative w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Repeat password</p>
            <div className="relative flex items-center">
              <Input
                type={showRepeatPassword ? "text" : "password"}
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="w-full h-[50px] p-4 pr-12"
              />
              <div className="absolute right-4 top-0 h-full flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  className="text-gray-400 hover:text-white"
                >
                  {showRepeatPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message (fixed height) */}
        <div className="h-[10px] mt-4">
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}
        </div>

        {/* Already have account */}
        <p className="underline text-center text-sm text-[16px] mt-[44px] mb-[100px]">
        <a
          href="/signin"
          className="text-[#6DDFFF]"
          onClick={async (e) => {
            e.preventDefault(); // stop the immediate nav
            try {
              localStorage.removeItem("prefill_email");
              localStorage.removeItem("prefill_name");
              localStorage.removeItem("user_id");
            } catch {}
            await signOut({ callbackUrl: "/signin" });
          }}
        >
          I have an account already.
        </a>
      </p>

        {/* Continue Button */}
        <div className="flex justify-center mb-[47.5px]">
          <Button
            className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[15px]"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 text-sm text-white opacity-60">
          <span>1 of 6</span>
          <ChevronRight
            className={`w-5 h-5 ${isFormValid() ? "cursor-pointer text-gray-300 hover:text-white" : "text-gray-500 cursor-not-allowed"}`}
            onClick={handleContinue}
          />
        </div>
      </div>
    </div>
  );
}
