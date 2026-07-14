import { BackNav } from "@/components/back-nav";
import { ShelterCard } from "@/components/shelter-card";
import { getSheltersForQuarteirao } from "@/lib/shelters/search";

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
      Esta zona não tem abrigos registados. A mostrar abrigos de bairros vizinhos.
    </p>
  );
}

export default async function AbrigosPage({
  searchParams,
}: {
  searchParams: Promise<{ quarteiraoId?: string }>;
}) {
  const params = await searchParams;
  const quarteiraoId = params.quarteiraoId;

  if (!quarteiraoId) {
    return (
      <main className="mx-auto flex min-h-screen flex-col px-spacing-screen-x py-6">
        <EmptyState />
      </main>
    );
  }

  const shelters = await getSheltersForQuarteirao(quarteiraoId);

  if (shelters.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen flex-col px-spacing-screen-x py-6">
        <EmptyState />
      </main>
    );
  }

  const hasOverflow = shelters.some((s) => s.fromNeighboringBairro);

  return (
    <main className="mx-auto flex min-h-screen flex-col px-spacing-screen-x py-6">
      <BackNav
        href="/explorar"
        contextLabel={shelters[0].bairroName}
        title="Abrigos disponíveis"
      />

      {hasOverflow && <NearbyBanner />}

      <div className="flex flex-col gap-[10px]">
        {shelters.map((shelter) => (
          <ShelterCard key={shelter.id} shelter={shelter} />
        ))}
      </div>
    </main>
  );
}
