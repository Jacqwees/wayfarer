/**
 * Weather helpers — powered by Open-Meteo (free, no API key required).
 * Fetches a geocoded forecast for a trip destination within the trip date window.
 * Falls back gracefully: if anything fails, returns null and the UI hides the strip.
 */

export type DayForecast = {
  date: string      // 'YYYY-MM-DD'
  maxC: number
  minC: number
  code: number      // WMO weather interpretation code
}

export type WeatherData = {
  city: string
  days: DayForecast[]
}

/** WMO weather code → emoji. https://open-meteo.com/en/docs */
const WMO: Record<number, string> = {
  0: '☀️',
  1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

export function wmoEmoji(code: number): string {
  return WMO[code] ?? '🌡️'
}

export function wmoLabel(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  if (code <= 86) return 'Snow'
  return 'Storms'
}

function fmt(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * Fetch a weather forecast for a trip.
 *
 * @param destination  e.g. "Barcelona, Spain"
 * @param startDate    'YYYY-MM-DD'
 * @param endDate      'YYYY-MM-DD'
 *
 * Caps forecast at 7 days ahead (Open-Meteo free tier limit).
 * Only returns days within [max(today, startDate), min(endDate, today+6)].
 * Returns null if the trip is in the past or an error occurs.
 */
export async function fetchWeather(
  destination: string,
  startDate: string,
  endDate: string,
): Promise<WeatherData | null> {
  try {
    const city = destination.split(',')[0].trim()

    // 1. Geocode
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    const geoRes = await fetch(geoUrl, { next: { revalidate: 3600 } })
    if (!geoRes.ok) return null
    const geo: { results?: { latitude: number; longitude: number }[] } = await geoRes.json()
    if (!geo.results?.length) return null

    const { latitude, longitude } = geo.results[0]

    // 2. Work out the date range to fetch
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tripStart = new Date(startDate + 'T00:00:00')
    const tripEnd   = new Date(endDate + 'T00:00:00')

    // Open-Meteo free = 7 days ahead maximum
    const maxEnd = new Date(today)
    maxEnd.setDate(maxEnd.getDate() + 6)

    const fetchStart = tripStart < today ? today : tripStart
    const fetchEnd   = tripEnd   < maxEnd ? tripEnd : maxEnd

    // Trip entirely in the past — nothing to show
    if (fetchStart > fetchEnd) return null

    // 3. Fetch forecast
    const forecastUrl = [
      `https://api.open-meteo.com/v1/forecast`,
      `?latitude=${latitude}&longitude=${longitude}`,
      `&daily=temperature_2m_max,temperature_2m_min,weathercode`,
      `&timezone=auto`,
      `&start_date=${fmt(fetchStart)}&end_date=${fmt(fetchEnd)}`,
    ].join('')

    const forecastRes = await fetch(forecastUrl, { next: { revalidate: 3600 } })
    if (!forecastRes.ok) return null

    const data: {
      daily?: {
        time: string[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        weathercode: number[]
      }
    } = await forecastRes.json()
    if (!data.daily) return null

    const days: DayForecast[] = data.daily.time.map((date, i) => ({
      date,
      maxC: Math.round(data.daily!.temperature_2m_max[i]),
      minC: Math.round(data.daily!.temperature_2m_min[i]),
      code: data.daily!.weathercode[i],
    }))

    return { city, days }
  } catch {
    return null
  }
}
