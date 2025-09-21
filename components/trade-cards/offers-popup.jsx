"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { StarIcon } from "../icons/star-icon";

export default function OffersPopup({ isOpen, onClose, service, trade }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showMainPopup, setShowMainPopup] = useState(isOpen);
  const [offers, setOffers] = useState([]); 

  useEffect(() => {
    setShowMainPopup(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Primary: use data passed from parent
    if (trade?.interested_users?.length) {
      // Transform the interested_users data to match the expected format
      const transformedOffers = trade.interested_users.map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        rating: user.rating?.toFixed(1) || "0.0",
        reviews: user.rating_count?.toString() || "0",
        level: user.level?.toString() || "1",
        needs: service, // What they're responding to (the service you posted)
        offers: "Skills & Services", // Generic for now - you can enhance this later
        until: trade.until,
        isBestPick: user.level > 15 && user.rating > 4.5 // Example criteria
      }));
      
      // Sort so best picks come first
      transformedOffers.sort((a, b) => {
        if (a.isBestPick && !b.isBestPick) return -1;
        if (!a.isBestPick && b.isBestPick) return 1;
        return 0;
      });
      
      setOffers(transformedOffers);
      return;
    }

    // Optional lazy load (requires the URL you added in urls.py)
    if (trade?.tradereq_id) {
      (async () => {
        try {
          const resp = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${trade.tradereq_id}/interests/`
          );
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const data = await resp.json();
          setOffers(data.interests || []);
        } catch (e) {
          console.error('Error fetching trade interests:', e);
          setOffers([]); // fail silent
        }
      })();
    } else {
      // No trade data, clear offers
      setOffers([]);
    }
  }, [isOpen, trade, service]);

  if (!isOpen && !showConfirmModal && !showSuccessModal) return null;

  const handleAcceptOffer = async (offer) => {
    setSelectedOffer(offer);
    setShowMainPopup(false);
    setTimeout(() => {
      setShowConfirmModal(true);
    }, 100);
  };

  const handleDeclineOffer = async (offer) => {
    console.log('Declining offer from:', offer.name);
    // You might want to remove the offer from the list or update its status
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {showMainPopup && (
        <>
          <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
          <div 
            className="relative w-[743px] flex flex-col items-center justify-center p-[50px_25px] gap-10 bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50"
          >
            {/* Close button */}
            <button 
              className="absolute top-8 right-8 text-white hover:text-gray-300 cursor-pointer"
              onClick={onClose}
            >
              <X className="w-[15px] h-[15px]" />
            </button>
            
            <div className="flex flex-col items-center justify-center gap-[25px] w-[622px]">
              {/* Title */}
              <h2 className="font-bold text-[25px] text-center text-white">
                Offers you received for {service}
              </h2>
              
              {/* Best Pick Label */}
              {offers.some(offer => offer.isBestPick) && (
                <div className="flex items-center gap-[10px] self-start">
                  <span className="font-bold text-[16px] text-white">Best Pick</span>
                  <StarIcon className="w-[19px] h-[19px]" />
                </div>
              )}
              
              {/* No offers message */}
              {offers.length === 0 && (
                <div className="text-white/60 text-center">
                  No one has expressed interest in this trade yet.
                </div>
              )}
              
              {/* Offers List */}
              <div className="flex flex-col gap-[25px] w-full max-h-[400px] overflow-y-auto">
                {offers.map((offer) => (
                  <div 
                    key={offer.id}
                    className="w-full p-[25px] flex flex-col gap-[15px] rounded-[20px]"
                    style={{
                      background: "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                      boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)"
                    }}
                  >
                    <div className="flex justify-between items-start w-full">
                      {/* User Info */}
                      <div className="flex items-start gap-[10px]">
                        <div className="w-[25px] h-[25px] rounded-full bg-gray-400"></div> 
                        <div className="flex flex-col items-start gap-[5px]">
                          <span className="text-[16px] text-white">{offer.name}</span>
                          <div className="flex items-center gap-[15px]">
                            <div className="flex items-center gap-[5px]">
                              <Icon icon="lucide:star" className="w-4 h-4 text-[#906EFF] fill-current flex-shrink-0" />
                              <span className="text-[13px] font-bold text-white">{offer.rating} ({offer.reviews})</span>
                            </div>
                            <div className="flex items-center gap-[5px]">
                              <div className="w-3 h-3 rounded-[5px] bg-[#933BFF]"></div>
                              <span className="text-[13px] text-white">LVL {offer.level}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Best Pick Badge */}
                      {offer.isBestPick && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#906EFF]/20 border border-[#906EFF] rounded-full">
                          <StarIcon className="w-3 h-3" />
                          <span className="text-xs text-white">Best Pick</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Interested in section */}
                    <div className="flex justify-center">
                      <div className="flex flex-col items-center gap-[10px]">
                        <span className="text-[13px] text-white">Interested in</span>
                        <div className="px-[15px] py-[7px] bg-[rgba(40,76,204,0.2)] border-[1.5px] border-[#0038FF] rounded-[15px]">
                          <span className="text-[13px] text-white">{offer.needs}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Date and Buttons */}
                    <div className="flex flex-col gap-[15px]">
                      <div className="flex justify-end">
                        <span className="text-[13px] text-white/60">until {offer.until}</span>
                      </div>
                      <div className="flex gap-[15px]">
                        <button 
                          className="w-[120px] h-[30px] flex justify-center items-center border-2 border-[#0038FF] text-[#0038FF] rounded-[10px] hover:bg-[#0038FF]/10 transition-colors cursor-pointer"
                          onClick={() => handleDeclineOffer(offer)}
                        >
                          <span className="text-[13px]">Decline</span>
                        </button>
                        <button 
                          className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] text-white rounded-[10px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
                          onClick={() => handleAcceptOffer(offer)}
                        >
                          <span className="text-[13px]">Accept</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Disclaimer */}
              <p className="text-[13px] text-white/60 text-center mt-[15px]">
                Disclaimer: Please exercise caution when proceeding with trades with other users. Expair is not liable for any losses arising from this trade. All trades are handled solely by its users and it is the user's discretion.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmModal(false)}></div>
          <div className="relative w-[600px] h-[220px] flex flex-col items-center justify-center bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#284CCC] backdrop-blur-[40px] rounded-[15px] z-[60]">
            <button 
              className="absolute top-7 right-7 text-white hover:text-gray-300 cursor-pointer"
              onClick={() => setShowConfirmModal(false)}
            >
              <X className="w-[15px] h-[15px]" />
            </button>
            
            <div className="flex flex-col items-center gap-[25px] w-[450px]">
              <h2 className="font-bold text-[22px] text-center text-white">
                Are you sure you want to accept this trade?
              </h2>
              
              <div className="flex flex-row gap-[25px]">
                <button 
                  className="w-[160px] h-[40px] flex justify-center items-center border-2 border-[#0038FF] text-[#0038FF] rounded-[15px] hover:bg-[#0038FF]/10 transition-colors cursor-pointer shadow-[0px_0px_15px_#284CCC]"
                  onClick={() => setShowConfirmModal(false)}
                >
                  <span className="text-[16px]">Cancel</span>
                </button>
                <button 
                  className="w-[168px] h-[40px] flex justify-center items-center bg-[#0038FF] text-white rounded-[15px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setTimeout(() => {
                      setShowSuccessModal(true);
                    }, 100);
                  }}
                >
                  <span className="text-[16px]">Confirm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSuccessModal(false)}></div>
          <div className="relative w-[600px] h-[220px] flex flex-col items-center justify-center bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-[60]">
            <button 
              className="absolute top-7 right-7 text-white hover:text-gray-300 cursor-pointer"
              onClick={() => setShowSuccessModal(false)}
            >
              <X className="w-[15px] h-[15px]" />
            </button>
            
            <div className="flex flex-col items-center gap-[25px] w-[450px]">
              <h2 className="font-bold text-[22px] text-center text-white">
                Success! Added to your trades for finalization.
              </h2>
              
              <button 
                className="w-[168px] h-[40px] flex justify-center items-center bg-[#0038FF] text-white rounded-[15px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
                onClick={() => {
                  setShowSuccessModal(false);
                  onClose(); // Close the entire popup
                  window.location.reload(); // Refresh to show updated trades
                }}
              >
                <span className="text-[16px]">Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}