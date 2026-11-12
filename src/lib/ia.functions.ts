import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// La llave de Gemini vive SOLO en el servidor (variable GEMINI_API_KEY, sin prefijo VITE_).
// El navegador nunca la ve. El modelo se puede cambiar con GEMINI_MODEL sin tocar código.
const MODELO_POR_DEFECTO = "gemini-3.5-flash";

const entradaSchema = z.object({
  productos: z
    .array(
      z.object({
        nombre: z.string().trim().max(120),
        stock: z.number().int().min(0),
        disponible: z.number().int().min(0),
        comprometido: z.number().int().min(0),
        vendido30d: z.number().int().min(0),
        producir: z.number().int().min(0),
      }),
    )
    .max(10),
  alertas: z
    .array(z.object({ producto: z.string().trim().max(120), cantidad: z.number().int().min(1) }))
    .max(10),
});

const INSTRUCCION = `Eres el asistente de producción de Mano Facturas Tauro, un taller de marroquinería (artículos de cuero).
Hablas cercano y respetuoso, en español de Colombia, con frases cortas. Solo hablas de inventario y producción.
REGLAS:
- Usa ÚNICAMENTE los números de los datos. Nunca inventes cifras.
- El campo "producir" ya viene calculado: úsalo tal cual, no lo recalcules.
- Si "alertas" trae elementos, empieza con una línea avisando cuál producto se quedó sin unidades por un pedido grande.
- Luego una viñeta por producto (máximo 5), del más urgente al menos urgente: producto, por qué (vendido en 30 días y cuánto queda) y cuántas unidades fabricar.
- Cierra con una frase corta de resumen.
- Si no hay productos, di que el inventario está tranquilo.`;

export const analizarInventarioIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => entradaSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Solo el personal (Don Tauro o Ayudante) puede usar la IA: así nadie gasta tu cuota.
    const sb = context.supabase as unknown as SupabaseClient;
    const { data: perfil } = await sb
      .from("perfiles")
      .select("rol")
      .eq("id", context.userId)
      .maybeSingle();
    if (!perfil || (perfil.rol !== "dueno" && perfil.rol !== "ayudante")) {
      throw new Error("Solo el personal puede usar el asistente.");
    }

    const llave = process.env["GEMINI_API_KEY"];
    if (!llave) throw new Error("Falta configurar GEMINI_API_KEY en el servidor.");
    const modelo = process.env["GEMINI_MODEL"] || MODELO_POR_DEFECTO;

    let respuesta: Response;
    try {
      respuesta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": llave },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: INSTRUCCION }] },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Datos del inventario (JSON):\n${JSON.stringify(data)}\n\nDame el análisis y la recomendación de producción para el próximo mes.`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
          }),
          signal: AbortSignal.timeout(25000),
        },
      );
    } catch {
      throw new Error("Gemini tardó demasiado o no hay conexión. Intenta de nuevo.");
    }

    if (!respuesta.ok) {
      console.error("Gemini respondió", respuesta.status, await respuesta.text().catch(() => ""));
      throw new Error("Gemini no pudo responder ahora. Intenta de nuevo en un momento.");
    }

    const json = (await respuesta.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const texto = (json.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!texto) throw new Error("Gemini devolvió una respuesta vacía. Intenta de nuevo.");
    return { texto };
  });
