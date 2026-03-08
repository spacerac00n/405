"use client";

import { CsvUpload } from "@/components/dashboard/CsvUpload";
import { Button } from "@/components/shared/Button";
import { TabSwitcher, type TourTab } from "@/components/layout/TabSwitcher";

type TopBarProps = {
  activeTab: TourTab;
  onTabChange: (tab: TourTab) => void;
  datasetOrigin: "placeholder" | "csv";
  datasetLabel: string;
  csvError: string | null;
  onFileSelect: (file: File) => Promise<void>;
  onEditProfile: () => void;
};

export function TopBar({
  activeTab,
  onTabChange,
  datasetOrigin,
  datasetLabel,
  csvError,
  onFileSelect,
  onEditProfile,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-[rgba(4,8,22,0.76)] backdrop-blur-2xl">
      <div className="mx-auto grid w-full max-w-[1480px] gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[220px_1fr_auto] xl:items-center xl:px-8">
        <div className="flex items-center">
          <img src="/icons/SP_Group_Logo.svg" alt="SP Group" className="h-13 w-auto -translate-y-0.5" />
        </div>
        <div className="flex justify-start xl:justify-center">
          <TabSwitcher activeTab={activeTab} onChange={onTabChange} />
        </div>
        <div className="flex flex-col items-start gap-3 xl:items-end">
          <div className="flex flex-wrap items-start gap-2">
            <CsvUpload
              datasetOrigin={datasetOrigin}
              datasetLabel={datasetLabel}
              error={csvError}
              onFileSelect={onFileSelect}
            />
            <Button
              variant="secondary"
              size="xs"
              className="h-10 px-4 text-sm"
              type="button"
              onClick={onEditProfile}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
