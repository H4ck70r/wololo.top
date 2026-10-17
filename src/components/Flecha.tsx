/* Triangulo dibujado, en lugar de los glifos Unicode ▲▼, que cambian de forma
   y de peso segun la fuente de cada sistema. */
export default function Flecha({ arriba, className = 'w-2 h-2' }: { arriba: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={`inline-block ${className}`} aria-hidden="true">
      <path d={arriba ? 'M5 1 9.5 9h-9z' : 'M5 9 .5 1h9z'} fill="currentColor" />
    </svg>
  );
}
