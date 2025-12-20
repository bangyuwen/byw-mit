export const STORAGE_KEYS = {
    VISITED: 'visited_shops',
    FAVORITE: 'favorite_shops',
    USER_NAME: 'user_name'
};

const DEFAULT_USER_NAME = '台灣囡仔';

export function getVisitedShops(): string[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.VISITED);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to parse visited shops', e);
        return [];
    }
}

export function saveVisitedShops(shops: string[]): void {
    localStorage.setItem(STORAGE_KEYS.VISITED, JSON.stringify(shops));
}

export function addVisitedShop(id: string): string[] {
    const shops = getVisitedShops();
    if (!shops.includes(id)) {
        shops.push(id);
        saveVisitedShops(shops);
    }
    return shops;
}

export function removeVisitedShop(id: string): string[] {
    const shops = getVisitedShops();
    const newShops = shops.filter(sid => sid !== id);
    saveVisitedShops(newShops);
    return newShops;
}

export function getFavoriteShops(): string[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.FAVORITE);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to parse favorite shops', e);
        return [];
    }
}

export function saveFavoriteShops(shops: string[]): void {
    localStorage.setItem(STORAGE_KEYS.FAVORITE, JSON.stringify(shops));
}

export function toggleFavoriteShop(id: string): string[] {
    let shops = getFavoriteShops();
    if (shops.includes(id)) {
        shops = shops.filter(sid => sid !== id);
    } else {
        shops.push(id);
    }
    saveFavoriteShops(shops);
    return shops;
}

export function getUserName(): string {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME) || DEFAULT_USER_NAME;
}

export function saveUserName(name: string): void {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
}

export function initUserName(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USER_NAME)) {
        localStorage.setItem(STORAGE_KEYS.USER_NAME, DEFAULT_USER_NAME);
    }
}

export function resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.VISITED);
    // Optional: decided not to clear username or favorites on "reset"? 
    // The original code only cleared 'visited_shops'.
    // "localStorage.removeItem('visited_shops');"
}
