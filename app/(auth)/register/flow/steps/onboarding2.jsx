"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "../../../../../components/ui/button";
import { Inter } from "next/font/google";
import { Search, Filter, ArrowUpDown, MoreHorizontal, Star, X, EyeOff } from "lucide-react";
import { StarIcon } from "../../../../../components/icons/star-icon";

const inter = Inter({ subsets: ["latin"] });

export default function Onboarding2({ onNext, onPrev }) {
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
  
  // Refs for click-outside handling
  const sortMenuRef = useRef(null);
  const filterMenuRef = useRef(null);
  const menuRefs = useRef([]);
  
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
  
  // Mock data for trade partners
  const tradePartners = [
    {
      id: 1,
      name: "Alex Johnson",
      rating: 5.0,
      reviews: 31,
      level: 20,
      rank: "Expert",
      needs: "Personal Training Plan",
      offers: "Plumbing",
      skillCategory: "Home Services",
      until: "July 3",
      date: new Date("2025-07-03")
    },
    {
      id: 2,
      name: "Michael Lee",
      rating: 4.9,
      reviews: 30,
      level: 17,
      rank: "Advanced",
      needs: "Design Kit for Site",
      offers: "Web Design",
      skillCategory: "Technology",
      until: "July 1",
      date: new Date("2025-07-01")
    },
    {
      id: 3,
      name: "Sarah Kim",
      rating: 4.9,
      reviews: 23,
      level: 18,
      rank: "Advanced",
      needs: "5-min Video Edit",
      offers: "Photography",
      skillCategory: "Creative",
      until: "July 4",
      date: new Date("2025-07-04")
    },
    {
      id: 4,
      name: "Emily Rivera",
      rating: 4.7,
      reviews: 14,
      level: 14,
      rank: "Intermediate",
      needs: "Acting Help",
      offers: "Vocal Training",
      skillCategory: "Performance Arts",
      until: "July 7",
      date: new Date("2025-07-07")
    },
    {
      id: 5,
      name: "David Chen",
      rating: 4.8,
      reviews: 15,
      level: 12,
      rank: "Intermediate",
      needs: "Tutoring",
      offers: "Math Lessons",
      skillCategory: "Education",
      until: "June 30",
      date: new Date("2025-06-30")
    },
    {
      id: 6,
      name: "Priya Patel",
      rating: 4.6,
      reviews: 8,
      level: 10,
      rank: "Beginner",
      needs: "Gardening",
      offers: "Cooking Lessons",
      skillCategory: "Home Services",
      until: "July 10",
      date: new Date("2025-07-10")
    }
  ];
  
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
  
  // Apply sorting and filtering
  const filteredAndSortedPartners = tradePartners
    .filter(partner => {
      // Apply rating filter
      if (filters.minRating > 0 && partner.rating < filters.minRating) {
        return false;
      }
      
      // Apply skill category filter
      if (filters.skillCategory !== "all" && partner.skillCategory !== filters.skillCategory) {
        return false;
      }
      
      // Apply level filter
      if (filters.minLevel > 0 && partner.level < filters.minLevel) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case "date":
          return a.date - b.date;
        case "level":
          return b.level - a.level;
        case "rating":
          return b.rating - a.rating;
        default:
          // Default "recommended" sorting - you can customize this
          return b.rating - a.rating;
      }
    });

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${inter.className} relative overflow-hidden`}
      style={{ 
        background: "#050015",
      }}
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
      
      {/* Background glows */}
      <div className="absolute w-[673px] h-[673px] left-[-611.5px] top-[-502px] bg-[#FB9696] opacity-50 blur-[200px]"></div>
      <div className="absolute w-[673px] h-[673px] right-[-350px] bottom-[853px] bg-[#6DDFFF] opacity-50 blur-[200px]"></div>
      <div className="absolute w-[673px] h-[673px] left-[calc(50%-336.5px)] bottom-[1042px] bg-[#906EFF] opacity-50 blur-[200px]"></div>
      <div className="absolute w-[673px] h-[673px] left-[calc(50%+383.5px-673px)] bottom-[992px] bg-[#0038FF] opacity-50 blur-[200px]"></div>
      <div className="absolute w-[673px] h-[673px] left-[calc(50%-383.5px-673px/2)] bottom-[992px] bg-[#D78DE5] opacity-50 blur-[200px]"></div>
      
      <div className="relative z-10 w-full max-w-[983px] flex flex-col items-center py-[40px]">
        {/* Header Section */}
        <div className="flex flex-col items-start gap-[44px] w-full">
          <div className="w-full">
            <div className="flex flex-col items-center gap-[25px] w-full">
              <div className="flex flex-col items-start gap-[15px] w-full">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-[15px]">
                    <StarIcon className="w-[38.33px] h-[38.33px]" />
                    <h2 className="text-[25px] font-semibold text-white">Here's what we found</h2>
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
                                    {rating === 0 ? "Any" : `${rating}★+`}
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
              
              <p className="text-[16px] text-white/40">Browse your potential trade partners</p>
            </div>
          </div>
          
          {/* Search Input */}
          <div className="w-full">
            <div className="w-full h-[50px] bg-[#120A2A] rounded-[15px] px-[14px] py-[8px] flex items-center">
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
          
          {/* Best Pick Section */}
          <div className="flex flex-col items-start gap-[15px] w-full">
            <div className="flex items-center gap-[10px]">
              <h3 className="text-[21px] font-bold text-white">Best Pick</h3>
              <StarIcon className="w-6 h-6" />
            </div>
            
            {/* Trade Partner Cards */}
            <div className="flex flex-wrap gap-[25px] w-full">
              {filteredAndSortedPartners.length > 0 ? (
                filteredAndSortedPartners.map((partner, index) => (
                <div 
                  key={partner.id}
                  className="w-[311px] h-[240px] p-[25px] flex flex-col justify-center items-center gap-[15px] rounded-[20px] border-[3px] border-[#284CCC]/80"
                  style={{
                    background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                    boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
                  }}
                >
                  <div className="flex flex-col justify-center items-center gap-[15px] w-[261px]">
                    {/* Partner Header */}
                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-start gap-[10px]">
                        <div className="w-[25px] h-[25px] rounded-full bg-gray-400"></div>
                        <div className="flex flex-col items-start gap-[5px]">
                          <span className="text-[16px] text-white">{partner.name}</span>
                          <div className="flex items-center gap-[15px]">
                            <div className="flex items-center gap-[5px]">
                              <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF] flex-shrink-0" />
                              <span className="text-[13px]"><span className="font-bold">{partner.rating.toFixed(1)}</span> <span className="text-white">({partner.reviews})</span></span>
                            </div>
                            <div className="flex items-center gap-[5px]">
                              <div className="w-3 h-3 rounded-[5px] bg-[radial-gradient(50.76%_54.89%_at_50%_50%,#933BFF_40%,#34188D_100%)]"></div>
                              <span className="text-[13px] text-white">LVL {partner.level}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="relative" ref={el => menuRefs.current[index] = el}>
                        <button onClick={() => setOpenMenuIndex(index === openMenuIndex ? null : index)}>
                          <MoreHorizontal className="w-6 h-6 text-white cursor-pointer hover:text-gray-300 transition-colors" />
                        </button>
                        {openMenuIndex === index && (
                          <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
                            <button 
                              onClick={() => handleNotInterested(partner.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full text-left"
                            >
                              <EyeOff className="w-4 h-4 text-white" />
                              Not Interested
                            </button>
                            <button 
                              onClick={() => handleReport(partner.id)}
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
                    <div className="flex justify-between items-start w-full space-x-4">
                      <div className="flex flex-col justify-center items-start gap-[10px] flex-1">
                        <span className="text-[13px] text-white">Needs</span>
                        <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[1.5px] border-[#0038FF] rounded-[15px] max-w-full">
                          <span className="text-[12px] text-white leading-tight line-clamp-2">{partner.needs}</span>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center items-end gap-[10px] flex-1">
                        <span className="text-[13px] text-white">Can offer</span>
                        <div className="px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[1.5px] border-[#906EFF] rounded-[15px] max-w-full">
                          <span className="text-[12px] text-white leading-tight line-clamp-2">{partner.offers}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Date and Button */}
                    <div className="flex justify-end items-center w-full">
                      <span className="text-[13px] text-white/60">until {partner.until}</span>
                    </div>
                    
                    <button 
                      className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors"
                      onClick={() => handleInterested(partner)}
                    >
                      <span className="text-[13px] text-white">I'm interested</span>
                    </button>
                  </div>
                </div>
              ))
              ) : (
                <div className="w-full py-10 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#1A0F3E] flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-white/50" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No matches found</h3>
                  <p className="text-white/60 text-center max-w-md">
                    Try adjusting your filters or search criteria to see more results
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Skip Button */}
        <div className="mt-[50px]">
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