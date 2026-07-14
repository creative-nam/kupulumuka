"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-primary-text"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-[10px] border border-border-default bg-surface px-3 py-2 text-sm text-primary-text outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function GeographicPicker() {
  const [snapshot, setSnapshot] = React.useState<GeoSnapshot | null>(null);
  const [error, setError] = React.useState(false);
  const [selection, setSelection] = React.useState<Selection>({
    provincia: null,
    distrito: null,
    bairro: null,
    quarteirao: null,
  });

  const loadSnapshot = React.useCallback(() => {
    setError(false);
    fetch("/geo-snapshot.json")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: GeoSnapshot) => setSnapshot(data))
      .catch(() => setError(true));
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
