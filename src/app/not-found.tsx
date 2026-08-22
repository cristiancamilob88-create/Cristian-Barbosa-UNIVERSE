import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-start gap-4 py-32">
      <p className="font-mono text-xs uppercase tracking-widest text-ember">404</p>
      <h1 className="font-display text-4xl font-black uppercase tracking-tight text-chalk">
        Esta página no existe
      </h1>
      <p className="text-steel">El enlace que seguiste no lleva a ninguna parte del universo.</p>
      <Link href="/" className="text-sm font-semibold uppercase tracking-wide text-ember">
        Volver al inicio
      </Link>
    </Container>
  );
}
