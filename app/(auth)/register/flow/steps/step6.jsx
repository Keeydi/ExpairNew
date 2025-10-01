"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronDown, X } from "lucide-react";
import Image from "next/image";
import { Inter } from "next/font/google";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

const allCategories = [
  {
    id: 1,
    name: "Creative & Design",
    subcategories: [
      "Graphic Design",
      "Photography",
      "Video Editing",
      "Illustration",
      "Animation",
    ],
  },
  {
    id: 2,
    name: "Technical & IT",
    subcategories: [
      "Web Development",
      "Software Development",
      "IT Support",
      "Network Administration",
      "Cybersecurity",
    ],
  },
  {
    id: 3,
    name: "Business & Management",
    subcategories: [
      "Project Management",
      "Business Consulting",
      "Human Resources",
      "Operations Management",
      "Marketing Strategy",
    ],
  },
  {
    id: 4,
    name: "Communication & Interpersonal",
    subcategories: [
      "Customer Service",
      "Public Relations",
      "Copywriting",
      "Multilingual Communication",
      "Online Community Engagement",
    ],
  },
  {
    id: 5,
    name: "Health & Wellness",
    subcategories: [
      "Nutrition Coaching",
      "Personal Training",
      "Mental Health Counseling",
      "Yoga Instruction",
      "Fitness Coaching",
    ],
  },
  {
    id: 6,
    name: "Education & Training",
    subcategories: [
      "Tutoring",
      "Language Instruction",
      "Corporate Training",
      "Curriculum Development",
      "Test Preparation",
    ],
  },
  {
    id: 7,
    name: "Home & Lifestyle",
    subcategories: [
      "Interior Decorating",
      "Cleaning Services",
      "Gardening",
      "Event Planning",
      "Personal Assistance",
    ],
  },
  {
    id: 8,
    name: "Handiwork & Maintenance",
    subcategories: [
      "Furniture Assembly",
      "Sewing & Alterations",
      "Handyman Services",
      "Painting & Decorating",
      "Crafting",
    ],
  },
  {
    id: 9,
    name: "Digital & Social Media",
    subcategories: [
      "Social Media Management",
      "Content Creation",
      "SEO",
      "Digital Advertising",
      "Email Marketing",
    ],
  },
  {
    id: 10,
    name: "Languages & Translation",
    subcategories: [
      "Translation",
      "Interpretation",
      "Language Tutoring",
      "Transcription",
      "Localization",
    ],
  },
  {
    id: 11,
    name: "Financial & Accounting",
    subcategories: [
      "Bookkeeping",
      "Tax Preparation",
      "Financial Planning",
      "Payroll Services",
      "Auditing",
    ],
  },
  {
    id: 12,
    name: "Sports & Fitness",
    subcategories: [
      "Personal Training",
      "Group Fitness Instruction",
      "Sports Coaching",
      "Nutrition for Athletes",
      "Physical Therapy",
    ],
  },
  {
    id: 13,
    name: "Arts & Performance",
    subcategories: [
      "Music Lessons",
      "Dance Instruction",
      "Acting Coaching",
      "Visual Arts",
      "Creative Writing",
    ],
  },
  {
    id: 14,
    name: "Culture & Diversity",
    subcategories: [
      "Diversity Training",
      "Cultural Consulting",
      "Language & Cultural Exchange",
      "Community Outreach",
      "Inclusion Workshops",
    ],
  },
  {
    id: 15,
    name: "Research & Critical Thinking",
    subcategories: [
      "Market Research",
      "Data Analysis",
      "Academic Research",
      "Competitive Analysis",
      "Strategic Planning",
    ],
  },
];

