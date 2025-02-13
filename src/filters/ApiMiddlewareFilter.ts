import {
	IApiMiddlewareFilter
} from '@src/filters/interfaces/IApiMiddlewareFilter.ts'
import { Game } from '@data/types'
import { ApiData, ILocalDb } from '@data/local-storage'
import { IApiService, IGameService } from '@src/services'


export class ApiMiddlewareFilter implements IApiMiddlewareFilter {
	async mapMissingScreenshots(game: Game,
								gameService: IGameService,
								apiService: IApiService,
								database: ILocalDb<ApiData>
	): Promise<Game> {
		const screenshots = await gameService.getScreenshots(game.id,
															 apiService
		)

		const successfulUpdate = await database.updateObject('games', {
			...game,
			screenshots
		})

		if (! successfulUpdate) {
			return Promise.reject(
				'Failed to update game with missing screenshots')
		}

		return Promise.resolve(successfulUpdate as Game)
	}

	async mapGameDetails(game: Game,
						 gameService: IGameService,
						 apiService: IApiService,
						 database: ILocalDb<ApiData>
	): Promise<Game> {
		const gameDetails      = await gameService.getById(game.id, apiService)
		const successfulUpdate = await database.updateObject('games', {
			...game,
			...gameDetails
		})

		if (! successfulUpdate) {
			return Promise.reject('Failed to update game with missing details')
		}

		return Promise.resolve(successfulUpdate as Game)
	}

	async mapGameData(data: ApiData,
					  gameService: IGameService,
					  apiService: IApiService,
					  database: ILocalDb<ApiData>
	): Promise<Game> {
		let parsedGame = data as Game

		if (! parsedGame.shortScreenshots) {
			parsedGame =
				await this.mapMissingScreenshots(parsedGame,
												 gameService,
												 apiService,
												 database
				)
		}

		if (! parsedGame.publishers) {
			parsedGame = await this.mapGameDetails(parsedGame,
												   gameService,
												   apiService,
												   database
			)
		}

		return parsedGame
	}
}



