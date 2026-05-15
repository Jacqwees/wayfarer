'use client'

import { wmoEmoji, wmoLabel, type WeatherData } from '@/lib/weather'

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tmrw'
  return d.toLocaleDateString('en-GB', { weekday: 'short' })
}

export default function WeatherStrip({ weather }: { weather: WeatherData }) {
  if (!weather.days.length) return null

  return (
    <div className="mb-4 px-5">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            Weather · {weather.city}
          </p>
          <p className="text-[10px] text-muted-foreground">°C</p>
        </div>

        {/* Day columns */}
        <div className="flex overflow-x-auto scrollbar-hide px-2 pb-3 gap-1">
          {weather.days.map((day) => (
            <div
              key={day.date}
              className="flex-1 min-w-[58px] flex flex-col items-center gap-1 px-2 py-2 rounded-xl hover:bg-muted/50 transition-colors shrink-0"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                {dayLabel(day.date)}
              </p>
              <span className="text-[22px] leading-none" title={wmoLabel(day.code)}>
                {wmoEmoji(day.code)}
              </span>
              <div className="text-center">
                <p className="text-[12px] font-semibold text-foreground leading-none">{day.maxC}°</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{day.minC}°</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
