/**
 * SquadStay changelog — add a new entry at the TOP for each release.
 * Bump CURRENT_VERSION to the newest entry's version to trigger the gate.
 *
 * Version format: 'YYYY-MM-DD' — simple, readable, sorts correctly as a string.
 */

export const CURRENT_VERSION = '2026-05-14'

export type ChangelogFeature = {
  icon: string
  title: string
  body: string
}

export type ChangelogEntry = {
  version: string        // must match CURRENT_VERSION for the latest entry
  label: string          // e.g. 'May 2026'
  headline: string       // big bold title shown on the card
  emoji: string          // large decorative emoji
  features: ChangelogFeature[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2026-05-14',
    label: 'May 2026',
    headline: "It's getting better in here.",
    emoji: '✈️',
    features: [
      {
        icon: '🌤️',
        title: 'Live weather on your dashboard',
        body: 'See a 7-day forecast for your destination right on the trip dashboard. Powered by Open-Meteo — no API key, no nonsense.',
      },
      {
        icon: '🌍',
        title: 'Language-ready',
        body: 'All text now lives in one file. French, Spanish, German — swap a single locale string and the entire app translates. More languages coming.',
      },
      {
        icon: '✈️',
        title: 'Airport search',
        body: 'Type a city or IATA code in the flights form and get instant suggestions — 380 airports, fully offline.',
      },
      {
        icon: '🌙',
        title: 'Dark mode',
        body: 'Auto, light, or dark — your choice. The app respects your system preference by default. Flip it in your profile settings.',
      },
      {
        icon: '👤',
        title: 'Squad profiles',
        body: "Tap any member's avatar to see their profile — bio, travel style, stats. Privacy settings control exactly what they can see.",
      },
      {
        icon: '🔗',
        title: 'Share link invites',
        body: 'Generate a one-click join link that works even for people who don\'t have an account yet. They\'ll land straight in your trip after sign-up.',
      },
    ],
  },
  {
    version: '2026-04-01',
    label: 'April 2026',
    headline: 'The first build.',
    emoji: '🏕️',
    features: [
      {
        icon: '🗓️',
        title: 'Trips & itinerary',
        body: 'Create trips, set dates, build a day-by-day plan. Everyone in the squad can view and edit together.',
      },
      {
        icon: '💸',
        title: 'Expenses',
        body: 'Log what you spent and who paid. Auto-split across the squad and see who owes who at a glance.',
      },
      {
        icon: '🧳',
        title: 'Packing list',
        body: 'Shared checklist everyone can tick off. Assign items. No more "I thought you packed the sunscreen."',
      },
      {
        icon: '🏨',
        title: 'Hotel & flights',
        body: 'Store your booking refs, check-in times, and flight details in one place the whole squad can see.',
      },
      {
        icon: '📍',
        title: 'Places',
        body: 'Save restaurants, beaches, and spots. Search with Google Places and build your hit list before you land.',
      },
    ],
  },
]
