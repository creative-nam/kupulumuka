"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCachedGeoSnapshot, getLastSyncedAt } from "@/lib/offline/query";
import { fetchWithTimeout } from "@/lib/offline/fetch-with-timeout";
import type { GeoSnapshot } from "@/scripts/generate-geo-snapshot";

type Selection = {
  provincia: GeoSnapshot["provincias"][number] | null;
  distrito: GeoSnapshot["provincias"][number]["distritos"][number] | null;
  bairro: GeoSnapshot["provincias"][number]["distritos"][number]["bairros"][number] | null;
  quarteirao: GeoSnapshot["provincias"][number]["distritos"][number]["bairros"][number]["quarteiroes"][number] | null;
};

function SelectField({
  id,
  label,
  value,
  disabled,
  options,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  options: { id: string; name: string }[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const items = React.useMemo(
    () => Object.fromEntries(options.map((o) => [o.id, o.name])),
    [options],
  );

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-primary-text"
      >
        {label}
      </label>
      <Select
        value={value || null}
        onValueChange={(v) => {
          if (v !== null) onChange(v);
        }}
        disabled={disabled}
        items={items}
      >
        <SelectTrigger
          id={id}
          className="w-full rounded-[12px]"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StalenessBanner({
  lastSyncedAt,
}: {
  lastSyncedAt?: string | null;
}) {
  const formatted = React.useMemo(() => {
    if (!lastSyncedAt) return null;
    const d = new Date(lastSyncedAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastSyncedAt]);

  return (
    <p className="mb-3 rounded-[10px] border border-border-default bg-surface px-3 py-2 text-[12px] text-secondary-text">
      Sem ligação — a mostrar dados guardados
      {formatted ? ` (última atualização: ${formatted})` : ""}
    </p>
  );
}

export function GeographicPicker() {
  const [snapshot, setSnapshot] = React.useState<GeoSnapshot | null>(null);
  const [error, setError] = React.useState(false);
  const [isCached, setIsCached] = React.useState(false);
  const [cachedAt, setCachedAt] = React.useState<string | null>(null);
  const [selection, setSelection] = React.useState<Selection>({
    provincia: null,
    distrito: null,
    bairro: null,
    quarteirao: null,
  });

  // Monotonic id of the latest loadSnapshot call. Each call captures its own id
  // and checks it before touching state, so a superseded (older) call discards
  // its result instead of overwriting a newer one — "latest wins", unlike the
  // "first wins" in-flight dedup in lib/offline/sync.ts.
  const requestIdRef = React.useRef(0);

  const loadSnapshot = React.useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(false);
    try {
      const res = await fetchWithTimeout("/geo-snapshot.json");
      if (requestId !== requestIdRef.current) return;
      if (!res.ok) throw new Error();
      const data: GeoSnapshot = await res.json();
      if (requestId !== requestIdRef.current) return;
      setSnapshot(data);
      setIsCached(false);
      setCachedAt(null);
    } catch {
      if (requestId !== requestIdRef.current) return;
      try {
        const cached = await getCachedGeoSnapshot();
        if (requestId !== requestIdRef.current) return;
        if (cached) {
          setSnapshot(cached);
          setIsCached(true);
          try {
            const syncedAt = await getLastSyncedAt();
            if (requestId !== requestIdRef.current) return;
            setCachedAt(syncedAt);
          } catch {
            if (requestId !== requestIdRef.current) return;
            setCachedAt(null);
          }
        } else {
          setError(true);
        }
      } catch {
        if (requestId !== requestIdRef.current) return;
        setError(true);
      }
    }
  }, []);

  React.useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const handleProvinciaChange = React.useCallback((id: string) => {
    if (!snapshot) return;
    const provincia = snapshot.provincias.find((p) => p.id === id) ?? null;
    setSelection({ provincia, distrito: null, bairro: null, quarteirao: null });
  }, [snapshot]);

  const handleDistritoChange = React.useCallback((id: string) => {
    setSelection((prev) => {
      const distrito =
        prev.provincia?.distritos.find((d) => d.id === id) ?? null;
      return { ...prev, distrito, bairro: null, quarteirao: null };
    });
  }, []);

  const handleBairroChange = React.useCallback((id: string) => {
    setSelection((prev) => {
      const bairro =
        prev.distrito?.bairros.find((b) => b.id === id) ?? null;
      return { ...prev, bairro, quarteirao: null };
    });
  }, []);

  const handleQuarteiraoChange = React.useCallback((id: string) => {
    setSelection((prev) => {
      const quarteirao =
        prev.bairro?.quarteiroes.find((q) => q.id === id) ?? null;
      return { ...prev, quarteirao };
    });
  }, []);

  const router = useRouter();
  const isComplete = selection.quarteirao !== null;

  const handleVerAbrigos = React.useCallback(() => {
    if (!selection.quarteirao) return;
    router.push(`/abrigos?quarteiraoId=${encodeURIComponent(selection.quarteirao.id)}`);
  }, [router, selection.quarteirao]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-secondary-text">
          Não foi possível carregar os dados
        </p>
        <Button onClick={loadSnapshot} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!snapshot) {
    return <p className="text-sm text-secondary-text">A carregar...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {isCached && <StalenessBanner lastSyncedAt={cachedAt} />}

      <h1 className="font-fraunces text-[15px] font-medium text-primary-text">
        Explorar abrigos
      </h1>

      <div className="flex flex-col gap-4">
        <SelectField
          id="provincia"
          label="Província"
          value={selection.provincia?.id ?? ""}
          options={snapshot.provincias}
          placeholder="Selecionar província"
          onChange={handleProvinciaChange}
        />

        <SelectField
          id="distrito"
          label="Distrito"
          value={selection.distrito?.id ?? ""}
          disabled={!selection.provincia}
          options={selection.provincia?.distritos ?? []}
          placeholder="Selecionar distrito"
          onChange={handleDistritoChange}
        />

        <SelectField
          id="bairro"
          label="Bairro"
          value={selection.bairro?.id ?? ""}
          disabled={!selection.distrito}
          options={selection.distrito?.bairros ?? []}
          placeholder="Selecionar bairro"
          onChange={handleBairroChange}
        />

        <SelectField
          id="quarteirao"
          label="Quarteirão"
          value={selection.quarteirao?.id ?? ""}
          disabled={!selection.bairro}
          options={selection.bairro?.quarteiroes ?? []}
          placeholder="Selecionar quarteirão"
          onChange={handleQuarteiraoChange}
        />
      </div>

      <Button disabled={!isComplete} className="w-full" onClick={handleVerAbrigos}>
        Ver abrigos
      </Button>
    </div>
  );
}
