import React, { Dispatch, SetStateAction } from 'react'
import { DataRequestParams } from '@data/request-parameters'


export interface ISearchFilterViewModel {
	updateFilters(event: React.MouseEvent<HTMLElement>,
				  setFilters: Dispatch<SetStateAction<DataRequestParams>>): void;
}