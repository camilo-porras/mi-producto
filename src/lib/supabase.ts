import { createClient } from "@supabase/supabase-js";

//Las llaves NO se escriben aqui estas vienen de las variables de entorno (Vercel).
const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const llave = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

if (!url || !llave) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Revisa las variables de entorno en Vercel.",
  );
}

export const supabase = createClient(url, llave);
