"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Star } from "lucide-react"

import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { Archivo } from "next/font/google";
import { Button } from "../../components/ui/button";
import { Icon } from "@iconify/react";
import ActiveTradeCardHome from "../../components/trade-cards/active-home";
import SortDropdown from "../../components/shared/sortdropdown";
import ExploreCard from "../../components/trade-cards/explore-card";


const inter = Inter({ subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"] });

export default function HomePage() {
  const router = useRouter();

  const { data: session } = useSession();

  const [greeting, setGreeting] = useState("Starry evening, voyager");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedSort, setSelectedSort] = useState("Date");
  const [selectedActiveSort, setSelectedActiveSort] = useState("Date");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Explore section state
  const [showExploreSortMenu, setShowExploreSortMenu] = useState(false);
  const [showExploreFilterMenu, setShowExploreFilterMenu] = useState(false);
  const [exploreSortBy, setExploreSortBy] = useState("recommended");
  const [exploreFilters, setExploreFilters] = useState({
    minRating: 0,
    skillCategory: "all",
    minLevel: 0,
  });

  // Refs for click-outside handling
  const menuRefs = useRef([]);
  const exploreSortMenuRef = useRef(null);
  const exploreFilterMenuRef = useRef(null);

  const handleNotInterested = (partnerId) => {
    // In a real app, you would update the user's preferences
    // For now, just close the menu and show a message
    setOpenMenuIndex(null);
    console.log(`Marked partner ${partnerId} as not interested`);
    // You could also remove the partner from the list or add a visual indicator
  };

  const handleReport = (partnerId) => {
    // In a real app, you would open a report form or send a report
    // For now, just close the menu and show a message
    setOpenMenuIndex(null);
    console.log(`Reported partner ${partnerId}`);
    // You could also show a confirmation message to the user
  };

  // Handle "I'm interested" button click
  const handleInterestedClick = (partner) => {
    setSelectedPartner(partner);
    setShowConfirmDialog(true);
  };

  // Handle confirmation dialog actions
  const handleConfirmInterest = () => {
    setShowConfirmDialog(false);
    setShowSuccessDialog(true);
    // In a real app, you would send the trade invitation here
    console.log(`Sent trade invitation to ${selectedPartner?.name}`);
  };

  const handleCancelInterest = () => {
    setShowConfirmDialog(false);
    setSelectedPartner(null);
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setSelectedPartner(null);
  };

  const handleGoToPendingTrades = () => {
    setShowSuccessDialog(false);
    setSelectedPartner(null);
    router.push('/home/trades/pending');
  };

  // Explore sort and filter handlers
  const handleExploreSortChange = (option) => {
    setExploreSortBy(option);
    setShowExploreSortMenu(false);
  };

  const handleExploreFilterChange = (key, value) => {
    setExploreFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyExploreFilters = () => {
    setShowExploreFilterMenu(false);
  };

  const handleResetExploreFilters = () => {
    setExploreFilters({
      minRating: 0,
      skillCategory: "all",
      minLevel: 0,
    });
  };

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check partner menu dropdowns
      let clickedInsideMenu = false;
      menuRefs.current.forEach((ref) => {
        if (ref && ref.contains(event.target)) {
          clickedInsideMenu = true;
        }
      });

      if (!clickedInsideMenu && openMenuIndex !== null) {
        setOpenMenuIndex(null);
      }

      // Check explore sort menu
      if (
        exploreSortMenuRef.current &&
        !exploreSortMenuRef.current.contains(event.target)
      ) {
        setShowExploreSortMenu(false);
      }

      // Check explore filter menu
      if (
        exploreFilterMenuRef.current &&
        !exploreFilterMenuRef.current.contains(event.target)
      ) {
        setShowExploreFilterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuIndex]);

  // Skill categories for filter
  const skillCategories = [
    "All Categories",
    "Home Services",
    "Technology",
    "Creative",
    "Performance Arts",
    "Education",
    "Health & Fitness",
  ];

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    let prefix = "Starry night", emoji = "⭐";
    if (hour >= 5 && hour < 12) { prefix = "Bright morning"; emoji = "☀️"; }
    else if (hour >= 12 && hour < 17) { prefix = "Good afternoon"; emoji = "☁️"; }
    else if (hour >= 17 && hour < 22) { prefix = "Stellar evening"; emoji = "🌙"; }

    // 1) Prefer DB-backed name from session (Google or credentials via NextAuth)
let first =
  (session?.user?.first_name || "").trim() ||          
  (session?.user?.name || "").trim().split(" ")[0];    

// 2) Only use localStorage if no session data exists
if (!first && !session?.user && typeof window !== "undefined") {
  const fromLS =
    localStorage.getItem("first_name") ||
    localStorage.getItem("prefill_name") || "";
  first = fromLS.trim().split(" ")[0];
}
    
    if (!first) {
      // derive from username/email as a last resort (optional)
      const handle = session?.user?.username || session?.user?.email || "";
      first = handle.split(/[._\-\s@]+/)[0]?.replace(/\d+/g, "") || "voyager";
    }
    setGreeting(`${prefix}, ${first} ${emoji}`);
  }, [session]);

  return (
    <div
      className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}
    >
      {/* Greeting Header */}
      <h1
        className={`text-[40px] font-bold mb-10 ${archivo.className}`}
        style={{
          textShadow: "0px 3px 25px rgba(126, 89, 248, 0.8)",
        }}
      >
        {greeting}
      </h1>

      {/* Active Trades Header */}
      <div className="flex justify-between items-center mb-8">
        <h4 className="text-[22px] font-bold">Active trades</h4>

        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <SortDropdown
            selected={selectedActiveSort}
            onChange={setSelectedActiveSort}
          />

          {/* Asc/Desc Toggle */}
          <button
            onClick={() => setSortAsc((prev) => !prev)}
            className="w-9 h-9 bg-[#120A2A] rounded-full flex items-center justify-center hover:bg-[#1A0F3E] transition"
          >
            <Icon
              icon={sortAsc ? "mdi:arrow-up" : "mdi:arrow-down"}
              className="text-lg"
            />
          </button>
        </div>
      </div>

      {/* Active Trade Cards Grid */}
      <div className="w-full max-w-[940px] flex flex-wrap gap-[25px] mt-6">
        <ActiveTradeCardHome />
      </div>

      {/* Explore Section */}
      <div className="mt-20">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-[15px]">
            <h4 className="text-[25px] font-[600]">Explore</h4>
            <Image
              src="/assets/logos/Colored=Logo XS.png"
              alt="Colored Logo XS"
              width={38}
              height={38}
              className="w-[38px] h-[38px]"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Sort Button and Dropdown */}
            <div className="relative" ref={exploreSortMenuRef}>
              <div
                className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] rounded-[15px] hover:bg-[#1A0F3E] transition text-sm cursor-pointer"
                onClick={() => setShowExploreSortMenu(!showExploreSortMenu)}
              >
                <span>
                  Sort:{" "}
                  {exploreSortBy.charAt(0).toUpperCase() +
                    exploreSortBy.slice(1)}
                </span>
                <Icon icon="lucide:arrow-up-down" className="text-lg" />
              </div>

              {/* Sort Dropdown Menu */}
              {showExploreSortMenu && (
                <div className="absolute top-full left-0 mt-2 w-[200px] bg-[#120A2A] border border-[#284CCC]/30 rounded-[15px] shadow-lg z-50 overflow-hidden">
                  <div className="p-2">
                    <div
                      className={`px-3 py-2 rounded-[10px] cursor-pointer ${
                        exploreSortBy === "recommended"
                          ? "bg-[#1A0F3E] text-white"
                          : "text-white/70 hover:bg-[#1A0F3E] hover:text-white"
                      } transition`}
                      onClick={() => handleExploreSortChange("recommended")}
                    >
                      Recommended
                    </div>
                    <div
                      className={`px-3 py-2 rounded-[10px] cursor-pointer ${
                        exploreSortBy === "date"
                          ? "bg-[#1A0F3E] text-white"
                          : "text-white/70 hover:bg-[#1A0F3E] hover:text-white"
                      } transition`}
                      onClick={() => handleExploreSortChange("date")}
                    >
                      By Date
                    </div>
                    <div
                      className={`px-3 py-2 rounded-[10px] cursor-pointer ${
                        exploreSortBy === "level"
                          ? "bg-[#1A0F3E] text-white"
                          : "text-white/70 hover:bg-[#1A0F3E] hover:text-white"
                      } transition`}
                      onClick={() => handleExploreSortChange("level")}
                    >
                      By Level
                    </div>
                    <div
                      className={`px-3 py-2 rounded-[10px] cursor-pointer ${
                        exploreSortBy === "rating"
                          ? "bg-[#1A0F3E] text-white"
                          : "text-white/70 hover:bg-[#1A0F3E] hover:text-white"
                      } transition`}
                      onClick={() => handleExploreSortChange("rating")}
                    >
                      By Rating
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Button and Dropdown */}
            <div className="relative" ref={exploreFilterMenuRef}>
              <div
                className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] rounded-[15px] hover:bg-[#1A0F3E] transition text-sm cursor-pointer"
                onClick={() => setShowExploreFilterMenu(!showExploreFilterMenu)}
              >
                <span>Filter</span>
                <Icon icon="lucide:filter" className="text-lg" />
              </div>

              {/* Filter Dropdown Menu */}
              {showExploreFilterMenu && (
                <div className="absolute top-full right-0 mt-2 w-[280px] bg-[#120A2A] border border-[#284CCC]/30 rounded-[15px] shadow-lg z-50 overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-3">
                      Filter Options
                    </h3>

                    {/* Rating Filter */}
                    <div className="mb-4">
                      <h4 className="text-white/70 text-sm mb-2">
                        Minimum Rating
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {[0, 2, 3, 4, 5].map((rating) => (
                          <div
                            key={rating}
                            className={`px-3 py-1 rounded-full cursor-pointer text-sm ${
                              exploreFilters.minRating === rating
                                ? "bg-[#0038FF] text-white"
                                : "bg-[#1A0F3E] text-white/70 hover:bg-[#1A0F3E]/80"
                            } transition`}
                            onClick={() =>
                              handleExploreFilterChange("minRating", rating)
                            }
                          >
                            {rating === 0 ? "Any" : `${rating}★+`}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skill Category Filter */}
                    <div className="mb-4">
                      <h4 className="text-white/70 text-sm mb-2">
                        Skill Category
                      </h4>
                      <select
                        className="w-full px-3 py-2 bg-[#1A0F3E] border border-[#284CCC]/30 rounded-[10px] text-white"
                        value={exploreFilters.skillCategory}
                        onChange={(e) =>
                          handleExploreFilterChange(
                            "skillCategory",
                            e.target.value
                          )
                        }
                      >
                        <option value="all">All Categories</option>
                        {skillCategories.slice(1).map((category, index) => (
                          <option key={index} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Level Filter */}
                    <div className="mb-4">
                      <h4 className="text-white/70 text-sm mb-2">
                        Minimum Level
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {[0, 5, 10, 15, 20].map((level) => (
                          <div
                            key={level}
                            className={`px-3 py-1 rounded-full cursor-pointer text-sm ${
                              exploreFilters.minLevel === level
                                ? "bg-[#0038FF] text-white"
                                : "bg-[#1A0F3E] text-white/70 hover:bg-[#1A0F3E]/80"
                            } transition`}
                            onClick={() =>
                              handleExploreFilterChange("minLevel", level)
                            }
                          >
                            {level === 0 ? "Any" : `LVL ${level}+`}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex justify-between mt-4">
                      <button
                        className="px-4 py-1 text-sm text-white/70 hover:text-white transition"
                        onClick={handleResetExploreFilters}
                      >
                        Reset
                      </button>
                      <button
                        className="px-4 py-1 bg-[#0038FF] text-white text-sm rounded-[10px] hover:bg-[#1a4dff] transition"
                        onClick={handleApplyExploreFilters}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full mb-8">
          <div className="w-full h-[50px] bg-[#120A2A] rounded-[15px] px-[14px] py-[8px] flex items-center border-[1px] border border-[rgba(255,255,255,0.40)]">
            <Icon icon="lucide:search" className="text-white mr-2 text-xl" />
            <input
              type="text"
              placeholder="Search"
              className="w-full h-full bg-transparent text-[16px] text-white outline-none placeholder:text-[#413663]"
            />
          </div>
        </div>

        {/* Trade Partner Cards */}
        <div className="flex flex-wrap justify-start gap-x-[25px] gap-y-[25px] w-full max-w-[940px]">
          {(() => {
            const partners = [
              {
                id: 1,
                name: "Olivia Brown",
                rating: 5.0,
                reviews: 20,
                level: 14,
                rank: "Intermediate",
                needs: "Nutrition Coaching for Weight Loss",
                offers: "Graphic Design",
                skillCategory: "Creative",
                until: "July 1",
                date: new Date("2025-07-01"),
              },
              {
                id: 2,
                name: "James Wilson",
                rating: 4.9,
                reviews: 10,
                level: 12,
                rank: "Intermediate",
                needs: "Algebra Tutoring",
                offers: "Gardening",
                skillCategory: "Home Services",
                until: "June 20",
                date: new Date("2025-06-20"),
              },
              {
                id: 3,
                name: "Sophia Garcia",
                rating: 4.4,
                reviews: 42,
                level: 10,
                rank: "Beginner",
                needs: "Interior Decorating",
                offers: "Language Lessons",
                skillCategory: "Education",
                until: "June 28",
                date: new Date("2025-06-28"),
              },
              {
                id: 4,
                name: "Daniel Kim",
                rating: 4.8,
                reviews: 20,
                level: 11,
                rank: "Intermediate",
                needs: "Furniture Assembly",
                offers: "Social Media Management",
                skillCategory: "Technology",
                until: "June 5",
                date: new Date("2025-06-05"),
              },
              {
                id: 5,
                name: "Jason Miller",
                rating: 5.0,
                reviews: 27,
                level: 17,
                rank: "Advanced",
                needs: "Tech Support",
                offers: "House Painting",
                skillCategory: "Home Services",
                until: "July 1",
                date: new Date("2025-07-01"),
              },
              {
                id: 6,
                name: "Mia Robinson",
                rating: 4.7,
                reviews: 12,
                level: 11,
                rank: "Intermediate",
                needs: "Guitar Lessons",
                offers: "Baking Lessons",
                skillCategory: "Performance Arts",
                until: "June 20",
                date: new Date("2025-06-20"),
              },
            ];

            // Filtering
            const filteredPartners = partners.filter((partner) => {
              if (exploreFilters.minRating > 0 && partner.rating < exploreFilters.minRating) return false;
              if (exploreFilters.skillCategory !== "all" && partner.skillCategory !== exploreFilters.skillCategory) return false;
              if (exploreFilters.minLevel > 0 && partner.level < exploreFilters.minLevel) return false;
              return true;
            });

            // Sorting
            const sortedPartners = [...filteredPartners].sort((a, b) => {
              switch (exploreSortBy) {
                case "date": return a.date - b.date;
                case "level": return b.level - a.level;
                case "rating": return b.rating - a.rating;
                default: return b.rating - a.rating;
              }
            });

            // No matches
            if (sortedPartners.length === 0) {
              return (
                <div className="w-full py-10 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#1A0F3E] flex items-center justify-center mb-4">
                    <Icon icon="lucide:search" className="w-8 h-8 text-white/50" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No matches found</h3>
                  <p className="text-white/60 text-center max-w-md">
                    Try adjusting your filters or search criteria to see more results
                  </p>
                </div>
              );
            }

            // Cards
            return sortedPartners.map((partner, index) => (
              <div
                key={partner.id}
                className="transition-all duration-300 hover:scale-[1.01] w-[440px] p-[25px] flex flex-col gap-[15px] rounded-[20px] border-[3px] border-[#284CCC]/80 relative"
                style={{
                  background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                  boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)",
                }}
              >
                {/* Partner Header */}
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-start gap-[10px]">
                    <Image src="/defaultavatar.png" alt="Default Avatar" width={25} height={25} className="rounded-full object-cover" />
                    <div className="flex flex-col items-start gap-[5px]">
                      <span className="text-[16px] text-white">{partner.name}</span>
                      <div className="flex items-center gap-[15px]">
                        <div className="flex items-center gap-[5px]">
                          <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF]" />
                          <span className="text-[13px]">
                            <span className="font-bold">{partner.rating.toFixed(1)}</span>{" "}
                            <span className="text-white">({partner.reviews})</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-[5px]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z" fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5"/><defs><radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)"><stop offset="0.4" stopColor="#933BFF"/><stop offset="1" stopColor="#34188D"/></radialGradient><linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="0.5" stopColor="#999999"/><stop offset="1" stopColor="white"/></linearGradient></defs></svg>
                          <span className="text-[13px] text-white">LVL {partner.level}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="relative" ref={(el) => (menuRefs.current[index] = el)}>
                    <button onClick={() => setOpenMenuIndex(index === openMenuIndex ? null : index)}>
                      <Icon icon="lucide:more-horizontal" className="w-6 h-6 text-white cursor-pointer hover:text-gray-300 transition-colors" />
                    </button>
                    {openMenuIndex === index && (
                      <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
                        <button onClick={() => handleNotInterested(partner.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full text-left">
                          <Icon icon="mdi:eye-off-outline" className="text-white text-base" /> Not Interested
                        </button>
                        <button onClick={() => handleReport(partner.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full text-left">
                          <Icon icon="mdi:flag" className="text-white text-base" /> Report
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Needs / Can Offer */}
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col gap-[10px] items-start flex-shrink-0">
                    <span className="text-[13px] text-white">Needs</span>
                    <div className="inline-block px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px]">
                      <span className="text-[12px] text-white leading-tight whitespace-nowrap">
                        {partner.needs}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[10px] items-end flex-shrink-0">
                    <span className="text-[13px] text-white">Can offer</span>
                    <div className="inline-block px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px]">
                      <span className="text-[12px] text-white leading-tight whitespace-nowrap">
                        {partner.offers}
                      </span>
                    </div>
                    <span className="text-[13px] text-white/60">until {partner.until}</span>
                  </div>
                </div>

                {/* Interested Button */}
                <div className="flex justify-center">
                  <button
                    className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors"
                    onClick={() => handleInterestedClick(partner)}
                  >
                    <span className="text-[13px] text-white">I'm interested</span>
                  </button>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedPartner && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="relative flex flex-col items-center justify-center w-[500px] h-[200px] bg-[#120A2A]/95 border-2 border-[#0038FF] shadow-[0px_4px_15px_#284CCC] backdrop-blur-[10px] rounded-[20px] overflow-hidden">
            {/* Background gradients */}
            <div className="absolute top-[-50px] left-[-50px] w-[150px] h-[150px] rounded-full bg-[#0038FF]/15 blur-[40px]"></div>
            <div className="absolute bottom-[-40px] right-[-40px] w-[120px] h-[120px] rounded-full bg-[#906EFF]/15 blur-[40px]"></div>

            {/* Close button */}
            <button 
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={handleCancelInterest}
            >
              <Icon icon="lucide:x" className="w-[20px] h-[20px]" />
            </button>

            <div className="flex flex-col items-center gap-6 w-full px-8 relative z-10">
              <h2 className="font-bold text-[20px] text-center text-white leading-tight">
                Are you sure you want to add this to your pending trades?
              </h2>
              <div className="flex flex-row gap-4">
                <button 
                  className="flex items-center justify-center w-[120px] h-[40px] border-2 border-[#0038FF] rounded-[15px] text-[#0038FF] text-[16px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#0038FF]/10 transition-colors"
                  onClick={handleCancelInterest}
                >
                  Cancel
                </button>
                <button 
                  className="flex items-center justify-center w-[120px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors"
                  onClick={handleConfirmInterest}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && selectedPartner && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="relative flex flex-col items-center justify-center w-[500px] h-[200px] bg-[#120A2A]/95 border-2 border-[#0038FF] shadow-[0px_4px_15px_#284CCC] backdrop-blur-[10px] rounded-[20px] overflow-hidden">
            {/* Background gradients */}
            <div className="absolute top-[-50px] left-[-50px] w-[150px] h-[150px] rounded-full bg-[#0038FF]/15 blur-[40px]"></div>
            <div className="absolute bottom-[-40px] right-[-40px] w-[120px] h-[120px] rounded-full bg-[#906EFF]/15 blur-[40px]"></div>

            {/* Close button */}
            <button 
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={handleSuccessDialogClose}
            >
              <Icon icon="lucide:x" className="w-[20px] h-[20px]" />
            </button>

            <div className="flex flex-col items-center gap-6 w-full px-8 relative z-10">
              <h2 className="font-bold text-[20px] text-center text-white leading-tight">
                Trade invitation successfully sent.
              </h2>
              <button 
                className="flex items-center justify-center w-[180px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors"
                onClick={handleGoToPendingTrades}
              >
                Go to Pending Trades
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
