"use client";

import * as React from "react";
import { BackNav } from "./back-nav";
import { ShelterCard } from "./shelter-card";
import { Button } from "@/components/ui/button";
import { getCachedShelters } from "@/lib/offline/query";
import { fetchWithTimeout } from "@/lib/offline/fetch-with-timeout";
import type {
  ShelterSearchResponse,
  ShelterSearchResult,
} from "@/lib/shelters/search";

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-sm text-secondary-text">
        Nenhum abrigo encontrado nesta zona. Tente outro quarteirão.
      </p>
      <BackNav
        href="/explorar"
        contextLabel="Voltar à pesquisa"
        title="Explorar abrigos"
      />
    </div>
  );
}

function NearbyBanner() {
  return (
    <p className="mb-3 rounded-[10px] border border-border-default bg-surface px-3 py-2 text-[12px] text-secondary-text">
      Esta zona não tem abrigos registados. A mostrar abrigos de bairros
      vizinhos.
    </p>
  );
}

function StalenessBanner({ lastSyncedAt }: { lastSyncedAt: string }) {
  const formatted = React.useMemo(() => {
    const d = new Date(lastSyncedAt);
    return d.toLocaleString("pt-PT", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastSyncedAt]);

  return (
    <p className="mb-3 rounded-[10px] border border-border-default bg-surface px-3 py-2 text-[12px] text-secondary-text">
      Sem ligação — a mostrar dados guardados (última atualização:{" "}
      {formatted})
    </p>
  );
}

type State =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "cached";
      shelters: ShelterSearchResult[];
      originBairroName: string;
      lastSyncedAt: string;
    }
  | { status: "live"; shelters: ShelterSearchResult[]; originBairroName: string };

export function ShelterResults({
  quarteiraoId,
}: {
  quarteiraoId: string;
}) {
  const [state, setState] = React.useState<State>({ status: "loading" });
  const [retryTrigger, setRetryTrigger] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    async function fetchShelters() {
      try {
        const res = await fetchWithTimeout(
          `/api/shelters?quarteiraoId=${encodeURIComponent(quarteiraoId)}`,
        );
        if (!res.ok) throw new Error("Fetch failed");
        const data: ShelterSearchResponse = await res.json();
        if (!cancelled) {
          setState({
            status: "live",
            shelters: data.results,
            originBairroName: data.originBairro?.name ?? "",
          });
        }
      } catch {
        try {
          const cached = await getCachedShelters(quarteiraoId);
          if (!cancelled) {
            if (cached.lastSyncedAt) {
              setState({
                status: "cached",
                shelters: cached.results,
                originBairroName: cached.originBairro?.name ?? "",
                lastSyncedAt: cached.lastSyncedAt,
              });
            } else {
              setState({ status: "error" });
            }
          }
        } catch {
          if (!cancelled) setState({ status: "error" });
        }
      }
    }

    fetchShelters();
    return () => {
      cancelled = true;
    };
  }, [quarteiraoId, retryTrigger]);

  if (state.status === "loading") {
    return (
      <main className="mx-auto flex min-h-screen flex-col px-4 py-6">
        <p className="text-sm text-secondary-text">A carregar...</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto flex min-h-screen flex-col px-4 py-6">
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-secondary-text">
            Não foi possível carregar os dados
          </p>
          <Button
            onClick={() => setRetryTrigger((n) => n + 1)}
            variant="outline"
          >
            Tentar novamente
          </Button>
        </div>
      </main>
    );
  }

  const shelters = state.shelters;
  const originBairroName = state.originBairroName;
  const isCached = state.status === "cached";

  if (shelters.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen flex-col px-4 py-6">
        {isCached && <StalenessBanner lastSyncedAt={state.lastSyncedAt} />}
        <EmptyState />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen flex-col px-4 py-6">
      <BackNav
        href="/explorar"
        contextLabel={originBairroName}
        title={
          shelters.some((s) => s.fromNeighboringBairro)
            ? `Abrigos próximos a ${originBairroName}`
            : `Abrigos disponíveis em ${originBairroName}`
        }
      />

      {isCached && (
        <StalenessBanner lastSyncedAt={state.lastSyncedAt} />
      )}

      {shelters.some((s) => s.fromNeighboringBairro) && <NearbyBanner />}

      <div className="flex flex-col gap-[10px]">
        {shelters.map((shelter) => (
          <ShelterCard key={shelter.id} shelter={shelter} />
        ))}
      </div>
    </main>
  );
}
