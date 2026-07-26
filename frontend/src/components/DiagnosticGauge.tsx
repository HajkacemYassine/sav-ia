/**
 * DiagnosticGauge — élément signature de l'interface.
 *
 * Inspiré des cadrans d'instruments de mesure (multimètre, manomètre)
 * qu'un technicien SAV utilise réellement sur le terrain. Le score de
 * confiance de l'IA est ici traité comme une vraie mesure d'instrument,
 * pas comme une barre de progression générique.
 */
export function DiagnosticGauge({
  value,
  size = 132,
  label = 'Confiance IA',
}: {
  value: number // 0..1
  size?: number
  label?: string
}) {
  const pct = Math.max(0, Math.min(1, value))
  const stroke = 8
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2

  // Arc de 270° (comme un cadran de manomètre), de -225° à +45°
  const startAngle = -225
  const sweep = 270
  const endAngle = startAngle + sweep * pct

  const toXY = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
  }

  const describeArc = (a0: number, a1: number) => {
    const [x0, y0] = toXY(a0)
    const [x1, y1] = toXY(a1)
    const largeArc = a1 - a0 > 180 ? 1 : 0
    return `M ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1}`
  }

  const trackPath = describeArc(startAngle, startAngle + sweep)
  const valuePath = describeArc(startAngle, endAngle)

  const color =
    pct >= 0.75 ? '#158F63' : pct >= 0.5 ? '#3358F4' : pct >= 0.3 ? '#E88C12' : '#D6432E'

  const ticks = Array.from({ length: 12 }, (_, i) => startAngle + (sweep / 11) * i)

  return (
    <div className="inline-flex flex-col items-center" role="img" aria-label={`${label} : ${Math.round(pct * 100)} pour cent`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ticks.map((angle, i) => {
          const [x1, y1] = toXY(angle)
          const rad = (angle * Math.PI) / 180
          const x2 = cx + (r - 5) * Math.cos(rad)
          const y2 = cy + (r - 5) * Math.sin(rad)
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#C7CBD2"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          )
        })}
        <path
          d={trackPath}
          fill="none"
          stroke="#E4E6EA"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={valuePath}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease-out' }}
        />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          className="font-mono"
          fontSize={size * 0.19}
          fontWeight={600}
          fill="#1F242C"
        >
          {Math.round(pct * 100)}
        </text>
        <text
          x={cx}
          y={cy + size * 0.14}
          textAnchor="middle"
          className="font-mono"
          fontSize={size * 0.08}
          fill="#727A87"
        >
          / 100
        </text>
      </svg>
      <span className="label-caps -mt-1 text-graphite-400">{label}</span>
    </div>
  )
}
