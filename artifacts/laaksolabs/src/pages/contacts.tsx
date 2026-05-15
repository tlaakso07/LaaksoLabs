import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ContactsView, type ContactWithClient } from '@/components/contacts/contacts-view'
import type { Client } from '@/lib/supabase/types'

export default function ContactsPage() {
  const [data, setData] = useState<{ contacts: ContactWithClient[]; clients: Pick<Client, 'id' | 'name' | 'division'>[] } | null>(null)

  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from('contacts').select('*, clients(name)').order('name'),
      sb.from('clients').select('id, name, division').order('name'),
    ]).then(([{ data: contacts }, { data: clients }]) => {
      setData({ contacts: (contacts ?? []) as ContactWithClient[], clients: (clients ?? []) as Pick<Client, 'id' | 'name' | 'division'>[] })
    })
  }, [])

  if (!data) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} /></div>
  return <ContactsView initialContacts={data.contacts} clients={data.clients} />
}
