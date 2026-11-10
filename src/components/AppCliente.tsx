import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { formatoPesos } from "@/lib/pedidos";
import { supabase } from "@/lib/supabase";
import { MarcaTauro } from "@/components/MarcaTauro";

type ItemCatalogo = { id: string; nombre: string; disponible: number };

type Solicitud = {
  id: string;
  created_at: string;
  estado: string;
  monto: number | string | null;
  motivo_anulacion: string | null;
  pedido_items:
    { producto_id: string; cantidad: number; precio_unitario: number | string }[] | null;
};

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  Solicitado: { texto: "Por confirmar", clase: "bg-accent text-accent-foreground" },
  Pendiente: { texto: "Aceptado", clase: "bg-accent text-accent-foreground" },
  Entregado: { texto: "Entregado", clase: "bg-muted text-muted-foreground" },
  Anulado: { texto: "No aceptado", clase: "bg-destructive/10 text-destructive" },
};

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

// Lo que ve y puede hacer un CLIENTE: mirar los productos y solicitar pedidos.
export function AppCliente() {
  const { perfil, salir } = useAuth();
  const [pestana, setPestana] = useState<"productos" | "solicitudes">("productos");
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    const [cat, sol] = await Promise.all([
      supabase.rpc("catalogo"),
      supabase
        .from("pedidos")
        .select(
          "id, created_at, estado, monto, motivo_anulacion, pedido_items(producto_id, cantidad, precio_unitario)",
        )
        .order("created_at", { ascending: false }),
    ]);
    if (cat.error || sol.error) {
      console.error("Error leyendo datos del cliente:", cat.error ?? sol.error);
      return;
    }
    setCatalogo(cat.data as ItemCatalogo[]);
    setSolicitudes(sol.data as unknown as Solicitud[]);
  }, []);

  useEffect(() => {
    (async () => {
      await cargar();
      setCargando(false);
    })();
  }, [cargar]);

  const cambiar = (id: string, delta: number, maximo: number) =>
    setCantidades((prev) => {
      const nueva = Math.min(Math.max((prev[id] ?? 0) + delta, 0), maximo);
      return { ...prev, [id]: nueva };
    });

  const elegidos = Object.entries(cantidades).filter(([, c]) => c > 0);

  const solicitar = async () => {
    if (elegidos.length === 0) return;
    setEnviando(true);
    setAviso(null);
    const { error } = await supabase.rpc("solicitar_pedido", {
      p_items: elegidos.map(([producto_id, cantidad]) => ({ producto_id, cantidad })),
    });
    if (error) {
      setAviso({ tipo: "error", texto: error.message });
      setEnviando(false);
      return;
    }
    setCantidades({});
    await cargar();
    setAviso({
      tipo: "ok",
      texto: "Solicitud enviada. Don Tauro la revisará y te confirmará el precio.",
    });
    setPestana("solicitudes");
    setEnviando(false);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-32">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-7 pt-8">
        <MarcaTauro className="pointer-events-none absolute right-5 top-7 h-20 w-20 object-contain" />
        <p className="text-sm uppercase tracking-widest text-accent">Mano Facturas Tauro</p>
        <h1 className="mt-1 pr-24 text-2xl font-semibold">Hola, {perfil?.nombre}</h1>
        <button
          type="button"
          onClick={salir}
          className="mt-3 text-sm font-semibold text-accent underline"
        >
          Cerrar sesión
        </button>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        {(["productos", "solicitudes"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPestana(p)}
            className={`rounded-2xl border px-4 py-3 text-base font-bold ${
              pestana === p
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {p === "productos" ? "Productos" : "Mis solicitudes"}
          </button>
        ))}
      </div>

      <main className="space-y-4 px-5 py-5">
        {aviso ? (
          <p
            role="status"
            className={`rounded-2xl px-4 py-3 text-sm font-bold ${
              aviso.tipo === "ok"
                ? "bg-accent text-accent-foreground"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {aviso.texto}
          </p>
        ) : null}

        {cargando ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}

        {!cargando && pestana === "productos" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Elige cuántas unidades quieres de cada producto. Don Tauro revisará tu solicitud y te
              confirmará el precio.
            </p>
            {catalogo.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay productos.</p>
            ) : (
              <ul className="space-y-3">
                {catalogo.map((p) => {
                  const cantidad = cantidades[p.id] ?? 0;
                  return (
                    <li
                      key={p.id}
                      className="tarjeta-cuero flex items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-lg font-semibold">{p.nombre}</p>
                        <p
                          className={`text-sm font-bold ${
                            p.disponible === 0 ? "text-destructive" : "text-muted-foreground"
                          }`}
                        >
                          {p.disponible === 0 ? "Agotado" : `${p.disponible} disponibles`}
                        </p>
                      </div>
                      {p.disponible > 0 ? (
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Quitar una unidad de ${p.nombre}`}
                            disabled={cantidad === 0}
                            onClick={() => cambiar(p.id, -1, p.disponible)}
                            className="h-12 w-12 rounded-2xl border-2 border-primary bg-card text-2xl font-bold text-primary disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xl font-bold">{cantidad}</span>
                          <button
                            type="button"
                            aria-label={`Agregar una unidad de ${p.nombre}`}
                            disabled={cantidad >= p.disponible}
                            onClick={() => cambiar(p.id, 1, p.disponible)}
                            className="h-12 w-12 rounded-2xl border-2 border-primary bg-card text-2xl font-bold text-primary disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : null}

        {!cargando && pestana === "solicitudes" ? (
          solicitudes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no has solicitado pedidos.</p>
          ) : (
            <ul className="space-y-3">
              {solicitudes.map((s) => {
                const estado = ESTADOS[s.estado] ?? ESTADOS["Solicitado"]!;
                const total = Number(s.monto ?? 0);
                return (
                  <li key={s.id} className="tarjeta-cuero p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}>
                        {estado.texto}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fechaCorta(s.created_at)}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm">
                      {(s.pedido_items ?? []).map((i) => (
                        <li key={i.producto_id}>
                          {i.cantidad} ×{" "}
                          {catalogo.find((c) => c.id === i.producto_id)?.nombre ?? "Producto"}
                        </li>
                      ))}
                    </ul>
                    {total > 0 ? (
                      <p className="mt-3 text-right text-lg font-bold text-primary">
                        {formatoPesos(total)}
                      </p>
                    ) : null}
                    {s.estado === "Anulado" && s.motivo_anulacion ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Motivo: {s.motivo_anulacion}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
      </main>

      {pestana === "productos" ? (
        <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-gradient-to-t from-background via-background to-transparent p-5">
          <button
            type="button"
            onClick={solicitar}
            disabled={enviando || elegidos.length === 0}
            className="superficie-cuero h-16 w-full rounded-2xl text-xl font-bold shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? "Enviando…"
              : elegidos.length === 0
                ? "Elige productos para solicitar"
                : `Solicitar pedido (${elegidos.reduce((s, [, c]) => s + c, 0)} unidades)`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
