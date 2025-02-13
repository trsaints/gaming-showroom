import { RootContextProvider } from '@data/context'
import { Footer, Header, SearchWidget } from '@views/components'
import { Outlet } from 'react-router-dom'
import { RootViewModel } from '@src/view-models/RootViewModel.ts'
import { useEffect, useState } from 'react'
import { ScrollTop } from '@views/components/ScrollTop'
import { LoadingScreen } from '@views/components/LoadingScreen'


const viewModel = new RootViewModel()

function Root() {
	const [isDbInitialized, setIsDbInitialized] = useState(false)

	useEffect(() => {
		async function initializeDatabase() {
			await viewModel.initializeDb()
			setIsDbInitialized(true)
		}

		initializeDatabase()
	}, [])

	if (! isDbInitialized) {
		return <LoadingScreen/>
	}

	return (
		<RootContextProvider {...viewModel}>
			<Header/>
			<SearchWidget/>
			<Outlet/>
			<Footer/>
			<ScrollTop/>
		</RootContextProvider>
	)
}

export { Root }