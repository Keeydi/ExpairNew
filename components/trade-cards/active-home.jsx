import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function ActiveTradeHome({ 
  name, 
  profilePic, 
  username,
  offering, 
  totalXp, 
  deadline 
}) {
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className="flex flex-col w-[440px] rounded-[20px] border-[3px] border-[#284CCC]/80 p-[25px] gap-[20px] relative"
      style={{
        background: 'radial-gradient(circle at top right, #3D2490 0%, #120A2A 69%)'
      }}
    >
      {/* Top Row */}
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-[10px]">
          {/* Clickable Profile Picture */}
          {username ? (
            <Link href={`/home/profile/${username}`} className="flex-shrink-0">
              <div className="relative w-[25px] h-[25px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#0038FF] transition-all">
                <Image
                  src={
                    !imageError && profilePic 
                      ? profilePic 
                      : "/assets/defaultavatar.png"
                  }
                  alt={`${name}'s avatar`}
                  width={25}
                  height={25}
                  className="rounded-full object-cover"
                  onError={handleImageError}
                />
              </div>
            </Link>
          ) : (
            <Image
              src={
                !imageError && profilePic 
                  ? profilePic 
                  : "/assets/defaultavatar.png"
              }
              alt="Avatar"
              width={25}
              height={25}
              className="rounded-full object-cover"
              onError={handleImageError}
            />
          )}
          
          <div className="flex items-center gap-[8px]">
            {/* Clickable Name */}
            {username ? (
              <Link href={`/home/profile/${username}`} className="hover:text-[#0038FF] transition-colors">
                <p className="text-base cursor-pointer">{name}</p>
              </Link>
            ) : (
              <p className="text-base">{name}</p>
            )}
            <div className="flex items-center gap-[4px]">
            </div>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setOpenMenuIndex(openMenuIndex ? null : 1)}>
            <Icon icon="mdi:dots-horizontal" className="text-white text-xl" />
          </button>
          {openMenuIndex && (
            <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-20 shadow-lg">
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                <Icon icon="mdi:flag" className="text-white text-base" />
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-[15px]">
        <div className="flex justify-between items-center w-full">
          <p className="text-base">{offering}</p>
          <p className="text-base font-semibold text-[#906EFF] whitespace-nowrap">{totalXp} XP</p>
        </div>
        <div className="flex justify-end w-full">
          <p className="text-xs text-white/60">{deadline}</p>
        </div>
      </div>
    </div>
  );
}