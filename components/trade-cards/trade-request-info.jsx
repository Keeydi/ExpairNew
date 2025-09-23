"use client";

export default function TradeRequestInfo({ requested, exchange }) {
  return (
    <div className="px-8 py-6 bg-[#0A0519] rounded-[20px] mb-[25px]">
      <div className="flex items-start gap-8">
        <div className="flex flex-col">
          <span className="text-[18px] text-white mb-2">Requested</span>
          <div className="px-[15px] py-[8px] bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[18px]">
            <span className="text-[15px] text-white">{requested}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[18px] text-white mb-2">In exchange for</span>
          <div className="px-[15px] py-[8px] bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[18px]">
            <span className="text-[15px] text-white">{exchange}</span>
          </div>
        </div>
      </div>
    </div>
  );
}