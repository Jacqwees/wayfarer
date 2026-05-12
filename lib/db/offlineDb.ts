import Dexie, { type Table } from 'dexie'

export interface PendingExpense {
  id?: number
  tripId: string
  description: string
  amount: number
  currency: string
  paid_by: string
  category: string
  split_type: 'equal_all' | 'equal_select' | 'custom'
  split_with?: string[]
  custom_splits?: { user_id: string; amount: number }[]
  createdAt: number
}

export class SquadStayDB extends Dexie {
  pendingExpenses!: Table<PendingExpense>

  constructor() {
    super('SquadStayDB')
    this.version(1).stores({
      pendingExpenses: '++id, tripId, createdAt',
    })
  }
}

export const db = new SquadStayDB()
