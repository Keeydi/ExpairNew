"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  
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

  // State for real data
  const [activeTrades, setActiveTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ACTIVE trades from backend
  useEffect(() => {
    let isMounted = true;

    const fetchActiveTrades = async () => {
      const token = session?.access || session?.accessToken;
      if (!token) {
        console.log("No session access token available");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/home/active-trades/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Active trades data:", data);
          
          if (!isMounted) return;
          
          const transformedTrades = await Promise.all(
          data.home_active_trades.map(async (trade) => {
            try {
              // Fetch comprehensive proof status
              const proofStatusResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/home/trade-proof-status/${trade.tradereq_id}/`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              const tradeDetailsResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-details/${trade.tradereq_id}/`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
                        
              let proofStatus = {
                current_user_submitted: false,
                partner_submitted: false,
                both_submitted: false,
                current_user_approved: false,
                partner_approved: false,
                both_approved: false,
                current_user_is_requester: trade.is_requester,
                status: "waiting_for_proofs"
              };

              let tradeDetails = null;
              
              if (proofStatusResponse.ok) {
                proofStatus = await proofStatusResponse.json();
              }

              console.log(`=== TRADE DETAILS DEBUG FOR TRADE ${trade.tradereq_id} ===`);
              console.log('Trade details response status:', tradeDetailsResponse.status);
              console.log('Trade details response ok:', tradeDetailsResponse.ok);
              
              if (tradeDetailsResponse.ok) {
                try {
                  const detailsData = await tradeDetailsResponse.json();
                  console.log('Full trade details response:', detailsData);
                  console.log('Session user ID:', session.user.id);
                  console.log('Available details array:', detailsData.details);
                  
                  if (detailsData.details && Array.isArray(detailsData.details)) {
                    console.log('Details array length:', detailsData.details.length);
                    detailsData.details.forEach((detail, index) => {
                      console.log(`Detail ${index}:`, {
                        user_id: detail.user_id,
                        user_name: detail.user_name,
                        skillprof: detail.skillprof,
                        modedel: detail.modedel,
                        reqtype: detail.reqtype,
                        reqbio: detail.reqbio
                      });
                    });
                    
                    // Find current user's trade detail
                    tradeDetails = detailsData.details.find(detail => detail.user_id === session.user.id);
                    console.log('Found current user trade details:', tradeDetails);
                    
                    // If current user details not found, maybe use partner's details for display
                    if (!tradeDetails && detailsData.details.length > 0) {
                      console.log('Current user details not found, using first available details');
                      tradeDetails = detailsData.details[0];
                    }
                  } else {
                    console.log('Details is not an array or is missing:', detailsData.details);
                  }
                } catch (jsonError) {
                  console.log('Failed to parse trade details JSON:', jsonError);
                }
              } else {
                console.log('Trade details response failed with status:', tradeDetailsResponse.status);
                try {
                  const errorText = await tradeDetailsResponse.text();
                  console.log('Error response:', errorText);
                } catch (textError) {
                  console.log('Could not read error response:', textError);
                }
              }  

              
              return {
                id: trade.tradereq_id,
                tradereq_id: trade.tradereq_id,
                firstname: trade.other_user.name.split(' ')[0] || trade.other_user.name,
                lastname: trade.other_user.name.split(' ').slice(1).join(' ') || '',
                username: trade.other_user.username,
                avatar: trade.other_user.profilePic || "/defaultavatar.png",
                rating: trade.other_user.rating.toFixed(1),
                reviews: "0",
                level: trade.other_user.level.toString(),
                requested: trade.is_requester ? trade.reqname : trade.offering,
                offering: trade.is_requester ? trade.offering : trade.reqname, 
                location: "Online",
                deadline: trade.deadline_formatted,
                xp: `${trade.total_xp} XP`,
                
                // Updated description to use actual trade bio instead of generic text
                description: tradeDetails?.reqbio || `Trade request: ${trade.reqname}`,
                
                status: "active",
                is_requester: trade.is_requester,
                
                // Store the actual trade detail values instead of null
                skillProficiency: tradeDetails?.skillprof || null,
                modeOfDelivery: tradeDetails?.modedel || null, 
                requestType: tradeDetails?.reqtype || null,
                requestBio: tradeDetails?.reqbio || `Trade request: ${trade.reqname}`,
                contextPic: tradeDetails?.contextpic || null,
                
                // Updated proof tracking
                myProofSubmitted: proofStatus.current_user_submitted,
                partnerProofSubmitted: proofStatus.partner_submitted,
                partnerHasProof: proofStatus.partner_submitted,
                
                // Approval tracking
                myProofApproved: proofStatus.current_user_approved,
                partnerProofApproved: proofStatus.partner_approved,
                bothProofsApproved: proofStatus.both_approved,
                
                // Overall status for UI decisions
                proofWorkflowStatus: proofStatus.status,
                
                // Rating availability - more flexible logic
                canRate: proofStatus.both_approved || proofStatus.status === "ready_to_rate",
                
                traderId: `${trade.other_user.name.toLowerCase().replace(' ', '_')}_${trade.other_user.id}`
              };
            } catch (error) {
              console.error(`Error processing trade ${trade.tradereq_id}:`, error);
              return null;
            }
          })
        );

          
          // Filter out failed trades
          const validTrades = transformedTrades.filter(trade => trade !== null);
          
          if (isMounted) {
            setActiveTrades(validTrades);
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching active trades:', error);
        if (isMounted) {
          setError('Failed to load active trades');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchActiveTrades();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const getTradeDetailTags = (trade) => {
  const tags = [];
  
  console.log(`Getting tags for trade ${trade.id}:`, {
    skillProficiency: trade.skillProficiency,
    modeOfDelivery: trade.modeOfDelivery,
    requestType: trade.requestType
  });
  
  // Skill Proficiency
  if (trade.skillProficiency) {
    const skillMap = {
      'BEGINNER': 'Beginner Level',
      'INTERMEDIATE': 'Intermediate Level', 
      'ADVANCED': 'Advanced Level',
      'CERTIFIED': 'Certified'
    };
    const skillTag = skillMap[trade.skillProficiency] || trade.skillProficiency;
    tags.push(skillTag);
    console.log(`Added skill tag: ${skillTag}`);
  }
  
  // Mode of Delivery
  if (trade.modeOfDelivery) {
    const deliveryMap = {
      'ONLINE': 'Online',
      'ONSITE': 'Onsite',
      'HYBRID': 'Hybrid'
    };
    const deliveryTag = deliveryMap[trade.modeOfDelivery] || trade.modeOfDelivery;
    tags.push(deliveryTag);
    console.log(`Added delivery tag: ${deliveryTag}`);
  }
  
  // Request Type
  if (trade.requestType) {
    const typeMap = {
      'SERVICE': 'Service',
      'OUTPUT': 'Output',
      'PROJECT': 'Project'
    };
    const typeTag = typeMap[trade.requestType] || trade.requestType;
    tags.push(typeTag);
    console.log(`Added type tag: ${typeTag}`);
  }
  
  // Debug: Log final tags
  console.log(`Final tags for trade ${trade.id}:`, tags);
  
  // Only show fallback tags if no actual trade details were found
  if (tags.length === 0) {
    console.log(`No trade details found for trade ${trade.id}, using fallback tags`);
    tags.push("Active Trade", "In Progress", "Proof Required");
  }
  
  return tags;
};


  const toggleCardExpand = (id) => {
    if (expandedCardId === id) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(id);
    }
  };

  const handleProofSubmission = async (files) => {
    if (!selectedTrade || !files.length) return;
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      files.forEach(fileData => {
        formData.append('proof_files', fileData.file);
      });
      formData.append('trade_request_id', selectedTrade.tradereq_id);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-proof/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access}`,
        },
        body: formData
      });
      
      if (response.ok) {
        // Update local state to reflect proof submission
        setActiveTrades(prevTrades => 
          prevTrades.map(trade => 
            trade.id === selectedTrade.id 
              ? { ...trade, myProofSubmitted: true }
              : trade
          )
        );
        
        setShowUploadDialog(false);
        console.log("Proof submitted successfully");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit proof");
      }
    } catch (error) {
      console.error("Error submitting proof:", error);
      alert("Failed to submit proof. Please try again.");
    }
  };

  const handleTradeRating = async (ratingData) => {
    if (!selectedTrade) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-rating/submit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trade_request_id: selectedTrade.tradereq_id,
          rating: ratingData.rating,
          review_description: ratingData.feedback
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Rating submitted successfully:", result);
        
        // Award XP immediately after rating
        try {
          const xpResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-xp/award/${selectedTrade.tradereq_id}/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (xpResponse.ok) {
            const xpResult = await xpResponse.json();
            console.log("XP awarded:", xpResult);
          }
        } catch (xpError) {
          console.error("Error awarding XP:", xpError);
        }
        
        // Remove trade from local state immediately (user has rated)
        setActiveTrades(prevTrades => 
          prevTrades.filter(trade => trade.id !== selectedTrade.id)
        );
        
        setShowSuccessDialog(false);
        
        // Show success message
        const message = result.both_users_rated ? 
          "Trade completed! Both users have rated each other." :
          "Rating submitted! Trade will be removed from your active trades.";
        
        alert(message);
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    }
  };

  const handleViewPartnerProof = async (trade) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-proof/${trade.tradereq_id}/partner/`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const partnerProofData = await response.json();
        setSelectedTrade({
          ...trade,
          partnerProofData: partnerProofData,
          proofFile: {
            name: partnerProofData.proof_file.name,
            url: partnerProofData.proof_file.url,
            isImage: partnerProofData.proof_file.is_image
          }
        });
        setShowViewProofDialog(true);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to load partner's proof");
      }
    } catch (error) {
      console.error("Error fetching partner proof:", error);
      alert("Failed to load partner's proof");
    }
  };

  const handleApproveProof = async () => {
    if (!selectedTrade) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-proof/${selectedTrade.tradereq_id}/approve/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const approvalData = await response.json();
        console.log("Approval response:", approvalData); // Debug log
        
        setShowViewProofDialog(false);
        
        // Update local state with more comprehensive data
        setActiveTrades(prevTrades => 
          prevTrades.map(trade => 
            trade.id === selectedTrade.id 
              ? { 
                  ...trade, 
                  myProofApproved: true,
                  partnerProofApproved: true,
                  bothProofsApproved: approvalData.both_approved || approvalData.trade_completed || false,
                  canRate: approvalData.both_approved || approvalData.trade_completed || false,
                  proofWorkflowStatus: (approvalData.both_approved || approvalData.trade_completed) ? "ready_to_rate" : "waiting_for_approval"
                }
              : trade
          )
        );
        
        // If both approved, show success dialog but don't reload immediately
        if (approvalData.both_approved || approvalData.trade_completed) {
          console.log("Both proofs approved, showing success dialog"); // Debug log
          setShowSuccessDialog(true);
        }
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve proof");
      }
    } catch (error) {
      console.error("Error approving proof:", error);
      alert("Failed to approve proof. Please try again.");
    }
  };

  const handleRejectProof = async () => {
    if (!selectedTrade) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-proof/${selectedTrade.tradereq_id}/reject/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        setShowViewProofDialog(false);
        
        // Show immediate feedback
        alert(`${selectedTrade.firstname} will be notified to resubmit their proof.`);
        
        setActiveTrades(prevTrades => 
          prevTrades.map(trade => 
            trade.id === selectedTrade.id 
              ? { 
                  ...trade, 
                  partnerProofSubmitted: false, // Partner needs to resubmit
                  partnerHasProof: false,
                  myProofApproved: false,
                  partnerProofApproved: false,
                  bothProofsApproved: false,
                  canRate: false
                }
              : trade
          )
        );      
      
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject proof");
      }
    } catch (error) {
      console.error("Error rejecting proof:", error);
      alert("Failed to reject proof. Please try again.");
    }
  };

  const getProofButtonState = (trade) => {
    console.log(`Trade ${trade.id} proof status:`, {
      mySubmitted: trade.myProofSubmitted,
      partnerSubmitted: trade.partnerProofSubmitted,
      myApproved: trade.myProofApproved,
      partnerApproved: trade.partnerProofApproved,
      bothApproved: trade.bothProofsApproved,
      workflowStatus: trade.proofWorkflowStatus
    });

    if (!trade.myProofSubmitted) {
      return {
        text: "Your Proof",
        disabled: false,
        onClick: () => {
          setSelectedTrade(trade);
          setShowUploadDialog(true);
        }
      };
    }
     
    if (trade.proofWorkflowStatus === "waiting_for_approval") {
      return {
        text: "Waiting for approval",
        disabled: true,
        onClick: () => {
          setSelectedTrade(trade);
          setShowUploadDialog(true);
        }
      };
    }

    return {
      text: "View Your Proof",
      disabled: false,
      onClick: () => {
        setSelectedTrade(trade);
        // For viewing own proof, we'll use the same dialog but in view mode
        setShowUploadDialog(true);
      }
    };
  };

  const getPartnerProofButtonState = (trade) => {
    if (!trade.myProofSubmitted) {
      return {
        text: `${trade.firstname}'s Proof`,
        disabled: true,
        onClick: null
      };
    }
      
    if (!trade.partnerHasProof) {
      return {
        text: `Waiting for ${trade.firstname}`,
        disabled: true,
        onClick: null
      };
    }
      
    if (trade.partnerProofApproved) {
      return {
        text: `${trade.firstname}'s Proof ✓`,
        disabled: false,
        onClick: () => handleViewPartnerProof(trade)
      };
    }

    return {
      text: `${trade.firstname}'s Proof`,
      disabled: false,
      onClick: () => handleViewPartnerProof(trade)
    };
  };

  const shouldShowRateButton = (trade) => {
    console.log(`Rate button check for trade ${trade.id}:`, {
      bothProofsApproved: trade.bothProofsApproved,
      canRate: trade.canRate,
      proofWorkflowStatus: trade.proofWorkflowStatus,
      showRateButton: trade.bothProofsApproved || trade.proofWorkflowStatus === "ready_to_rate"
    });
    
    return trade.bothProofsApproved || trade.proofWorkflowStatus === "ready_to_rate";
  };

  const getTradeStatusText = (trade) => {
    if (trade.bothProofsApproved) {
      return "Ready to rate";
    }
    
    switch (trade.proofWorkflowStatus) {
      case "waiting_for_proofs":
        if (!trade.myProofSubmitted && !trade.partnerProofSubmitted) {
          return "No one has submitted their proof of trade yet.";
        } else if (!trade.myProofSubmitted) {
          return "Submit your proof";
        } else {
          return `Waiting for ${trade.firstname}'s proof`;
        }
      
      case "waiting_for_your_proof":
        return "Submit your proof";
      
      case "waiting_for_partner_proof":
        return `Waiting for ${trade.firstname}'s proof`;
      
      case "waiting_for_approval":
        return "Waiting for proof approval";
      
      case "ready_to_rate":
        return "Ready to rate";
      
      default:
        return "In progress";
    }
  };

  if (loading) {
    return (
      <div className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading active trades...</div>
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
        <h1 className="text-[25px] font-semibold">Active trades</h1>

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
      {activeTrades.length === 0 ? (
        <div className="text-white/60 text-center py-8">
          No active trades yet.
        </div>
      ) : (
        <div className="flex flex-col gap-[25px]">
          {activeTrades.map((trade) => {
            const proofButtonState = getProofButtonState(trade);
            const partnerProofButtonState = getPartnerProofButtonState(trade);
            const showRateButton = shouldShowRateButton(trade);
            
            return (
              <div
                key={trade.id}
                className={`w-[945px] rounded-[20px] border-[3px] border-[#284CCC]/80 transition-all duration-300 hover:scale-[1.01] overflow-hidden`}
                style={{
                  background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                  boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
                }}
              >
                {/* Status Badge */}
                <div className="flex justify-center mt-4 mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    trade.bothProofsApproved 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : trade.proofWorkflowStatus === "waiting_for_approval"
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {getTradeStatusText(trade)}
                  </div>
                </div>

                {expandedCardId === trade.id ? (
                  // Expanded View
                  <div>
                    {/* Header */}
                    <div className="p-[25px] pb-[15px] flex justify-between items-start">
                      <div className="flex items-start gap-[10px]">
                        {/* Clickable Profile Picture */}
                        {trade.username ? (
                          <Link href={`/home/profile/${trade.username}`} className="flex-shrink-0">
                            <div className="w-[25px] h-[25px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#284CCC] transition-all">
                              <Image
                                src={trade.avatar}
                                alt="Avatar"
                                width={25}
                                height={25}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                              />
                            </div>
                          </Link>
                        ) : (
                          <div className="w-[25px] h-[25px] rounded-full overflow-hidden">
                            <Image
                              src={trade.avatar}
                              alt="Avatar"
                              width={25}
                              height={25}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                            />
                          </div>
                        )}
                        
                        <div>
                          {/* Clickable Name */}
                          {trade.username ? (
                            <Link href={`/home/profile/${trade.username}`} className="hover:text-[#284CCC] transition-colors">
                              <span>{trade.firstname} {trade.lastname}</span>
                            </Link>
                          ) : (
                            <span className="text-[16px] font-normal text-white">
                              {trade.firstname} {trade.lastname}
                            </span>
                          )}
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
                              <Icon icon="lucide:alert-circle" className="text-white text-base" />
                              Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Context Image - Only show if contextPic exists */}
                    {trade.contextPic && (
                      <div className="px-[25px] pb-[20px]">
                        <div className="w-full h-[321px] rounded-[15px] overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)]">
                          <Image
                            src={trade.contextPic}
                            alt="Trade Context"
                            width={900}
                            height={300}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Trade Details */}
                    <div className="px-[25px] pb-[20px]">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px] inline-block">
                            <span className="text-[16px] text-white">
                              {trade.requested}
                            </span>
                          </div>
                        </div>
                        <span className="text-[16px] font-semibold text-[#906EFF]">
                          {trade.xp}
                        </span>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon icon="lucide:map-pin" className="w-4 h-4 text-[rgba(255,255,255,0.60)]" />
                            <span className="text-[13px] text-[rgba(255,255,255,0.60)]">{trade.location}</span>
                          </div>
                          <span className="text-[13px] font-normal text-[rgba(255,255,255,0.60)]">Due on {trade.deadline}</span>
                        </div>

                        <div className="flex flex-wrap gap-[15px]">
                          {getTradeDetailTags(trade).map((tag, index) => (
                            <div
                              key={index}
                              className="px-[15px] py-[4px] border-[2px] border-white rounded-[15px]"
                            >
                              <span className="text-[13px] font-normal text-white">{tag}</span>
                            </div>
                          ))}
                        </div>

                        <div>
                          <div className="px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px] inline-block">
                            <span className="text-[16px] text-white">In exchange for {trade.offering}</span>
                          </div>
                        </div>

                        <p className="text-[13px] text-[rgba(255,255,255,0.60)]">{trade.requestBio}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-[25px] pb-[25px] flex flex-wrap justify-between">
                      <button 
                        className="flex items-center justify-center"
                        onClick={() => toggleCardExpand(trade.id)}
                      >
                        <Icon icon="lucide:chevron-up" className="w-[30px] h-[30px] text-white"/>
                      </button>
                      
                      <div className="flex items-center gap-[15px]">
                        {showRateButton ? (
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
                        {/* Clickable Profile Picture */}
                        {trade.username ? (
                          <Link href={`/home/profile/${trade.username}`} className="flex-shrink-0">
                            <div className="w-[25px] h-[25px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#284CCC] transition-all">
                              <Image
                                src={trade.avatar}
                                alt="Avatar"
                                width={25}
                                height={25}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                              />
                            </div>
                          </Link>
                        ) : (
                          <div className="w-[25px] h-[25px] rounded-full overflow-hidden">
                            <Image
                              src={trade.avatar}
                              alt="Avatar"
                              width={25}
                              height={25}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = '/assets/defaultavatar.png'; }}
                            />
                          </div>
                        )}
                        
                        {/* Clickable Name */}
                        {trade.username ? (
                          <Link href={`/home/profile/${trade.username}`} className="hover:text-[#284CCC] transition-colors">
                            <span>
                              {trade.firstname} {trade.lastname}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-[16px] font-normal text-white">
                            {trade.firstname} {trade.lastname}
                          </span>
                        )}
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
                              <Icon icon="lucide:alert-circle" className="text-white text-base" />
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
                          <div className="px-[10px] py-[5px] bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px]">
                            <span className="text-[15px] text-white">{trade.offering}</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[16px] font-semibold text-[#906EFF]">{trade.xp}</span>
                    </div>

                    {/* Bottom Row - Location and Due Date */}
                    <div className="flex justify-between items-center w-full opacity-60">
                      <div className="flex items-center gap-[5px]">
                        <Icon icon="lucide:map-pin" className="w-4 h-4 text-[rgba(255,255,255,0.60)]" />
                        <span className="text-[13px] font-normal text-[rgba(255,255,255,0.60)]">{trade.location}</span>
                      </div>
                      <span className="text-[13px] font-normal text-white/60">Due on {trade.deadline}</span>
                    </div>

                    {/* Chevron Down + Action Buttons */}
                    <div className="relative w-full mt-4">
                      <div className="absolute bottom-0 left-0">
                        <Icon
                          icon="lucide:chevron-down"
                          className="w-[30px] h-[30px] text-white cursor-pointer"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-[20px] justify-end">
                        {showRateButton ? (
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
                              className="w-[190px] h-[40px] flex justify-center items-center rounded-[15px] cursor-pointer transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                proofButtonState.onClick && proofButtonState.onClick();
                              }}
                              disabled={proofButtonState.disabled}
                              style={{
                                background: proofButtonState.disabled ? "#413663" : "#0038FF",
                                boxShadow: proofButtonState.disabled ? "none" : "0px 0px 15px rgba(40, 76, 204, 0.6)",
                                opacity: proofButtonState.disabled ? 0.6 : 1,
                                cursor: proofButtonState.disabled ? "not-allowed" : "pointer"
                              }}
                            >
                              <div className="flex items-center gap-[10px]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" fill="#D9D9D9"/>
                                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" fill="#D9D9D9"/>
                                </svg>
                                <span className="text-[16px] text-white">{proofButtonState.text}</span>
                              </div>
                            </button>

                            {/* Partner Proof Button */}
                            <button
                              className="min-w-[190px] max-w-[280px] h-[40px] flex justify-center items-center rounded-[15px] transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                partnerProofButtonState.onClick && partnerProofButtonState.onClick();
                              }}
                              disabled={partnerProofButtonState.disabled}
                              style={{
                                background: partnerProofButtonState.disabled ? "#413663" : "#0038FF",
                                boxShadow: partnerProofButtonState.disabled ? "none" : "0px 0px 15px rgba(40, 76, 204, 0.6)",
                                opacity: partnerProofButtonState.disabled ? 0.6 : 1,
                                cursor: partnerProofButtonState.disabled ? "not-allowed" : "pointer"
                              }}
                            >
                              <div className="flex items-center gap-[10px] px-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 21C4.45 21 3.97933 20.8043 3.588 20.413C3.19667 20.0217 3.00067 19.5507 3 19V5C3 4.45 3.196 3.97933 3.588 3.588C3.98 3.19667 4.45067 3.00067 5 3H19C19.55 3 20.021 3.196 20.413 3.588C20.805 3.98 21.0007 3.45067 21 5V19C21 19.55 20.8043 20.021 20.413 20.413C20.0217 20.805 19.5507 21.0007 19 21H5ZM6 17H18L14.25 12L11.25 16L9 13L6 17Z" fill="white"/></svg>
                                <span className="text-[16px] text-white truncate">{partnerProofButtonState.text}</span>
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
                            <StarEvaluateIcon size="70" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Proof Dialog */}
      {showUploadDialog && (
        <UploadProofDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onSubmit={handleProofSubmission}
          title={selectedTrade?.myProofSubmitted ? "View Your Proof" : "Your proof"}
          mode={selectedTrade?.myProofSubmitted ? "view" : "upload"}
          tradereq_id={selectedTrade?.tradereq_id}
        />
      )}

      {/* View Proof Dialog */}
      {showViewProofDialog && (
        <ViewProofDialog
          isOpen={showViewProofDialog}
          onClose={() => {
            setShowViewProofDialog(false);
          }}
          onApprove={handleApproveProof}
          onReject={handleRejectProof}
          trade={selectedTrade}
        />
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <SuccessDialog
          isOpen={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          trade={selectedTrade}
          onRatingSubmit={handleTradeRating}
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