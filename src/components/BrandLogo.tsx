import React from "react";

interface BrandLogoProps {
  className?: string;
  color?: string;
}

export default function BrandLogo({ className = "h-8 w-8", color = "currentColor" }: BrandLogoProps) {
  return (
    <svg 
      viewBox="0 0 120 160" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Button circle rim */}
      <circle 
        cx="60" 
        cy="55" 
        r="35" 
        stroke={color} 
        strokeWidth="9" 
        className="transition-all"
      />
      {/* Inner subtle alignment line for button aesthetic */}
      <circle 
        cx="60" 
        cy="55" 
        r="22" 
        stroke={color} 
        strokeWidth="2" 
        strokeDasharray="4 2" 
        opacity="0.35" 
      />
      
      {/* 4 classic button holes forming a elegant grid square */}
      <circle cx="48" cy="43" r="5" fill={color} />
      <circle cx="72" cy="43" r="5" fill={color} />
      <circle cx="48" cy="67" r="5" fill={color} />
      <circle cx="72" cy="67" r="5" fill={color} />

      {/* Center spinal axis/stem representing structural posture */}
      <path 
        d="M60 90V152" 
        stroke={color} 
        strokeWidth="9" 
        strokeLinecap="round" 
      />

      {/* Ribbon Row 1 */}
      <path 
        d="M40 105C45 105 48 105 52 105" 
        stroke={color} 
        strokeWidth="9" 
        strokeLinecap="round" 
      />
      <path 
        d="M68 105C72 105 75 105 80 105" 
        stroke={color} 
        strokeWidth="9" 
        strokeLinecap="round" 
      />

      {/* Ribbon Row 2 */}
      <path 
        d="M36 123C42 123 48 123 52 123" 
        stroke={color} 
        strokeWidth="9" 
        strokeLinecap="round" 
      />
      <path 
        d="M68 123C72 123 78 123 84 123" 
        stroke={color} 
        strokeWidth="9" 
        strokeLinecap="round" 
      />

      {/* Ribbon Row 3 */}
      <path 
        d="M38 141C44 141 48 141 52 141" 
        stroke={color} 
        strokeWidth="9" 
        strokeLinecap="round" 
      />
      <path 
        d="M68 141C72 141 76 141 82 141" 
        stroke={color} 
        strokeWidth="9" 
        strokeLinecap="round" 
      />
    </svg>
  );
}
