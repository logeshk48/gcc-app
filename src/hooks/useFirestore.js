import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useCollection(collectionName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, collectionName), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setData(docs)
      setLoading(false)
    })
    return () => unsub()
  }, [collectionName])

  return { data, loading }
}