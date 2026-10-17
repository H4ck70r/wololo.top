/*
  La marca: WOLOLO en letra de inscripcion, con el .top pegado como sufijo y no
  colgado debajo como un subtitulo roto.

  El sello de la izquierda es un estandarte partido en dos tintas, el azur y el
  gules del monje convirtiendo: la broma mas conocida del juego dicha sin
  dibujar al monje, que es arte del juego y la marca no puede depender de el.
*/
export default function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 20 24"
        className={lg ? 'w-7 h-8' : 'w-[18px] h-[22px]'}
        aria-hidden="true"
      >
        <path d="M1 1h18v15l-9 7-9-7z" fill="#3f74bd" />
        <path d="M10 1h9v15l-9 7z" fill="#c8463b" />
        <path d="M1 1h18v15l-9 7-9-7z" fill="none" stroke="#e3b341" strokeWidth="1.5" />
      </svg>
      <span
        className={`font-display font-bold text-gray-50 ${lg ? 'text-[2rem]' : 'text-[1.35rem]'} leading-none`}
        style={{ letterSpacing: '0.12em' }}
      >
        WOLOLO
        <span className="font-sans font-semibold text-gold-400 tracking-normal" style={{ fontSize: '0.62em', letterSpacing: '0.02em' }}>
          .top
        </span>
      </span>
    </span>
  );
}
