'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { sendPushToUser } from './push'

async function getFxRate(currency: string): Promise<number> {
  if (currency === 'GBP') return 1
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${currency}&to=GBP`)
    const data = await res.json()
    return data.rates?.GBP ?? 1
  } catch {
    return 1
  }
}

export async function addExpense(tripId: string, data: {
  description: string
  amount: number
  currency: string
  paid_by: string
  category: string
  split_type: 'equal_all' | 'equal_select' | 'custom'
  split_with?: string[]
  custom_splits?: { user_id: string; amount: number }[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()

  const fx_rate = await getFxRate(data.currency)
  const amount_gbp = data.amount * fx_rate

  const { data: expense, error: expErr } = await db.from('expenses').insert({
    trip_id: tripId,
    description: data.description,
    amount: data.amount,
    currency: data.currency,
    amount_gbp,
    fx_rate_used: fx_rate,
    paid_by: data.paid_by,
    category: data.category,
    split_type: data.split_type,
    added_by: user.id,
  }).select('id').single()

  if (expErr || !expense) return { error: expErr?.message ?? 'Failed to create expense' }

  let splits: { expense_id: string; user_id: string; amount_owed: number }[] = []

  if (data.split_type === 'equal_all') {
    const { data: members } = await db.from('trip_members').select('user_id').eq('trip_id', tripId)
    const memberIds = (members ?? []).map(m => m.user_id)
    const share = amount_gbp / memberIds.length
    splits = memberIds.map(uid => ({ expense_id: expense.id, user_id: uid, amount_owed: uid === data.paid_by ? 0 : share }))
  } else if (data.split_type === 'equal_select' && data.split_with?.length) {
    const share = amount_gbp / (data.split_with.length + (data.split_with.includes(data.paid_by) ? 0 : 1))
    const all = data.split_with.includes(data.paid_by) ? data.split_with : [...data.split_with, data.paid_by]
    splits = all.map(uid => ({ expense_id: expense.id, user_id: uid, amount_owed: uid === data.paid_by ? 0 : share }))
  } else if (data.split_type === 'custom' && data.custom_splits?.length) {
    splits = data.custom_splits.map(s => ({ expense_id: expense.id, user_id: s.user_id, amount_owed: s.amount }))
  }

  if (splits.length > 0) {
    await db.from('expense_splits').insert(splits)
  }

  // Notify trip members
  const { data: members } = await db.from('trip_members').select('user_id').eq('trip_id', tripId).neq('user_id', user.id)
  const { data: profile } = await db.from('users').select('display_name').eq('id', user.id).single()
  const { data: trip } = await db.from('trips').select('name').eq('id', tripId).single()
  if (members && members.length > 0) {
    await db.from('notifications').insert(
      members.map(m => ({
        user_id: m.user_id,
        type: 'expense_added',
        trip_id: tripId,
        reference_id: expense.id,
        message: `${profile?.display_name ?? 'Someone'} added £${amount_gbp.toFixed(2)} expense to ${trip?.name}: ${data.description}`,
      }))
    )
  }

  // Push notification to members
  if (members && members.length > 0) {
    for (const m of members) {
      sendPushToUser(m.user_id, { title: 'New expense added', body: `${profile?.display_name ?? 'Someone'}: £${amount_gbp.toFixed(2)} — ${data.description}`, url: `/trips/${tripId}/expenses`, tag: 'expense' }).catch(() => {})
    }
  }

  revalidatePath(`/trips/${tripId}/expenses`)
  return { success: true }
}

export async function recordPayment(tripId: string, toUserId: string, amount: number, note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { data: payment, error } = await db.from('payments').insert({
    trip_id: tripId,
    from_user_id: user.id,
    to_user_id: toUserId,
    amount,
    note: note || null,
    status: 'pending',
  }).select('id').single()

  if (error) return { error: error.message }

  const { data: profile } = await db.from('users').select('display_name').eq('id', user.id).single()
  const { data: trip } = await db.from('trips').select('name').eq('id', tripId).single()
  await db.from('notifications').insert({
    user_id: toUserId,
    type: 'payment_pending',
    trip_id: tripId,
    reference_id: payment.id,
    message: `${profile?.display_name ?? 'Someone'} sent you £${amount.toFixed(2)} in ${trip?.name} — confirm when received`,
  })

  sendPushToUser(toUserId, { title: 'Payment received', body: `${profile?.display_name ?? 'Someone'} sent you £${amount.toFixed(2)} — confirm when received`, url: `/trips/${tripId}/expenses`, tag: 'payment' }).catch(() => {})

  revalidatePath(`/trips/${tripId}/expenses`)
  return { success: true }
}

export async function confirmPayment(tripId: string, paymentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { data: payment } = await db.from('payments').select('*').eq('id', paymentId).single()
  if (!payment) return { error: 'Payment not found' }
  if (payment.to_user_id !== user.id) return { error: 'Not authorised' }

  await db.from('payments').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', paymentId)

  const { data: profile } = await db.from('users').select('display_name').eq('id', user.id).single()
  const { data: trip } = await db.from('trips').select('name').eq('id', tripId).single()
  await db.from('notifications').insert({
    user_id: payment.from_user_id,
    type: 'payment_confirmed',
    trip_id: tripId,
    reference_id: paymentId,
    message: `${profile?.display_name ?? 'Someone'} confirmed your £${payment.amount.toFixed(2)} payment in ${trip?.name}`,
  })

  sendPushToUser(payment.from_user_id, { title: 'Payment confirmed!', body: `${profile?.display_name ?? 'Someone'} confirmed your £${payment.amount.toFixed(2)} payment`, url: `/trips/${tripId}/expenses`, tag: 'payment' }).catch(() => {})

  revalidatePath(`/trips/${tripId}/expenses`)
  return { success: true }
}

export async function disputeSplit(tripId: string, splitId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  await db.from('expense_splits').update({ status: 'disputed', disputed_at: new Date().toISOString() }).eq('id', splitId).eq('user_id', user.id)

  // Notify the person who paid that their split has been disputed
  const { data: split } = await db.from('expense_splits').select('expense_id').eq('id', splitId).single()
  if (split) {
    const { data: expense } = await db.from('expenses').select('paid_by, description').eq('id', split.expense_id).single()
    if (expense && expense.paid_by !== user.id) {
      const { data: profile } = await db.from('users').select('display_name').eq('id', user.id).single()
      const { data: trip } = await db.from('trips').select('name').eq('id', tripId).single()
      await db.from('notifications').insert({
        user_id: expense.paid_by,
        type: 'expense_disputed',
        trip_id: tripId,
        reference_id: splitId,
        message: `${profile?.display_name ?? 'Someone'} disputed their share of "${expense.description}" in ${trip?.name}`,
      })
      sendPushToUser(expense.paid_by, {
        title: 'Split disputed',
        body: `${profile?.display_name ?? 'Someone'} disputed their share of "${expense.description}"`,
        url: `/trips/${tripId}/expenses`,
        tag: 'expense',
      }).catch(() => {})
    }
  }

  revalidatePath(`/trips/${tripId}/expenses`)
  return { success: true }
}

export async function nudgePayer(tripId: string, toUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const db = createServiceClient()
  const { data: profile } = await db.from('users').select('display_name').eq('id', user.id).single()
  const { data: trip } = await db.from('trips').select('name').eq('id', tripId).single()
  await db.from('notifications').insert({
    user_id: toUserId,
    type: 'nudge',
    trip_id: tripId,
    message: `${profile?.display_name ?? 'Someone'} is waiting for you to settle up in ${trip?.name}`,
  })

  sendPushToUser(toUserId, { title: '👋 Settle up reminder', body: `${profile?.display_name ?? 'Someone'} is waiting for you to settle up in ${trip?.name}`, url: `/trips/${tripId}/expenses`, tag: 'nudge' }).catch(() => {})

  return { success: true }
}
