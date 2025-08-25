"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { StarIcon } from "../icons/star-icon";
import XpGainedDialog from "./xp-gained-dialog";

export default function SuccessDialog({ isOpen, onClose, trade }) {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(3);
  const [showRating, setShowRating] = useState(false);
  const [showXpGained, setShowXpGained] = useState(false);
  
  const maxChars = 500;

  if (!isOpen) return null;

  // Create array of 5 stars
  const stars = Array(5).fill(0);

  const handleSubmit = () => {
    // Here you would submit the feedback and show the rating phase
    console.log("Submitting feedback:", feedback);
    setShowRating(true);
  };

  const handleContinue = () => {
    // Show XP gained dialog
    setShowRating(false);
    setShowXpGained(true);
  };

  const handleXpGainedClose = () => {
    // Final step - close all dialogs
    setShowXpGained(false);
    onClose();
  };

  return (
    <>
      {showXpGained ? (
        <XpGainedDialog 
          isOpen={showXpGained}
          onClose={handleXpGainedClose}
          xpGained={trade?.xp?.replace(" XP", "") || 250}
        />
      ) : (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          {!showRating ? (
            // First phase - Feedback dialog
            <div 
              className="w-[618px] flex flex-col items-center justify-center p-[50px] relative"
              style={{
                background: "rgba(0, 0, 0, 0.05)",
                border: "2px solid #0038FF",
                boxShadow: "0px 4px 15px #D78DE5",
                backdropFilter: "blur(30px)",
                borderRadius: "15px"
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-[30px] right-[30px] text-white hover:text-gray-300"
              >
                <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
              </button>

              <div className="flex flex-col items-center gap-[30px] w-full">
                {/* Success Icon */}
                <div className="w-[70px] h-[70px] rounded-full bg-[#0038FF] flex items-center justify-center">
                  <Icon icon="lucide:check" className="w-[40px] h-[40px] text-white" />
                </div>
                
                {/* Title */}
                <h2 className="text-[25px] font-bold text-white text-center">
                  Successful trade!
                </h2>
                
                {/* Trade Details */}
                <div className="flex items-center justify-center text-white text-center max-w-[600px] overflow-hidden">
                  <div className="flex-1 text-right pr-2 overflow-hidden">
                    <span className="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {trade?.requested}
                    </span>
                  </div>
                  
                  <div className="flex-shrink-0 px-2">
                    <Icon icon="lucide:x" className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 text-left pl-2 overflow-hidden">
                    <span className="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {trade?.offering}
                    </span>
                  </div>
                </div>
                
                {/* Feedback Section */}
                <div className="w-full">
                  <p className="text-white text-center mb-4">
                    Tell us more about your experience
                  </p>
                  <div className="relative">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="How did the trade go?"
                      maxLength={maxChars}
                      className="w-full h-[120px] bg-[#120A2A] border-none rounded-[15px] text-white p-4 focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
                    />
                    <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                      {feedback.length}/{maxChars}
                    </span>
                  </div>
                </div>
                
                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  className="w-[172px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC] self-end"
                >
                  Submit
                </button>
              </div>
            </div>
          ) : (
            // Second phase - Rating dialog
            <div 
              className="w-[618px] flex flex-col items-center justify-center p-[50px] relative"
              style={{
                background: "rgba(0, 0, 0, 0.05)",
                border: "2px solid #0038FF",
                boxShadow: "0px 4px 15px #D78DE5",
                backdropFilter: "blur(30px)",
                borderRadius: "15px"
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-[30px] right-[30px] text-white hover:text-gray-300"
              >
                <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
              </button>

              <div className="flex flex-col items-center gap-[30px] w-full">
                {/* Success Icon */}
                <div className="w-[70px] h-[70px] rounded-full bg-[#0038FF] flex items-center justify-center">
                  <Icon icon="lucide:check" className="w-[40px] h-[40px] text-white" />
                </div>
                
                {/* Title */}
                <h2 className="text-[25px] font-[700] text-white text-center">
                  Successful trade!
                </h2>
                
                {/* Trade Details */}
                <div className="flex items-center justify-center text-white text-center max-w-[600px] overflow-hidden">
                  <div className="flex-1 text-right pr-2 overflow-hidden">
                    <span className="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {trade?.requested}
                    </span>
                  </div>
                  
                  <div className="flex-shrink-0 px-2">
                    <Icon icon="lucide:x" className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 text-left pl-2 overflow-hidden">
                    <span className="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {trade?.offering}
                    </span>
                  </div>
                </div>
                
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-4">
                    {stars.map((_, index) => (
                      <div 
                        key={index} 
                        onClick={() => setRating(index + 1)}
                        className="transform transition-transform"
                      >
                        {index < rating ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                          <path d="M15.0342 1.25C15.2181 1.25 15.4065 1.34581 15.5771 1.49707H15.5781C15.7439 1.64702 15.8833 1.83433 15.9844 2.04883V2.0498C15.9876 2.0566 15.9905 2.06374 15.9932 2.07129L15.9941 2.07422L18.5918 9.45898L18.8857 10.2939H27.7764C27.9619 10.2941 28.1516 10.3921 28.3184 10.543L28.3193 10.5439C28.4849 10.6936 28.6245 10.8797 28.7256 11.0938L28.7275 11.0986C28.7415 11.1281 28.75 11.1638 28.75 11.2021C28.7499 11.5967 28.5701 12.004 28.417 12.3184L28.4072 12.3379L28.3828 12.3896C28.3702 12.4161 28.3548 12.4352 28.3408 12.4473L21.8223 17.9902L21.2061 18.5146L21.4326 19.293L23.7236 27.1494L23.7363 27.1953L23.7539 27.2402C23.8423 27.4749 23.8486 27.7384 23.7705 27.9785L23.7686 27.9834C23.6966 28.2079 23.5631 28.4055 23.3975 28.5186L23.3438 28.5557L23.293 28.5986C23.1186 28.7466 22.9458 28.7509 22.8135 28.75H22.752C22.6727 28.7505 22.6018 28.749 22.5176 28.7275C22.4399 28.7077 22.3457 28.6691 22.2461 28.5771L22.2051 28.5391L22.1602 28.5049L15.958 23.7363L15.2051 23.1582L14.4463 23.7275L8.0166 28.5527L8.01465 28.5547C8.00979 28.5583 8.00513 28.5613 8.00098 28.5635L7.99414 28.5664L7.98828 28.5703C7.82105 28.6611 7.6393 28.706 7.45801 28.7061C7.2767 28.7061 7.09499 28.661 6.92773 28.5703L6.91602 28.5645L6.8418 28.5186C6.67376 28.4014 6.54255 28.208 6.47266 27.9883H6.47363C6.40268 27.7639 6.39117 27.4995 6.47559 27.2715L6.5 27.2051L6.5166 27.1367L8.50781 19.0928L8.69434 18.3389L8.10156 17.8379L1.80957 12.5166L1.75098 12.4678L1.6875 12.4258L1.625 12.3799C1.52411 12.297 1.43774 12.1822 1.37305 12.0498L1.30664 11.8838C1.22735 11.63 1.22479 11.3391 1.33887 11.1006L1.34277 11.0938C1.44336 10.8804 1.58138 10.6944 1.74609 10.5449C1.91616 10.392 2.10627 10.2941 2.29199 10.2939H11.3516L11.6348 9.4375L14.0713 2.0791L14.0723 2.07715C14.0753 2.06807 14.0792 2.05974 14.083 2.05176V2.05078C14.178 1.85049 14.3206 1.65039 14.4883 1.49902C14.6582 1.34648 14.8487 1.25 15.0342 1.25Z" fill="white" stroke="url(#paint0_linear_1277_5546)" strokeWidth="2.5"/>
                          <defs>
                            <linearGradient id="paint0_linear_1277_5546" x1="0" y1="15" x2="30" y2="15" gradientUnits="userSpaceOnUse">
                              <stop stop-color="#FB9696"/>
                              <stop offset="0.25" stop-color="#D78DE5"/>
                              <stop offset="0.5" stop-color="#7E59F8"/>
                              <stop offset="0.75" stop-color="#284CCC"/>
                              <stop offset="1" stop-color="#6DDFFF"/>
                            </linearGradient>
                          </defs>
                        </svg>
                        ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                          <path opacity="0.2" d="M15.0342 1.25C15.2181 1.25 15.4065 1.34581 15.5771 1.49707H15.5781C15.7439 1.64702 15.8833 1.83433 15.9844 2.04883V2.0498C15.9876 2.0566 15.9905 2.06374 15.9932 2.07129L15.9941 2.07422L18.5918 9.45898L18.8857 10.2939H27.7764C27.9619 10.2941 28.1516 10.3921 28.3184 10.543L28.3193 10.5439C28.4849 10.6936 28.6245 10.8797 28.7256 11.0938L28.7275 11.0986C28.7415 11.1281 28.75 11.1638 28.75 11.2021C28.7499 11.5967 28.5701 12.004 28.417 12.3184L28.4072 12.3379L28.3828 12.3896C28.3702 12.4161 28.3548 12.4352 28.3408 12.4473L21.8223 17.9902L21.2061 18.5146L21.4326 19.293L23.7236 27.1494L23.7363 27.1953L23.7539 27.2402C23.8423 27.4749 23.8486 27.7384 23.7705 27.9785L23.7686 27.9834C23.6966 28.2079 23.5631 28.4055 23.3975 28.5186L23.3438 28.5557L23.293 28.5986C23.1186 28.7466 22.9458 28.7509 22.8135 28.75H22.752C22.6727 28.7505 22.6018 28.749 22.5176 28.7275C22.4399 28.7077 22.3457 28.6691 22.2461 28.5771L22.2051 28.5391L22.1602 28.5049L15.958 23.7363L15.2051 23.1582L14.4463 23.7275L8.0166 28.5527L8.01465 28.5547C8.00979 28.5583 8.00513 28.5613 8.00098 28.5635L7.99414 28.5664L7.98828 28.5703C7.82105 28.6611 7.6393 28.706 7.45801 28.7061C7.2767 28.7061 7.09499 28.661 6.92773 28.5703L6.91602 28.5645L6.8418 28.5186C6.67376 28.4014 6.54255 28.208 6.47266 27.9883H6.47363C6.40268 27.7639 6.39117 27.4995 6.47559 27.2715L6.5 27.2051L6.5166 27.1367L8.50781 19.0928L8.69434 18.3389L8.10156 17.8379L1.80957 12.5166L1.75098 12.4678L1.6875 12.4258L1.625 12.3799C1.52411 12.297 1.43774 12.1822 1.37305 12.0498L1.30664 11.8838C1.22735 11.63 1.22479 11.3391 1.33887 11.1006L1.34277 11.0938C1.44336 10.8804 1.58138 10.6944 1.74609 10.5449C1.91616 10.392 2.10627 10.2941 2.29199 10.2939H11.3516L11.6348 9.4375L14.0713 2.0791L14.0723 2.07715C14.0753 2.06807 14.0792 2.05974 14.083 2.05176V2.05078C14.178 1.85049 14.3206 1.65039 14.4883 1.49902C14.6582 1.34648 14.8487 1.25 15.0342 1.25Z" fill="white" fillOpacity="0.4" stroke="url(#paint0_linear_1277_5550)" strokeWidth="2.5"/>
                          <defs>
                            <linearGradient id="paint0_linear_1277_5550" x1="0" y1="15" x2="30" y2="15" gradientUnits="userSpaceOnUse">
                              <stop stop-color="#FB9696"/>
                              <stop offset="0.25" stop-color="#D78DE5"/>
                              <stop offset="0.5" stop-color="#7E59F8"/>
                              <stop offset="0.75" stop-color="#284CCC"/>
                              <stop offset="1" stop-color="#6DDFFF"/>
                            </linearGradient>
                          </defs>
                        </svg>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-white gap-[5px]">
                    <p className="text-[16px] font-[400]">{rating} out of 5</p>
                    <p className="text-[16px] font-[600]">Your rating</p>
                  </div>
                  <p className="text-white/60 text-[13px] font-[400] text-center mt-2">
                    These are objective ratings generated by AI via sentiment analysis.
                  </p>
                </div>
                
                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  className="w-[172px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}