import { Business } from './business';

interface Region {
    center: Coordinates;
}

export interface SearchData {
    businesses: Business[];
    region: Region;
    total: number;
}
