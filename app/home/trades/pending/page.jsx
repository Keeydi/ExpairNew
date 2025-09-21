"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import OffersPopup from "../../../../components/trade-cards/offers-popup";
import EvaluationDialog from "../../../../components/trade-cards/evaluation-dialog";

const inter = Inter({ subsets: ["latin"] });

export default function PendingTradesPage() {
  const { data: session } = useSession();
  
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedSort, setSelectedSort] = useState("Date");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showOffersPopup, setShowOffersPopup] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const [postedTrades, setPostedTrades] = useState([]);
  const [initiatedTrades, setInitiatedTrades] = useState([]);
  const [finalizationTrades, setFinalizationTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all trade data
  useEffect(() => {
    const fetchAllTrades = async () => {
    if (!session) return;
      
      if (!session?.access) {
        console.log("No session or access token found");
        setError("Authentication required");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);

        console.log("=== FETCHING TRADES DEBUG ===");
        console.log("Session:", session);
        console.log("Access token exists:", !!session.access);
        console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
        
        // Fetch all three types of trades
        const [postedResponse, interestedResponse, activeResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/posted-trades/`, {
            headers: {
              'Authorization': `Bearer ${session.access}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/interested-trades/`, {
            headers: {
              'Authorization': `Bearer ${session.access}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/active-trades/`, {
            headers: {
              'Authorization': `Bearer ${session.access}`,
              'Content-Type': 'application/json',
            },
          })
        ]);      
        
        if (postedResponse.ok) {
          const postedData = await postedResponse.json();
          const transformedPostedTrades = postedData.posted_trades.map(trade => ({
            id: trade.tradereq_id,
            tradereq_id: trade.tradereq_id,
            name: `${session.user.first_name || ''} ${session.user.last_name || ''}`.trim() || session.user.username || 'You',
            rating: session.user.rating || "0.0",
            reviews: session.user.reviews || "0",
            level: session.user.level || "1",
            needs: trade.reqname,
            interested: trade.interested_users.map(user => ({
              id: user.id,
              name: user.name,
              username: user.username,
              avatar: user.profilePic || "/defaultavatar.png",
              rating: user.rating,
              reviews: user.rating_count,
              level: user.level,
            })),
            interested_users: trade.interested_users,
            until: trade.deadline ? new Date(trade.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'No deadline',
          }));
          setPostedTrades(transformedPostedTrades);
        }
        
        if (interestedResponse.ok) {
          const interestedData = await interestedResponse.json();
          // The data is already in the right format from the backend
          setInitiatedTrades(interestedData.interested_trades);
        }
        
        if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        
        // Fetch trade details status for each active trade
        const tradesWithStatus = await Promise.all(
          activeData.active_trades.map(async (trade) => {
            try {
              const statusResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${trade.trade_request_id}/details/status/`,
                {
                  headers: {
                    'Authorization': `Bearer ${session.access}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                return { ...trade, detailsStatus: statusData };
              }
              return trade;
            } catch (error) {
              console.error('Error fetching trade details status:', error);
              return trade;
            }
          })
        );
        
        setFinalizationTrades(tradesWithStatus);
      }

        
      } catch (error) {
        console.error('Error fetching trades:', error);
        setError('Failed to load trades');
      } finally {
        setLoading(false);
      }
    };

    fetchAllTrades();
  }, [session]);

  const handleViewClick = (trade) => {
  console.log("=== HANDLE VIEW CLICK DEBUG ===");
  console.log("Trade object:", trade);
  console.log("Trade.interested_users:", trade.interested_users);
  console.log("Trade.interested:", trade.interested);
  
  // Debug each interested user to see the data structure
  if (trade.interested_users) {
    trade.interested_users.forEach((user, index) => {
      console.log(`User ${index}:`, user);
      console.log(`User ${index} interest_id:`, user.interest_id);
      console.log(`User ${index} trade_interests_id:`, user.trade_interests_id);
    });
  }
  
  // Create a consistent trade object for the popup
  const tradeForPopup = {
    tradereq_id: trade.tradereq_id,
    interested_users: trade.interested_users || trade.interested || [],
    deadline: trade.until, // Map 'until' to 'deadline' for consistency
    until: trade.until
  };
  
  console.log("Trade for popup:", tradeForPopup);
  
  setSelectedTrade(tradeForPopup);
  setSelectedService(trade.needs);
  setShowOffersPopup(true);
};

  if (loading) {
    return (
      <div className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading your trades...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  // Add this function to your PendingTradesPage component
const refreshTrades = async () => {
  if (!session?.access) return;
  
  try {
    setLoading(true);
    
    const [postedResponse, interestedResponse, activeResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/posted-trades/`, {
          headers: {
            'Authorization': `Bearer ${session.access}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/interested-trades/`, {
          headers: {
            'Authorization': `Bearer ${session.access}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/active-trades/`, {
          headers: {
            'Authorization': `Bearer ${session.access}`,
            'Content-Type': 'application/json',
          },
        })
      ]);
    
    if (postedResponse.ok) {
      const postedData = await postedResponse.json();
      const transformedPostedTrades = postedData.posted_trades.map(trade => ({
        id: trade.tradereq_id,
        tradereq_id: trade.tradereq_id,
        name: `${session.user.first_name || ''} ${session.user.last_name || ''}`.trim() || session.user.username || 'You',
        rating: session.user.rating || "0.0",
        reviews: session.user.reviews || "0",
        level: session.user.level || "1",
        needs: trade.reqname,
        interested: trade.interested_users
          .filter(user => user.status === 'PENDING') // ✅ Only show pending interests
          .map(user => ({
            id: user.id,
            interest_id: user.interest_id,
            name: user.name,
            username: user.username,
            avatar: user.profilePic || "/defaultavatar.png",
            rating: user.rating,
            reviews: user.rating_count,
            level: user.level,
            status: user.status, // ✅ Include status
          })),
        interested_users: trade.interested_users.filter(user => user.status === 'PENDING'), // ✅ Filter for popup
        until: trade.deadline ? new Date(trade.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'No deadline',
      }));
      setPostedTrades(transformedPostedTrades);
    }
    if (interestedResponse.ok) {
        const interestedData = await interestedResponse.json();
        setInitiatedTrades(interestedData.interested_trades);
      }
    
    if (activeResponse.ok) {
      const activeData = await activeResponse.json();
      setFinalizationTrades(activeData.active_trades);
    }
    
  } catch (error) {
    console.error('Error refreshing trades:', error);
  } finally {
    setLoading(false);
  }
};


  // Add a cancel interest function
  const handleCancelInterest = async (interestId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-interests/${interestId}/decline/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Remove the interest from the list
        setInitiatedTrades(prevTrades => 
          prevTrades.filter(trade => trade.interest_id !== interestId)
        );
      }
    } catch (error) {
      console.error('Error cancelling interest:', error);
    }
  };


  return (
    <div className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}>
      {/* Page Title with Sort/Filter */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-[25px] font-bold">Pending trades</h1>

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
        <h2 className="text-[20px] font-medium mb-5 text-[#D78DE5]">Trades you posted</h2>
        {postedTrades.length === 0 ? (
          <div className="text-white/60 text-center py-8">
            You haven't posted any trades yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-[25px]">
            {postedTrades.map((trade, index) => (
              <div
                key={trade.id}
                className="w-[440px] h-[240px] p-[25px] flex flex-col justify-between rounded-[20px] border-[3px] border-[#D78DE5]/80"
                style={{
                  background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                  boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
                }}
              >
                {/* Trade Header */}
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-start gap-[10px]">
                    <div className="w-[25px] h-[25px] rounded-full bg-gray-400"></div>
                    <div className="flex flex-col items-start gap-[5px]">
                      <span className="text-[16px] text-white">{trade.name}</span>
                      <div className="flex items-center gap-[15px]">
                        <div className="flex items-center gap-[5px]">
                          <Icon icon="lucide:star" className="w-4 h-4 text-[#906EFF] fill-current flex-shrink-0" />
                          <span className="text-[13px] font-bold text-white">{trade.rating} ({trade.reviews})</span>
                        </div>
                        <div className="flex items-center gap-[5px]">
                          <div className="w-3 h-3 rounded-[5px] bg-[#933BFF]"></div>
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
                    <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[1.5px] border-[#0038FF] rounded-[15px]">
                      <span className="text-[12px] text-white leading-tight">{trade.needs}</span>
                    </div>
                  </div>
                  
                  {/* Interested People */}
                  <div className="flex flex-col items-end gap-[10px]">
                    <span className="text-[13px] text-white">Look who's interested</span>
                    <div className="flex -space-x-2">
                      {trade.interested && trade.interested.length > 0 ? (
                        trade.interested.map((person) => (
                          <div key={person.id} className="w-[25px] h-[25px] rounded-full border border-white overflow-hidden">
                            <Image
                              src={person.avatar}
                              alt="Avatar"
                              width={25}
                              height={25}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="text-[12px] text-white/60">No interest yet</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="flex justify-end items-center w-full">
                  <span className="text-[13px] text-white/60">until {trade.until}</span>
                </div>

                {/* View Button */}
                <button 
                  className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors"
                  onClick={() => handleViewClick(trade)}
                  disabled={!trade.interested || trade.interested.length === 0}
                >
                  <span className="text-[13px] text-white">
                    {(!trade.interested || trade.interested.length === 0) ? 'No offers' : 'View'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Trades You're Interested In Section */}
       <div className="mb-10">
        <h2 className="text-[20px] font-medium mb-5 text-[#FB9696]">Trades you're interested in</h2>
        {initiatedTrades.length === 0 ? (
          <div className="text-white/60 text-center py-8">
            You haven't expressed interest in any trades yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-[25px]">
            {initiatedTrades.map((trade, index) => (
              <div
                key={trade.id}
                className="w-[440px] h-[240px] p-[25px] flex flex-col justify-between rounded-[20px] border-[3px] border-[#FB9696]/80"
                style={{
                  background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                  boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
                }}
              >
              {/* Trade Header */}
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-start gap-[10px]">
                    <div className="w-[25px] h-[25px] rounded-full bg-gray-400"></div>
                    <div className="flex flex-col items-start gap-[5px]">
                      <span className="text-[16px] text-white">{trade.name}</span>
                      <div className="flex items-center gap-[15px]">
                        <div className="flex items-center gap-[5px]">
                          <Icon icon="lucide:star" className="w-4 h-4 text-[#906EFF] fill-current flex-shrink-0" />
                          <span className="text-[13px] font-bold text-white">{trade.rating} ({trade.reviews})</span>
                        </div>
                        <div className="flex items-center gap-[5px]">
                          <div className="w-3 h-3 rounded-[5px] bg-[#933BFF]"></div>
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
                        <button 
                          className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full"
                          onClick={() => {
                            handleCancelInterest(trade.interest_id);
                            setOpenMenuIndex(null);
                          }}
                        >
                          <Icon icon="lucide:x" className="text-white text-base" />
                          Cancel Interest
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
                      <span className="text-[12px] text-white leading-tight line-clamp-2">{trade.needs}</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-end gap-[10px] flex-1">
                    <span className="text-[13px] text-white">Can offer</span>
                    <div className="px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[1.5px] border-[#906EFF] rounded-[15px] max-w-full">
                      <span className="text-[12px] text-white leading-tight line-clamp-2">{trade.offers}</span>
                    </div>
                  </div>
                </div>

              {/* Status and Date */}
              <div className="flex justify-between items-center w-full">
                <span className="text-[13px] text-white/60">{trade.status}</span>
                <span className="text-[13px] text-white/60">until {trade.until}</span>
              </div>
            </div>
         ))}
          </div>
        )}
      </div>

      {/* Trades for Confirmation Section */}
      <div className="mb-10">
        <h2 className="text-[20px] font-medium mb-5 text-[#6DDFFF]">Trades for confirmation</h2>
        {finalizationTrades.length === 0 ? (
          <div className="text-white/60 text-center py-8">
            No trades ready for confirmation yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-[25px]">
            {finalizationTrades.map((trade, index) => (
              <div
                key={trade.id}
                className="w-[440px] h-[240px] p-[25px] flex flex-col justify-between rounded-[20px] border-[3px] border-[#6DDFFF]/80"
                style={{
                  background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                  boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
                }}
              >
                {/* Trade Header */}
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-start gap-[10px]">
                    <div className="w-[25px] h-[25px] rounded-full bg-gray-400"></div>
                    <div className="flex flex-col items-start gap-[5px]">
                      <span className="text-[16px] text-white">{trade.name}</span>
                      <div className="flex items-center gap-[15px]">
                        <div className="flex items-center gap-[5px]">
                          <Icon icon="lucide:star" className="w-4 h-4 text-[#906EFF] fill-current flex-shrink-0" />
                          <span className="text-[13px] font-bold text-white">{trade.rating} ({trade.reviews})</span>
                        </div>
                        <div className="flex items-center gap-[5px]">
                          <div className="w-3 h-3 rounded-[5px] bg-[#933BFF]"></div>
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

              {/* Needs/Offers Section */}
              <div className="flex justify-between items-start w-full space-x-4">
                <div className="flex flex-col justify-center items-start gap-[10px] flex-1">
                  <span className="text-[13px] text-white">Needs</span>
                  <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[1.5px] border-[#0038FF] rounded-[15px] max-w-full">
                    <span className="text-[12px] text-white leading-tight line-clamp-2">{trade.needs}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-end gap-[10px] flex-1">
                  <span className="text-[13px] text-white">Can offer</span>
                  <div className="px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[1.5px] border-[#906EFF] rounded-[15px] max-w-full">
                    <span className="text-[12px] text-white leading-tight line-clamp-2">{trade.offers}</span>
                  </div>
                </div>
              </div>

              {/* Date and Buttons */}
              <div className="flex justify-end items-center w-full">
                <span className="text-[13px] text-white/60">until {trade.until}</span>
              </div>

              <div className="flex justify-between">
              {(() => {
                const currentUserSubmitted = trade.detailsStatus?.current_user?.has_submitted;
                const otherUserSubmitted = trade.is_requester 
                  ? trade.detailsStatus?.responder?.has_submitted 
                  : trade.detailsStatus?.requester?.has_submitted;
                const otherUserName = trade.is_requester 
                  ? trade.detailsStatus?.responder?.name?.split(' ')[0] 
                  : trade.detailsStatus?.requester?.name?.split(' ')[0];

                if (!currentUserSubmitted) {
                  return (
                    <Link href={`/home/trades/add-details?requested=${encodeURIComponent(trade.needs)}&exchange=${encodeURIComponent(trade.offers)}&tradereq_id=${trade.trade_request_id}`}>
                      <button className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors">
                        <span className="text-[13px] text-white">Add details</span>
                      </button>
                    </Link>
                  );
                } else if (!otherUserSubmitted) {
                  return (
                    <button 
                      disabled
                      className="w-[140px] h-[30px] flex justify-center items-center bg-[#413663] rounded-[10px] cursor-not-allowed"
                    >
                      <span className="text-[11px] text-white/70">Waiting for {otherUserName}</span>
                    </button>
                  );
                } else {
                  return (
                    <button 
                      disabled
                      className="w-[120px] h-[30px] flex justify-center items-center bg-[#0FBC0F] rounded-[10px]"
                    >
                      <span className="text-[13px] text-white">Ready</span>
                    </button>
                  );
                }
              })()}
              
              <button 
                className="w-[120px] h-[30px] flex justify-center items-center bg-[#120A2A] border border-white rounded-[10px] cursor-pointer hover:bg-[#1A0F3E] transition-colors"
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
                  <Icon icon="lucide:star" className="w-4 h-4 text-white" />
                  <span className="text-[13px] text-white">Evaluate</span>
                </div>
              </button>
            </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offers Popup */}
      <OffersPopup 
        isOpen={showOffersPopup} 
        onClose={() => setShowOffersPopup(false)} 
        service={selectedService} 
        trade={selectedTrade} 
        onTradeUpdate={refreshTrades}
      />

      {/* Evaluation Dialog */}
      <EvaluationDialog
        isOpen={showEvaluationDialog}
        onClose={() => setShowEvaluationDialog(false)}
        tradeData={selectedTrade}
      />
    </div>
  );
}