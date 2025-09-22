"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import UploadProofDialog from "../../../../components/trade-cards/upload-proof-dialog";
import ViewProofDialog from "../../../../components/trade-cards/view-proof-dialog";
import SuccessDialog from "../../../../components/trade-cards/success-dialog";
import ActiveEvaluationDialog from "../../../../components/trade-cards/active-evaluation-dialog";
import { StarEvaluateIcon } from "../../../../components/icons/star-evaluate-icon";
import { StarIconSmall } from "../../../../components/icons/star-icon-small";
import { Star } from "lucide-react";
import Tooltip from "../../../../components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export default function ActiveTradesPage() {
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedSort, setSelectedSort] = useState("Date");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewProofDialog, setShowViewProofDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  // Active trades data
  const activeTrades = [
    {
      id: 1,
      name: "Olivia Brown",
      avatar: "/defaultavatar.png",
      rating: "5.0",
      reviews: "20",
      level: "14",
      requested: "Responsive Number Coaching for Weight Loss",
      offering: "Health & Wellness",
      location: "Online (synchronous)",
      deadline: "July 9",
      xp: "300 XP",
      description: "Certified nutritionist needed to create weekly meal plans and provide ongoing guidance.",
      status: "completed", // both parties approved and completed
      myProofSubmitted: true,
      partnerProofSubmitted: true,
      partnerHasProof: true, // whether partner actually has proof available
      myEvaluationSubmitted: true,
      partnerEvaluationSubmitted: true,
      traderId: "olivia_brown_123",
      canRate: true // both parties completed, ready for rating
    },
    {
      id: 2,
      name: "Emily Johnson",
      avatar: "/defaultavatar.png",
      rating: "4.8",
      reviews: "15",
      level: "12",
      requested: "Logo Design for New Cafe",
      offering: "Gardening Services",
      location: "Online (asynchronous)",
      deadline: "July 10",
      xp: "250 XP",
      description: "Need a professional logo design for a new coffee shop with a modern aesthetic.",
      status: "completed", // both parties approved and completed
      myProofSubmitted: true,
      partnerProofSubmitted: true,
      partnerHasProof: true,
      myEvaluationSubmitted: true,
      partnerEvaluationSubmitted: true,
      traderId: "emily_johnson_456",
      canRate: true // both parties completed, ready for rating
    },
    {
      id: 3,
      name: "Michael Lee",
      avatar: "/defaultavatar.png",
      rating: "4.9",
      reviews: "25",
      level: "18",
      requested: "Website Development for Startup",
      offering: "Digital Marketing",
      location: "In-person",
      deadline: "July 19",
      xp: "500 XP",
      description: "Looking for a skilled developer to create a responsive website for a new tech startup.",
      status: "active", // still in progress
      myProofSubmitted: true,
      partnerProofSubmitted: false,
      partnerHasProof: false, // partner hasn't uploaded proof yet
      myEvaluationSubmitted: true,
      partnerEvaluationSubmitted: false, // partner hasn't evaluated yet
      traderId: "michael_lee_789",
      canRate: false // not yet completed
    },
    {
      id: 4,
      name: "Jason Miller",
      avatar: "/defaultavatar.png",
      rating: "4.7",
      reviews: "12",
      level: "10",
      requested: "Tech Support for Home Network",
      offering: "Computer Repair",
      location: "Online (synchronous)",
      deadline: "July 22",
      xp: "300 XP",
      description: "Need assistance setting up and optimizing a home network for remote work.",
      status: "active", // still in progress
      myProofSubmitted: false,
      partnerProofSubmitted: true,
      partnerHasProof: true,
      myEvaluationSubmitted: false,
      partnerEvaluationSubmitted: false, // neither party has evaluated yet
      traderId: "jason_miller_012",
      canRate: false // not yet completed
    }
  ];

  const toggleCardExpand = (id) => {
    if (expandedCardId === id) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(id);
    }
  };

  // Simulate approval logic for the two routes
  const handleApprove = (trade) => {
    // Route A: If partner already approved and you approve next → automatically go to success dialog
    if (trade.partnerProofSubmitted && trade.myProofSubmitted) {
      setSelectedTrade(trade);
      setShowSuccessDialog(true);
    }
    // Route B: If you approve first but partner hasn't → wait (notification will trigger later)
    else {
      // Show notification that you're waiting for partner
      console.log("Waiting for partner to complete their part...");
      // In real app, this would show a notification/toast
    }
  };



  return (
    <div className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}>
      {/* Page Title with Sort/Filter */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-[25px] font-bold">Active trades</h1>

        <div className="flex items-center gap-4">
          {/* Sort Button */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] rounded-[15px] hover:bg-[#1A0F3E] transition text-sm cursor-pointer">
            <span>Sort</span>
            <Icon icon="lucide:arrow-up-down" className="text-lg" />
          </div>

          {/* Filter Button */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] rounded-[15px] hover:bg-[#1A0F3E] transition text-sm cursor-pointer">
            <span>Filter</span>
            <Icon icon="lucide:filter" className="text-lg" />
          </div>
        </div>
      </div>

      {/* Active Trades Section */}
      <div className="flex flex-col gap-[15px]">
        {activeTrades.map((trade) => (
          <div
            key={trade.id}
            className={`${expandedCardId === trade.id ? 'w-[945px]' : 'w-[945px]'} rounded-[20px] border-[3px] border-[#284CCC]/80 transition-all duration-300 hover:scale-[1.01] overflow-hidden`}
            style={{
              background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
              boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
            }}
          >
            {expandedCardId === trade.id ? (
              // Expanded View - Full Card with Image
              <div>
                {/* Header with more options button */}
                <div className="p-[25px] pb-[15px] flex justify-between items-start">
                  <div className="flex items-start gap-[10px]">
                    <div className="w-[35px] h-[35px] rounded-full overflow-hidden">
                      <Image
                        src={trade.avatar}
                        alt="Avatar"
                        width={35}
                        height={35}
                      />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-medium">{trade.name}</h3>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuIndex(openMenuIndex === trade.id ? null : trade.id);
                    }}>
                      <Icon icon="lucide:more-horizontal" className="w-6 h-6 text-white" />
                    </button>
                    {openMenuIndex === trade.id && (
                      <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                          <Icon icon="mdi:flag" className="text-white text-base" />
                          Report
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Large Image */}
                <div className="px-[25px] pb-[15px]">
                  <div className="w-full h-[300px] rounded-[15px] overflow-hidden">
                    <Image
                      src="/defaultavatar.png" // This would be the actual trade image
                      alt="Trade Preview"
                      width={900}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Trade Details */}
                <div className="px-[25px] pb-[15px]">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px] inline-block">
                        <span className="text-[16px] text-white">
                          Requested {trade.requested}
                        </span>
                      </div>
                    </div>
                    <span className="text-[16px] font-semibold text-[#906EFF]">
                      {trade.xp}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="text-[13px] text-white/60 block mb-1">Requested</span>
                      <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[1.5px] border-[#0038FF] rounded-[15px] inline-block">
                        <span className="text-[12px] text-white">{trade.requested}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[13px] text-white/60 block mb-1">In exchange for</span>
                      <div className="px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[1.5px] border-[#906EFF] rounded-[15px] inline-block">
                        <span className="text-[12px] text-white">{trade.offering}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Icon icon="lucide:map-pin" className="w-4 h-4 text-white" />
                      <span className="text-[13px] text-white">{trade.location}</span>
                    </div>

                    <p className="text-[14px] text-white/80">{trade.description}</p>

                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-white/60">Due on {trade.deadline}</span>
                      <button 
                        className="flex items-center justify-center w-6 h-6"
                        onClick={() => toggleCardExpand(trade.id)}
                      >
                        <Icon icon="lucide:chevron-up" className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-[25px] pb-[25px] flex flex-wrap justify-between">
                  <button 
                    className="min-w-[220px] max-w-[280px] h-[40px] flex justify-center items-center rounded-[15px] cursor-pointer transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrade(trade);
                      setShowViewProofDialog(true);
                    }}
                    style={{
                      background: "#0038FF",
                      boxShadow: "0px 0px 15px rgba(40, 76, 204, 0.6)"
                    }}
                  >
                    <div className="flex items-center gap-[10px] px-3">
                      <Icon icon="lucide:image" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                      <span className="text-[16px] text-white truncate">View proof</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-[15px]">
                    {trade.canRate && trade.status === "completed" && (
                      <button 
                        className="w-[170px] h-[40px] flex justify-center items-center rounded-[15px] cursor-pointer transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrade(trade);
                          setShowSuccessDialog(true);
                        }}
                        style={{
                          background: "#0038FF",
                          boxShadow: "0px 0px 15px rgba(40, 76, 204, 0.6)"
                        }}
                      >
                        <div className="flex items-center gap-[10px]">
                          <StarIconSmall />
                          <span className="text-[16px] text-white">Rate your trade</span>
                        </div>
                      </button>
                    )}
                    {!trade.partnerEvaluationSubmitted && trade.status !== "completed" ? (
                      <button
                        className="min-w-[170px] h-[40px] flex justify-center items-center rounded-[15px] border-2 border-[#7E59F8] bg-[#120A2A] shadow-[0_0_15px_#D78DE5] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrade(trade);
                          setShowEvaluationDialog(true);
                        }}
                      >
                        <div className="flex items-center gap-[10px]">
                          <StarIconSmall />
                          <span className="text-[16px] font-normal text-white">Review Details</span>
                        </div>
                      </button>
                    ) : (
                      <button
                        className="min-w-[170px] h-[40px] flex justify-center items-center rounded-[15px] border-2 border-[#7E59F8] bg-[#120A2A] shadow-[0_0_15px_#D78DE5] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrade(trade);
                          setShowEvaluationDialog(true);
                        }}
                      >
                        <div className="flex items-center gap-[10px]">
                          <StarIconSmall />
                          <span className="text-[16px] font-normal text-white">Review Details</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Centered Waiting Status */}
                {!trade.partnerEvaluationSubmitted && trade.status !== "completed" && (
                  <div className="w-full px-[25px] pb-[15px] flex justify-center">
                    <span className="text-[13px] text-white/60">Waiting for confirmation</span>
                  </div>
                )}
              </div>
            ) : (
              // Collapsed View
              <div
                className="p-[25px] flex flex-col justify-center items-start gap-[20px] cursor-pointer"
                onClick={() => toggleCardExpand(trade.id)}
              >
                {/* Top Row - Name and Menu */}
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-center gap-[10px]">
                    <div className="w-[25px] h-[25px] rounded-full overflow-hidden">
                      <Image
                        src={trade.avatar}
                        alt="Avatar"
                        width={25}
                        height={25}
                      />
                    </div>
                    <span className="text-[16px] font-normal text-white">
                      {trade.firstname} {trade.lastname}
                    </span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuIndex(openMenuIndex === trade.id ? null : trade.id);
                      }}
                    >
                      <Icon icon="lucide:more-horizontal" className="w-6 h-6 text-white" />
                    </button>
                    {openMenuIndex === trade.id && (
                      <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                          <Icon icon="mdi:flag" className="text-white text-base" />
                          Report
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle Row - Requested, In Exchange For, XP */}
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-center gap-[20px]">
                    <div className="flex flex-col gap-[15px]">
                      <div className="flex items-center gap-[10px]">
                        <span className="text-[16px] text-white">Requested</span>
                      </div>
                      <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px]">
                        <span className="text-[15px] text-white">{trade.requested}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-[15px]">
                      <span className="text-[16px] text-white">In exchange for</span>
                      <div className="px-[15px] py-[10px] bg-[rgba(144,110,255,0.2)] border-[1.5px] border-[#906EFF] rounded-[15px]">
                        <span className="text-[13px] text-white">{trade.offering}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[16px] font-semibold text-[#906EFF]">{trade.xp}</span>
                </div>

                {/* Bottom Row - Location and Due Date */}
                <div className="flex justify-between items-center w-full opacity-60">
                  <div className="flex items-center gap-[5px]">
                    <Icon icon="lucide:map-pin" className="w-4 h-4 text-white" />
                    <span className="text-[13px] text-white">{trade.location}</span>
                  </div>
                  <span className="text-[13px] font-normal text-white/60">Due on {trade.deadline}</span>
                </div>

                {/* Chevron Down + Action Buttons */}
                <div className="relative w-full mt-4">
                  {/* Chevron Down sa lower-left */}
                  <div className="absolute bottom-0 left-0">
                    <Icon
                      icon="lucide:chevron-down"
                      className="w-[30px] h-[30px] text-white cursor-pointer"
                    />
                  </div>

                  {/* Action Buttons sa kanan */}
                  <div className="flex flex-wrap items-center gap-[20px] justify-end">
                    {trade.status === "completed" && trade.canRate ? (
                      <button
                        className="w-[170px] h-[40px] flex justify-center items-center rounded-[15px] cursor-pointer transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrade(trade);
                          setShowSuccessDialog(true);
                        }}
                        style={{
                          background: "#0038FF",
                          boxShadow: "0px 0px 15px rgba(40, 76, 204, 0.6)"
                        }}
                      >
                        <div className="flex items-center gap-[10px]">
                          <StarIconSmall />
                          <span className="text-[16px] text-white">Rate your trade</span>
                        </div>
                      </button>
                    ) : (
                      <>
                        {/* Your Proof Button */}
                        <button
                          className="w-[130px] h-[40px] flex justify-center items-center rounded-[15px] cursor-pointer transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrade(trade);
                            setShowUploadDialog(true);
                          }}
                          style={{
                            background: "#0038FF",
                            boxShadow: "0px 0px 15px rgba(40, 76, 204, 0.6)"
                          }}
                        >
                          <div className="flex items-center gap-[10px]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.07483 0.5C8.58409 4.35956 11.6404 7.41579 15.5 7.92506V8.07483C11.6404 8.58409 8.58409 11.6404 8.07483 15.5H7.92517C7.41591 11.6404 4.35956 8.58409 0.5 8.07483V7.92506C4.35956 7.41579 7.41591 4.35956 7.92517 0.5H8.07483Z" fill="#D9D9D9"/></svg>
                            <span className="text-[16px] text-white">Your Proof</span>
                          </div>
                        </button>

                        {/* Partner Proof Button */}
                        <button
                          className={`min-w-[160px] max-w-[280px] h-[40px] flex justify-center items-center rounded-[15px] transition-all ${
                            trade.partnerHasProof 
                              ? "cursor-pointer" 
                              : "cursor-not-allowed opacity-50"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (trade.partnerHasProof) {
                              setSelectedTrade(trade);
                              setShowViewProofDialog(true);
                            }
                          }}
                          disabled={!trade.partnerHasProof}
                          style={{
                            background: "#0038FF",
                            boxShadow: trade.partnerHasProof ? "0px 0px 15px rgba(40, 76, 204, 0.6)" : "none"
                          }}
                        >
                          <div className="flex items-center gap-[10px] px-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 21C4.45 21 3.97933 20.8043 3.588 20.413C3.19667 20.0217 3.00067 19.5507 3 19V5C3 4.45 3.196 3.97933 3.588 3.588C3.98 3.19667 4.45067 3.00067 5 3H19C19.55 3 20.021 3.196 20.413 3.588C20.805 3.98 21.0007 3.45067 21 5V19C21 19.55 20.8043 20.021 20.413 20.413C20.0217 20.805 19.5507 21.0007 19 21H5ZM6 17H18L14.25 12L11.25 16L9 13L6 17Z" fill="white"/></svg>
                            <span className="text-[16px] text-white truncate">{trade.firstname}'s proof</span>
                          </div>
                        </button>
                      </>
                    )}
                    <div className="h-[70px] flex items-center">
                      <button
                        className="flex justify-center items-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrade(trade);
                          setShowEvaluationDialog(true);
                        }}
                      >
                        <StarEvaluateIcon size="60" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Centered Waiting Status for Collapsed View */}
                {!trade.partnerEvaluationSubmitted && trade.status !== "completed" && (
                  <div className="w-full mt-2 flex justify-center">
                    <span className="text-[13px] text-white/60">Waiting for confirmation</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload Proof Dialog */}
      {showUploadDialog && (
        <UploadProofDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onSubmit={(files) => {
            console.log("Files submitted:", files);
            setShowUploadDialog(false);
            // Here you would handle the file upload to your backend
          }}
          title={selectedTrade?.myProofSubmitted ? "Upload your proof" : "View Your Proof"}
          mode={selectedTrade?.myProofSubmitted ? "upload" : "view"}
        />
      )}

      {/* View Proof Dialog */}
      {showViewProofDialog && (
        <ViewProofDialog
          isOpen={showViewProofDialog}
          onClose={() => {
            setShowViewProofDialog(false);
          }}
          onApprove={() => {
            setShowViewProofDialog(false);
            // Show success dialog after a short delay
            setTimeout(() => {
              setShowSuccessDialog(true);
            }, 300);
          }}
          trade={selectedTrade}
        />
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <SuccessDialog
          isOpen={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          trade={selectedTrade}
        />
      )}

      {/* Evaluation Dialog */}
      {showEvaluationDialog && (
        <ActiveEvaluationDialog
          isOpen={showEvaluationDialog}
          onClose={() => setShowEvaluationDialog(false)}
          tradeData={{
            requestTitle: selectedTrade?.requested,
            offerTitle: selectedTrade?.offering,
            feedback: `This trade for ${selectedTrade?.requested} in exchange for ${selectedTrade?.offering} is well-balanced, with a high skill level required and moderate time commitment. The task complexity is fairly challenging, which makes this a valuable and rewarding exchange for both parties. Overall, it's a great match that promises meaningful growth and results.`
          }}
        />
      )}

    </div>
  );
}