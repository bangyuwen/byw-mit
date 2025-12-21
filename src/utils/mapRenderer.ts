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

    private icons: Record<string, any> = {};

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

        // Define icons
        const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png';
        const shadowOptions = {
            shadowUrl: shadowUrl,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        };

        const createIcon = (color: string) => new L.Icon({
            ...shadowOptions,
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        });

        this.icons = {
            none: createIcon('blue'),
            want: createIcon('violet'), // Pink-ish
            visited: createIcon('green'),
            like: createIcon('red'),
            dislike: createIcon('black')
        };

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

    private createPopupContent(name: string, category: string, status: string): string {
        let statusText = '⬜ 未踩點';
        if (status === 'visited') statusText = '✅ 已踩點';
        if (status === 'like') statusText = '❤ 喜歡';
        if (status === 'dislike') statusText = '🖤 不喜歡';
        if (status === 'want') statusText = '💖 想去';
        
        return `<b>${name}</b><br>${category}<br>${statusText}`;
    }

    updateMarkers(shops: any[], statusMap: Record<string, string>): void {
        if (!this.map || Object.keys(this.icons).length === 0) return;
        
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
                const status = statusMap[shop.id] || 'none';
                // Handle both string and number types safely
                const lat = typeof shop.lat === 'number' ? shop.lat : parseFloat(shop.lat);
                const lng = typeof shop.lng === 'number' ? shop.lng : parseFloat(shop.lng);

                const targetIcon = this.icons[status] || this.icons['none'];

                if (!isNaN(lat) && !isNaN(lng)) {
                    if (this.markers.has(shop.id)) {
                        // Update existing marker
                        const marker = this.markers.get(shop.id)!;
                        (marker as any).shopId = shop.id; 
                        
                        // Check if icon needs update
                        if ((marker as any).options.icon !== targetIcon) {
                           (marker as any).setIcon(targetIcon);
                           marker.bindPopup(this.createPopupContent(shop.name, shop.category, status));
                        }
                    } else {
                        // Create new marker
                        const marker = L.marker([lat, lng], {
                            icon: targetIcon
                        })
                            .addTo(mapInstance)
                            .bindPopup(this.createPopupContent(shop.name, shop.category, status));
                        
                        (marker as any).shopId = shop.id; 
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
