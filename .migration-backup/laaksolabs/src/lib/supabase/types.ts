export type Division = 'div1' | 'div2' | 'div3'

export type ClientStatus =
  | 'prospect'
  | 'lead'
  | 'proposal'
  | 'onboarding'
  | 'active'
  | 'paused'
  | 'churned'

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done'

export type TaskCategory =
  | 'sales'
  | 'delivery'
  | 'operations'
  | 'creative'
  | 'campaigns'

export type RevenueType = 'retainer' | 'project' | 'equity' | 'other'

export type RevenueStatus = 'expected' | 'invoiced' | 'paid' | 'overdue'

export type HappyDogStatus =
  | 'not_ordered'
  | 'ordered'
  | 'in_progress'
  | 'review'
  | 'delivered'
  | 'revision'

export type CampaignPlatform = 'meta' | 'google' | 'other'

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'

export type ActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'milestone'
  | 'payment'

export interface Client {
  id: string
  name: string
  owner_name: string | null
  division: Division
  status: ClientStatus
  retainer_amount: number | null
  phone: string | null
  email: string | null
  website: string | null
  location: string | null
  services: string[] | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RevenueEntry {
  id: string
  client_id: string
  amount: number
  type: RevenueType
  month: string
  status: RevenueStatus
  notes: string | null
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  client_id: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  category: TaskCategory
  created_at: string
  completed_at: string | null
}

export interface HappyDogOrder {
  id: string
  client_id: string
  deliverable: string
  status: HappyDogStatus
  hd_cost: number | null
  client_price: number | null
  margin: number | null
  ordered_date: string | null
  delivered_date: string | null
  notes: string | null
  created_at: string
}

export interface Contact {
  id: string
  name: string
  role: string | null
  company: string | null
  phone: string | null
  email: string | null
  notes: string | null
  client_id: string | null
  created_at: string
}

export interface Campaign {
  id: string
  client_id: string
  platform: CampaignPlatform
  campaign_name: string
  status: CampaignStatus
  daily_budget: number | null
  spend_mtd: number | null
  leads_mtd: number | null
  cost_per_lead: number | null
  ctr: number | null
  notes: string | null
  last_synced: string | null
}

export interface ActivityLog {
  id: string
  client_id: string | null
  type: ActivityType
  content: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id' | 'created_at'>>
      }
      revenue_entries: {
        Row: RevenueEntry
        Insert: Omit<RevenueEntry, 'id' | 'created_at'>
        Update: Partial<Omit<RevenueEntry, 'id' | 'created_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at'>>
      }
      happydog_orders: {
        Row: HappyDogOrder
        Insert: Omit<HappyDogOrder, 'id' | 'created_at'>
        Update: Partial<Omit<HappyDogOrder, 'id' | 'created_at'>>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at'>
        Update: Partial<Omit<Contact, 'id' | 'created_at'>>
      }
      campaigns: {
        Row: Campaign
        Insert: Omit<Campaign, 'id'>
        Update: Partial<Omit<Campaign, 'id'>>
      }
      activity_log: {
        Row: ActivityLog
        Insert: Omit<ActivityLog, 'id' | 'created_at'>
        Update: Partial<Omit<ActivityLog, 'id' | 'created_at'>>
      }
    }
  }
}
