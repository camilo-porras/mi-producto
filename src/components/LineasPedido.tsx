import { STOCK_BAJO, formatoPesos, type LineaForm, type ProductoVista } from "@/lib/pedidos";

const etiqueta = "block text-sm font-bold text-muted-foreground mb-2";
const campo =
  "w-full rounded-2xl border border-border bg-card px-4 py-4 text-lg outline-none focus:border-primary";

// Cuántas unidades se pueden pedir de un producto. Al editar un pedido, sus propias
// unidades (ya apartadas) no cuentan contra él.
export const limiteDe = (prod: ProductoVista, propias?: Record<string, number>) =>
  Math.max(prod.stock - (prod.comprometido - (propias?.[prod.id] ?? 0)), 0);

export const totalDe = (lineas: LineaForm[]) =>
  lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);

// Hay al menos un renglón y todos son válidos (producto, cantidad, precio y stock).
export function lineasValidas(
  lineas: LineaForm[],
  productos: ProductoVista[],
  propias?: Record<string, number>,
) {
  if (lineas.length === 0) return false;
  return lineas.every((l) => {
    const prod = productos.find((p) => p.id === l.productoId);
    return (
      !!prod && l.cantidad >= 1 && l.precioUnitario >= 0 && l.cantidad <= limiteDe(prod, propias)
    );
  });
}

// Crea un renglón nuevo con el primer producto que todavía no está en el pedido.
export function lineaNueva(
  productos: ProductoVista[],
  lineas: LineaForm[],
  propias?: Record<string, number>,
): LineaForm | null {
  const libres = productos.filter((p) => !lineas.some((l) => l.productoId === p.id));
  const elegido = libres.find((p) => limiteDe(p, propias) > 0) ?? libres[0];
  return elegido ? { productoId: elegido.id, cantidad: 1, precioUnitario: 45000 } : null;
}

type Props = {
  lineas: LineaForm[];
  onChange: (lineas: LineaForm[]) => void;
  productos: ProductoVista[];
  propias?: Record<string, number>;
};

// Los renglones de un pedido: cada uno es un producto con su cantidad y su precio.
export function LineasPedido({ lineas, onChange, productos, propias }: Props) {
  const cambiar = (i: number, cambio: Partial<LineaForm>) =>
    onChange(lineas.map((l, k) => (k === i ? { ...l, ...cambio } : l)));
  const quitar = (i: number) => onChange(lineas.filter((_, k) => k !== i));
  const siguiente = lineaNueva(productos, lineas, propias);

  return (
    <div className="space-y-4">
      {lineas.map((l, i) => {
        const prod = productos.find((p) => p.id === l.productoId);
        const limite = prod ? limiteDe(prod, propias) : 0;
        const noAlcanza = l.cantidad > limite;
        // Un producto solo puede estar una vez en el pedido
        const opciones = productos.filter(
          (p) => p.id === l.productoId || !lineas.some((o) => o.productoId === p.id),
        );

        return (
          <div key={l.productoId} className="tarjeta-cuero space-y-4 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-muted-foreground">Producto {i + 1}</span>
              {lineas.length > 1 ? (
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  className="text-sm font-semibold text-destructive underline"
                >
                  Quitar
                </button>
              ) : null}
            </div>

            <div>
              <label className={etiqueta} htmlFor={`prod-${i}`}>
                Producto
              </label>
              <select
                id={`prod-${i}`}
                className={campo}
                value={l.productoId}
                onChange={(e) => cambiar(i, { productoId: e.target.value })}
              >
                {opciones.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              {prod ? (
                <div className="mt-2">
                  <p
                    className={`text-sm font-bold ${
                      noAlcanza ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    Disponibles: {limite}
                    {noAlcanza
                      ? ` · pides ${l.cantidad}: no puedes tomar este pedido`
                      : limite <= STOCK_BAJO
                        ? " · stock bajo"
                        : ""}
                  </p>
                  {prod.comprometido - (propias?.[prod.id] ?? 0) > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {prod.stock} en bodega · {prod.comprometido - (propias?.[prod.id] ?? 0)}{" "}
                      apartadas por otros pedidos
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={etiqueta} htmlFor={`cant-${i}`}>
                  Cantidad
                </label>
                <input
                  id={`cant-${i}`}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className={campo}
                  value={l.cantidad}
                  onChange={(e) =>
                    cambiar(i, { cantidad: Math.max(1, Math.floor(Number(e.target.value))) })
                  }
                />
              </div>
              <div>
                <label className={etiqueta} htmlFor={`precio-${i}`}>
                  Precio unitario
                </label>
                <input
                  id={`precio-${i}`}
                  type="number"
                  min={0}
                  step={1000}
                  inputMode="numeric"
                  className={campo}
                  value={l.precioUnitario}
                  onChange={(e) =>
                    cambiar(i, { precioUnitario: Math.max(0, Number(e.target.value)) })
                  }
                />
              </div>
            </div>

            <p className="text-right text-sm font-bold text-muted-foreground">
              Subtotal: {formatoPesos(l.cantidad * l.precioUnitario)}
            </p>
          </div>
        );
      })}

      <button
        type="button"
        disabled={!siguiente}
        onClick={() => siguiente && onChange([...lineas, siguiente])}
        className="h-14 w-full rounded-2xl border-2 border-primary bg-card text-base font-bold text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {siguiente ? "+ Agregar otro producto" : "Ya agregaste todos los productos"}
      </button>
    </div>
  );
}
