import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const url = process.env.VITE_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!url || !serviceKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

// Simulate login function
const login = async (email, password) => {
  const { data } = await supabase.from('users').select('*').eq('email', email).limit(1)
  if (!data || !data.length) return null
  
  const user = data[0]
  if (user.password !== password) return null
  
  // Map database fields to frontend fields
  return {
    ...user,
    firstName: user.firstName || user.firstname,
    lastName: user.lastName || user.lastname,
    companyName: user.companyName || user.companyname
  }
}

const testLogin = async () => {
  console.log('🧪 Testing login functionality...')
  
  // Test admin login
  console.log('\n1. Testing admin login...')
  const adminUser = await login('lafactory.garges@gmail.com', 'admin')
  if (adminUser) {
    console.log('✅ Admin login successful')
    console.log('Admin user:', JSON.stringify(adminUser, null, 2))
    console.log('Role:', adminUser.role)
    console.log('Is admin?', adminUser.role === 'ADMIN')
  } else {
    console.log('❌ Admin login failed')
  }
  
  // Test user login
  console.log('\n2. Testing user login...')
  const regularUser = await login('jean@example.com', 'user123')
  if (regularUser) {
    console.log('✅ User login successful')
    console.log('User role:', regularUser.role)
    console.log('Is admin?', regularUser.role === 'ADMIN')
  } else {
    console.log('❌ User login failed')
  }
}

testLogin().catch(console.error)