"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Step3({ step3Data, onDataSubmit, onNext, onPrev }) {
  const [profilePicFile, setProfilePicFile] = useState(
    step3Data.profilePicFile || null
  );
  const [profilePreview, setProfilePreview] = useState("/defaultavatar.png");

  const [userIDFile, setUserIDFile] = useState(step3Data.userIDFile || null);
  const [userIDFileName, setUserIDFileName] = useState(
    step3Data.userIDFileName || ""
  );

  const [introduction, setIntroduction] = useState(
    step3Data.introduction || ""
  );
  const [links, setLinks] = useState(step3Data.links || [""]); // keep as array

  // preview when a profile picture is selected
  useEffect(() => {
    if (!profilePicFile) return setProfilePreview("/defaultavatar.png");
    const url = URL.createObjectURL(profilePicFile);
    setProfilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePicFile]);

  useEffect(() => {
    if (step3Data) {
      setProfilePicFile(step3Data.profilePicFile || null);
      setUserIDFile(step3Data.userIDFile || null);
      setIntroduction(step3Data.introduction || "");
      setLinks(step3Data.links || []);
    }
  }, [step3Data]);

  const handleAddLink = () => {
    setLinks((prev) => [...prev, ""]);
  };

  const handleLinkChange = (index, value) => {
    const updated = [...links];
    updated[index] = value;
    setLinks(updated);
  };

  const handleRemoveLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    // Filter out empty links and ensure it's an array
    const filteredLinks = links.filter((link) => link && link.trim() !== "");

    onDataSubmit({
      profilePicFile,
      userIDFile,
      userIDFileName,
      introduction,
      links: filteredLinks, // Keep as array, don't stringify here
    });
    onNext();
  };

  const handlePrev = () => {
    onPrev({ profilePicFile, userIDFile, userIDFileName, introduction, links });
  };

  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      {/* Disclaimer */}
      <div className="fixed bottom-[20px] sm:bottom-[60px] left-4 sm:left-[40px] max-w-xs sm:max-w-[422px] text-[11px] sm:text-[13px] text-white/40 text-left z-50">
        Disclaimer: By linking your social media accounts, you agree to share
        selected public information for verification purposes. Expair will not
        post on your behalf or access private data. Use caution when linking
        accounts. Expair is not liable for third-party misuse.
      </div>

      <div className="relative z-10 w-full max-w-6xl text-center px-4">
        {/* Header */}
        <div className="flex flex-col items-center">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={250}
            height={76}
            className="rounded-full mb-[30px] w-[180px] sm:w-[250px]"
          />
          <h1 className="font-[600] text-[18px] sm:text-[25px] text-center mb-[40px] sm:mb-[70px]">
            Customize your profile for additional verification.
          </h1>
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row justify-center gap-[40px] lg:gap-[100px] mb-[40px]">
          {/* Left column - Photo upload */}
          <div className="flex flex-col items-center min-w-[250px]">
            <p className="text-white font-[500] text-[18px] sm:text-[20px] mb-[20px] sm:mb-[30px] text-center w-full">
              Upload a photo
            </p>

            <div className="flex flex-col items-center mb-[30px] sm:mb-[41px]">
              {/* Profile photo preview */}
              <div className="relative w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] mb-8">
                <div className="w-full h-full bg-[#120A2A] rounded-full shadow-[0px_20px_60px_rgba(0,0,0,0.35)] relative">
                  <Image
                    src={profilePreview}
                    alt="Profile Photo"
                    width={200}
                    height={200}
                    className="object-cover w-full h-full rounded-full"
                  />
                  <div className="absolute inset-0 border-[4px] sm:border-[5px] border-white/80 rounded-full"></div>
                </div>
              </div>

              {/* Upload button */}
              <label
                htmlFor="photo-upload"
                className="cursor-pointer bg-[#0038FF] hover:bg-[#1a4dff] text-white px-5 py-2 sm:px-6 sm:py-3 rounded-[15px] shadow-[0px_0px_15px_#284CCC] flex items-center gap-2"
              >
                <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Choose Photo</span>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProfilePicFile(e.target.files[0] || null)}
              />
            </div>

            {/* <p className="text-white font-[500] text-[18px] sm:text-[20px] mb-[12px] sm:mb-[15px] text-center w-full">
              Connect your socials
            </p>
            <div className="flex gap-[20px] sm:gap-[40px] flex-wrap justify-center">
              {[
                { src: "/assets/google.png", alt: "Google" },
                { src: "/assets/linkedin.png", alt: "LinkedIn" },
                { src: "/assets/facebook.png", alt: "Facebook" },
              ].map(({ src, alt }) => (
                <Image
                  key={alt}
                  src={src}
                  width={40}
                  height={40}
                  alt={alt}
                  className="cursor-pointer rounded-[10px]"
                  onClick={() => alert(`Signing up with ${alt}`)}
                />
              ))} 
            </div> */}
          </div>

          {/* Middle + Right columns */}
          <div className="flex flex-col lg:flex-row gap-[40px] lg:gap-[100px] w-full">
            {/* ID upload + Links */}
            <div className="flex flex-col gap-[20px] sm:gap-[25px] w-full lg:w-[400px]">
              {/* ID upload */}
              <div>
                <p className="text-white font-[500] text-[18px] sm:text-[20px] mb-[12px] sm:mb-[15px] text-left">
                  Get verified by uploading an ID
                </p>
                <div className="relative">
                  <div className="w-full h-[45px] sm:h-[50px] rounded-[12px] sm:rounded-[15px] border border-white/40 bg-[#120A2A] px-4 flex items-center justify-between cursor-pointer">
                    <span className="text-white/50 text-[14px] sm:text-[16px]">
                      {userIDFileName || "Upload file or photo"}
                    </span>
                    <Upload className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      onChange={(e) => {
                        setUserIDFile(e.target.files[0] || null); // Set the file
                        setUserIDFileName(e.target.files[0]?.name || ""); // Update the file name state
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Introduction */}
              <div>
                <p className="text-white font-[500] text-[18px] sm:text-[20px] mb-[15px] sm:mb-[25px] text-left">
                  Write a stellar introduction
                </p>
                <div className="relative">
                  <textarea
                    rows={4}
                    maxLength={500}
                    className="w-full h-[150px] sm:h-[207px] rounded-[12px] sm:rounded-[15px] px-3 sm:px-4 py-2 sm:py-3 text-white bg-[#120A2A] border border-white/40 resize-none placeholder-[#413663] placeholder:text-[14px] sm:placeholder:text-[16px]"
                    placeholder="Tell us more about yourself"
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                  />
                  <span className="absolute bottom-2 right-3 sm:bottom-3 sm:right-4 text-[10px] sm:text-xs text-gray-400">
                    {500 - introduction.length} characters left
                  </span>
                </div>
              </div>
            </div>
            {/* Right side: links */}
            <div className="flex-1 min-w-[200px] sm:min-w-[400px] text-left">
              <p className="text-white font-[500] text-[18px] sm:text-[20px] mb-[12px] sm:mb-[15px] text-left">
                Add a website or a link
              </p>
              <div className="max-h-[200px] sm:max-h-[310px] overflow-y-auto custom-scrollbar">
                {links.map((link, index) => (
                  <div key={index} className="relative mb-[12px] sm:mb-[15px]">
                    <Input
                      type="url"
                      value={link}
                      onChange={(e) => handleLinkChange(index, e.target.value)}
                      placeholder="Link here"
                      className="bg-[#120A2A] text-white border border-white/40 rounded-[12px] sm:rounded-[15px] w-full pr-8 sm:pr-10 h-[45px] sm:h-[50px] placeholder-[#413663] placeholder:text-[14px] sm:placeholder:text-[16px]"
                    />
                    {index > 0 && (
                      <X
                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-white/70 cursor-pointer"
                        onClick={() => handleRemoveLink(index)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddLink}
                className="font-[400] text-[14px] sm:text-[16px] text-[#0038FF] hover:underline text-left mt-1"
              >
                + Add another link
              </button>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center mt-[75px] mb-[25px]">
          <Button
            className="cursor-pointer flex w-[180px] sm:w-[240px] h-[45px] sm:h-[50px] justify-center items-center px-[20px] sm:px-[38px] py-[10px] sm:py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[12px] sm:rounded-[15px]"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>

        <p className="mt-2 text-sm text-gray-500 text-center">
          You can skip this step by clicking this button.
        </p>

        {/* Pagination */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-2 text-sm text-white opacity-60 z-50">
          <ChevronLeft
            className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={handlePrev}
          />
          <span>3 of 6</span>
          <ChevronRight
            className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={handleContinue}
          />
        </div>
      </div>
    </div>
  );
}