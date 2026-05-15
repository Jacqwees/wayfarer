import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const ua = (await headers()).get('user-agent') ?? ''
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  redirect(isMobile ? '/landing-mobile.html' : '/landing-desktop.html')
}
