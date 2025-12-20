// Type definitions for minimal Leaflet usage
interface LeafletMap {
    setView(center: [number, number], zoom: number): LeafletMap;
    fitBounds(bounds: [[number, number], [number, number]]): void;
    removeLayer(layer: any): void;
    invalidateSize(): void;
    on(event: string, fn: (e?: any) => void): void;
    getBounds(): {
        getNorth(): number;
        getSouth(): number;
        getEast(): number;
        getWest(): number;
    };
    getCenter(): { lat: number; lng: number };
}

interface LeafletMarker {
    addTo(map: LeafletMap): LeafletMarker;
    bindPopup(content: string): LeafletMarker;
    openPopup(): LeafletMarker;
}

// Declare external L
declare const L: any;

export interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

export interface MapMarkerData {
    lat: string | number;
    lng: string | number;
    name: string;
    category: string;
    isVisited: boolean;
}

export class MapRenderer {
    private map: LeafletMap | null = null;
    private markers: Map<string, LeafletMarker> = new Map();
    private elementId: string;
    private onMoveEndCallback: ((bounds: MapBounds) => void) | null = null;
    private onShopFocusCallback: ((id: string | null) => void) | null = null;

    constructor(elementId: string) {
        this.elementId = elementId;
    }

    private defaultIcon: any;
    private visitedIcon: any;

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

        // Define icons once
        const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png';
        const shadowOptions = {
            shadowUrl: shadowUrl,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        };

        this.defaultIcon = new L.Icon({
            ...shadowOptions,
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        });

        this.visitedIcon = new L.Icon({
            ...shadowOptions,
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        });

        if (this.map) {
            this.map.on('moveend', () => {
                this.handleMoveEnd();
            });

            this.map.on('popupopen', (e: any) => {
                const marker = e.popup._source;
                const id = marker?.shopId;
                if (id && this.onShopFocusCallback) {
                    this.onShopFocusCallback(id);
                }
            });

            this.map.on('popupclose', () => {
                if (this.onShopFocusCallback) {
                    this.onShopFocusCallback(null);
                }
            });
        }
    }

    setView(center: [number, number], zoom: number): void {
        if (this.map) {
            this.map.setView(center, zoom);
        }
    }

    fitBounds(bounds: [[number, number], [number, number]]): void {
        if (this.map) {
            this.map.fitBounds(bounds);
        }
    }

    onMoveEnd(callback: (bounds: MapBounds) => void): void {
        this.onMoveEndCallback = callback;
    }

    onShopFocus(callback: (id: string | null) => void): void {
        this.onShopFocusCallback = callback;
    }

    private handleMoveEnd(): void {
        if (!this.map || !this.onMoveEndCallback) return;
        const bounds = this.map.getBounds();
        this.onMoveEndCallback({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        });
    }

    updateMarkers(shops: any[], visitedShops: string[]): void {
        if (!this.map || !this.defaultIcon || !this.visitedIcon) return;
        
        const mapInstance = this.map;
        const newShopIds = new Set(shops.map(s => s.id));

        // 1. Remove markers that are no longer in the list (except current-location)
        for (const [id, marker] of this.markers) {
            if (id !== 'current-location' && !newShopIds.has(id)) {
                mapInstance.removeLayer(marker);
                this.markers.delete(id);
            }
        }

        // 2. Add or update markers
        shops.forEach(shop => {
            if (shop.lat && shop.lng) {
                const isVisited = visitedShops.includes(shop.id);
                // Handle both string and number types safely
                const lat = typeof shop.lat === 'number' ? shop.lat : parseFloat(shop.lat);
                const lng = typeof shop.lng === 'number' ? shop.lng : parseFloat(shop.lng);

                const targetIcon = isVisited ? this.visitedIcon : this.defaultIcon;

                if (!isNaN(lat) && !isNaN(lng)) {
                    if (this.markers.has(shop.id)) {
                        // Update existing marker
                        const marker = this.markers.get(shop.id)!;
                        (marker as any).shopId = shop.id; // Ensure ID is attached
                        
                        // Check if icon needs update
                        if ((marker as any).options.icon !== targetIcon) {
                           (marker as any).setIcon(targetIcon);
                           marker.bindPopup(`
                                <b>${shop.name}</b><br>
                                ${shop.category}<br>
                                ${isVisited ? '✅ 已踩點' : '⬜ 未踩點'}
                            `);
                        }
                    } else {
                        // Create new marker
                        const marker = L.marker([lat, lng], {
                            icon: targetIcon
                        })
                            .addTo(mapInstance)
                            .bindPopup(`
                                <b>${shop.name}</b><br>
                                ${shop.category}<br>
                                ${isVisited ? '✅ 已踩點' : '⬜ 未踩點'}
                            `);
                        
                        (marker as any).shopId = shop.id; // Attach ID
                        this.markers.set(shop.id, marker);
                    }
                }
            }
        });
    }



    addCurrentLocationMarker(lat: number, lng: number): void {
        if (!this.map) return;
        
        // Remove existing location marker if any (optional, but good practice to track it)
        // For simplicity, we'll just add a new one with a distinct look
        
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'current-location-marker',
                html: '<div style="background-color: #007bff; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            })
        }).addTo(this.map)
          .bindPopup('📍 你在這裡');
          
        this.markers.set('current-location', marker); 
    }

    getBounds(): MapBounds | null {
        if (!this.map) return null;
        const bounds = this.map.getBounds();
        return {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        };
    }

    getCenter(): [number, number] | null {
        if (!this.map) return null;
        const center = this.map.getCenter();
        return [center.lat, center.lng];
    }

    invalidateSize(): void {
        if (this.map) {
            this.map.invalidateSize();
        }
    }

    openPopup(id: string): void {
        const marker = this.markers.get(id);
        if (marker) {
            marker.openPopup();
        }
    }
}
