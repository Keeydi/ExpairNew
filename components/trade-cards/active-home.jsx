import Image from "next/image";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function ActiveTradeHome() {
  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  const trades = [
    {
      name: "Emily Johnson",
      title: "Logo Design for New Cafe",
      xp: "250 XP",
      deadline: "July 10",
    },
    {
      name: "Michael Lee",
      title: "Website Development for Startup",
      xp: "500 XP",
      deadline: "July 15",
    },
    {
      name: "Sarah Thompson",
      title: "Project Management for Product Launch",
      xp: "500 XP",
      deadline: "July 30",
    },
    {
      name: "Jason Miller",
      title: "Tech Support for Home Network",
      xp: "300 XP",
      deadline: "July 25",
    },
  ];

  return (
    <div className="w-full max-w-[940px] flex flex-wrap gap-[25px]">
      {trades.map((trade, index) => (
        <div
          key={index}
          className="transition-all duration-300 hover:scale-[1.01] flex flex-col w-[440px] rounded-[20px] border-[3px] border-[#284CCC]/80 p-[25px] gap-[20px] relative"
          style={{
            background: 'radial-gradient(circle at top right, #3D2490 0%, #120A2A 69%)'
          }}
        >
          {/* Top Row */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-[10px]">
              <Image
                src="/assets/defaultavatar.png"
                alt="Avatar"
                width={25}
                height={25}
                className="rounded-full"
              />
              <p className="text-base">{trade.name}</p>
            </div>
            <div className="relative">
              <button onClick={() => setOpenMenuIndex(index === openMenuIndex ? null : index)}>
                <Icon icon="mdi:dots-horizontal" className="text-white text-xl" />
              </button>
              {openMenuIndex === index && (
                <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-20 shadow-lg">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                    <Icon icon="mdi:alert-circle-outline" className="text-white text-base" />
                    Report
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                    <Icon icon="mdi:eye-off-outline" className="text-white text-base" />
                    Not Interested
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-[15px]">
            <div className="flex justify-between items-center w-full">
              <p className="text-base">{trade.title}</p>
              <p className="text-base font-semibold text-[#906EFF] whitespace-nowrap">{trade.xp}</p>
            </div>
            <div className="flex justify-end w-full">
              <p className="text-[13px] font-normal text-white/60">Due on {trade.deadline}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
