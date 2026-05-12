const SUPABASE_URL = 'https://latvdryfgdqzxaposkzm.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_cNE6m0OcdPR0sjQaHCu_VA_ylPVmKDp'

const { createClient } = supabase
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const channel = client.channel('online-users', {
    config: { presence: { key: crypto.randomUUID() } }
})

function updateCount(state) {
    const count = Object.keys(state).length
    const el = document.getElementById('online-count')
    if (!el) return

    if (count >= 200) {
        el.textContent = '200+'
    } else {
        el.textContent = count
    }
}

channel
    .on('presence', { event: 'sync' }, () => {
        updateCount(channel.presenceState())
    })
    .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.track({ online_at: new Date().toISOString() })
        }
    })