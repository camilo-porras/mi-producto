import logoTauro from "@/assets/tauro-logo.png";

export function MarcaTauro() {
  return (
    <img
      src={logoTauro}
      alt="Logo de Mano Facturas Tauro"
      className="pointer-events-none absolute right-4 top-1/2 h-28 w-28 -translate-y-1/2 object-contain"
    />
  );
}