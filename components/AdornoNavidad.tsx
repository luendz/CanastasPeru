/** Ramas de pino con bayas y una estrella, para decorar tarjetas y secciones. */
export default function AdornoNavidad({ className, estrella = true }: { className?: string; estrella?: boolean }) {
  const ramas = [
    "M100 52 C80 46 58 46 30 54", "M100 52 C120 46 142 46 170 54",
    "M100 54 C84 58 66 64 44 70", "M100 54 C116 58 134 64 156 70",
  ];
  const agujas: string[] = [];
  for (const [x0, dir] of [[100, -1], [100, 1]] as const) {
    for (let i = 1; i <= 9; i++) {
      const x = x0 + dir * i * 7.5;
      const y = 50 + Math.abs(i - 4) * 0.6;
      agujas.push(`M${x} ${y} l${dir * -5} -8`, `M${x} ${y + 2} l${dir * -6} 7`);
    }
  }
  return (
    <svg className={className ?? "adornoNavidad"} viewBox="0 0 200 80" aria-hidden="true">
      <g stroke="#2f5d3a" strokeWidth="2.2" strokeLinecap="round" fill="none">
        {ramas.map((d) => <path key={d} d={d} />)}
      </g>
      <g stroke="#3f7a4b" strokeWidth="1.6" strokeLinecap="round">
        {agujas.map((d, i) => <path key={i} d={d} />)}
      </g>
      <g fill="#b3202f">
        {[[84, 58], [91, 63], [79, 64], [112, 60], [119, 65], [107, 66], [58, 60], [144, 61]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.6" />)}
      </g>
      <g fill="#d9a441">
        {[[70, 48], [132, 49], [96, 66]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" />)}
      </g>
      {estrella && <path d="M100 18l4.2 9 9.8 1.1-7.3 6.7 2 9.7-8.7-5-8.7 5 2-9.7-7.3-6.7 9.8-1.1z" fill="#d9a441" />}
    </svg>
  );
}
