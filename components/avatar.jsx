"use client";

import Image from "next/image";

export default function ProfileAvatar({ src, size = 40, className = "" }) {
  const DEFAULT_AVATAR = "/assets/defaultavatar.png";

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <Image
        src={src || DEFAULT_AVATAR}
        alt="Profile picture"
        fill
        sizes={`${size}px`}
        className="object-cover object-center"
      />
    </div>
  );
}