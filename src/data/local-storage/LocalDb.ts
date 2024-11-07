import { ILocalDb } from '@data/local-storage/'
import {
	Game,
	Genre,
	LocalDbStore,
	Platform,
	Publisher,
	Tag
} from '@data/types'


export type ApiData = Game | Platform | Publisher | Genre | Tag

export class LocalDb implements ILocalDb<ApiData> {
	private readonly _name: string
	private readonly _version: number
	private readonly _loadKey: string

	constructor(name: string, version: number) {
		this._name    = name
		this._version = version
		this._loadKey = `${this._name}_db_created`
	}

	openRequest() {
		return indexedDB.open(this._name, this._version)
	}

	openObjectStore(storageName: string,
					mode: IDBTransactionMode
	): Promise<IDBObjectStore> {
		return new Promise<IDBObjectStore>((resolve, reject) => {
			const openRequest = this.openRequest()

			openRequest.addEventListener('success', () => {
				const transaction = openRequest.result.transaction(storageName,
																   mode
				)

				resolve(transaction.objectStore(storageName))
			})

			openRequest.addEventListener('error',
										 () => reject(openRequest.error)
			)
		})
	}

	create<T extends ApiData[]>(storages: { [K in keyof T]: LocalDbStore<T[K]> }): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (this.isCreated()) {
				return reject('database already created')
			}

			const openRequest = this.openRequest()

			openRequest.addEventListener('upgradeneeded', () => {
				return this.createStores(openRequest, storages, reject)
			})

			openRequest.addEventListener('success', () => {
				localStorage.setItem(this._loadKey, 'true')
				resolve(true)
			})

			openRequest.addEventListener('error', () => {
				reject(openRequest.error)
			})
		})
	}

	createStores<T extends ApiData[]>(openRequest: IDBOpenDBRequest,
									  storages: { [K in keyof T]: LocalDbStore<T[K]> },
									  reject: (reason?: string) => void
	): void {
		const { result } = openRequest

		try {
			storages.forEach(store => result.createObjectStore(store.name,
															   store
			))
		} catch (error) {
			return reject(`failed to create object stores: ${error}`)
		}
	}

	getObjectById(storageName: string, key: number): Promise<ApiData> {
		return new Promise<ApiData>((resolve, reject) => {
			this.openObjectStore(storageName, 'readonly')
				.then(objectStore => {
					const idbGetRequest = objectStore.get(key)

					idbGetRequest.addEventListener('success',
												   () => resolve(idbGetRequest.result)
					)
					idbGetRequest.addEventListener('error', (event) => {
						return this.rejectFailedEvent(event, reject)
					})
				})
				.catch(error => {
					console.log(`Failed to open object store: ${error}`)
					reject(error)
				})
		})
	}

	rejectFailedEvent(event: Event,
					  reject: (reason?: DOMException | null) => void
	): void {
		const error = (event.target as IDBRequest).error
		console.log(`Failed to perform operation: ${error?.message}`)
		reject(error)
	}

	getAll(storageName: string): Promise<ApiData[]> {
		return new Promise<ApiData[]>((resolve, reject) => {
			this.openObjectStore(storageName, 'readonly')
				.then(objectStore => {
					const idbCursorRequest = objectStore.openCursor()

					idbCursorRequest.addEventListener('error', (event) => {
						return this.rejectFailedEvent(event, reject)
					})

					const results: ApiData[] = []

					idbCursorRequest.addEventListener('success', () => {
						const cursor = idbCursorRequest.result

						if (cursor) {
							results.push(cursor.value)
							cursor.continue()
						} else {
							resolve(results)
						}
					})
				})
				.catch(error => {
					console.log(`Failed to open object store: ${error}`)
					reject(error)
				})
		})
	}

	addObject(storageName: string, object: ApiData): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			if (! this.isCreated() || ! object) reject(false)

			this.openObjectStore(storageName, 'readwrite')
				.then(objectStore => {
					return this.handleAddObject(objectStore,
												object,
												resolve,
												reject
					)
				})
				.catch(error => {
					console.log(`Failed to open object store: ${error}`)
					reject(error)
				})
		})
	}

	handleAddObject(objectStore: IDBObjectStore,
					object: ApiData,
					resolve: (value: (PromiseLike<boolean> | boolean)) => void,
					reject: (reason?: DOMException | null) => void
	): void {
		const idbAddRequest = objectStore.add(object)

		idbAddRequest.addEventListener('success',
									   () => resolve(true)
		)
		idbAddRequest.addEventListener('error', (event) => {
			return this.rejectFailedEvent(event, reject)
		})
	}

	addBulk(storageName: string, objects: ApiData[]): Promise<ApiData[]> {
		return new Promise<ApiData[]>((resolve, reject) => {
			if (! this.isCreated() || objects.length < 1) reject(false)

			const addedObjects: ApiData[] = []
			let completed                 = 0

			objects.forEach(object => {
				this.openObjectStore(storageName, 'readwrite')
					.then(objectStore => {
						const idbAddRequest = objectStore.add(object)

						idbAddRequest.addEventListener('success', () => {
							addedObjects.push(object)
							completed++

							if (completed === objects.length) {
								resolve(addedObjects)
							}
						})

						idbAddRequest.addEventListener('error', (event) => {
							const error = (event.target as IDBRequest).error

							console.log(`Failed to add entry ${object.id}: ${error?.message}`)
							completed++

							if (completed === objects.length) {
								resolve(addedObjects)
							}
						})
					})
					.catch(error => {
						console.log(`Failed to open object store: ${error}`)
						completed++

						if (completed === objects.length) {
							resolve(addedObjects)
						}
					})
			})
		})
	}

	removeObject(storageName: string, key: number): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			if (! this.isCreated()) reject(false)

			this.openObjectStore(storageName, 'readwrite')
				.then(objectStore => {
					const idbDeleteRequest = objectStore.delete(key)

					idbDeleteRequest.addEventListener('success',
													  () => resolve(true)
					)
					idbDeleteRequest.addEventListener('error', (event) => {
						return this.rejectFailedEvent(event, reject)
					})
				})
				.catch(error => {
					console.log(`Failed to open object store: ${error}`)
					reject(error)
				})
		})
	}

	updateObject(storageName: string,
				 newObject: ApiData
	): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			if (! this.isCreated() || ! newObject) reject(false)

			this.openObjectStore(storageName, 'readwrite')
				.then(objectStore => {
					const idbPutRequest = objectStore.put(newObject)

					idbPutRequest.addEventListener('success',
												   () => resolve(true)
					)
					idbPutRequest.addEventListener('error', (event) => {
						return this.rejectFailedEvent(event, reject)
					})
				})
				.catch(error => {
					console.log(`Failed to open object store: ${error}`)
					reject(error)
				})
		})
	}

	isCreated(): boolean {
		return localStorage.getItem(this._loadKey) !== null
	}

	reset(): void {
		indexedDB.deleteDatabase(this._name)
		localStorage.removeItem(this._loadKey)
	}
}

