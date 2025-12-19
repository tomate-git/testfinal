import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const url = process.env.VITE_SUPABASE_URL || ''
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!url || !serviceKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const testCRUD = async () => {
  console.log('🧪 Testing Supabase CRUD operations...')
  
  try {
    // Test 1: Read all spaces
    console.log('\n1. Testing READ spaces...')
    const { data: spaces, error: spacesError } = await supabase.from('spaces').select('*')
    if (spacesError) throw spacesError
    console.log(`✅ Found ${spaces.length} spaces`)
    
    // Test 2: Read all users
    console.log('\n2. Testing READ users...')
    const { data: users, error: usersError } = await supabase.from('users').select('*')
    if (usersError) throw usersError
    console.log(`✅ Found ${users.length} users`)
    
    // Test 3: Read all reservations
    console.log('\n3. Testing READ reservations...')
    const { data: reservations, error: reservationsError } = await supabase.from('reservations').select('*')
    if (reservationsError) throw reservationsError
    console.log(`✅ Found ${reservations.length} reservations`)
    
    // Test 4: Create a test message
    console.log('\n4. Testing CREATE message...')
    const testMessage = {
      id: `test-${Date.now()}`,
      name: 'Test User',
      email: 'test@example.com',
      subject: 'CRUD Test',
      content: 'This is a test message to verify CRUD operations',
      date: new Date().toISOString(),
      read: false,
      senderrole: 'USER'
    }
    
    const { data: createdMessage, error: createError } = await supabase
      .from('messages')
      .insert(testMessage)
      .select()
    
    if (createError) throw createError
    console.log('✅ Created test message')
    
    // Test 5: Update the message
    console.log('\n5. Testing UPDATE message...')
    const { error: updateError } = await supabase
      .from('messages')
      .update({ read: true, readat: new Date().toISOString() })
      .eq('id', testMessage.id)
    
    if (updateError) throw updateError
    console.log('✅ Updated test message')
    
    // Test 6: Delete the test message
    console.log('\n6. Testing DELETE message...')
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', testMessage.id)
    
    if (deleteError) throw deleteError
    console.log('✅ Deleted test message')
    
    console.log('\n🎉 All CRUD operations successful!')
    console.log('\n📊 Migration Summary:')
    console.log(`   • Spaces: ${spaces.length}`)
    console.log(`   • Users: ${users.length}`)
    console.log(`   • Reservations: ${reservations.length}`)
    console.log(`   • Messages: Successfully tested CRUD`)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testCRUD()