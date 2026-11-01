import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePedidos } from "@/lib/pedidos";
import { normalizar } from "@/components/SelectorCliente";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes | Tauro Control" },
      { name: "description", content: "Consulta y edita los clientes registrados." },
    ],
  }),
  component: Clientes,
});

function Clientes() {
  const { clientes, cargando } = usePedidos();
  const [busqueda, setBusqueda] = useState("");
  const q = normalizar(busqueda.trim());
  const lista = clientes.filter(
    (c) =>
      !q ||
      normalizar(c.nombre).includes(q) ||
      normalizar(c.negocio).includes(q) ||
      c.telefono.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "no-coincide"),
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-32">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-8 pt-8">
        <MarcaTauro className="pointer-events-none absolute right-5 top-7 h-20 w-20 object-contain" />
        <Link to="/" className="text-sm text-accent">
          ← Volver a pedidos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Clientes</h1>
        <p className="mt-1 pr-24 text-sm text-accent">
          {clientes.length === 1
            ? "1 cliente registrado"
            : `${clientes.length} clientes registrados`}
        </p>
      </header>

      <main className="px-5 py-6">
        <input
          className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-lg outline-none focus:border-primary"
          placeholder="Busca por nombre, negocio o teléfono"
          autoComplete="off"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {cargando ? (
          <p className="mt-4 text-sm text-muted-foreground">Cargando clientes…</p>
        ) : lista.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {clientes.length === 0 ? "Todavía no hay clientes." : "Ningún cliente coincide."}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {lista.map((c) => (
              <li key={c.id}>
                <Link to="/clientes/$id" params={{ id: c.id }} className="tarjeta-cuero block p-4">
                  <p className="text-lg font-semibold">{c.nombre}</p>
                  {c.negocio ? <p className="text-sm text-muted-foreground">{c.negocio}</p> : null}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[c.telefono, c.ciudad].filter(Boolean).join(" · ") ||
                      "Faltan datos: toca para completarlos"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-gradient-to-t from-background via-background to-transparent p-5">
        <Link
          to="/clientes/nuevo"
          className="superficie-cuero flex h-16 items-center justify-center rounded-2xl text-xl font-bold shadow-lg"
        >
          + Nuevo cliente
        </Link>
      </div>
    </div>
  );
}
