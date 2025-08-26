"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import OffersPopup from "../../../../components/trade-cards/offers-popup";
import EvaluationDialog from "../../../../components/trade-cards/evaluation-dialog";
import { Star } from "lucide-react";

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
                      <div className="flex items-center gap-[5px]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z" fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5"/><defs><radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)"><stop offset="0.4" stopColor="#933BFF"/><stop offset="1" stopColor="#34188D"/></radialGradient><linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="0.5" stopColor="#999999"/><stop offset="1" stopColor="white"/></linearGradient></defs></svg>
                        <span className="text-[13px] text-white">LVL {trade.level}</span>
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
              className="transition-all duration-300 hover:scale-[1.01] w-[440px] h-[240px] p-[25px] flex flex-col justify-between rounded-[20px] border-[3px] border-[#6DDFFF]/80"
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
                      <div className="flex items-center gap-[5px]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z" fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5"/><defs><radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)"><stop offset="0.4" stopColor="#933BFF"/><stop offset="1" stopColor="#34188D"/></radialGradient><linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="0.5" stopColor="#999999"/><stop offset="1" stopColor="white"/></linearGradient></defs></svg>
                        <span className="text-[13px] text-white">LVL {trade.level}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenuIndex(openMenuIndex === `final-${index}` ? null : `final-${index}`)}>
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

              {/* Date and Buttons */}
              <div className="flex justify-end items-center w-full">
                <span className="text-[13px] text-white/60">until {trade.until}</span>
              </div>

              <div className="flex justify-between">
                <Link href={`/home/trades/add-details?requested=${encodeURIComponent(trade.needs)}&exchange=${encodeURIComponent(trade.offers)}`}>
                  <button className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors">
                    <span className="text-[13px] text-white">Add details</span>
                  </button>
                </Link>
                <button 
                  className="w-[120px] h-[30px] flex justify-center items-center rounded-[10px] bg-[#120A2A] border-[2px] border-transparent [background:linear-gradient(#120A2A,#120A2A)_padding-box,linear-gradient(90deg,#7E59F8_0%,#FFF_50%,#7E59F8_100%)_border-box] cursor-pointer hover:bg-[#1A0F3E] transition-colors"
                  onClick={() => {
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
              </div>
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