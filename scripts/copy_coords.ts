import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');

const GLUTTONY_FILE = path.join(BASE_DIR, 'public', 'gluttony.json');
const SUPPORT_FILE = path.join(BASE_DIR, 'public', 'support.json');

interface Place {
    name: string;
    place_id: string;
    lat?: number;
    lng?: number;
    [key: string]: any;
}

async function main() {
    // Load both files
    const gluttonyData = JSON.parse(await fs.readFile(GLUTTONY_FILE, 'utf-8'));
    const supportData = JSON.parse(await fs.readFile(SUPPORT_FILE, 'utf-8'));

    // Create lookup from gluttony by place_id
    const gluttonyLookup = new Map<string, Place>();
    for (const place of gluttonyData.places) {
        gluttonyLookup.set(place.place_id, place);
    }

    let updatedCount = 0;
    for (const place of supportData.places) {
        // If lat is missing, try to find from gluttony
        if (!place.lat || place.lat === 0) {
            const match = gluttonyLookup.get(place.place_id);
            if (match && match.lat && match.lat !== 0) {
                place.lat = match.lat;
                place.lng = match.lng;
                if (match.description && !place.description) {
                    place.description = match.description;
                }
                console.log(`Matched: ${place.name} -> lat: ${place.lat}`);
                updatedCount++;
            }
        }
    }

    console.log(`Updated ${updatedCount} places from gluttony.json`);
    await fs.writeFile(SUPPORT_FILE, JSON.stringify(supportData, null, 2), 'utf-8');
    console.log("Done.");
}

main();
