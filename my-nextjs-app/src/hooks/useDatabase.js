import { useState, useEffect } from 'react'
import { db } from '../lib/supabase'
import { dbUtils } from '../lib/dbUtils'

// Custom hook for authentication
export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { user } = await db.auth.getCurrentUser()
      setUser(user)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = db.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    setLoading(true)
    const result = await db.auth.signIn(email, password)
    setLoading(false)
    return result
  }

  const signUp = async (email, password, userData) => {
    setLoading(true)
    const result = await db.auth.signUp(email, password, userData)
    setLoading(false)
    return result
  }

  const signOut = async () => {
    setLoading(true)
    const result = await db.auth.signOut()
    setUser(null)
    setLoading(false)
    return result
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }
}

// Custom hook for fetching data
export const useSupabaseData = (table, conditions = {}, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: result, error: fetchError } = await db.query.select(table, '*', conditions)
        
        if (fetchError) {
          setError(fetchError)
        } else {
          setData(result)
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, dependencies)

  const refetch = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: result, error: fetchError } = await db.query.select(table, '*', conditions)
      
      if (fetchError) {
        setError(fetchError)
      } else {
        setData(result)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

// Custom hook for attendance data
export const useAttendance = (userId = null) => {
  const [attendance, setAttendance] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAttendance = async () => {
    setLoading(true)
    setError(null)

    try {
      let result
      if (userId) {
        result = await db.presensi.getByUserId(userId)
      } else {
        result = await db.presensi.getAll()
      }

      if (result.error) {
        setError(result.error)
      } else {
        setAttendance(result.data || [])
        
        // Get stats
        const statsResult = await dbUtils.getAttendanceStats(userId)
        if (statsResult.success) {
          setStats(statsResult.stats)
        }
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [userId])

  const createAttendance = async (status, kelas_id) => {
    if (!userId) {
      setError(new Error('User ID is required'))
      return { success: false }
    }

    const result = await dbUtils.createAttendance(userId, status, kelas_id)
    if (result.success) {
      await fetchAttendance() // Refresh data
    }
    return result
  }

  const checkTodayAttendance = async () => {
    if (!userId) return { hasAttendance: false }
    
    const result = await dbUtils.getTodayAttendance(userId)
    return result
  }

  return {
    attendance,
    stats,
    loading,
    error,
    refetch: fetchAttendance,
    createAttendance,
    checkTodayAttendance
  }
}

// Custom hook for users data
export const useUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await db.users.getAll()
      
      if (fetchError) {
        setError(fetchError)
      } else {
        setUsers(data || [])
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const createUser = async (userData) => {
    const result = await db.users.create(userData)
    if (result.data) {
      await fetchUsers() // Refresh data
    }
    return result
  }

  const updateUser = async (id, userData) => {
    const result = await db.users.update(id, userData)
    if (result.data) {
      await fetchUsers() // Refresh data
    }
    return result
  }

  const deleteUser = async (id) => {
    const result = await db.users.delete(id)
    if (!result.error) {
      await fetchUsers() // Refresh data
    }
    return result
  }

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser
  }
}

// Custom hook for kelas data
export const useKelas = () => {
  const [kelas, setKelas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchKelas = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await db.kelas.getAll()
      
      if (fetchError) {
        setError(fetchError)
      } else {
        setKelas(data || [])
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKelas()
  }, [])

  const createKelas = async (kelasData) => {
    const result = await db.kelas.create(kelasData)
    if (result.data) {
      await fetchKelas() // Refresh data
    }
    return result
  }

  const updateKelas = async (id, kelasData) => {
    const result = await db.kelas.update(id, kelasData)
    if (result.data) {
      await fetchKelas() // Refresh data
    }
    return result
  }

  const deleteKelas = async (id) => {
    const result = await db.kelas.delete(id)
    if (!result.error) {
      await fetchKelas() // Refresh data
    }
    return result
  }

  return {
    kelas,
    loading,
    error,
    refetch: fetchKelas,
    createKelas,
    updateKelas,
    deleteKelas
  }
}