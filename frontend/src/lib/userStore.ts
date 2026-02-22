const DB_NAME = 'mygamesportal-db'
const DB_VERSION = 1
const STORE_NAME = 'session'
const USER_KEY = 'username'

const openDatabase = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open IndexedDB'))
    }
  })
}

export const saveUsername = async (username: string) => {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    store.put(username, USER_KEY)

    transaction.oncomplete = () => {
      database.close()
      resolve()
    }

    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Failed to save username'))
    }
  })
}

export const getUsername = async () => {
  const database = await openDatabase()

  return new Promise<string | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(USER_KEY)

    request.onsuccess = () => {
      database.close()
      const result = request.result

      if (typeof result === 'string') {
        resolve(result)
        return
      }

      resolve(null)
    }

    request.onerror = () => {
      database.close()
      reject(request.error ?? new Error('Failed to get username'))
    }
  })
}