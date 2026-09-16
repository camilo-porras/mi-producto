import logoTauro from "@/assets/tauro-logo.png";

export function MarcaTauro() {
  return (
    <img
      src={logoTauro}
      alt="Logo de Mano Facturas Tauro"
      className="pointer-events-none absolute right-5 top-8 h-10 w-10 object-contain"
    />
  );
}