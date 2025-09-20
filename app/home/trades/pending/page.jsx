"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import OffersPopup from "../../../../components/trade-cards/offers-popup";
import EvaluationDialog from "../../../../components/trade-cards/evaluation-dialog";
import { Star } from "lucide-react";
import Tooltip from "../../../../components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export default function PendingTradesPage() {
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedSort, setSelectedSort] = useState("Date");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showOffersPopup, setShowOffersPopup] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [expandedFinalizationCardId, setExpandedFinalizationCardId] = useState(null);

  // Data for trades you posted
  const postedTrades = [
    {
      id: 1,
      name: "John Doe",
      rating: "5.0",
      reviews: "25",
      level: "15",
      needs: "Plumbing",
      interested: [
        { id: 1, avatar: "/defaultavatar.png" },
        { id: 2, avatar: "/defaultavatar.png" },
        { id: 3, avatar: "/defaultavatar.png" }
      ],
      until: "July 5"
    },
    {
      id: 2,
      name: "John Doe",
      rating: "5.0",
      reviews: "25",
      level: "15",
      needs: "Logo and Branding Design",
      interested: [
        { id: 1, avatar: "/defaultavatar.png" },
        { id: 2, avatar: "/defaultavatar.png" }
      ],
      until: "July 11"
    }
  ];

  // Data for trades you initiated
  const initiatedTrades = [
    {
      id: 1,
      name: "Alex Johnson",
      rating: "5.0",
      reviews: "31",
      level: "20",
      needs: "Personal Training Plan",
      offers: "Plumbing",
      until: "July 3",
      status: "Waiting for approval"
    },
    {
      id: 2,
      name: "Isabella Davis",
      rating: "4.2",
      reviews: "18",
      level: "8",
      needs: "Social Media Management",
      offers: "Graphic Design",
      until: "June 12",
      status: "Waiting for approval"
    }
  ];

  // Data for trades for finalization
  const finalizationTrades = [
    {
      id: 1,
      name: "Olivia Brown",
      rating: "5.0",
      reviews: "20",
      level: "14",
      needs: "Nutrition Coaching",
      offers: "Graphic Design",
      until: "July 1"
    },
    {
      id: 2,
      name: "Kevin Nguyen",
      rating: "3.9",
      reviews: "10",
      level: "18",
      needs: "Training for Weight Loss",
      offers: "Meal Preparation",
      until: "July 1"
    }
  ];

  // Toggle card expand for finalization trades
  const toggleFinalizationCardExpand = (id) => {
    if (expandedFinalizationCardId === id) {
      setExpandedFinalizationCardId(null);
    } else {
      setExpandedFinalizationCardId(id);
    }
  };

  return (
    <div className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}>
      {/* Page Title with Sort/Filter */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-[25px] font-[600]">Pending trades</h1>

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

      {/* Trades You Posted Section */}
      <div className="mb-10">
        <h2 className="text-[20px] font-[500] mb-5 text-[#D78DE5]">Trades you posted</h2>
        <div className="flex flex-wrap gap-[25px]">
          {postedTrades.map((trade, index) => (
            <div
              key={trade.id}
              className="transition-all duration-300 hover:scale-[1.01] w-[440px] h-[240px] p-[25px] flex flex-col justify-between rounded-[20px] border-[3px] border-[#D78DE5]/80"
              style={{
                background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
              }}
            >
              {/* Trade Header */}
              <div className="flex justify-between items-start w-full">
                <div className="flex items-start gap-[10px]">
                  <img src="/defaultavatar.png" alt="Default Avatar" className="w-[25px] h-[25px] rounded-full object-cover" />
                  <div className="flex flex-col items-start gap-[5px]">
                    <span className="text-[16px] text-white">{trade.name}</span>
                    <div className="flex items-center gap-[15px]">
                      <div className="flex items-center gap-[5px]">
                        <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF]" />
                        <span className="text-[13px] font-bold text-white">{trade.rating}</span>
                        <span className="text-[13px] font-normal text-white"> ({trade.reviews})</span>
                      </div>
                      <div className="flex flex-col gap-[3px]">
                        <div className="flex items-center gap-[5px]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z" fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5"/><defs><radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)"><stop offset="0.4" stopColor="#933BFF"/><stop offset="1" stopColor="#34188D"/></radialGradient><linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="0.5" stopColor="#999999"/><stop offset="1" stopColor="white"/></linearGradient></defs></svg>
                          <span className="text-[13px] text-white">LVL {trade.level}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}>
                    <Icon icon="lucide:more-horizontal" className="w-6 h-6 text-white" />
                  </button>
                  {openMenuIndex === index && (
                    <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
                      <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                        <Icon icon="lucide:edit" className="text-white text-base" />
                        Edit
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                        <Icon icon="lucide:trash-2" className="text-white text-base" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Needs and Interested Section */}
              <div className="flex justify-between items-start w-full">
                {/* Needs */}
                <div className="flex flex-col items-start gap-[10px]">
                  <span className="text-[13px] text-white">Needs</span>
                  <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px]">
                    <span className="text-[13px] text-white leading-tight">{trade.needs}</span>
                  </div>
                </div>
                
                {/* Interested People */}
                <div className="flex flex-col items-end gap-[10px]">
                  <span className="text-[13px] text-white">Look who's interested</span>
                  <div className="flex -space-x-2">
                    {trade.interested.map((person) => (
                      <div key={person.id} className="w-[25px] h-[25px] rounded-full border border-white overflow-hidden">
                        <Image
                          src={person.avatar}
                          alt="Avatar"
                          width={25}
                          height={25}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="flex justify-end items-center w-full">
                <span className="text-[13px] [color:var(--White-Heavy,_rgba(255,255,255,0.60))]">until {trade.until}</span>
              </div>

              {/* View Button - Centered */}
              <div className="flex justify-center w-full">
                <button 
                  className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors"
                  onClick={() => {
                    setSelectedService(trade.needs);
                    setShowOffersPopup(true);
                  }}
                >
                  <span className="text-[13px] text-white">View</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trades You Initiated Section */}
      <div className="mb-10">
        <h2 className="text-[20px] font-medium mb-5 text-[#FB9696]">Trades you initiated</h2>
        <div className="flex flex-wrap gap-[25px]">
          {initiatedTrades.map((trade, index) => (
            <div
              key={trade.id}
              className="transition-all duration-300 hover:scale-[1.01]transition-all duration-300 hover:scale-[1.01] w-[440px] h-[240px] p-[25px] flex flex-col justify-between rounded-[20px] border-[3px] border-[#FB9696]/80"
              style={{
                background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
              }}
            >
              {/* Trade Header */}
              <div className="flex justify-between items-start w-full">
                <div className="flex items-start gap-[10px]">
                  <img src="/defaultavatar.png" alt="Default Avatar" className="w-[25px] h-[25px] rounded-full object-cover" />
                  <div className="flex flex-col items-start gap-[5px]">
                    <span className="text-[16px] text-white">{trade.name}</span>
                    <div className="flex items-center gap-[15px]">
                      <div className="flex items-center gap-[5px]">
                        <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF]" />
                        <span className="text-[13px] font-bold text-white">{trade.rating}</span>
                        <span className="text-[13px] font-normal text-white"> ({trade.reviews})</span>
                      </div>
                      <div className="flex flex-col gap-[3px]">
                        <div className="flex items-center gap-[5px]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
                            <path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z" 
                              fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5" />
                            <defs>
                              <radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)">
                                <stop offset="0.4" stopColor="#933BFF"/>
                                <stop offset="1" stopColor="#34188D"/>
                              </radialGradient>
                              <linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse">
                                <stop stopColor="white"/>
                                <stop offset="0.5" stopColor="#999999"/>
                                <stop offset="1" stopColor="white"/>
                              </linearGradient>
                            </defs>
                          </svg>
                          <span className="text-[13px] text-white">LVL {trade.level}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenuIndex(openMenuIndex === `initiated-${index}` ? null : `initiated-${index}`)}>
                    <Icon icon="lucide:more-horizontal" className="w-6 h-6 text-white" />
                  </button>
                  {openMenuIndex === `initiated-${index}` && (
                    <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
                      <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                        <Icon icon="lucide:x" className="text-white text-base" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Needs / Offers */}
              <div className="flex justify-between items-start w-full">
                <div className="flex flex-col items-start gap-[10px]">
                  <span className="text-[13px] text-white">Needs</span>
                  <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px]">
                    <span className="text-[13px] text-white leading-tight">{trade.needs}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-[10px]">
                  <span className="text-[13px] text-white">Can offer</span>
                  <div className="px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px]">
                    <span className="text-[13px] text-white leading-tight">{trade.offers}</span>
                  </div>
                </div>
              </div>

              {/* Date - Bottom Right */}
              <div className="flex justify-end items-center w-full">
                <span className="text-[13px] text-white/60">until {trade.until}</span>
              </div>

              {/* Status - Centered */}
              <div className="flex justify-center w-full">
                <span className="text-[13px] text-white/60">{trade.status}</span>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Trades for Finalization Section */}
      <div className="mb-10">
        <h2 className="text-[20px] font-medium mb-5 text-[#6DDFFF]">Trades for finalization</h2>
        <div className="flex flex-wrap gap-[25px]">
          {finalizationTrades.map((trade, index) => (
            <div
              key={trade.id}
              className={`${expandedFinalizationCardId === trade.id ? 'w-[945px]' : 'w-[440px]'} transition-all duration-300 hover:scale-[1.01] ${expandedFinalizationCardId === trade.id ? 'h-auto' : 'h-[240px]'} rounded-[20px] border-[3px] border-[#6DDFFF]/80`}
              style={{
                background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
              }}
            >
              {expandedFinalizationCardId === trade.id ? (
                // Expanded View - Full Card with Image
                <div>
                  {/* Header with more options button */}
                  <div className="p-[25px] pb-[15px] flex justify-between items-start">
                    <div className="flex items-start gap-[10px]">
                      <div className="w-[25px] h-[25px] rounded-full overflow-hidden">
                        <Image
                          src="/defaultavatar.png"
                          alt="Avatar"
                          width={25}
                          height={25}
                        />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-normal">{trade.name}</h3>
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuIndex(openMenuIndex === `final-${index}` ? null : `final-${index}`);
                      }}>
                        <Icon icon="lucide:more-horizontal" className="w-6 h-6 text-white" />
                      </button>
                      {openMenuIndex === `final-${index}` && (
                        <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
                          <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                            <Icon icon="lucide:x" className="text-white text-base" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Large Image */}
                  <div className="px-[25px] pb-[20px]">
                    <div className="w-full h-[321px] rounded-[15px] overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)]">
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
                  <div className="px-[25px] pb-[20px]">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px] inline-block">
                          <span className="text-[16px] text-white">
                            Requested {trade.needs}
                          </span>
                        </div>
                      </div>
                      <span className="text-[16px] font-normal text-[#906EFF]">
                        300 XP
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Icon icon="lucide:map-pin" className="w-4 h-4 text-[rgba(255,255,255,0.60)]" />
                          <span className="text-[13px] text-[rgba(255,255,255,0.60)]">Online (synchronous)</span>
                        </div>
                        <span className="text-[13px] font-normal text-[rgba(255,255,255,0.60)]">Due on {trade.until}</span>
                      </div>

                      <div className="flex flex-wrap gap-[15px]">
                        {["Health & Wellness", "Nutrition Coaching", "Certified", "Service"].map((tag, tagIndex) => (
                          <div
                            key={tagIndex}
                            className="px-[15px] py-[4px] border-[2px] border-white rounded-[15px]"
                          >
                            <span className="text-[13px] font-normal text-white">{tag}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px] inline-block">
                          <span className="text-[16px] text-white">In exchange for {trade.offers}</span>
                        </div>
                      </div>

                      <p className="text-[13px] text-[rgba(255,255,255,0.60)]">
                        {trade.name}'s trade for {trade.needs} in exchange for {trade.offers} is well-balanced, with a high skill level required and moderate time commitment. The task complexity is fairly challenging, which makes this a valuable and rewarding exchange for both parties.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-[25px] pb-[25px] flex flex-wrap justify-between">
                    <button 
                      className="flex items-center justify-center"
                      onClick={() => toggleFinalizationCardExpand(trade.id)}
                    >
                      <Icon icon="lucide:chevron-up" className="w-[30px] h-[30px] text-white"/>
                    </button>
                    <div className="flex items-center gap-[15px]">
                      <Link href={`/home/trades/add-details?requested=${encodeURIComponent(trade.needs)}&exchange=${encodeURIComponent(trade.offers)}`}>
                        <button className="min-w-[120px] h-[40px] flex justify-center items-center bg-[#0038FF] rounded-[15px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors">
                          <span className="text-[16px] text-white">Add details</span>
                        </button>
                      </Link>
                      <Tooltip content="Expair's tailored AI will evaluate your trade using task difficulty, time, and skills. Make sure to add all details before you can run the evaluation." position="left">
                        <button 
                          className="min-w-[120px] h-[40px] flex justify-center items-center rounded-[15px] border-2 border-[#7E59F8] bg-[#120A2A] shadow-[0_0_15px_#D78DE5] cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrade({
                              requestTitle: trade.needs,
                              offerTitle: trade.offers,
                              taskComplexity: 60,
                              timeCommitment: 50,
                              skillLevel: 80,
                              feedback: `${trade.name}'s trade for ${trade.needs} in exchange for ${trade.offers} is well-balanced, with a high skill level required and moderate time commitment. The task complexity is fairly challenging, which makes this a valuable and rewarding exchange for both parties. Overall, it's a great match that promises meaningful growth and results.`
                            });
                            setShowEvaluationDialog(true);
                          }}
                        >
                          <div className="flex items-center gap-[10px]">
                            <img src="/assets/logos/White=Logo S.png" alt="Logo" className="w-[16px] h-[16px]" />
                            <span className="text-[16px] font-normal text-white">Evaluate</span>
                          </div>
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ) : (
                // Collapsed View
                <div className="p-[25px] flex flex-col justify-between h-full cursor-pointer" onClick={() => toggleFinalizationCardExpand(trade.id)}>
                  {/* Trade Header */}
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-start gap-[10px]">
                      <img src="/defaultavatar.png" alt="Default Avatar" className="w-[25px] h-[25px] rounded-full object-cover" />
                      <div className="flex flex-col items-start gap-[5px]">
                        <span className="text-[16px] text-white">{trade.name}</span>
                        <div className="flex items-center gap-[15px]">
                          <div className="flex items-center gap-[5px]">
                            <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF]" />
                            <span className="text-[13px] font-bold text-white">{trade.rating}</span>
                            <span className="text-[13px] font-normal text-white"> ({trade.reviews})</span>
                          </div>
                          <div className="flex flex-col gap-[3px]">
                            <div className="flex items-center gap-[5px]">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z" fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5"/><defs><radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)"><stop offset="0.4" stopColor="#933BFF"/><stop offset="1" stopColor="#34188D"/></radialGradient><linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="0.5" stopColor="#999999"/><stop offset="1" stopColor="white"/></linearGradient></defs></svg>
                              <span className="text-[13px] text-white">LVL {trade.level}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuIndex(openMenuIndex === `final-${index}` ? null : `final-${index}`);
                      }}>
                        <Icon icon="lucide:more-horizontal" className="w-6 h-6 text-white" />
                      </button>
                      {openMenuIndex === `final-${index}` && (
                        <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
                          <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                            <Icon icon="lucide:x" className="text-white text-base" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Needs and Offers Section */}
                  <div className="flex justify-between items-start w-full">
                    {/* Needs */}
                    <div className="flex flex-col items-start gap-[10px]">
                      <span className="text-[13px] text-white">Needs</span>
                      <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px]">
                        <span className="text-[13px] text-white leading-tight">{trade.needs}</span>
                      </div>
                    </div>

                    {/* Offers */}
                    <div className="flex flex-col items-end gap-[10px]">
                      <span className="text-[13px] text-white">Can offer</span>
                      <div className="px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px]">
                        <span className="text-[13px] text-white leading-tight">{trade.offers}</span>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex justify-end items-center w-full">
                    <span className="text-[13px] text-white/60">until {trade.until}</span>
                  </div>

                  {/* Buttons Row */}
                  <div className="flex justify-between items-center w-full">
                    <div className="flex gap-[15px]">
                      <Link href={`/home/trades/add-details?requested=${encodeURIComponent(trade.needs)}&exchange=${encodeURIComponent(trade.offers)}`}>
                        <button 
                          className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[13px] text-white">Add details</span>
                        </button>
                      </Link>
                      <button 
                        className="w-[120px] h-[30px] flex justify-center items-center bg-[#6DDFFF] rounded-[10px] shadow-[0px_0px_15px_#6DDFFF] cursor-pointer hover:bg-[#8FE7FF] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFinalizationCardExpand(trade.id);
                        }}
                      >
                        <span className="text-[13px] text-white">View details</span>
                      </button>
                      <Tooltip content="Expair's tailored AI will evaluate your trade using task difficulty, time, and skills. Make sure to add all details before you can run the evaluation." position="left">
                        <button 
                          className="w-[120px] h-[30px] flex justify-center items-center rounded-[10px] bg-[#120A2A] border-[2px] border-transparent [background:linear-gradient(#120A2A,#120A2A)_padding-box,linear-gradient(90deg,#7E59F8_0%,#FFF_50%,#7E59F8_100%)_border-box] cursor-pointer hover:bg-[#1A0F3E] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrade({
                              requestTitle: trade.needs,
                              offerTitle: trade.offers,
                              taskComplexity: 60,
                              timeCommitment: 50,
                              skillLevel: 80,
                              feedback: `${trade.name}'s trade for ${trade.needs} in exchange for ${trade.offers} is well-balanced, with a high skill level required and moderate time commitment. The task complexity is fairly challenging, which makes this a valuable and rewarding exchange for both parties. Overall, it's a great match that promises meaningful growth and results.`
                            });
                            setShowEvaluationDialog(true);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <img src="/assets/logos/White=Logo S.png" alt="Logo" className="w-[16px] h-[16px]" />
                            <span className="text-[13px] text-white">Evaluate</span>
                          </div>
                        </button>
                      </Tooltip>
                    </div>
                    
                    {/* Chevron Down Button */}
                    <Icon 
                      icon="lucide:chevron-down" 
                      className="w-[30px] h-[30px] text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Offers Popup */}
      <OffersPopup 
        isOpen={showOffersPopup} 
        onClose={() => setShowOffersPopup(false)} 
        service={selectedService} 
      />

      {/* Evaluation Dialog */}
      <EvaluationDialog
        isOpen={showEvaluationDialog}
        onClose={() => setShowEvaluationDialog(false)}
        closeParentDialog={() => setShowEvaluationDialog(false)}
        tradeData={selectedTrade}
      />
    </div>
  );
}