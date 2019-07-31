import { BusinessLocation } from './business-location';

export interface Business {
    alias: string;
    categories: [];
    coordinates: Coordinates;
    display_phone: string;
    distance: number;
    id: string;
    image_url: string;
    is_closed: boolean;
    location: BusinessLocation;
    name:  string;
    phone:  string;
    price:  string;
    rating: number;
    review_count: number;
    transactions: [];
    url: string;
}
