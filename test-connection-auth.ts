
import { createClient } from '@supabase/supabase-js'

const url = 'https://oawkctztcuoxeszukukp.supabase.co'
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hd2tjdHp0Y3VveGVzenVrdWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjY0NzQsImV4cCI6MjA3NDkwMjQ3NH0.FHrnEghIdp7a9YcvWs3ji5Ibl4UAEFnU1x5IT2-VEr0'

const supabase = createClient(url, anon, {
    auth: {
        persistSession: false
    }
})

async function run() {
    const email = `test_${Date.now()}@example.com`
    const password = 'Password123!'

    console.log(`Signing up test user: ${email}...`)
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError) {
        console.error('Auth Error:', authError)
        return
    }

    console.log('Signed in as:', authData.user?.id)

    console.log('Testing authenticated query (articles)...')
    try {
        const start = Date.now()
        const { data, error } = await supabase
            .from('blog_articles')
            .select('*')
            .eq('status', 'published')
            .limit(1)

        if (error) console.error('Error:', error)
        else console.log('Success (articles):', data?.length, 'Time:', Date.now() - start, 'ms')
    } catch (e) {
        console.error('Exception:', e)
    }

    console.log('Testing authenticated query (doctors)...')
    try {
        const start = Date.now()
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('role', 'doctor')
            .limit(1)

        if (error) console.error('Error:', error)
        else console.log('Success (doctors):', data?.length, 'Time:', Date.now() - start, 'ms')
    } catch (e) {
        console.error('Exception:', e)
    }

    // Clean up? We can't delete users easily from client side typically unless admins.
}

run()
