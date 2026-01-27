
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceImage = path.join(__dirname, '../public/logo-source.png');
const outputDir = path.join(__dirname, '../public');

const sizes = [
    { name: 'favicon-16x16.png', width: 16, height: 16 },
    { name: 'favicon-32x32.png', width: 32, height: 32 },
    { name: 'apple-touch-icon.png', width: 180, height: 180 },
    { name: 'android-chrome-192x192.png', width: 192, height: 192 },
];

async function generateFavicons() {
    try {
        for (const size of sizes) {
            await sharp(sourceImage)
                .resize(size.width, size.height)
                .toFile(path.join(outputDir, size.name));
            console.log(`Generated ${size.name}`);
        }
        console.log('Favicon generation complete.');
    } catch (error) {
        console.error('Error generating favicons:', error);
    }
}

generateFavicons();
