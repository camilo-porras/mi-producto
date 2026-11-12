import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { usePedidos } from "@/lib/pedidos";
import { calcularSugerencias, detectarAlertas, DIAS_ANALISIS } from "@/lib/analisis-inventario";
import { analizarInventarioIA } from "@/lib/ia.functions";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente de producción | Tauro Control" },
      {
        name: "description",
        content: "Recomendación de qué fabricar el próximo mes según lo que se agota.",
      },
    ],
  }),
  component: Asistente,
});

function Asistente() {
  const { productos, pedidos, cargando } = usePedidos();
  const analizar = useServerFn(analizarInventarioIA);
  const [texto, setTexto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pensando, setPensando] = useState(false);

  // Paso 1 (RAG): solo los productos relevantes, calculados en código.
  const sugerencias = useMemo(() => calcularSugerencias(productos, pedidos), [productos, pedidos]);
  const alertas = useMemo(() => detectarAlertas(productos, pedidos), [productos, pedidos]);

  const pedirAnalisis = async () => {
    setPensando(true);
    setError(null);
    setTexto(null);
    try {
      // Ley 1581: a Gemini solo viajan productos y cantidades, sin datos de clientes.
      const r = await analizar({
        data: {
          productos: sugerencias.map((s) => ({
            nombre: s.producto,
            stock: s.stock,
            disponible: s.disponible,
            comprometido: s.comprometido,
            vendido30d: s.vendido30d,
            producir: s.producir,
          })),
          alertas: alertas.map((a) => ({ producto: a.producto, cantidad: a.cantidad })),
        },
      });
      setTexto(r.texto);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo obtener la recomendación.");
    } finally {
      setPensando(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-8 pt-8">
        <MarcaTauro className="pointer-events-none absolute right-5 top-7 h-20 w-20 object-contain" />
        <Link to="/" className="text-sm text-accent">
          ← Volver a pedidos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Asistente de producción</h1>
        <p className="mt-1 pr-24 text-sm text-accent">Qué fabricar para que nada quede en cero</p>
      </header>

      <main className="space-y-4 px-5 py-6">
        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando datos…</p>
        ) : sugerencias.length === 0 ? (
          <p className="tarjeta-cuero p-5 text-sm">
            Todo el inventario está tranquilo: no hay productos con stock bajo.
          </p>
        ) : (
          <>
            <ul className="tarjeta-cuero divide-y divide-border">
              {sugerencias.map((s) => (
                <li key={s.productoId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.producto}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.disponible} disponible{s.disponible === 1 ? "" : "s"} · vendió{" "}
                      {s.vendido30d} en {DIAS_ANALISIS} días
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                    Fabricar {s.producir}
                  </span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={pedirAnalisis}
              disabled={pensando}
              className="superficie-cuero h-16 w-full rounded-2xl text-lg font-bold shadow-lg disabled:opacity-60"
            >
              {pensando ? "Gemini está pensando…" : "✨ Explicar con IA"}
            </button>
          </>
        )}

        {error ? (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
            {error} La lista de arriba sigue siendo válida.
          </p>
        ) : null}

        {texto ? (
          <section className="tarjeta-cuero p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Recomendación de Gemini
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{texto}</p>
          </section>
        ) : null}
      </main>
    </div>
  );
}
