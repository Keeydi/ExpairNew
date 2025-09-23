import { Button } from "../ui/button";
import Link from "next/link";

export function HelpCategoryCard({ title, desc, iconSrc, className, href }) {
  return (
    <div
      className={
        "relative flex flex-col items-center text-center rounded-[20px] border-[3px] border-[#284ccccc] shadow-[0_5px_40px_0_rgba(40,76,204,0.2)] w-full sm:w-[250px] md:w-[280px] lg:w-[300px] mx-auto transition-all duration-300 hover:scale-[1.01] " +
        className
      }
      style={{
        padding: "20px",
        background:
          "radial-gradient(277.39% 141.42% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
      }}
    >
      {/* Icon */}
      <img
        src={iconSrc}
        alt={title}
        className="w-8 h-8 sm:w-10 sm:h-10 mb-[11px] object-contain"
      />

      {/* Title */}
      <h2 className="text-white mb-[11px] text-[18px] sm:text-[20px] font-semibold">
        {title}
      </h2>

      {/* Description */}
      <p
        className="mb-[20px] sm:mb-[25px] px-2 text-[12px] sm:text-[13px]"
        style={{
          color: "rgba(255, 255, 255, 0.60)",
        }}
      >
        {desc}
      </p>

      {/* Button */}
      <div className="mt-auto mb-2 sm:mb-[25px]">
        <Link href={href}>
          <Button className="font-normal w-[100px] sm:w-[120px] h-[30px] px-6 py-2 shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[10px]">
            View
          </Button>
        </Link>
      </div>
    </div>
  );
}
