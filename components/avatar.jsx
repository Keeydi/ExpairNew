"use client";

import Image from "next/image";

export default function ProfileAvatar({ src, size = 40, className = "" }) {
  const DEFAULT_AVATAR = "/assets/defaultavatar.png";

  return (
    <Image
      src={src || DEFAULT_AVATAR}
      alt="Profile picture"
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
    />
  );
}