import { ComponentProps } from 'react'
import { Game } from '@data/types'
import { ISearchControls } from '@views/pages/SearchControls/SearchControls.tsx'


export interface IGamePageList extends ComponentProps<'article'>,
									   ISearchControls {
	games: Game[]
	withFilter?: boolean
}