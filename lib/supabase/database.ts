import { createClient } from './client'

export async function getProfile() {
  try {
    const client = createClient()
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

export async function upsertProfile(profile: any) {
  try {
    const client = createClient()
    const { data, error } = await client
      .from('profiles')
      .upsert(profile)
      .select()
      .single()

    if (error) {
      console.error('Error upserting profile:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('Error upserting profile:', error)
    return null
  }
}

export async function getFoodItems() {
  try {
    const client = createClient()
    const { data, error } = await client
      .from('food_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching food items:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Error fetching food items:', error)
    return []
  }
}

export async function addFoodItem(item: any) {
  try {
    const client = createClient()
    const { data, error } = await client
      .from('food_items')
      .insert(item)
      .select()
      .single()

    if (error) {
      console.error('Error adding food item:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('Error adding food item:', error)
    return null
  }
}

export async function updateFoodItem(id: string, item: any) {
  try {
    const client = createClient()
    const { data, error } = await client
      .from('food_items')
      .update(item)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating food item:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('Error updating food item:', error)
    return null
  }
}

export async function deleteFoodItem(id: string) {
  try {
    const client = createClient()
    const { error } = await client
      .from('food_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting food item:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error deleting food item:', error)
    return false
  }
}

export async function getDietLogs() {
  try {
    const client = createClient()
    const { data: { user } } = await client.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await client
      .from('diet_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching diet logs:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Error fetching diet logs:', error)
    return []
  }
}

export async function addDietLog(log: any) {
  try {
    const client = createClient()
    const { data: { user } } = await client.auth.getUser()

    if (!user) {
      return null
    }

    const { data, error } = await client
      .from('diet_logs')
      .insert({ ...log, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('Error adding diet log:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('Error adding diet log:', error)
    return null
  }
}

export async function deleteDietLog(id: string) {
  try {
    const client = createClient()
    const { data: { user } } = await client.auth.getUser()

    if (!user) {
      return false
    }

    const { error } = await client
      .from('diet_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting diet log:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error deleting diet log:', error)
    return false
  }
}
