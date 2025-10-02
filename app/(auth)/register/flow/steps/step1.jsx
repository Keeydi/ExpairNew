"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import Image from "next/image";
import { Eye, EyeOff, ChevronRight, Check, X } from "lucide-react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Step1({ step1Data, onDataSubmit, onNext }) {
  const { data: session, status } = useSession();

  const [firstName, setFirstName] = useState(step1Data?.firstname || "");
  const [lastName, setLastName] = useState(step1Data?.lastname || "");
  const [email, setEmail] = useState(step1Data?.email || "");
  const [username, setUsername] = useState(step1Data?.username || "");
  const [password, setPassword] = useState(step1Data?.password || "");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  useEffect(() => {
    if (step1Data) {
      setFirstName(step1Data.firstname || "");
      setLastName(step1Data.lastname || "");
      setEmail(step1Data.email || "");
      setUsername(step1Data.username || "");
      setPassword(step1Data.password || "");
    }

    if (
      status === "authenticated" &&
      session?.user?.isNewUser &&
      session?.user?.googleData
    ) {
      const googleData = session.user.googleData;
      setIsGoogleUser(true);
      setFirstName(googleData.first_name || "");
      setLastName(googleData.last_name || "");
      setEmail(googleData.email || "");

      if (googleData.email && !username) {
        const emailUsername = googleData.email.split("@")[0];
        setUsername(emailUsername);
      }
      setErrorMessage("");
    }
  }, [step1Data, session, status]);

  const passwordRules = [
    { label: "At least one lowercase letter", test: /[a-z]/ },
    { label: "At least one uppercase letter", test: /[A-Z]/ },
    { label: "At least one number", test: /\d/ },
    { label: "At least one symbol (!@#$%^&*)", test: /[!@#$%^&*]/ },
    { label: "Minimum 8 characters", test: /.{8,}/ },
  ];

  const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    if (usernameError || emailError) {
      setErrorMessage("Please fix the errors before continuing.");
      return false;
    }
    if (
      !firstName ||
      !lastName ||
      !email ||
      !username ||
      !password ||
      !repeatPassword
    ) {
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
    if (!passwordRules.every((rule) => rule.test.test(password))) {
      setErrorMessage("Password does not meet all requirements.");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) return;
    onDataSubmit?.({ firstName, lastName, email, username, password });
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
      passwordRules.every((rule) => rule.test.test(password))
    );
  };

  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedUsername = useDebounce(username, 500);
  const debouncedEmail = useDebounce(email, 500);

  const checkAvailability = async (field, value) => {
    // 1. Check for the BASE_URL
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!baseUrl) {
      console.error("NEXT_PUBLIC_BACKEND_URL is not set!");
      // Set a general error state to prevent submission
      setErrorMessage("Configuration Error: Backend URL not found.");
      return true; // Treat as 'exists' to block submission
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/validate-field/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ field, value }),
      });

      // 2. Throw an error if the API call was unsuccessful (e.g., 404, 500)
      if (!response.ok) {
        // Read the body for a Django error, but continue to throw
        const errorText = await response.text();
        throw new Error(
          `API call failed with status: ${
            response.status
          }. Response: ${errorText.substring(0, 100)}...`
        );
      }

      const data = await response.json();
      return data.exists;
    } catch (error) {
      // This catch block handles both the initial 'Failed to fetch'
      // and the 'API call failed' errors we throw above.
      console.error(`Error checking ${field} for value "${value}":`, error);

      // This is the key fix: if fetch fails, assume the worst (network down)
      // and prevent the user from continuing without confirmation.
      setErrorMessage(
        `Network Error: Could not verify ${field} availability. Please check server or try again.`
      );

      // Returning true means "it exists" and will block the user.
      // This is a safer default when a critical network check fails.
      return true;
    }
  };

  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameError("");
      return;
    }
    const checkUsername = async () => {
      setIsCheckingUsername(true);
      const exists = await checkAvailability("username", debouncedUsername);
      setUsernameError(exists ? "Username already taken." : "");
      setIsCheckingUsername(false);
    };
    checkUsername();
  }, [debouncedUsername]);

  useEffect(() => {
    if (!debouncedEmail || !isEmailValid(debouncedEmail)) {
      setEmailError("");
      return;
    }
    const checkEmail = async () => {
      setIsCheckingEmail(true);
      const exists = await checkAvailability("email", debouncedEmail);
      setEmailError(exists ? "Account with this email already exists." : "");
      setIsCheckingEmail(false);
    };
    checkEmail();
  }, [debouncedEmail]);
  // ✅ END: Updated Validation Logic

  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center px-4 ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      <div className="relative z-10 w-full max-w-4xl text-center">
        <div className="flex flex-col items-center">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={250}
            height={76}
            className="rounded-full mb-[30px]"
          />
          {isGoogleUser ? (
            <div className="text-center mb-[50px]">
              <h1 className="font-[600] text-[25px] text-center mb-[10px]">
                Complete Your Account Setup
              </h1>
              <p className="text-white opacity-80 text-[16px]">
                Just a few more details to get you started
              </p>
            </div>
          ) : (
            <h1 className="font-[600] text-[25px] text-center mb-[90px]">
              Let's get your account started.
            </h1>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[44px] gap-y-[20px] justify-center">
          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">First name</p>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full h-[50px] p-4"
            />
          </div>

          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Last name</p>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full h-[50px] p-4"
            />
          </div>

          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Username</p>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full h-[50px] p-4 ${
                usernameError ? "border-red-500" : ""
              }`}
            />
            {isCheckingUsername && (
              <p className="text-gray-400 text-xs mt-1">
                Checking availability...
              </p>
            )}
            {usernameError && (
              <p className="text-red-500 text-xs mt-1">{usernameError}</p>
            )}
          </div>

          <div className="w-full max-w-[400px] text-left">
            <p className="text-white font-normal mb-[8px]">Email address</p>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full h-[50px] p-4 ${
                emailError ? "border-red-500" : ""
              }`}
            />
            {isCheckingEmail && (
              <p className="text-gray-400 text-xs mt-1">
                Checking availability...
              </p>
            )}
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>

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
                      <span
                        className={valid ? "text-green-400" : "text-red-400"}
                      >
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

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
                  {showRepeatPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[10px] mt-2">
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}
        </div>

        <p className="underline text-center text-sm text-[16px] mt-[px] mb-[60px]">
          <a
            href="/signin"
            className="text-[#6DDFFF]"
            onClick={async (e) => {
              e.preventDefault();
              try {
                if (isGoogleUser) {
                  await signOut({ redirect: false });
                }
              } catch (error) {
                console.error("Error signing out:", error);
              }
              window.location.href = "/signin";
            }}
          >
            I have an account already.
          </a>
        </p>

        <div className="flex justify-center mb-[47.5px]">
          <Button
            className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[15px]"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>

        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-2 text-[16px] text-white opacity-60 z-50">
          <span>1 of 6</span>
          <ChevronRight
            className={`w-5 h-5 ${
              isFormValid()
                ? "cursor-pointer text-gray-300 hover:text-white"
                : "text-gray-500 cursor-not-allowed"
            }`}
            onClick={handleContinue}
          />
        </div>
      </div>
    </div>
  );
}
