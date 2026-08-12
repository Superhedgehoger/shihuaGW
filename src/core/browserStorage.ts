const DATABASE_NAME = 'shihua_doc_formatter';
const STORE_NAME = 'key_value';
const DATABASE_VERSION = 1;

function localStorageAvailable(): boolean {
  return typeof localStorage !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function readIndexedDb(key: string): Promise<string | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
      request.onerror = () => reject(request.error ?? new Error('Failed to read IndexedDB'));
    });
  } finally {
    database.close();
  }
}

async function writeIndexedDb(key: string, value: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Failed to write IndexedDB'));
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write aborted'));
    });
  } finally {
    database.close();
  }
}

async function removeIndexedDb(key: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Failed to delete IndexedDB value'));
    });
  } finally {
    database.close();
  }
}

/** Read from IndexedDB and automatically migrate a legacy localStorage value. */
export async function getBrowserValue(key: string): Promise<string | null> {
  try {
    const stored = await readIndexedDb(key);
    if (stored !== null) return stored;
  } catch {
    // Private browsing and hardened browsers may disable IndexedDB.
  }

  const legacy = localStorageAvailable() ? localStorage.getItem(key) : null;
  if (legacy !== null) {
    try {
      await writeIndexedDb(key, legacy);
    } catch {
      // The localStorage copy remains the fallback source.
    }
  }
  return legacy;
}

/** Store large offline data in IndexedDB, falling back to localStorage. */
export async function setBrowserValue(key: string, value: string): Promise<void> {
  try {
    await writeIndexedDb(key, value);
    return;
  } catch {
    if (!localStorageAvailable()) throw new Error('浏览器不支持可用的本地存储');
  }
  localStorage.setItem(key, value);
}

export async function removeBrowserValue(key: string): Promise<void> {
  try {
    await removeIndexedDb(key);
  } catch {
    // Continue with the legacy fallback cleanup.
  }
  if (localStorageAvailable()) localStorage.removeItem(key);
}
