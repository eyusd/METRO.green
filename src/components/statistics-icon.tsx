import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

interface LineStats {
  lineName: string;
  mode: string;
  totalStations: number;
  visitedStations: number;
  percentage: number;
  color: string;
}

function CircleBackground({ line }: { line: LineStats }) {
  return (

    <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">          
      <circle
        cx="18"
        cy="18"
        r="16"
        fill="none"
        className="stroke-gray-700"
        strokeWidth="2"
      />
      {/* Progress Circle */}
      <circle
        cx="18"
        cy="18"
        r="16"
        fill="none"
        strokeWidth="2"
        strokeDasharray={`${(line.percentage * 100.53) / 100} 100.53`}
        strokeLinecap="round"
        className="transition-all duration-300"
        style={{ stroke: `#${line.color}` }}
      />
    </svg>
  )
}

function RounndedSquareBackground({ line }: { line: LineStats }) {
  return (

    <svg className="w-12 h-12 transform" viewBox="0 0 36 36">          
      <rect
        x="2"
        y="2"
        width="32"
        height="32"
        rx="8"
        ry="8"
        fill="none"
        className="stroke-gray-700"
        strokeWidth="2"
      />
      {/* Progress Rect */}
      <rect
        x="2"
        y="2"
        width="32"
        height="32"
        rx="8"
        ry="8"
        fill="none"
        strokeWidth="2"
        strokeDasharray={`${(line.percentage * 115) / 100} 115`}
        strokeLinecap="round"
        className="transition-all duration-300"
        style={{ stroke: `#${line.color}` }}
      />
    </svg>
  )
}

interface StatisticsIconProps extends ComponentProps<"div"> {
  line: LineStats;
}

const getLineIconUrl = (mode: string, lineName: string): string => {
  return `/icons/${mode}_${lineName}.svg`;
};

export function StatisticsIcon({
  line,
  className,
  ...props
}: StatisticsIconProps) {
  return (
    <div
      className={cn(
        "flex flex-row items-center justify-center gap-1 p-3 border border-emerald-950 rounded-xl bg-gradient-to-br from-emerald-950/40 to-gray-950 hover:from-gray-800 hover:to-gray-900 transition-all duration-300 shadow-lg",
        className
      )}
      {...props}
    >
      {/* Circular Progress with Icon */}
      <div className="relative w-12 h-12">
        {line.mode == "METRO" ? (
          <CircleBackground line={line} />
        ) : (
          <RounndedSquareBackground line={line} />
        )}
        {/* Line Icon in Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={getLineIconUrl(line.mode, line.lineName)}
            alt={`${line.mode} ${line.lineName}`}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              // Fallback to colored circle with line number
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement!;
              parent.innerHTML = `
                              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" 
                                   style="background-color: #${line.color}">
                                ${line.lineName}
                              </div>
                            `;
            }}
          />
        </div>
      </div>

      {/* Compact Stats */}
      <div className="flex flex-col text-xs">
        <div className="text-gray-300">
          {line.visitedStations}/{line.totalStations}
        </div>
        <div className="font-bold text-xs text-white" style={{ color: `#${line.color}` }}>
          {line.percentage.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
