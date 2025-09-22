"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Info } from "lucide-react";
import Link from "next/link";
import TradeRequestInfo from "../../../../components/trade-cards/trade-request-info";
import WarningDialog from "../../../../components/trade-cards/warning-dialog";

const inter = Inter({ subsets: ["latin"] });

export default function AddTradeDetailsPage() {
  const [deliveryMode, setDeliveryMode] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [requestType, setRequestType] = useState("");
  const [details, setDetails] = useState("");
  const [photo, setPhoto] = useState(null);
  const [deadline, setDeadline] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [tradeData, setTradeData] = useState({ requested: "", exchange: "" });
  const [showSkillTooltip, setShowSkillTooltip] = useState(false);
  const [showRequestTooltip, setShowRequestTooltip] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get trade data from URL parameters
  useEffect(() => {
    const requested = searchParams.get('requested');
    const exchange = searchParams.get('exchange');
    
    if (requested && exchange) {
      setTradeData({
        requested: decodeURIComponent(requested),
        exchange: decodeURIComponent(exchange)
      });
    }
  }, [searchParams]);
  
  const handleDetailsChange = (e) => {
    const text = e.target.value;
    setDetails(text);
    setCharCount(text.length);
  };
  
  const handleSubmit = () => {
    setShowConfirmModal(true);
  };
  
  const handleConfirm = () => {
    setShowConfirmModal(false);
    setShowWarningModal(true);
  };

  const handleWarningConfirm = () => {
    setShowWarningModal(false);
    setShowSuccessModal(true);
  };

  const isFormValid =
  deliveryMode.trim() !== "" &&
  skillLevel.trim() !== "" &&
  requestType.trim() !== "" &&
  details.trim() !== "";

  return (
    <div className={`w-full min-h-screen text-white ${inter.className} relative overflow-x-hidden`}>
      {/* Background glows */}
      <div className="fixed w-[673px] h-[673px] left-[-611.5px] top-[-336px] bg-[#906EFF] opacity-35 blur-[200px] z-0"></div>
      <div className="fixed w-[673px] h-[673px] right-[-354px] bottom-[-454px] bg-[#0038FF] opacity-35 blur-[200px] z-0"></div>
      
      {/* Main content */}
      <div className="relative z-10 max-w-[940px] w-full mx-auto pt-[23px] md:pt-[50px] pb-[100px] px-4 md:px-6 flex flex-col items-center">
        <h1 className="text-[25px] font-semibold mb-[34px] w-full">Adding trade details</h1>

        {/* Trade Request Info */}
        {(tradeData.requested && tradeData.exchange) && (
          <TradeRequestInfo 
            requested={tradeData.requested}
            exchange={tradeData.exchange}
          />
        )}

        <div className="w-full flex flex-col md:flex-row justify-between gap-8 md:gap-[30px]">
          {/* Left column */}
          <div className="w-full md:w-[400px] flex flex-col gap-[20px]">
            {/* Delivery mode */}
            <div className="flex flex-col gap-[15px]">
              <label className="text-[16px]">Select the mode of delivery *</label>
              <div className="relative">
                <select 
                  className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[16px] appearance-none text-[16px] text-white outline-none cursor-pointer"
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value)}
                  required
                >
                  <option value="" disabled hidden className="text-[#413663]">-- select --</option>
                  <option value="onsite">Onsite</option>
                  <option value="online-sync">Online (synchronous)</option>
                  <option value="online-async">Online (asynchronous)</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <Icon 
                  icon="mingcute:down-fill" 
                  className="absolute right-[16px] top-1/2 transform -translate-y-1/2 text-white w-[24px] h-[24px]" 
                />
              </div>
            </div>
            
            {/* Skill proficiency */}
            <div className="flex flex-col gap-[15px]">
              <div className="flex items-center gap-2">
                <label className="text-[16px]">Select the skill proficiency required *</label>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowSkillTooltip(true)}
                    onMouseLeave={() => setShowSkillTooltip(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  {showSkillTooltip && (
                    <div className="absolute left-0 top-6 w-[320px] bg-[#120A2A] border border-white/20 rounded-[10px] p-3 shadow-lg z-20">
                      <div className="text-sm text-white space-y-2">
                        <div>Indicates the level of expertise required for a trade, helping users set clear expectations for skill and experience.</div>
                        <div><strong>Beginner</strong> – Just starting out and have basic knowledge of the skill.</div>
                        <div><strong>Intermediate</strong> – Comfortable with the skill and can perform it with some independence.</div>
                        <div><strong>Advanced</strong> – Highly skilled and able to perform complex tasks with expertise.</div>
                        <div><strong>Certified</strong> – Verified by uploading at least one official credential related to the skill.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <select 
                  className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[16px] appearance-none text-[16px] text-white outline-none cursor-pointer"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  required
                >
                  <option value="" disabled hidden className="text-[#413663]">-- select --</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="certified">Certified</option>
                </select>
                <Icon 
                  icon="mingcute:down-fill" 
                  className="absolute right-[16px] top-1/2 transform -translate-y-1/2 text-white w-[24px] h-[24px]" 
                />
              </div>
            </div>
            
            {/* Request type */}
            <div className="flex flex-col gap-[15px]">
              <div className="flex items-center gap-2">
                <label className="text-[16px]">Select the type of request *</label>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowRequestTooltip(true)}
                    onMouseLeave={() => setShowRequestTooltip(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  {showRequestTooltip && (
                    <div className="absolute left-0 top-6 w-[320px] bg-[#120A2A] border border-white/20 rounded-[10px] p-3 shadow-lg z-20">
                      <div className="text-sm text-white space-y-2">
                        <div>Defines the format of the trade, whether it involves time-based services, one-time outputs, or ongoing projects.</div>
                        <div><strong>Service</strong> – An action done for someone else within a period of time (e.g., tutoring, house repairs, fitness training).</div>
                        <div><strong>Output</strong> – A one-time deliverable you create or provide (e.g., logo design, video edit, custom playlist)</div>
                        <div><strong>Project</strong> – A long-term recurring collaboration. (e.g., developing a website, co-writing a film, organizing an event)</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <select 
                  className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[16px] appearance-none text-[16px] text-white outline-none cursor-pointer"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  required
                >
                  <option value="" disabled hidden className="text-[#413663]">-- select --</option>
                  <option value="service">Service</option>
                  <option value="output">Output</option>
                  <option value="project">Project</option>
                </select>
                <Icon 
                  icon="mingcute:down-fill" 
                  className="absolute right-[16px] top-1/2 transform -translate-y-1/2 text-white w-[24px] h-[24px]" 
                />
              </div>
            </div>
            
            {/* Photo upload */}
            <div className="flex flex-col gap-[15px]">
              <label className="text-[16px]">Upload a photo for context</label>
              <div className="relative">
                <input 
                  type="file" 
                  id="photo-upload" 
                  className="hidden" 
                  onChange={(e) => setPhoto(e.target.files[0])}
                />
                <label 
                  htmlFor="photo-upload" 
                  className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[16px] py-[15px] flex justify-between items-center cursor-pointer"
                >
                  <span className="text-[16px] text-[#413663]">
                    {photo ? photo.name : "Upload photo"}
                  </span>
                  <Icon 
                    icon="material-symbols:upload" 
                    className="text-white w-[24px] h-[24px]" 
                  />
                </label>
              </div>
            </div>
            
            {/* Deadline */}
            <div className="flex flex-col gap-[15px]">
              <label className="text-[16px]">Set a deadline</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[18px] py-[15px] text-[16px] text-white outline-none placeholder:text-[#413663]"
                  onFocus={(e) => {
                    e.target.type = "date";
                    e.target.showPicker();
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = "text";
                  }}
                />
                <Icon 
                  icon="mdi:calendar" 
                  className="absolute right-[16px] top-1/2 transform -translate-y-1/2 text-white w-[24px] h-[24px]" 
                />
              </div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="w-full md:w-[400px] flex flex-col gap-[20px]">
            {/* Details textarea */}
            <div className="flex flex-col gap-[20px]">
              <label className="text-[16px]">Tell us more about your request *</label>
              <div className="flex flex-col gap-[10px]">
                <textarea
                  placeholder="Example: I'm seeking a beginner-to-novice graphic designer to create visually compelling and unique designs that capture my brand's identity. It would be preferred to have experience with logo design, branding, and digital graphics. This is for my personal project and I need help with visual direction."
                  value={details}
                  onChange={handleDetailsChange}
                  maxLength={500}
                  className="w-full h-[390px] min-h-[250px] bg-[#120A2A] border border-white/40 rounded-[15px] p-[25px] text-[16px] text-white outline-none placeholder:text-[#413663] resize-none"
                  required
                />
                <div className="flex justify-end">
                  <span className="text-[16px] text-[#413663]">{charCount}/500</span>
                </div>
              </div>
            </div>
            
            {/* Confirm button */}
            <div className="flex justify-end mt-auto">
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="w-[240px] h-[50px] bg-[#0038FF] rounded-[15px] text-[20px] font-medium text-white shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmModal(false)}></div>
          <div className="relative w-[90%] max-w-[700px] h-auto min-h-[220px] flex flex-col items-center justify-center bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 px-4 md:px-[50px] py-[40px] md:py-[60px]">
            {/* Close button */}
            <button 
              className="absolute top-[20px] right-[20px] text-white hover:text-gray-300 cursor-pointer"
              onClick={() => setShowConfirmModal(false)}
            >
              <X className="w-[15px] h-[15px]" />
            </button>
            
            <h2 className="font-bold text-[20px] md:text-[22px] text-center text-white w-full max-w-[500px] mb-[20px]">
              Are the trade details correct?
            </h2>
            
            <div className="flex flex-col items-center gap-[15px] w-full max-w-[500px]">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-[25px]">
                <button 
                  className="w-full sm:w-[160px] h-[40px] flex justify-center items-center border-2 border-[#0038FF] text-[#0038FF] rounded-[15px] hover:bg-[#0038FF]/10 transition-colors cursor-pointer shadow-[0px_0px_15px_#284CCC]"
                  onClick={() => setShowConfirmModal(false)}
                >
                  <span className="text-[16px]">Cancel</span>
                </button>
                <button 
                  className="w-full sm:w-[168px] h-[40px] flex justify-center items-center bg-[#0038FF] text-white rounded-[15px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
                  onClick={handleConfirm}
                >
                  <span className="text-[16px]">Confirm</span>
                </button>
              </div>
              
              <p className="text-[13px] text-white/60 text-center">
                Please review the trade details carefully. Once confirmed, changes will no longer be allowed.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Warning Modal */}
      <WarningDialog 
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleWarningConfirm}
      />
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative w-[90%] max-w-[700px] h-auto min-h-[220px] flex flex-col items-center justify-center bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 px-4 md:px-[50px] py-[40px] md:py-[60px]">
            {/* Close button */}
            <button 
              className="absolute top-[20px] right-[20px] text-white hover:text-gray-300 cursor-pointer"
              onClick={() => setShowSuccessModal(false)}
            >
              <X className="w-[15px] h-[15px]" />
            </button>
            
            <h2 className="font-bold text-[20px] md:text-[22px] text-center text-white mb-[20px]">
              Trade details successfully added.
            </h2>
            
            <Link href="/home/trades/pending">
              <button 
                className="w-full sm:w-[240px] h-[50px] flex justify-center items-center bg-[#0038FF] text-white rounded-[15px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
              >
                <span className="text-[16px]">Go back to Pending Trades</span>
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}