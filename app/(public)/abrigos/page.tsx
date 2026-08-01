import { BackNav } from "@/components/back-nav";
import { ShelterResults } from "@/components/shelter-results";

function NoSelectionState() {
  return (
    <main className="mx-auto flex min-h-screen flex-col px-4 py-6">
      <BackNav
        href="/explorar"
        contextLabel="Voltar à pesquisa"
        title="Explorar abrigos"
      />
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-secondary-text">
          Selecione uma zona para ver os abrigos disponíveis.
        </p>
      </div>
    </main>
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
    return <NoSelectionState />;
  }

  return <ShelterResults quarteiraoId={quarteiraoId} />;
}
