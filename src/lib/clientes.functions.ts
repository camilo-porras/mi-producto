import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const dispositivoSchema = z.string().uuid();

const clienteSchema = z.object({
  dispositivoId: dispositivoSchema,
  nombre: z.string().trim().min(1).max(120),
  negocio: z.string().trim().max(120),
  telefono: z.string().trim().min(1).max(30),
  direccion: z.string().trim().min(1).max(180),
  ciudad: z.string().trim().min(1).max(100),
  departamento: z.string().trim().min(1).max(100),
});

export type FichaCliente = Omit<z.infer<typeof clienteSchema>, "dispositivoId">;

const normalizarNombre = (nombre: string) =>
  nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-CO");

export const listarClientes = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ dispositivoId: dispositivoSchema }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: clientes, error } = await supabaseAdmin
      .from("clientes")
      .select("nombre, negocio, telefono, direccion, ciudad, departamento")
      .eq("dispositivo_hash", data.dispositivoId)
      .order("nombre");

    if (error) throw new Error("No fue posible consultar los clientes guardados.");
    return clientes.map((cliente) => ({
      nombre: cliente.nombre,
      negocio: cliente.negocio ?? "",
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      departamento: cliente.departamento,
    }));
  });

export const guardarCliente = createServerFn({ method: "POST" })
  .inputValidator((data) => clienteSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("clientes").upsert(
      {
        dispositivo_hash: data.dispositivoId,
        nombre: data.nombre,
        nombre_normalizado: normalizarNombre(data.nombre),
        negocio: data.negocio || null,
        telefono: data.telefono,
        direccion: data.direccion,
        ciudad: data.ciudad,
        departamento: data.departamento,
      },
      { onConflict: "dispositivo_hash,nombre_normalizado" },
    );

    if (error) throw new Error("No fue posible guardar los datos del cliente.");
    return { ok: true };
  });