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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
const inter = Inter({ subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"] });

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [exploreItems, setExploreItems] = useState([]); // Explore items from backend
  const [exploreErr, setExploreErr] = useState(""); // Error message for explore fetch

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

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Refs for click-outside handling
  const menuRefs = useRef([]);
  const exploreSortMenuRef = useRef(null);
  const exploreFilterMenuRef = useRef(null);

  const handleNotInterested = (partnerId) => {
    setOpenMenuIndex(null);
    console.log(`Marked partner ${partnerId} as not interested`);
  };

  const handleReport = (partnerId) => {
    setOpenMenuIndex(null);
    console.log(`Reported partner ${partnerId}`);
  };

  // Handle "I'm interested" button click
  const handleInterestedClick = (partner) => {
    setSelectedPartner(partner);
    setShowConfirmDialog(true);
  };

  // Handle confirmation dialog actions
  const handleConfirmInterest = async () => {
  setShowConfirmDialog(false);
  
  try {
    const headers = { "Content-Type": "application/json" };
    const token = session?.access;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    const response = await fetch(`${BACKEND_URL}/express-interest/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tradereq_id: selectedPartner?.tradereq_id,
        requester_name: selectedPartner?.name
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("Interest expressed successfully:", data);
      setShowSuccessDialog(true);
    } else {
      const errorData = await response.json();
      console.error("Failed to express interest:", errorData.error);
      // Show error message to user
    }
  } catch (error) {
    console.error("Network error:", error);
    // Show error message to user
  }
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
    else if (hour >= 12 && hour < 18) { prefix = "Good afternoon"; emoji = "☁️"; }
    else if (hour >= 18 && hour < 22) { prefix = "Stellar evening"; emoji = "🌙"; }

    console.log("Session user object:", session?.user);
    
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

  // Load Explore feed from backend
useEffect(() => {
  (async () => {
    try {
      const headers = { "Content-Type": "application/json" };
      const token = session?.access || session?.accessToken;
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const resp = await fetch(`${BACKEND_URL}/explore/feed/`, { headers });
      if (!resp.ok) {
        setExploreErr(`Failed to load feed (HTTP ${resp.status})`);
        return;
      }
      const data = await resp.json();
      
      // 🔍 DEBUG: Check for duplicates in raw data
      console.log("Raw API response:", data.items);
      console.log("Total items:", data.items?.length);
      
      const tradereqIds = data.items?.map(item => item.tradereq_id) || [];
      const uniqueIds = [...new Set(tradereqIds)];
      console.log("Unique tradereq_ids:", uniqueIds.length);
      console.log("Total tradereq_ids:", tradereqIds.length);
      
      if (uniqueIds.length !== tradereqIds.length) {
        console.error("🚨 DUPLICATE tradereq_ids found in API response!");
        const duplicates = tradereqIds.filter((id, index) => tradereqIds.indexOf(id) !== index);
        console.error("Duplicate IDs:", duplicates);
      }
      
      // Check for duplicate names
      const names = data.items?.map(item => item.name) || [];
      const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
      if (duplicateNames.length > 0) {
        console.log("Users with multiple requests:", [...new Set(duplicateNames)]);
      }
      
      const uniqueItems = Array.from(
        new Map(data.items.map(item => [item.tradereq_id, item])).values()
      );

      setExploreItems(uniqueItems);
    } catch (e) {
      setExploreErr(e?.message || "Network error");
    }
  })();
}, [session]);

  const fmtUntil = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  };

  // Filter and sort explore items
  const getFilteredAndSortedItems = () => {
    let filtered = exploreItems.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.name?.toLowerCase().includes(query) ||
          item.need?.toLowerCase().includes(query) ||
          item.offer?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Rating filter
      if (exploreFilters.minRating > 0 && item.rating < exploreFilters.minRating) return false;
      
      // Level filter
      if (exploreFilters.minLevel > 0 && item.level < exploreFilters.minLevel) return false;
      
      // Skill category filter (you may need to add skillCategory to your backend data)
      // if (exploreFilters.skillCategory !== "all" && item.skillCategory !== exploreFilters.skillCategory) return false;
      
      return true;
    });

    // Sort the filtered items
    return filtered.sort((a, b) => {
      switch (exploreSortBy) {
        case "date":
          return new Date(a.deadline) - new Date(b.deadline);
        case "level":
          return b.level - a.level;
        case "rating":
          return b.rating - a.rating;
        case "recommended":
        default:
          return b.rating - a.rating; // fallback to rating
      }
    });
  };

  const filteredAndSortedItems = getFilteredAndSortedItems();

  const [homeActiveTrades, setHomeActiveTrades] = useState([]);
  const [homeTradesLoading, setHomeTradesLoading] = useState(true);

  useEffect(() => {
  const fetchHomeActiveTrades = async () => {
    try {
      const headers = { "Content-Type": "application/json" };
      const token = session?.access || session?.accessToken;
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const response = await fetch(`${BACKEND_URL}/home/active-trades/`, { headers });
      if (response.ok) {
        const data = await response.json();
        setHomeActiveTrades(data.home_active_trades);
      }
    } catch (error) {
      console.error("Error fetching home active trades:", error);
    } finally {
      setHomeTradesLoading(false);
    }
  };

  if (session) {
    fetchHomeActiveTrades();
  }
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
        {homeTradesLoading ? (
          <div className="text-white/60">Loading active trades...</div>
        ) : homeActiveTrades.length === 0 ? (
          <div className="w-full py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1A0F3E] flex items-center justify-center mb-4 mx-auto">
              <Icon icon="lucide:handshake" className="w-8 h-8 text-white/50" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No active trades ready yet
            </h3>
            <p className="text-white/60 text-center max-w-md mx-auto">
              Complete trade details with your partners to see active trades here.
            </p>
          </div>
        ) : (
          homeActiveTrades.map((trade) => (
            <ActiveTradeCardHome
              key={trade.tradereq_id}
              name={trade.other_user.name}
              username={trade.other_user.username} 
              profilePic={trade.other_user.profilePic}
              offering={trade.offering}
              totalXp={trade.total_xp}
              deadline={trade.deadline_formatted}
            />
          ))
        )}
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
                            {rating === 0 ? "Any" : `${rating}⭐+`}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Explore Cards Grid */}
        <div className="flex flex-wrap justify-start gap-x-[25px] gap-y-[25px] w-full max-w-[940px]">
          {exploreErr ? (
            <div className="w-full py-4 text-red-400">{exploreErr}</div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="w-full py-10 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#1A0F3E] flex items-center justify-center mb-4">
                <Icon icon="lucide:search" className="w-8 h-8 text-white/50" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                {exploreItems.length === 0 ? "No matches yet" : "No matches found"}
              </h3>
              <p className="text-white/60 text-center max-w-md">
                {exploreItems.length === 0 
                  ? "New requests will appear here as users post them."
                  : "Try adjusting your filters or search criteria to see more results"
                }
              </p>
            </div>
          ) : (
            filteredAndSortedItems.map((item, i) => (
              <ExploreCard
              key={`explore-${item.tradereq_id || i}`}  
              name={item.name}
              rating={item.rating}
              ratingCount={item.ratingCount}
              level={item.level}
              need={item.need}
              offer={item.offer}
              deadline={item.deadline ? `until ${fmtUntil(item.deadline)}` : ""}
              profilePicUrl={item.profilePicUrl} 
              userId={item.userId}
              username={item.username}
              onInterestedClick={() => handleInterestedClick(item)}
            />
            ))
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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