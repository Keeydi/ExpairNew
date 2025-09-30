"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function SafetyGuidelines() {
  const router = useRouter();

  const handleAgree = () => {
    router.push("/register/flow"); // punta sa multi-step registration flow
  };

  return (
    <div
      className={`flex min-h-screen justify-center bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/signup.png')" }}
    >
      {/* Content */}
      <div className="relative z-10 max-w-4xl w-full text-center space-y-6 px-4 md:px-0 pt-[123px]">
        {/* Welcome */}
        <div className="flex flex-col items-center">
          <h1 className="text-xl md:text-[39px] font-[700] mb-[10px] md:mb-[15px] flex items-center justify-center gap-3">
            Welcome to
            <Image
              src="/assets/logos/Logotype=Logotype M.png"
              alt="Expair Logo"
              width={176}
              height={54}
              className="inline-block w-[120px] md:w-[176px] h-auto"
            />
            !
          </h1>
          <p className="text-[14px] md:text-[16px] font-[400] text-[rgba(255,255,255,0.60)] mb-[559px] px-2">
            Your safety is our top priority. Please follow these guidelines to keep our community safe.
          </p>
        </div>

        {/* Agreement */}
        <p className="text-[12px] md:text-[14px] font-[400] text-white max-w-md mx-auto mb-[20px] md:mb-[30px] mt-[40px] md:mt-[80px] px-2">
          By clicking on “I agree”, you acknowledge that you have read and agree to Expair’s{" "}
          <a href="/terms" className="underline text-[#6DDFFF]">
            Terms and Conditions
          </a>{" "}
          and{" "}
          <a href="/privacy-policy" className="underline text-[#6DDFFF]">
            Privacy Policy
          </a>
          .
        </p>

        {/* Button */}
        <div className="mt-4 flex justify-center items-center mb-[120px]">
          <Button
            onClick={handleAgree}
            className="cursor-pointer w-[200px] md:w-[240px] h-[45px] md:h-[50px] px-[20px] md:px-[38px] py-[10px] md:py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-[18px] md:text-[20px] font-normal transition rounded-[12px] md:rounded-[15px]"
          >
            I agree
          </Button>
        </div>
      </div>
    </div>
  );
}