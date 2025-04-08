import React from "react";
import { cn } from "@/lib/utils";

interface MatchGaugeProps {
  percentage: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function MatchGauge({ 
  percentage,
  size = "md",
  showValue = true,
  className
}: MatchGaugeProps) {
  // Calculate the stroke width based on size
  const getStrokeWidth = () => {
    switch (size) {
      case "sm": return 8;
      case "lg": return 12;
      default: return 10;
    }
  };

  // Calculate the radius based on size
  const getRadius = () => {
    switch (size) {
      case "sm": return 30;
      case "lg": return 60;
      default: return 45;
    }
  };

  // Calculate dimensions based on size
  const strokeWidth = getStrokeWidth();
  const radius = getRadius();
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Calculate the viewBox and dimensions
  const svgSize = radius * 2;
  const fontSize = size === "sm" ? "text-xs" : size === "lg" ? "text-xl" : "text-base";

  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 60) return "text-green-400";
    if (percentage >= 40) return "text-amber-500";
    if (percentage >= 20) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        height={svgSize}
        width={svgSize}
        className={cn("transform -rotate-90", getColor())}
      >
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-500 ease-in-out opacity-90"
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth / 3}
          opacity={0.2}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      {showValue && (
        <div className={cn("absolute font-semibold", fontSize)}>
          {percentage}%
        </div>
      )}
    </div>
  );
}