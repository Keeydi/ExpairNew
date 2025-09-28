"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import OffersPopup from "../../../../components/trade-cards/offers-popup";
import EvaluationDialog from "../../../../components/trade-cards/evaluation-dialog";
import { Star } from "lucide-react";
import Tooltip from "../../../../components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div
        className="w-[440px] h-[240px] p-[25px] flex flex-col justify-between rounded-[20px] border-[3px] border-[#D78DE5]/80"
        style={{
          background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
          boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)",
        }}
      >
        <div className="bg-[#170a3eff] p-8 rounded-[20px] shadow-lg w-full">
          <h3 className="text-center text-[16px] font-semibold text-white mb-4">{message}</h3>
          <div className="flex justify-between gap-4">
            <button
              onClick={onCancel}
              className="w-[120px] py-2 rounded-[15px] text-white border-2 border-[#FB9696] bg-transparent hover:bg-[#FB9696] transition duration-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="w-[120px] py-2 rounded-[15px] text-white bg-[#906EFF] hover:bg-[#7e59f7] transition duration-300"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


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
  const [expandedFinalizationCardId, setExpandedFinalizationCardId] = useState(null);

  const [postedTrades, setPostedTrades] = useState([]);
  const [initiatedTrades, setInitiatedTrades] = useState([]);
  const [finalizationTrades, setFinalizationTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState(null);
  const [showDeleteModalForCard, setShowDeleteModalForCard] = useState(null);

  const handleDeleteTrade = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${tradeToDelete.tradereq_id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setPostedTrades(prevTrades => prevTrades.filter(t => t.tradereq_id !== tradeToDelete.tradereq_id));
        setShowModal(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete trade request');
      }
    } catch (error) {
      console.error('Error deleting trade request:', error);
      alert('Failed to delete trade request');
    }
  };

  const handleCancelDelete = () => setShowModal(false);

  // Add the missing toggle function
  const toggleFinalizationCardExpand = useCallback((tradeId) => {
    setExpandedFinalizationCardId(expandedFinalizationCardId === tradeId ? null : tradeId);
  }, [expandedFinalizationCardId]);

  // Set loading state for individual actions
  const setActionLoadingState = useCallback((actionId, isLoading) => {
    setActionLoading(prev => ({
      ...prev,
      [actionId]: isLoading
    }));
  }, []);

  // Update specific finalization trade
  const updateFinalizationTrade = useCallback(async (tradeRequestId) => {
    if (!session?.access) return;

    setActionLoadingState(`finalization-${tradeRequestId}`, true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/active-trades/`, {
        headers: {
          'Authorization': `Bearer ${session.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTrade = data.active_trades.find(trade => trade.trade_request_id === tradeRequestId);

        if (updatedTrade) {
          // Fetch updated status
          const statusResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${tradeRequestId}/details/status/`,
            {
              headers: {
                'Authorization': `Bearer ${session.access}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const statusData = statusResponse.ok ? await statusResponse.json() : null;
          const tradeWithStatus = { ...updatedTrade, detailsStatus: statusData };

          // Update only the specific trade
          setFinalizationTrades(prevTrades =>
            prevTrades.map(trade =>
              trade.trade_request_id === tradeRequestId ? tradeWithStatus : trade
            )
          );
        }
      }
    } catch (error) {
      console.error('Error updating finalization trade:', error);
    } finally {
      setActionLoadingState(`finalization-${tradeRequestId}`, false);
    }
  }, [session, setActionLoadingState]);

  const refreshAllTrades = useCallback(async (shouldSetLoading = false) => {
    if (!session?.access) return;

    if (shouldSetLoading) {
      setLoading(true);
      setError(null);
    }

    try {
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
          interested: trade.interested_users
            .filter(user => user.status === 'PENDING')
            .map(user => ({
              id: user.id,
              interest_id: user.interest_id,
              name: user.name,
              username: user.username,
              avatar: user.profilePic ?
                (user.profilePic.startsWith('http') ? user.profilePic : `${process.env.NEXT_PUBLIC_BACKEND_URL}${user.profilePic}`)
                : "/defaultavatar.png",
              rating: user.rating,
              reviews: user.rating_count,
              level: user.level,
              status: user.status,
            })),
          interested_users: trade.interested_users.filter(user => user.status === 'PENDING'),
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
      console.error('Error refreshing trades:', error);
      if (shouldSetLoading) {
        setError('Failed to load trades');
      }
    } finally {
      if (shouldSetLoading) {
        setLoading(false);
      }
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      refreshAllTrades(true); // Pass true to handle loading state
    }
  }, [session, refreshAllTrades]);

  const handleViewClick = useCallback((trade) => {
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
      deadline: trade.until,
      until: trade.until
    };

    console.log("Trade for popup:", tradeForPopup);

    setSelectedTrade(tradeForPopup);
    setSelectedService(trade.needs);
    setShowOffersPopup(true);
  }, []);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [tradeToCancel, setTradeToCancel] = useState(null);
  const [showCancelModalForCard, setShowCancelModalForCard] = useState(null);

  const InlineConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
      <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-70 z-20 rounded-[20px]">
        <div className="w-[300px] p-[20px] flex flex-col gap-4 rounded-[15px] border-[2px] border-[#D78DE5]/80 bg-[#170a3eff] shadow-lg">
          <h3 className="text-center text-[14px] font-semibold text-white">{message}</h3>
          <div className="flex justify-between gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded-[10px] text-white border border-[#FB9696] bg-transparent hover:bg-[#FB9696] transition duration-300"
            >
              <span className="text-[12px]">Cancel</span>
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 rounded-[10px] text-white bg-[#906EFF] hover:bg-[#7e59f7] transition duration-300"
            >
              <span className="text-[12px]">Confirm</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handle trade cancellation
  const handleCancelTrade = async (tradeRequestId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${tradeRequestId}/cancel/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        refreshAllTrades();
        setOpenMenuIndex(null);
        setShowCancelModalForCard(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to cancel trade');
      }
    } catch (error) {
      console.error('Error cancelling trade:', error);
      alert('Failed to cancel trade');
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setTradeToCancel(null);
  };

  // Memoize expensive computations
  const memoizedPostedTrades = useMemo(() => postedTrades, [postedTrades]);
  const memoizedInitiatedTrades = useMemo(() => initiatedTrades, [initiatedTrades]);
  const memoizedFinalizationTrades = useMemo(() => finalizationTrades, [finalizationTrades]);

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
        <h2 className="text-[20px] font-[500] mb-5 text-[#D78DE5]">Trades you posted</h2>
        {postedTrades.length === 0 ? (
          <div className="text-white/60 text-center py-8">
            You haven't posted any trades yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-[25px]">
            {postedTrades.map((trade, index) => (
              <div key={trade.id} className="relative">
                <div
                  className="transition-all duration-300 hover:scale-[1.01] w-[440px] h-[240px] p-[25px] flex flex-col justify-between rounded-[20px] border-[3px] border-[#D78DE5]/80"
                  style={{
                    background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                    boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
                  }}
                >
                  {/* Trade Header */}
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-start gap-[10px]">
                      {/* Clickable Profile Picture */}
                      {session?.user?.username ? (
                        <Link href={`/home/profile/${session.user.username}`} className="flex-shrink-0">
                          <div className="w-[25px] h-[25px] rounded-full overflow-hidden bg-gray-400 cursor-pointer hover:ring-2 hover:ring-[#D78DE5] transition-all">
                            <Image
                              src={session?.user?.image || '/assets/defaultavatar.png'}
                              alt="Your profile picture"
                              width={25}
                              height={25}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                              unoptimized={session?.user?.image?.startsWith('http')}
                            />
                          </div>
                        </Link>
                      ) : (
                        <div className="w-[25px] h-[25px] rounded-full overflow-hidden bg-gray-400 flex-shrink-0">
                          <Image
                            src={session?.user?.image || '/assets/defaultavatar.png'}
                            alt="Your profile picture"
                            width={25}
                            height={25}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                            unoptimized={session?.user?.image?.startsWith('http')}
                          />
                        </div>
                      )}
                      <div className="flex flex-col items-start gap-[5px]">
                        {/* Clickable Name */}
                        {session?.user?.username ? (
                          <Link href={`/home/profile/${session.user.username}`} className="text-[16px] text-white hover:text-[#D78DE5] transition-colors cursor-pointer">
                            <span>{trade.name}</span>
                          </Link>
                        ) : (
                          <span className="text-[16px] text-white">{trade.name}</span>
                        )}

                        <div className="flex items-center gap-[15px]">
                          <div className="flex items-center gap-[5px]">
                            <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF]" />
                            <span className="text-[13px] font-bold text-white">{trade.rating}</span>
                            <span className="text-[13px] font-normal text-white"> ({trade.reviews})</span>
                          </div>
                          <div className="flex flex-col gap-[3px]">
                            <div className="flex items-center gap-[5px]">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
                                <path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z" fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5" />
                                <defs>
                                  <radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)">
                                    <stop offset="0.4" stopColor="#933BFF" />
                                    <stop offset="1" stopColor="#34188D" />
                                  </radialGradient>
                                  <linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="white" />
                                    <stop offset="0.5" stopColor="#999999" />
                                    <stop offset="1" stopColor="white" />
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
                      <button onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}>
                        <Icon icon="lucide:more-horizontal" className="w-6 h-6 text-white" />
                      </button>
                      {openMenuIndex === index && (
                        <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
                          <button
                            className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full"
                            onClick={() => {
                              setShowDeleteModalForCard(trade.id);
                              setOpenMenuIndex(null);
                            }}
                          >
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
                                src={person.avatar || '/assets/defaultavatar.png'}
                                alt={`${person.name}'s profile picture`}
                                width={25}
                                height={25}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                                unoptimized={person.avatar?.startsWith('http')}
                              />
                            </div>
                          ))
                        ) : (
                          <div className="text-[12px] text-white/60">No requests yet</div>
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

                {/* Inline Delete Modal */}
                {showDeleteModalForCard === trade.id && (
                  <InlineConfirmationModal
                    message="Are you sure you want to delete this trade request? This action cannot be undone."
                    onConfirm={() => handleDeleteTrade(trade)}
                    onCancel={() => setShowDeleteModalForCard(null)}
                  />
                )}
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
                className="w-[440px] h-[240px] p-[25px] flex flex-col justify-between duration-300 hover:scale-[1.01] h-[240px] rounded-[20px] border-[3px] border-[#FB9696]/80"
                style={{
                  background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                  boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
                }}
              >
                {/* Trade Header */}
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-start gap-[10px]">
                    {/* Clickable Profile Picture */}
                    {trade.requester?.username ? (
                      <Link href={`/home/profile/${trade.requester.username}`} className="flex-shrink-0">
                        <div className="w-[25px] h-[25px] rounded-full overflow-hidden bg-gray-400 cursor-pointer hover:ring-2 hover:ring-[#FB9696] transition-all">
                          <Image
                            src={trade.requester?.profile_pic || '/assets/defaultavatar.png'}
                            alt={`${trade.name}'s profile picture`}
                            width={25}
                            height={25}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                            unoptimized={trade.requester?.profile_pic?.startsWith('http')}
                          />
                        </div>
                      </Link>
                    ) : (
                      <div className="w-[25px] h-[25px] rounded-full overflow-hidden bg-gray-400 flex-shrink-0">
                        <Image
                          src={trade.requester?.profile_pic || '/assets/defaultavatar.png'}
                          alt={`${trade.name}'s profile picture`}
                          width={25}
                          height={25}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                          unoptimized={trade.requester?.profile_pic?.startsWith('http')}
                        />
                      </div>
                    )}

                    <div className="flex flex-col items-start gap-[5px]">
                      {/* Clickable Name */}
                      {trade.requester?.username ? (
                        <Link href={`/home/profile/${trade.requester.username}`} className="text-[16px] text-white hover:text-[#FB9696] transition-colors cursor-pointer">
                          <span>{trade.name}</span>
                        </Link>
                      ) : (
                        <span className="text-[16px] text-white">{trade.name}</span>
                      )}

                      <div className="flex items-center gap-[15px]">
                        <div className="flex items-center gap-[5px]">
                          <Icon icon="lucide:star" className="w-4 h-4 text-[#906EFF] fill-current flex-shrink-0" />
                          <span className="text-[13px] font-bold text-white">{trade.rating} ({trade.reviews})</span>
                        </div>
                        <div className="flex flex-col gap-[3px]">
                          <div className="flex items-center gap-[5px]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
                              <path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z"
                                fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5" />
                              <defs>
                                <radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)">
                                  <stop offset="0.4" stopColor="#933BFF" />
                                  <stop offset="1" stopColor="#34188D" />
                                </radialGradient>
                                <linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="white" />
                                  <stop offset="0.5" stopColor="#999999" />
                                  <stop offset="1" stopColor="white" />
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
              <div key={trade.id} className="relative">
                <div
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
                          {/* Clickable Profile Picture */}
                          {(() => {
                            const otherUser = trade.is_requester ? trade.responder : trade.requester;
                            return otherUser?.username;
                          })() ? (
                            <Link href={`/home/profile/${trade.is_requester ? trade.responder.username : trade.requester.username}`} className="flex-shrink-0">
                              <div className="w-[25px] h-[25px] rounded-full overflow-hidden bg-gray-400 cursor-pointer hover:ring-2 hover:ring-[#6DDFFF] transition-all">
                                <Image
                                  src={trade.other_user_profile_pic || '/assets/defaultavatar.png'}
                                  alt={`${trade.name}'s profile picture`}
                                  width={25}
                                  height={25}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                                  unoptimized={trade.other_user_profile_pic?.startsWith('http')}
                                />
                              </div>
                            </Link>
                          ) : (
                            <div className="w-[25px] h-[25px] rounded-full overflow-hidden bg-gray-400 flex-shrink-0">
                              <Image
                                src={trade.other_user_profile_pic || '/assets/defaultavatar.png'}
                                alt={`${trade.name}'s profile picture`}
                                width={25}
                                height={25}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                                unoptimized={trade.other_user_profile_pic?.startsWith('http')}
                              />
                            </div>
                          )}

                          <div>
                            {/* Clickable Name */}
                            {(() => {
                              const otherUser = trade.is_requester ? trade.responder : trade.requester;
                              return otherUser?.username;
                            })() ? (
                              <Link href={`/home/profile/${trade.is_requester ? trade.responder.username : trade.requester.username}`} className="hover:text-[#6DDFFF] transition-colors">
                                <h3 className="text-[16px] font-normal cursor-pointer">{trade.name}</h3>
                              </Link>
                            ) : (
                              <h3 className="text-[16px] font-normal">{trade.name}</h3>
                            )}
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
                              <button
                                className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCancelModalForCard(trade.id);
                                  setOpenMenuIndex(null);
                                }}
                              >
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
                          <Icon icon="lucide:chevron-up" className="w-[30px] h-[30px] text-white" />
                        </button>
                        <div className="flex items-center gap-[15px]">
                          <Link href={`/home/trades/add-details?requested=${encodeURIComponent(trade.needs)}&exchange=${encodeURIComponent(trade.offers)}&tradereq_id=${trade.trade_request_id}`}>
                            <button className="min-w-[120px] h-[40px] flex justify-center items-center bg-[#0038FF] rounded-[15px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors">
                              <span className="text-[16px] text-white">Add details</span>
                            </button>
                          </Link>
                          <Tooltip content="Expair's tailored AI will evaluate your trade using task difficulty, time, and skills. Make sure to add all details before you can run the evaluation." position="left">
                            <button
                              className={`min-w-[120px] h-[40px] flex justify-center items-center rounded-[15px] border-2 border-[#7E59F8] shadow-[0_0_15px_#D78DE5] transition-colors ${trade.detailsStatus?.submission_status?.both_submitted
                                ? 'bg-[#120A2A] cursor-pointer hover:bg-[#1A0F3E]'
                                : 'bg-[#413663] cursor-not-allowed opacity-50'
                                }`}
                              disabled={!trade.detailsStatus?.submission_status?.both_submitted}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (trade.detailsStatus?.submission_status?.both_submitted) {
                                  setSelectedTrade({
                                    tradereq_id: trade.trade_request_id,
                                    requestTitle: trade.needs,
                                    offerTitle: trade.offers,
                                    taskComplexity: 60,
                                    timeCommitment: 50,
                                    skillLevel: 80,
                                    feedback: `${trade.name}'s trade for ${trade.needs} in exchange for ${trade.offers} is well-balanced, with a high skill level required and moderate time commitment. The task complexity is fairly challenging, which makes this a valuable and rewarding exchange for both parties. Overall, it's a great match that promises meaningful growth and results.`
                                  });
                                  setShowEvaluationDialog(true);
                                }
                              }}
                            >
                              <div className="flex items-center gap-[10px]">
                                <img src="/assets/logos/White=Logo S.png" alt="Logo" className="w-[16px] h-[16px]" />
                                <span className="text-[16px] font-normal text-white">
                                  {trade.detailsStatus?.submission_status?.both_submitted ? 'Evaluate' : 'Waiting for details'}
                                </span>
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
                          {/* Clickable Profile Picture */}
                          {(() => {
                            const otherUser = trade.is_requester ? trade.responder : trade.requester;
                            return otherUser?.username;
                          })() ? (
                            <Link href={`/home/profile/${trade.is_requester ? trade.responder.username : trade.requester.username}`} className="flex-shrink-0">
                              <div className="w-[25px] h-[25px] rounded-full overflow-hidden bg-gray-400 cursor-pointer hover:ring-2 hover:ring-[#6DDFFF] transition-all">
                                <Image
                                  src={trade.other_user_profile_pic || '/assets/defaultavatar.png'}
                                  alt={`${trade.name}'s profile picture`}
                                  width={25}
                                  height={25}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                                  unoptimized={trade.other_user_profile_pic?.startsWith('http')}
                                />
                              </div>
                            </Link>
                          ) : (
                            <div className="w-[25px] h-[25px] rounded-full overflow-hidden bg-gray-400 flex-shrink-0">
                              <Image
                                src={trade.other_user_profile_pic || '/assets/defaultavatar.png'}
                                alt={`${trade.name}'s profile picture`}
                                width={25}
                                height={25}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                                unoptimized={trade.other_user_profile_pic?.startsWith('http')}
                              />
                            </div>
                          )}

                          <div className="flex flex-col items-start gap-[5px]">
                            {/* Clickable Name */}
                            {(() => {
                              const otherUser = trade.is_requester ? trade.responder : trade.requester;
                              return otherUser?.username;
                            })() ? (
                              <Link href={`/home/profile/${trade.is_requester ? trade.responder.username : trade.requester.username}`} className="text-[16px] text-white hover:text-[#6DDFFF] transition-colors cursor-pointer">
                                <span>{trade.name}</span>
                              </Link>
                            ) : (
                              <span className="text-[16px] text-white">{trade.name}</span>
                            )}

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
                                        <stop offset="0.4" stopColor="#933BFF" />
                                        <stop offset="1" stopColor="#34188D" />
                                      </radialGradient>
                                      <linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="white" />
                                        <stop offset="0.5" stopColor="#999999" />
                                        <stop offset="1" stopColor="white" />
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
                          <button onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setOpenMenuIndex(openMenuIndex === `final-${index}` ? null : `final-${index}`);
                          }}>
                            <Icon icon="lucide:more-horizontal" className="w-6 h-6 text-white" />
                          </button>
                          {openMenuIndex === `final-${index}` && (
                            <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
                              <button
                                className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCancelModalForCard(trade.id);
                                  setOpenMenuIndex(null);
                                }}
                              >
                                <Icon icon="lucide:x" className="text-white text-base" />
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                        {showCancelModalForCard === trade.id && (
                          <InlineConfirmationModal
                            message="Are you sure you want to cancel this trade?"
                            onConfirm={() => handleCancelTrade(trade.trade_request_id)}
                            onCancel={() => setShowCancelModalForCard(null)}
                          />
                        )}
                      </div>

                      {/* Needs/Offers Section */}
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
                                <button className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-[13px] text-white">Add details</span>
                                </button>
                              </Link>
                            );
                          } else if (!otherUserSubmitted) {
                            return (
                              <button
                                disabled
                                className="w-[140px] h-[30px] flex justify-center items-center bg-[#413663] rounded-[10px] cursor-not-allowed"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                              >
                                <span className="text-[11px] text-white/70">Waiting for {otherUserName}</span>
                              </button>
                            );
                          } else {
                            return (
                              <button
                                disabled
                                className="w-[120px] h-[30px] flex justify-center items-center bg-[#6DDFFF] rounded-[10px]"
                              >
                                <span className="text-[14px] text-black font-bold">Ready</span>
                              </button>
                            );
                          }
                        })()}

                        <button
                          className={`h-[35px] flex justify-center items-center border border-white rounded-[10px] transition-colors ${trade.detailsStatus?.submission_status?.both_submitted
                            ? 'w-[120px] bg-[#120A2A] cursor-pointer hover:bg-[#1A0F3E]'
                            : 'w-[170px] bg-[#413663] cursor-not-allowed opacity-50'
                            }`}
                          disabled={!trade.detailsStatus?.submission_status?.both_submitted}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (trade.detailsStatus?.submission_status?.both_submitted) {
                              setSelectedTrade({
                                tradereq_id: trade.trade_request_id,
                                requestTitle: trade.needs,
                                offerTitle: trade.offers,
                                taskComplexity: 60,
                                timeCommitment: 50,
                                skillLevel: 80,
                                feedback: `${trade.name}'s trade for ${trade.needs} in exchange for ${trade.offers} is well-balanced, with a high skill level required and moderate time commitment. The task complexity is fairly challenging, which makes this a valuable and rewarding exchange for both parties. Overall, it's a great match that promises meaningful growth and results.`
                              });
                              setShowEvaluationDialog(true);
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <Icon icon="lucide:star" className="w-4 h-4 text-white" />
                            <span className="text-[14px] text-white">
                              {trade.detailsStatus?.submission_status?.both_submitted ? 'Evaluate' : 'Waiting for details'}
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ),
            )}
          </div>
        )}
      </div>
      {/* Offers Popup */}
      <OffersPopup
        isOpen={showOffersPopup}
        onClose={() => setShowOffersPopup(false)}
        service={selectedService}
        trade={selectedTrade}
        onTradeUpdate={refreshAllTrades}
      />

      {/* Evaluation Dialog */}
      <EvaluationDialog
        isOpen={showEvaluationDialog}
        onClose={() => setShowEvaluationDialog(false)}
        tradeData={selectedTrade}
        onTradeUpdate={(tradeRequestId) => updateFinalizationTrade(tradeRequestId)}
      />

    </div>
  );
}