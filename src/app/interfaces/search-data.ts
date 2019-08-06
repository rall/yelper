import { Business } from './business';

interface Region {
    center: Coordinates;
}

export interface SearchError {
    title: string;
    message: string;
}

export interface SearchData {
    businesses: Business[];
    region?: Region;
    total: number;
    error?: SearchError
}
