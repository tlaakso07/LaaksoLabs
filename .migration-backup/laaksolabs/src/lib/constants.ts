import type { Division, ClientStatus, TaskPriority, HappyDogStatus, RevenueStatus } from './supabase/types'

export const REVENUE_TARGET = 200000

export const DIVISION_LABELS: Record<Division, string> = {
  div1: 'Div 1',
  div2: 'Div 2',
  div3: 'Div 3',
}

export const DIVISION_FULL_LABELS: Record<Division, string> = {
  div1: 'AI Design & Marketing',
  div2: 'AI Consulting & SEO',
  div3: 'The Fund',
}

export const DIVISION_COLORS: Record<Division, string> = {
  div1: '#6C6C70',
  div2: '#8A78B4',
  div3: '#6C6C70',
}

export const DIVISION_TARGET_RETAINER: Record<Division, number> = {
  div1: 7500,
  div2: 15000,
  div3: 0,
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  prospect: 'Prospect',
  lead: 'Lead',
  proposal: 'Proposal',
  onboarding: 'Onboarding',
  active: 'Active',
  paused: 'Paused',
  churned: 'Churned',
}

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  prospect: '#3B82F6',
  lead: '#3B82F6',
  proposal: '#8B5CF6',
  onboarding: '#EAB308',
  active: '#22C55E',
  paused: '#EF4444',
  churned: '#EF4444',
}

export const PIPELINE_STATUSES: ClientStatus[] = [
  'prospect',
  'lead',
  'proposal',
  'onboarding',
  'active',
]

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#6B7280',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const HAPPYDOG_STATUS_LABELS: Record<HappyDogStatus, string> = {
  not_ordered: 'Not Ordered',
  ordered: 'Ordered',
  in_progress: 'In Progress',
  review: 'Review',
  delivered: 'Delivered',
  revision: 'Revision',
}

export const REVENUE_STATUS_LABELS: Record<RevenueStatus, string> = {
  expected: 'Expected',
  invoiced: 'Invoiced',
  paid: 'Paid',
  overdue: 'Overdue',
}

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Clients', href: '/clients', icon: 'Users' },
  { label: 'Tasks', href: '/tasks', icon: 'CheckSquare' },
  { label: 'Happy Dog', href: '/happydog', icon: 'Package' },
  { label: 'Revenue', href: '/revenue', icon: 'DollarSign' },
  { label: 'Contacts', href: '/contacts', icon: 'BookUser' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
]
