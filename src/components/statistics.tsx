"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrendingUp, X } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { stations } from "@/lib/stations";
import { StatisticsIcon } from "./statistics-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NotificationData } from "./main-content";

interface StatisticsProps {
  showNotification: (data: NotificationData) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LineStats {
  lineName: string;
  mode: string;
  totalStations: number;
  visitedStations: number;
  percentage: number;
  color: string;
}

interface GroupedStats {
  [mode: string]: LineStats[];
}

// Function to sort lines numerically
const sortLines = (lines: LineStats[], mode: string): LineStats[] => {
  return lines.sort((a, b) => {
    if (mode === "METRO" || mode === "TRAM") {
      // Handle special cases first
      if (a.lineName.includes("bis") || b.lineName.includes("bis")) {
        if (a.lineName.includes("bis") && b.lineName.includes("bis")) {
          const aBase = parseFloat(a.lineName.replace(/[^0-9.]/g, ""));
          const bBase = parseFloat(b.lineName.replace(/[^0-9.]/g, ""));
          return aBase - bBase;
        }
        // Put bis lines after their base number
        if (a.lineName.includes("bis")) {
          const baseA = parseFloat(a.lineName.replace(/[^0-9.]/g, ""));
          const baseB = parseFloat(b.lineName);
          return baseA === baseB ? 1 : baseA - baseB;
        }
        if (b.lineName.includes("bis")) {
          const baseA = parseFloat(a.lineName);
          const baseB = parseFloat(b.lineName.replace(/[^0-9.]/g, ""));
          return baseA === baseB ? -1 : baseA - baseB;
        }
      }

      // Handle 3a/3b for trams
      if (
        a.lineName.includes("a") ||
        a.lineName.includes("b") ||
        b.lineName.includes("a") ||
        b.lineName.includes("b")
      ) {
        const aNum = parseFloat(a.lineName.replace(/[^0-9.]/g, ""));
        const bNum = parseFloat(b.lineName.replace(/[^0-9.]/g, ""));
        if (aNum === bNum) {
          return a.lineName.localeCompare(b.lineName);
        }
        return aNum - bNum;
      }

      // Regular numerical sort
      const aNum = parseFloat(a.lineName);
      const bNum = parseFloat(b.lineName);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
    }

    // For RER or fallback, sort alphabetically
    return a.lineName.localeCompare(b.lineName);
  });
};

export function Statistics({ showNotification, isOpen, onOpenChange }: StatisticsProps) {
  const visitedStations = useGameStore((state) => state.visitedStations);

  // Calculate statistics for each line grouped by mode
  const statistics: GroupedStats = useMemo(() => {
    const lineMap = new Map<
      string,
      {
        totalStations: Set<string>;
        visitedStations: Set<string>;
        mode: string;
        color: string;
      }
    >();

    // Process all stations to build line statistics
    stations.features.forEach((feature) => {
      const stationName = feature.properties?.nom_gares;
      const rescom = feature.properties?.res_com || "";
      const color = feature.properties?.colourweb_hexa || "000000";

      if (!stationName || !rescom) return;

      // Extract mode and line name from res_com (e.g., "METRO 1", "RER A", "TRAM 3a")
      const parts = rescom.split(" ");
      if (parts.length < 2) return;

      const mode = parts[0];
      const lineName = parts.slice(1).join(" ");
      const lineKey = `${mode}_${lineName}`;

      if (!lineMap.has(lineKey)) {
        lineMap.set(lineKey, {
          totalStations: new Set(),
          visitedStations: new Set(),
          mode,
          color,
        });
      }

      const lineData = lineMap.get(lineKey)!;
      lineData.totalStations.add(stationName);

      if (visitedStations.includes(stationName)) {
        lineData.visitedStations.add(stationName);
      }
    });

    // Convert to grouped structure
    const grouped: GroupedStats = {};

    lineMap.forEach((data, lineKey) => {
      const [mode, lineName] = lineKey.split("_", 2);
      const totalCount = data.totalStations.size;
      const visitedCount = data.visitedStations.size;
      const percentage = totalCount > 0 ? (visitedCount / totalCount) * 100 : 0;

      if (!grouped[mode]) {
        grouped[mode] = [];
      }

      grouped[mode].push({
        lineName,
        mode,
        totalStations: totalCount,
        visitedStations: visitedCount,
        percentage,
        color: data.color,
      });
    });

    // Sort lines within each mode using proper numerical sorting
    Object.keys(grouped).forEach((mode) => {
      grouped[mode] = sortLines(grouped[mode], mode);
    });

    return grouped;
  }, [visitedStations]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalStations = new Set<string>();
    const visitedStationsSet = new Set(visitedStations);

    stations.features.forEach((feature) => {
      const stationName = feature.properties?.nom_gares;
      if (stationName) {
        totalStations.add(stationName);
      }
    });

    const totalCount = totalStations.size;
    const visitedCount = visitedStationsSet.size;
    const percentage = totalCount > 0 ? (visitedCount / totalCount) * 100 : 0;

    return {
      totalStations: totalCount,
      visitedStations: visitedCount,
      percentage,
    };
  }, [visitedStations]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            variant="ghost"
            size="lg"
            className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-950 border border-slate-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 hover:from-slate-100 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-900 backdrop-blur-sm"
          >
            <motion.div
              animate={{
                rotate: isOpen ? 180 : 0,
                scale: isOpen ? 1.1 : 1,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <TrendingUp className="size-5 text-slate-600 dark:text-slate-400" />
            </motion.div>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-xl max-h-[calc(90dvh-150px)] border-0 bg-black/95 backdrop-blur-xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="relative">
          <DialogTitle className="text-white text-lg font-semibold">
            Game Statistics
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-sm">
            Your progress across all metro, RER, and tram lines
          </DialogDescription>

          {/* Close Button */}
          <motion.button
            onClick={() => onOpenChange(false)}
            className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-black/80 transition-all duration-200 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <X className="size-4 text-white" />
          </motion.button>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(60dvh-150px)] pr-4">
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-gray-950/40 backdrop-blur-sm p-4 rounded-lg border border-emerald-950">
              <h3 className="font-semibold text-lg mb-2 text-white">
                Overall Progress
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {overallStats.visitedStations} / {overallStats.totalStations}{" "}
                  stations
                </span>
                <span className="font-bold text-lg text-emerald-400">
                  {overallStats.percentage.toFixed(1)}%
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-700/50 rounded-full h-3 mt-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-3 rounded-full transition-all duration-800 ease-out"
                  style={{ width: `${overallStats.percentage}%` }}
                />
              </div>
            </div>

            {/* Mode Groups */}
            {Object.entries(statistics)
              .sort(([a], [b]) => {
                const order = { METRO: 1, RER: 2, TRAM: 3 };
                return (
                  (order[a as keyof typeof order] || 4) -
                  (order[b as keyof typeof order] || 4)
                );
              })
              .map(([mode, lines]) => (
                <div key={mode} className="space-y-3">
                  <h3 className="font-semibold text-base text-white flex items-center">
                    <img
                      src={`/icons/${mode}.svg`}
                      alt={mode}
                      className="w-6 h-6 object-contain inline-block mr-2"
                    />
                    {mode}
                  </h3>

                  {/* Compact grid layout */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {lines.map((line) => (
                      <StatisticsIcon
                        line={line}
                        key={`${line.mode}_${line.lineName}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
