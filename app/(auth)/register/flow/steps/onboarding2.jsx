"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "../../../../../components/ui/button";
import { Inter } from "next/font/google";
import { Search, Filter, ArrowUpDown, MoreHorizontal, Star, X, EyeOff } from "lucide-react";
import { StarIcon } from "../../../../../components/icons/star-icon";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function Onboarding2({ onNext, onPrev }) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [sortBy, setSortBy] = useState("recommended");
  const [filters, setFilters] = useState({
    minRating: 0,
    skillCategory: "all",
    minLevel: 0
  });

  // Backend data states
  const [exploreItems, setExploreItems] = useState([]);
  const [exploreErr, setExploreErr] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Refs for click-outside handling
  const sortMenuRef = useRef(null);
  const filterMenuRef = useRef(null);
  const menuRefs = useRef([]);

  // Load explore data from backend
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const headers = { "Content-Type": "application/json" };
        const token = session?.access || session?.accessToken;
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const resp = await fetch(`${BACKEND_URL}/explore/feed/`, { headers });
        if (!resp.ok) {
          setExploreErr(`Failed to load feed (HTTP ${resp.status})`);
          return;
        }
        const data = await resp.json();
        setExploreItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        setExploreErr(e?.message || "Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  // Date formatting function
  const fmtUntil = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  };
  
  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
      
      // Check partner menu dropdowns
      let clickedInsideMenu = false;
      menuRefs.current.forEach((ref, index) => {
        if (ref && ref.contains(event.target)) {
          clickedInsideMenu = true;
        }
      });
      
      if (!clickedInsideMenu && openMenuIndex !== null) {
        setOpenMenuIndex(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuIndex]);
  
  const handleInterested = (partner) => {
    setSelectedPartner(partner);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    setShowSuccessModal(true);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };
  
  const handleGoToHome = () => {
    onNext();
  };
  
  const handleSortChange = (option) => {
    setSortBy(option);
    setShowSortMenu(false);
  };
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleApplyFilters = () => {
    setShowFilterMenu(false);
  };
  
  const handleResetFilters = () => {
    setFilters({
      minRating: 0,
      skillCategory: "all",
      minLevel: 0
    });
  };
  
  const handleNotInterested = (partnerId) => {
    setOpenMenuIndex(null);
    console.log(`Marked partner ${partnerId} as not interested`);
  };
  
  const handleReport = (partnerId) => {
    setOpenMenuIndex(null);
    console.log(`Reported partner ${partnerId}`);
  };
  
  // Skill categories for filter
  const skillCategories = [
    "All Categories",
    "Home Services",
    "Technology",
    "Creative",
    "Performance Arts",
    "Education",
    "Health & Fitness"
  ];

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
      if (filters.minRating > 0 && item.rating < filters.minRating) return false;
      
      // Level filter
      if (filters.minLevel > 0 && item.level < filters.minLevel) return false;
      
      return true;
    });

    // Sort the filtered items
    return filtered.sort((a, b) => {
      switch (sortBy) {
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

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-cover bg-center ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register2.png')" }}
    >
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={handleCancel}></div>
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
            
            <div className="flex flex-col items-center gap-5 w-full px-8">
              {/* Title */}
              <h2 className="font-bold text-[22px] text-center text-white leading-tight">
                Are you sure you want to add this to your pending trades?
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
                  className="flex items-center justify-center w-[130px] h-[38px] bg-[#0038FF] rounded-[15px] text-white text-[15px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
                  onClick={handleConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative flex flex-col items-center justify-center w-[500px] h-[220px] bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-[-100px] left-[-100px] w-[200px] h-[200px] rounded-full bg-[#0038FF]/20 blur-[60px]"></div>
            <div className="absolute bottom-[-80px] right-[-80px] w-[180px] h-[180px] rounded-full bg-[#D78DE5]/20 blur-[60px]"></div>
            
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={() => setShowSuccessModal(false)}
            >
              <X className="w-[15px] h-[15px]" />
            </button>
            
            <div className="flex flex-col items-center gap-5 w-full px-8">
              {/* Title */}
              <h2 className="font-bold text-[22px] text-center text-white leading-tight">
                Success! You can start checking out Expair now.
              </h2>
              
              {/* Button */}
              <div className="flex flex-row gap-5 mt-3">
                <button 
                  className="flex items-center justify-center w-[160px] h-[38px] bg-[#0038FF] rounded-[15px] text-white text-[15px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
                  onClick={handleGoToHome}
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
         
      <div className="relative z-10 w-full max-w-[983px] flex flex-col items-center pt-[111px]">
        {/* Header Section */}
        <div className="flex flex-col items-start gap-[44px] w-full">
          <div className="w-full">
            <div className="text-left flex flex-col items-start gap-[19px] w-full">
              <div className="flex flex-col items-start gap-[15px] w-full">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-[15px]">
                    <Image
                      src="/assets/logos/Colored=Logo XS.png"
                      alt="Colored Logo"
                      width={38}
                      height={38}
                    />
                    <h2 className="text-[25px] font-[600] text-white">Here's what we found</h2>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Sort Button and Dropdown */}
                    <div className="relative" ref={sortMenuRef}>
                      <div 
                        className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] rounded-[15px] hover:bg-[#1A0F3E] transition text-sm cursor-pointer"
                        onClick={() => setShowSortMenu(!showSortMenu)}
                      >
                        <span>Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</span>
                        <ArrowUpDown className="text-lg" />
                      </div>
                      
                      {/* Sort Dropdown Menu */}
                      {showSortMenu && (
                        <div className="absolute top-full left-0 mt-2 w-[200px] bg-[#120A2A] border border-[#284CCC]/30 rounded-[15px] shadow-lg z-50 overflow-hidden">
                          <div className="p-2">
                            <div 
                              className={`px-3 py-2 rounded-[10px] cursor-pointer ${sortBy === "recommended" ? "bg-[#1A0F3E] text-white" : "text-white/70 hover:bg-[#1A0F3E] hover:text-white"} transition`}
                              onClick={() => handleSortChange("recommended")}
                            >
                              Recommended
                            </div>
                            <div 
                              className={`px-3 py-2 rounded-[10px] cursor-pointer ${sortBy === "date" ? "bg-[#1A0F3E] text-white" : "text-white/70 hover:bg-[#1A0F3E] hover:text-white"} transition`}
                              onClick={() => handleSortChange("date")}
                            >
                              By Date
                            </div>
                            <div 
                              className={`px-3 py-2 rounded-[10px] cursor-pointer ${sortBy === "level" ? "bg-[#1A0F3E] text-white" : "text-white/70 hover:bg-[#1A0F3E] hover:text-white"} transition`}
                              onClick={() => handleSortChange("level")}
                            >
                              By Level
                            </div>
                            <div 
                              className={`px-3 py-2 rounded-[10px] cursor-pointer ${sortBy === "rating" ? "bg-[#1A0F3E] text-white" : "text-white/70 hover:bg-[#1A0F3E] hover:text-white"} transition`}
                              onClick={() => handleSortChange("rating")}
                            >
                              By Rating
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Filter Button and Dropdown */}
                    <div className="relative" ref={filterMenuRef}>
                      <div 
                        className="flex items-center gap-2 px-4 py-2 bg-[#120A2A] rounded-[15px] hover:bg-[#1A0F3E] transition text-sm cursor-pointer"
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                      >
                        <span>Filter</span>
                        <Filter className="text-lg" />
                      </div>
                      
                      {/* Filter Dropdown Menu */}
                      {showFilterMenu && (
                        <div className="absolute top-full right-0 mt-2 w-[280px] bg-[#120A2A] border border-[#284CCC]/30 rounded-[15px] shadow-lg z-50 overflow-hidden">
                          <div className="p-4">
                            <h3 className="text-white font-medium mb-3">Filter Options</h3>
                            
                            {/* Rating Filter */}
                            <div className="mb-4">
                              <h4 className="text-white/70 text-sm mb-2">Minimum Rating</h4>
                              <div className="flex flex-wrap gap-2">
                                {[0, 2, 3, 4, 5].map((rating) => (
                                  <div 
                                    key={rating}
                                    className={`px-3 py-1 rounded-full cursor-pointer text-sm ${filters.minRating === rating ? "bg-[#0038FF] text-white" : "bg-[#1A0F3E] text-white/70 hover:bg-[#1A0F3E]/80"} transition`}
                                    onClick={() => handleFilterChange("minRating", rating)}
                                  >
                                    {rating === 0 ? "Any" : `${rating}⭐+`}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Skill Category Filter */}
                            <div className="mb-4">
                              <h4 className="text-white/70 text-sm mb-2">Skill Category</h4>
                              <select 
                                className="w-full px-3 py-2 bg-[#1A0F3E] border border-[#284CCC]/30 rounded-[10px] text-white"
                                value={filters.skillCategory}
                                onChange={(e) => handleFilterChange("skillCategory", e.target.value)}
                              >
                                <option value="all">All Categories</option>
                                {skillCategories.slice(1).map((category, index) => (
                                  <option key={index} value={category}>{category}</option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Level Filter */}
                            <div className="mb-4">
                              <h4 className="text-white/70 text-sm mb-2">Minimum Level</h4>
                              <div className="flex flex-wrap gap-2">
                                {[0, 5, 10, 15, 20].map((level) => (
                                  <div 
                                    key={level}
                                    className={`px-3 py-1 rounded-full cursor-pointer text-sm ${filters.minLevel === level ? "bg-[#0038FF] text-white" : "bg-[#1A0F3E] text-white/70 hover:bg-[#1A0F3E]/80"} transition`}
                                    onClick={() => handleFilterChange("minLevel", level)}
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
                                onClick={handleResetFilters}
                              >
                                Reset
                              </button>
                              <button 
                                className="px-4 py-1 bg-[#0038FF] text-white text-sm rounded-[10px] hover:bg-[#1a4dff] transition"
                                onClick={handleApplyFilters}
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
              </div>
              
              <p className="text-[16px] text-left text-white/40">Browse your potential trade partners</p>
            </div>
          </div>
          
          {/* Search Input */}
          <div className="w-full">
            <div 
              className="rounded-[15px] p-[2px]" 
              style={{ 
                background: 'linear-gradient(90deg, #FB9696 0%, #D78DE5 25%, #7E59F8 50%, #284CCC 75%, #6DDFFF 100%)' 
              }}
            >
              <div className="w-full h-[50px] bg-[#120A2A] rounded-[13px] px-[14px] py-[8px] flex items-center">
                <Search className="w-6 h-6 text-white mr-2" />
                <input
                  type="text"
                  placeholder="Enter a service you need"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full bg-transparent text-[16px] text-white outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* Best Pick Section */}
          <div className="flex flex-col items-start gap-[15px] w-full">
            <div className="flex items-center gap-[10px]">
              <h3 className="text-[21px] font-bold text-white">Best Pick</h3>
              <StarIcon className="w-6 h-6" />
            </div>
            
            {/* Trade Partner Cards */}
            <div className="flex flex-wrap gap-[25px] w-full">
              {exploreErr ? (
                <div className="w-full py-4 text-red-400">{exploreErr}</div>
              ) : loading ? (
                <div className="w-full py-10 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#1A0F3E] flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                  <p className="text-white/60">Loading trade partners...</p>
                </div>
              ) : filteredAndSortedItems.length > 0 ? (
                filteredAndSortedItems.map((item, index) => (
                  <div
                    key={`explore-${item.id || item.name || index}`}
                    className="w-[311px] h-[240px] p-[25px] flex flex-col justify-between rounded-[20px] border-[3px] border-[#284CCC]/80"
                    style={{
                      background:
                        "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                      boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)",
                    }}
                  >
                    {/* Top content */}
                    <div className="flex flex-col gap-[15px]">
                      {/* Partner Header */}
                      <div className="flex justify-between items-start w-full">
                        <div className="flex items-start gap-[10px]">
                          <Image src="/defaultavatar.png" alt="Default Avatar" width={25} height={25} className="rounded-full object-cover" />
                          <div className="flex flex-col items-start gap-[5px]">
                            <span className="text-[16px] text-white">{item.name}</span>
                            <div className="flex items-center gap-[15px]">
                              <div className="flex items-center gap-[5px]">
                                <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF]" />
                                <span className="text-[13px]">
                                  <span className="font-bold">
                                    {item.rating.toFixed(1)}
                                  </span>{" "}
                                  <span className="text-white">
                                    ({item.ratingCount})
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-[5px]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z" fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5"/><defs><radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)"><stop offset="0.4" stopColor="#933BFF"/><stop offset="1" stopColor="#34188D"/></radialGradient><linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="0.5" stopColor="#999999"/><stop offset="1" stopColor="white"/></linearGradient></defs></svg>
                                <span className="text-[13px] text-white">
                                  LVL {item.level}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className="relative"
                          ref={(el) => (menuRefs.current[index] = el)}
                        >
                          <button
                            onClick={() =>
                              setOpenMenuIndex(index === openMenuIndex ? null : index)
                            }
                          >
                            <MoreHorizontal className="w-6 h-6 text-white cursor-pointer hover:text-gray-300 transition-colors" />
                          </button>
                          {openMenuIndex === index && (
                            <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
                              <button
                                onClick={() => handleNotInterested(item.id || item.name)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full text-left"
                              >
                                <EyeOff className="w-4 h-4 text-white" />
                                Not Interested
                              </button>
                              <button
                                onClick={() => handleReport(item.id || item.name)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full text-left"
                              >
                                <X className="w-4 h-4 text-white" />
                                Report
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Needs/Offers Section */}
                      <div className="flex justify-between w-full">
                        {/* Needs */}
                        <div className="flex flex-col gap-[5px] items-start">
                          <span className="text-[13px] text-white">Needs</span>
                          <div className="inline-flex px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[1.5px] border-[#0038FF] rounded-[15px]">
                            <span className="text-[12px] text-white leading-tight">
                              {item.need}
                            </span>
                          </div>
                        </div>

                        {/* Can Offer */}
                        <div className="flex flex-col gap-[5px] items-end">
                          <span className="text-[13px] text-white">Can offer</span>
                          <div className="inline-flex px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[1.5px] border-[#906EFF] rounded-[15px]">
                            <span className="text-[12px] text-white leading-tight">
                              {item.offer || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex justify-end items-center w-full">
                        <span className="text-[13px] text-white/60">
                          {item.deadline ? `until ${fmtUntil(item.deadline)}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Button */}
                    <button
                      className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors self-center"
                      onClick={() => handleInterested(item)}
                    >
                      <span className="text-[13px] text-white">I'm interested</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="w-full py-10 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#1A0F3E] flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-white/50" />
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
              )}
            </div>
          </div>
        </div>
        
        {/* Skip Button */}
        <div className="mt-[50px] mb-[100px]">
          <button 
            className="text-[20px] font-medium text-[#0038FF] underline cursor-pointer hover:text-[#1a4dff] transition-colors"
            onClick={onNext}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}