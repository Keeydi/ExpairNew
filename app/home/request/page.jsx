"use client";

import { useState } from "react";
import { useSession } from 'next-auth/react';
import { Button } from "../../../components/ui/button";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function RequestPage() {
  const [serviceRequest, setServiceRequest] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState({ serviceRequest: "", date: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const validate = () => {
    let valid = true;
    let newErrors = { serviceRequest: "", date: "" };

    if (!serviceRequest.trim()) {
      newErrors.serviceRequest = "Please enter a service.";
      valid = false;
    }

    if (!date) {
      newErrors.date = "Please select a date.";
      valid = false;
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = "Date cannot be in the past.";
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };  
  
  const handleSubmit = async () => {
    if (!validate()) return;
    
    if (!session || !session.access) {
      console.log('No session or access token found');
      router.push('/auth/signin');
      return;
    }

    console.log('Making request with token:', session.access ? 'Token exists' : 'No token');
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access}`, // Fixed auth header
          },
          body: JSON.stringify({
            reqname: serviceRequest,
            reqdeadline: date
          })
        }
      );
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Trade request created:', data);
        // Redirect to pending trades page to see the created request
        router.push("/home/trades/pending");
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setErrors(prev => ({ 
          ...prev, 
          serviceRequest: errorData.error || "Failed to create request" 
        }));
      }
    } catch (error) {
      console.error('Network error:', error);
      setErrors(prev => ({ 
        ...prev, 
        serviceRequest: "Network error. Please try again." 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`pt-[40px] pb-[40px] flex min-h-screen items-center justify-center ${inter.className} relative overflow-hidden`}
      style={{ 
        backgroundImage: "url('/assets/bg_register1.png')",
        backgroundSize: "100% 120%",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Background glows */}
      <div className="absolute w-[673px] h-[673px] left-[-611.5px] top-[-336px] bg-[#906EFF] opacity-35 blur-[200px]"></div>
      <div className="absolute w-[673px] h-[673px] right-[-354px] bottom-[-454px] bg-[#0038FF] opacity-35 blur-[200px]"></div>
      
      <div className="relative z-10 w-full max-w-5xl text-center px-4 flex flex-col items-center">
        {/* Header spacing - reduced for authenticated users */}
        <div className="mb-[360px]"></div>
        
        {/* Main content */}
        <div className="flex flex-col items-center justify-center w-full max-w-[941px] mx-auto">
          {/* Title and subtitle */}
          <div className="flex flex-col items-center gap-[15px] mb-[25px] w-full">
            <h1 className="font-bold text-[31px] text-center text-white">
              What are you looking for?
            </h1>
            <p className="text-[16px] text-white/40">
              Create a new request
            </p>
          </div>
          
          
          {/* Service input field */}
          <div className="flex flex-col items-center gap-[15px] w-full mb-[40px]">
            <div className="w-[407px] h-[50px] bg-[#120A2A] rounded-[15px] px-[14px] py-[8px] flex items-center">
              <input
                type="text"
                placeholder="Enter a service you need. (e.g., Plumbing)"
                value={serviceRequest}
                onChange={(e) => {
                  setServiceRequest(e.target.value);
                  if (errors.serviceRequest) {
                    setErrors((prev) => ({ ...prev, serviceRequest: "" }));
                  }
                }}
                className="w-full h-full bg-transparent text-[16px] text-white outline-none placeholder:text-[#413663]"
              />
            </div>
            <div className="h-[10px]">
              {errors.serviceRequest && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.serviceRequest}
                </p>
              )}
            </div>
          </div>
          
          {/* Date selector */}
          <div className="flex flex-col items-center gap-[8px] w-full mb-[40px]">
            <p className="text-[16px] text-white text-center">
              Until when is this available?
            </p>
            <div className="relative w-[400px]">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) {
                    setErrors((prev) => ({ ...prev, date: "" }));
                  }
                }}
                className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[18px] py-[15px] pr-[45px] text-[16px] text-white outline-none placeholder:text-[#413663]"
              />
              <Calendar
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white cursor-pointer"
                onClick={() =>
                  document.querySelector('input[type="date"]')?.showPicker?.()
                }
              />
            </div>
            <div className="h-[10px]">
              {errors.date && (
                <p className="text-red-500 text-sm mt-2">{errors.date}</p>
              )}
            </div>
          </div>
          
          {/* Continue Button */}
          <div className="flex justify-center mt-[25px]">
            <Button
              className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-[20px] font-[500] transition rounded-[15px] disabled:opacity-50"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}