export default function Step6({
  step1Data,
  step2Data,
  step3Data,
  step4Data,
  step5Data,
  step6Data = [],
  onPrev,
  onConfirm,
  isSubmitting,
}) {
  const [openDropdowns, setOpenDropdowns] = useState({}); // { [genId]: boolean }
  const [errorMessage, setErrorMessage] = useState(""); // UI error text
  const [checkedOptions, setCheckedOptions] = useState({}); // { [genId]: number[] } -> specskills_ids
  const [specByGen, setSpecByGen] = useState({}); // { [genId]: [{id, name}] } from backend
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // <-- Added modal state

  // Fix: Use step6Data directly and handle the data format from step5
  const safeSelected = Array.isArray(step6Data) ? step6Data : [];
  const selectedCategoryIds = useMemo(() => {
    return safeSelected
      .map((s) => {
        // Handle the data format from step5 (which has category_id)
        if (typeof s === "number") return s;
        if (typeof s === "string" && !isNaN(Number(s))) return Number(s);
        return s?.category_id ?? s?.genskills_id ?? null;
      })
      .filter(Boolean);
  }, [safeSelected]);

  const categories = useMemo(
    () => allCategories.filter((c) => selectedCategoryIds.includes(c.id)),
    [selectedCategoryIds]
  );

  useEffect(() => {
    let isCancelled = false;
    async function run() {
      if (!selectedCategoryIds.length) return;
      setLoadingSpecs(true);
      try {
        const entries = await Promise.all(
          selectedCategoryIds.map(async (gid) => {
            try {
              const r = await fetch(
                `/api/dj/skills/specific/?genskills_id=${gid}`
              );
              const data = await r.json();
              const list = (Array.isArray(data) ? data : []).map((s) => ({
                id: Number(s.specSkills_id ?? s.id),
                name: s.specName ?? s.name,
              }));
              return [gid, list];
            } catch {
              return [gid, []];
            }
          })
        );
        if (!isCancelled) setSpecByGen(Object.fromEntries(entries));
      } finally {
        if (!isCancelled) setLoadingSpecs(false);
      }
    }
    run();
    return () => {
      isCancelled = true;
    };
  }, [selectedCategoryIds]);

  const toggleDropdown = (categoryId) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const toggleCheckbox = (categoryId, option) => {
    setCheckedOptions((prev) => {
      const currentOptions = prev[categoryId] || [];

      if (currentOptions.includes(option)) {
        const newOptions = {
          ...prev,
          [categoryId]: currentOptions.filter((item) => item !== option),
        };

        // Clear error if there's at least one selection across all categories
        const hasSelections = Object.values(newOptions).some(
          (arr) => arr && arr.length > 0
        );
        if (hasSelections) {
          setErrorMessage("");
        }

        return newOptions;
      } else {
        setErrorMessage(""); // Clear error when adding a selection
        return {
          ...prev,
          [categoryId]: [...currentOptions, option],
        };
      }
    });
  };

  const isOptionChecked = (genId, specId) =>
    (checkedOptions[genId] || []).includes(specId);

  const handleContinue = () => {
    const missing = categories
      .filter(
        (cat) => !(checkedOptions[cat.id] && checkedOptions[cat.id].length > 0)
      )
      .map((cat) => `• ${cat.name}`);

    if (missing.length) {
      setErrorMessage(
        "Please select at least one specialization for each chosen category:\n" +
          missing.join("\n")
      );
      return;
    }

    // Show the confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    // pass selections up to parent
    onConfirm?.({
      selectedCategoryIds, // array of genskills ids
      checkedOptions, // object { genId: [specSkillId, ...], ... }
    });
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const handleNextClick = () => {
    handleContinue();
  };

  return (
    <div
      className={`pt-[60px] pb-[50px] flex min-h-screen bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      <div className="relative z-10 w-full max-w-5xl text-center px-4 flex flex-col items-center mx-auto">
        {/* Header - Fixed at top */}
        <div className="flex flex-col items-center flex-shrink-0">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={249.3}
            height={76}
            className="mb-[30px]"
          />
          <h1 className="font-[600] text-[25px] text-center mb-[60px]">
            Set up your skills.
          </h1>
        </div>

        {/* Show loading or no categories message */}
        {loadingSpecs && (
          <div className="text-white mb-4">Loading specializations...</div>
        )}

        {!loadingSpecs && categories.length === 0 && (
          <div className="text-white mb-4">
            No categories selected. Please go back to Step 5.
          </div>
        )}

        {/* Main content - Grows to fill space */}
        {categories.length > 0 && (
          <div className="flex flex-col items-center justify-start w-full max-w-[922px] mx-auto flex-grow">
            <h2 className="text-[20px] font-[500] text-center text-white mb-[20px]">
              Select your specializations in each skill category.
            </h2>

            {/* Your existing dropdown content */}
            <div
              className={`flex flex-row gap-[120px] w-full ${
                categories.length === 1 ? "justify-center" : ""
              }`}
            >
              {" "}
              <div className="flex flex-col gap-[20px] w-[401px]">
                {categories
                  .slice(0, Math.ceil(categories.length / 2))
                  .map((category) => (
                    <div key={category.id} className="w-full">
                      <div className="flex flex-col gap-[15px]">
                        <label className="text-white text-[16px] text-left">
                          {category.name}
                        </label>
                        <div className="relative">
                          {!openDropdowns[category.id] && (
                            <div
                              className="w-[400px] h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] flex items-center justify-between px-4 cursor-pointer"
                              onClick={() => toggleDropdown(category.id)}
                            >
                              <span className="text-[#413663] text-[16px]">
                                Select subcategory
                              </span>
                              <ChevronDown className="w-6 h-6 text-white" />
                            </div>
                          )}

                          {openDropdowns[category.id] && (
                            <div className="w-[400px] bg-[#120A2A] border border-white/40 rounded-[15px] p-[20px_15px_10px_20px] flex flex-col justify-between transition-all duration-300">
                              {specByGen[category.id]?.map((spec) => (
                                <div
                                  key={spec.id}
                                  className="flex flex-row items-center gap-[15px] cursor-pointer hover:bg-white/5 rounded-[8px] p-[5px] transition-colors duration-200"
                                  onClick={() =>
                                    toggleCheckbox(category.id, spec.id)
                                  }
                                >
                                  <div className="w-[18px] h-[18px] flex items-center justify-center">
                                    {isOptionChecked(category.id, spec.id) ? (
                                      <div className="w-[18px] h-[18px] bg-gradient-to-br from-[#0038FF] to-[#906EFF] rounded-[4px] border border-[#0038FF] flex items-center justify-center shadow-[0px_2px_8px_rgba(0,56,255,0.3)]">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="12"
                                          height="12"
                                          viewBox="0 0 12 12"
                                          fill="none"
                                        >
                                          <path
                                            d="M4.5 8.7L1.95 6.15L2.85 5.25L4.5 6.9L9.15 2.25L10.05 3.15L4.5 8.7Z"
                                            fill="white"
                                            strokeWidth="1.5"
                                          />
                                        </svg>
                                      </div>
                                    ) : (
                                      <div className="w-[18px] h-[18px] border-2 border-white/40 rounded-[4px] hover:border-white/60 transition-colors duration-200 bg-transparent"></div>
                                    )}
                                  </div>
                                  <span className="text-white text-[16px] font-[400] leading-[19px] select-none">
                                    {spec.name}
                                  </span>
                                </div>
                              ))}
                              <ChevronDown
                                className="w-6 h-6 text-white self-end transform rotate-180 cursor-pointer mt-[10px]"
                                onClick={() => toggleDropdown(category.id)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {categories.length > 1 && (
                <div className="flex flex-col gap-[20px] w-[401px]">
                  {categories
                    .slice(Math.ceil(categories.length / 2))
                    .map((category) => (
                      <div key={category.id} className="w-full">
                        <div className="flex flex-col gap-[15px]">
                          <label className="text-white text-[16px] text-left">
                            {category.name}
                          </label>
                          <div className="relative">
                            {!openDropdowns[category.id] && (
                              <div
                                className="w-[400px] h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] flex items-center justify-between px-4 cursor-pointer"
                                onClick={() => toggleDropdown(category.id)}
                              >
                                <span className="text-[#413663] text-[16px]">
                                  Select subcategory
                                </span>
                                <ChevronDown className="w-6 h-6 text-white" />
                              </div>
                            )}

                            {openDropdowns[category.id] && (
                              <div className="w-[400px] bg-[#120A2A] border border-white/40 rounded-[15px] p-[20px_15px_10px_20px] flex flex-col justify-between transition-all duration-300">
                                {specByGen[category.id]?.map((spec) => (
                                  <div
                                    key={spec.id}
                                    className="flex flex-row items-center gap-[15px] cursor-pointer hover:bg-white/5 rounded-[8px] p-[5px] transition-colors duration-200"
                                    onClick={() =>
                                      toggleCheckbox(category.id, spec.id)
                                    }
                                  >
                                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                                      {isOptionChecked(category.id, spec.id) ? (
                                        <div className="w-[18px] h-[18px] bg-gradient-to-br from-[#0038FF] to-[#906EFF] rounded-[4px] border border-[#0038FF] flex items-center justify-center shadow-[0px_2px_8px_rgba(0,56,255,0.3)]">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                          >
                                            <path
                                              d="M4.5 8.7L1.95 6.15L2.85 5.25L4.5 6.9L9.15 2.25L10.05 3.15L4.5 8.7Z"
                                              fill="white"
                                              strokeWidth="1.5"
                                            />
                                          </svg>
                                        </div>
                                      ) : (
                                        <div className="w-[18px] h-[18px] border-2 border-white/40 rounded-[4px] hover:border-white/60 transition-colors duration-200 bg-transparent"></div>
                                      )}
                                    </div>
                                    <span className="text-white text-[16px] font-[400] leading-[19px] select-none">
                                      {spec.name}
                                    </span>
                                  </div>
                                ))}
                                <ChevronDown
                                  className="w-6 h-6 text-white self-end transform rotate-180 cursor-pointer mt-[10px]"
                                  onClick={() => toggleDropdown(category.id)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        <div className="h-[10px] mt-4 flex-shrink-0">
          {errorMessage && (
            <p className="text-red-500 text-sm whitespace-pre-line">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Continue Button - Fixed at bottom */}
        {categories.length > 0 && (
          <div className="flex justify-center mt-[60px] mb-[47.5px] flex-shrink-0">
            <Button
              className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-[500] transition rounded-[15px]"
              onClick={() => {
                const hasSelections = Object.values(checkedOptions).some(
                  (arr) => arr && arr.length > 0
                );
                if (!hasSelections) {
                  setErrorMessage("Please select at least one specialization.");
                  return;
                }
                setErrorMessage("");
                setShowConfirmModal(true);
              }}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Pagination - Centered at bottom */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-2 text-sm text-white opacity-60 z-50">
          <ChevronLeft
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onPrev}
          />
          <span>6 of 6</span>
          <ChevronLeft
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white transform rotate-180"
            onClick={handleNextClick}
          />
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={handleCancel}
            ></div>
            <div className="relative flex flex-col items-center justify-center w-[500px] h-[220px] bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-[-100px] left-[-100px] w-[200px] h-[200px] rounded-full bg-[#0038FF]/20 blur-[60px]"></div>
              <div className="absolute bottom-[-80px] right-[-80px] w-[180px] h-[180px] rounded-full bg-[#D78DE5]/20 blur-[60px]"></div>

              {/* Close button */}
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-300"
                onClick={handleCancel}
              >
                <X className="w-[15px] h-[15px]" />
              </button>

              <div className="flex flex-col items-center gap-4 w-full px-8 text-center">
                {/* Title */}
                <h2 className="font-bold text-[22px] text-white leading-tight">
                  Are all your account details accurate?
                </h2>

                {/* Buttons */}
                <div className="flex flex-row gap-5 mt-3">
                  <button
                    className="flex items-center justify-center w-[130px] h-[38px] border-2 border-[#0038FF] rounded-[15px] text-[#0038FF] text-[15px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#0038FF]/10 transition-colors cursor-pointer"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex items-center justify-center w-[130px] h-[38px] bg-[#0038FF] rounded-[15px] text-white text-[15px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer disabled:opacity-50"
                    onClick={handleConfirm}
                    disabled={isSubmitting} // <-- USE NEW PROP TO DISABLE
                  >
                    {/* Display Spinner or Text based on submission state */}
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Confirm"
                    )}
                  </button>
                </div>
                {/* Subtitle */}
                <p className="text-white/60 text-[14px]">
                  You may edit these details again in your profile.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
