import { createAdminClient } from '@/lib/supabase/server'
import { ContactsView } from '@/components/contacts/contacts-view'
import type { Client } from '@/lib/supabase/types'
import type { ContactWithClient } from '@/components/contacts/contacts-view'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const db = createAdminClient()
  const [contactsRes, clientsRes] = await Promise.all([
    db.from('contacts').select('*, clients(name)').order('name'),
    db.from('clients').select('id, name, division').order('name'),
  ])

  return (
    <ContactsView
      initialContacts={(contactsRes.data ?? []) as ContactWithClient[]}
      clients={(clientsRes.data ?? []) as Pick<Client, 'id' | 'name' | 'division'>[]}
    />
  )
}
