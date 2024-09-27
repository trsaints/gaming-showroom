import { createContext } from 'react'
import { IRootContext }  from './IRootContext'


const RootContext = createContext<IRootContext>({
													clientSecret: '',
													setClientSecret: () => {}
												})

export { RootContext }