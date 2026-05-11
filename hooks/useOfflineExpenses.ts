'use client'

import { useState, useEffect, useCallback } from 'react'
import { db, type PendingExpense } from '@/lib/db/offlineDb'
import { addExpense } from '@/app/actions/expenses'

export function useOfflineExpenses(tripId: string) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    db.pendingExpenses.where('tripId').equals(tripId).toArray().then(setPendingExpenses)
  }, [tripId])

  const syncPending = useCallback(async () => {
    const pending = await db.pendingExpenses.where('tripId').equals(tripId).toArray()
    if (pending.length === 0) return
    setSyncing(true)
    for (const exp of pending) {
      const res = await addExpense(tripId, {
        description: exp.description,
        amount: exp.amount,
        currency: exp.currency,
        paid_by: exp.paid_by,
        category: exp.category,
        split_type: exp.split_type,
        split_with: exp.split_with,
        custom_splits: exp.custom_splits,
      })
      if (!res.error && exp.id !== undefined) {
        await db.pendingExpenses.delete(exp.id)
      }
    }
    setPendingExpenses([])
    setSyncing(false)
  }, [tripId])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingExpenses.length > 0) {
      syncPending()
    }
  }, [isOnline, pendingExpenses.length, syncPending])

  const queueExpense = useCallback(async (data: Omit<PendingExpense, 'id' | 'tripId' | 'createdAt'>) => {
    const id = await db.pendingExpenses.add({ ...data, tripId, createdAt: Date.now() })
    const all = await db.pendingExpenses.where('tripId').equals(tripId).toArray()
    setPendingExpenses(all)
    return id
  }, [tripId])

  return { isOnline, pendingExpenses, syncing, queueExpense, syncPending }
}
