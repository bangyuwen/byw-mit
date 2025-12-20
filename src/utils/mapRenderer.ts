// Type definitions for minimal Leaflet usage
interface LeafletMap {
    setView(center: [number, number], zoom: number): LeafletMap;
    removeLayer(layer: any): void;
    invalidateSize(): void;
}

interface LeafletMarker {
    addTo(map: LeafletMap): LeafletMarker;
    bindPopup(content: string): LeafletMarker;
}

// Declare external L
declare const L: any;

export interface MapMarkerData {
    lat: string | number;
    lng: string | number;
    name: string;
    category: string;
    isVisited: boolean;
}

export class MapRenderer {
    private map: LeafletMap | null = null;
    private markers: LeafletMarker[] = [];
    private elementId: string;

    constructor(elementId: string) {
        this.elementId = elementId;
    }

    init(center: [number, number], zoom: number): void {
        if (this.map) return;
        
        const element = document.getElementById(this.elementId);
        if (!element) return;

        this.map = L.map(this.elementId).setView(center, zoom);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);
    }

    updateMarkers(shops: any[], visitedShops: string[]): void {
        if (!this.map) return;
        
        // Clear existing markers
        const mapInstance = this.map;
        this.markers.forEach(m => mapInstance.removeLayer(m));
        this.markers = [];

        // Add new markers
        shops.forEach(shop => {
            if (shop.lat && shop.lng) {
                const isVisited = visitedShops.includes(shop.id);
                // Handle both string and number types safely
                const lat = typeof shop.lat === 'number' ? shop.lat : parseFloat(shop.lat);
                const lng = typeof shop.lng === 'number' ? shop.lng : parseFloat(shop.lng);

                if (!isNaN(lat) && !isNaN(lng)) {
                    const marker = L.marker([lat, lng])
                        .addTo(mapInstance)
                        .bindPopup(`
                            <b>${shop.name}</b><br>
                            ${shop.category}<br>
                            ${isVisited ? '✅ 已踩點' : '⬜ 未踩點'}
                        `);
                    this.markers.push(marker);
                }
            }
        });
    }

    invalidateSize(): void {
        if (this.map) {
            this.map.invalidateSize();
        }
    }
}
