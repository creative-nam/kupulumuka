import { ShelterResults } from "@/components/shelter-results";

export default async function AbrigosPage({
  searchParams,
}: {
  searchParams: Promise<{ quarteiraoId?: string }>;
}) {
  const params = await searchParams;
  const quarteiraoId = params.quarteiraoId;

  if (!quarteiraoId) {
    return (
      <main className="mx-auto flex min-h-screen flex-col px-4 py-6">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-secondary-text">
            Nenhum abrigo encontrado nesta zona. Tente outro quarteirão.
          </p>
        </div>
      </main>
    );
  }

  return <ShelterResults quarteiraoId={quarteiraoId} />;
}
