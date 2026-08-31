import { IDataRepository } from './IDataRepository';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { NeonAdapter } from './NeonAdapter';
import { isNeonConfigured } from '../neon/client';

export * from './IDataRepository';
export * from './LocalStorageAdapter';
export * from './NeonAdapter';

const STORAGE_PREF_KEY = 'calories_storage_provider_preference';

export type StorageProviderType = 'local' | 'neon';

// Singleton instance
let currentRepository: IDataRepository | null = null;
let currentStorageType: StorageProviderType = 'local';

export function getActiveStorageType(): StorageProviderType {
  if (typeof window !== 'undefined') {
    const savedPref = localStorage.getItem(STORAGE_PREF_KEY) as StorageProviderType | null;
    if (savedPref === 'neon' && isNeonConfigured()) {
      return 'neon';
    }
    if (savedPref === 'local') {
      return 'local';
    }
  }
  return isNeonConfigured() ? 'neon' : 'local';
}

export function getDataRepository(forceType?: StorageProviderType): IDataRepository {
  if (forceType === 'local') {
    return new LocalStorageAdapter();
  }
  if (forceType === 'neon') {
    return new NeonAdapter();
  }

  const activeType = getActiveStorageType();
  if (!currentRepository || currentStorageType !== activeType) {
    currentStorageType = activeType;
    if (activeType === 'neon') {
      currentRepository = new NeonAdapter();
    } else {
      currentRepository = new LocalStorageAdapter();
    }
  }
  return currentRepository;
}

export function switchStorageType(type: StorageProviderType): IDataRepository {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_PREF_KEY, type);
  }
  currentStorageType = type;
  if (type === 'neon') {
    currentRepository = new NeonAdapter();
  } else {
    currentRepository = new LocalStorageAdapter();
  }
  return currentRepository;
}

export function setDataRepository(repo: IDataRepository): void {
  currentRepository = repo;
}
