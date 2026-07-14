import type { ShelterSearchResult } from "@/lib/shelters/search";
import { ShareButton } from "./share-button";

function TierBadge({ tier }: { tier: "OFFICIAL" | "COMMUNITY" }) {
  const isOfficial = tier === "OFFICIAL";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        isOfficial
          ? "bg-tier-oficial-bg text-tier-oficial-text"
          : "bg-tier-comunitario-bg text-tier-comunitario-text"
      }`}
    >
      {isOfficial ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )}
      {isOfficial ? "Oficial" : "Comunitário"}
    </span>
  );
}

const CAPACITY_LABELS: Record<string, string> = {
  AVAILABLE: "Livre",
  NEARLY_FULL: "Quase cheio",
  FULL: "Esgotado",
};

const CAPACITY_CLASSES: Record<string, string> = {
  AVAILABLE: "bg-capacity-livre-bg text-capacity-livre-text",
  NEARLY_FULL: "bg-capacity-quase-bg text-capacity-quase-text",
  FULL: "bg-capacity-esgotado-bg text-capacity-esgotado-text",
};

function CapacityPill({ status }: { status: "AVAILABLE" | "NEARLY_FULL" | "FULL" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${CAPACITY_CLASSES[status]}`}
    >
      {CAPACITY_LABELS[status]}
    </span>
  );
}

export function ShelterCard({ shelter }: { shelter: ShelterSearchResult }) {
  return (
    <div className="flex flex-col gap-2 rounded-[12px] border border-border-default bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-medium text-primary-text">
          {shelter.name}
        </h2>
        <TierBadge tier={shelter.tier} />
      </div>

      <p className="text-[12px] leading-snug text-secondary-text">
        {shelter.routeDescription}
      </p>

      <div className="flex items-center justify-between gap-2">
        <CapacityPill status={shelter.capacityStatus} />
        <ShareButton shelterName={shelter.name} routeDescription={shelter.routeDescription} />
      </div>
    </div>
  );
}
