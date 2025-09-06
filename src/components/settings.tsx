"use client";

import { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RotateCcw,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Info,
  Cog,
  X,
} from "lucide-react";
import { useGameStore } from "@/lib/store";
import type { NotificationData } from "./main-content";

interface SettingsProps {
  showNotification: (data: NotificationData) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Settings({ showNotification, isOpen, onOpenChange }: SettingsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState("");

  const { visitedStations, resetGame, addStation, getStationCount } =
    useGameStore();

  // Export game data as JSON
  const exportGameData = () => {
    const gameData = {
      visitedStations,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    const dataStr = JSON.stringify(gameData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `metro-game-save-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import game data from JSON
  const importGameData = () => {
    try {
      const parsed = JSON.parse(importData);

      if (!parsed.visitedStations || !Array.isArray(parsed.visitedStations)) {
        throw new Error("Invalid save data format");
      }

      // Reset current game and import stations
      resetGame();
      parsed.visitedStations.forEach((station: string) => {
        addStation(station);
      });

      setImportData("");
      setShowImportDialog(false);
      showNotification({
        type: "success",
        title: "Import Successful",
        message: `Successfully imported ${parsed.visitedStations.length} visited stations!`,
        details: {
          tip: "Your previous progress has been restored",
        },
      });
    } catch (error) {
      showNotification({
        type: "error",
        title: "Import Failed",
        message: "Error importing save data. Please check the file format.",
        details: {
          reason: error instanceof Error ? error.message : "Unknown error",
          tip: "Make sure you're using a valid game save file",
        },
      });
      console.error("Import error:", error);
    }
  };

  // Handle file upload for import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  // Reset game with confirmation
  const handleResetGame = () => {
    resetGame();
    setShowResetConfirm(false);
    showNotification({
      type: "success",
      title: "Game Reset Complete",
      message: "Game has been reset! All progress has been cleared.",
      details: {
        tip: "Start exploring Paris metro stations to build your collection again",
      },
    });
  };

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
                rotate: isOpen ? 90 : 0,
                scale: isOpen ? 1.1 : 1,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Cog className="size-5 text-slate-600 dark:text-slate-400" />
            </motion.div>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-xl bg-black/95 border-gray-800 text-white max-h-[calc(90dvh-150px)]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="relative">
          <DialogTitle className="text-white">Game Settings</DialogTitle>
          <DialogDescription className="text-gray-300">
            Manage your game preferences and data
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
            {/* Game Statistics Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                <Info className="h-4 w-4" />
                Game Info
              </h3>
              <div className="bg-gradient-to-br from-emerald-950/40 to-gray-950/40 backdrop-blur-sm p-4 rounded-lg border border-gray-700/20 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">
                    Stations Visited:
                  </span>
                  <span className="font-medium text-white">
                    {getStationCount()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Save Location:</span>
                  <span className="font-medium text-xs text-white">
                    Browser Local Storage
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Auto-Save:</span>
                  <span className="font-medium flex items-center gap-1 text-white">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    Enabled
                  </span>
                </div>
              </div>
            </div>

            {/* Data Management Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                <Download className="h-4 w-4" />
                Data Management
              </h3>

              <div className="space-y-2">
                {/* Export Data */}
                <Button
                  onClick={exportGameData}
                  variant="outline"
                  className="w-full justify-start border-emerald-950 bg-gradient-to-br from-emerald-950/40 to-gray-950/40 backdrop-blur-sm text-white hover:bg-emerald-950/40 hover:text-emerald-300"
                  disabled={getStationCount() === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Save Data
                </Button>

                {/* Import Data */}
                <Button
                  onClick={() => setShowImportDialog(!showImportDialog)}
                  variant="outline"
                  className="w-full justify-start border-emerald-950 bg-gradient-to-br from-emerald-950/40 to-gray-950/40 backdrop-blur-sm text-white hover:bg-emerald-950/40 hover:text-emerald-300"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Save Data
                </Button>

                {/* Import Dialog */}
                {showImportDialog && (
                  <div className="border border-gray-700 rounded-lg p-4 space-y-3 bg-gradient-to-br from-gray-900/40 to-gray-950/40 backdrop-blur-sm">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">
                        Upload save file:
                      </label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="w-full text-sm border border-gray-600 bg-gray-800 text-white rounded p-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">
                        Or paste save data:
                      </label>
                      <textarea
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        placeholder="Paste your exported JSON save data here..."
                        className="w-full h-20 text-xs border border-gray-600 bg-gray-800 text-white rounded p-2 font-mono placeholder-gray-400"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={importGameData}
                        disabled={!importData.trim()}
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Import
                      </Button>
                      <Button
                        onClick={() => {
                          setShowImportDialog(false);
                          setImportData("");
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-700 bg-gray-800/50 text-white hover:bg-gray-700/50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </h3>

              {!showResetConfirm ? (
                <Button
                  onClick={() => setShowResetConfirm(true)}
                  variant="destructive"
                  className="w-full justify-start"
                  disabled={getStationCount() === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Game
                </Button>
              ) : (
                <div className="border border-red-500/30 rounded-lg p-4 space-y-3 bg-gradient-to-br from-red-900/20 to-red-950/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Are you sure?</span>
                  </div>
                  <p className="text-sm text-red-300">
                    This will permanently delete all your visited stations (
                    {getStationCount()} stations). This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleResetGame}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Yes, Reset Game
                    </Button>
                    <Button
                      onClick={() => setShowResetConfirm(false)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-700 bg-gray-800/50 text-white hover:bg-gray-700/50"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
