import { ApiData }      from '@data/local-storage/LocalDb.ts'
import { LocalDbStore } from '@data/types/LocalDbStore.ts'


export interface ILocalDb<T> {
	openObjectStore(storageName: string, mode: IDBTransactionMode): Promise<IDBObjectStore>

	create<T extends ApiData[]>(storages: { [K in keyof T]: LocalDbStore<T[K]> }): void

	getObjectById(storageName: string, key: number): Promise<T>

	getAll(storageName: string): Promise<T[]>

	addObject(storageName: string, object: T): Promise<boolean>

	removeObject(storageName: string, key: keyof T): Promise<boolean>

	updateObject(storageName: string, key: keyof T, newObject: T): Promise<boolean>

	isCreated(): boolean

	reset(): void
}