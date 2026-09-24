/**
 * Demo catalogue — ten electrical products across four categories.
 *
 * Idempotent: everything is matched by slug and updated in place, so running it
 * twice leaves ten products rather than twenty. It only ever touches the
 * documents listed here; anything else in the database is left alone.
 *
 *   npm run seed:electrical
 *
 * Artwork is drawn locally by scripts/make-product-art.mjs and served from the
 * client as /products/<slug>.svg — a third of the stock-photo ids first used
 * here turned out to be dead, and a demo that 404s is worse than no demo.
 */
import mongoose from 'mongoose';
import config from './app/config';
import { Category } from './app/modules/category/category.model';
import { Product } from './app/modules/product/product.model';

/** Artwork drawn by scripts/make-product-art.mjs and served from the client. */
const art = (slug: string) => "/products/" + slug + ".svg";

interface SeedCategory {
    name: string;
    slug: string;
    icon: string;
    image: string;
}

const CATEGORIES: SeedCategory[] = [
    { name: 'Lighting', slug: 'lighting', icon: '💡', image: art("led-ceiling-panel-light-24w") },
    { name: 'Fans & Cooling', slug: 'fans-cooling', icon: '🌀', image: art("bldc-ceiling-fan-56-remote") },
    { name: 'Wiring & Switches', slug: 'wiring-switches', icon: '🔌', image: art("modular-switch-socket-board-6-gang") },
    { name: 'Power & Backup', slug: 'power-backup', icon: '🔋', image: art("pure-sine-wave-ips-1200va") },
];

interface SeedProduct {
    name: string;
    slug: string;
    category: string;           // category slug
    brand: string;
    model: string;
    price: number;
    originalPrice: number | null;
    stock: number;
    shortDescription: string;
    description: string;
    specifications: { key: string; value: string }[];
    warrantyMonths: number;
    isFeatured?: boolean;
    /** Demo sales history, so Top Selling badges and best-seller rows mean something. */
    sold: number;
    rating: number;
    reviews: number;
}

const PRODUCTS: SeedProduct[] = [
    {
        name: 'LED Ceiling Panel Light 24W',
        slug: 'led-ceiling-panel-light-24w',
        sold: 412, rating: 4.6, reviews: 58,
        category: 'lighting',
        brand: 'Lumex', model: 'LX-P24',
        price: 1150, originalPrice: 1490, stock: 64,
        shortDescription: 'Slim recessed panel with even, flicker-free daylight output.',
        description:
            '<p>A 24-watt recessed panel that spreads light evenly across a room instead of pooling it under the fixture. The driver is isolated and flicker-free, so it is comfortable to sit under for long stretches.</p>'
            + '<ul><li>2200 lumens at 6500K daylight</li><li>Cut-out size 225 mm</li><li>Aluminium heat sink for a longer driver life</li></ul>',
        specifications: [
            { key: 'Power', value: '24 W' },
            { key: 'Luminous flux', value: '2200 lm' },
            { key: 'Colour temperature', value: '6500K daylight' },
            { key: 'Input', value: '165–265 V AC' },
        ],
        warrantyMonths: 24,
        isFeatured: true,
    },
    {
        name: 'Smart Wi-Fi LED Bulb 9W (RGB + White)',
        slug: 'smart-wifi-led-bulb-9w-rgb',
        sold: 268, rating: 4.4, reviews: 41,
        category: 'lighting',
        brand: 'Lumex', model: 'LX-S9',
        price: 690, originalPrice: 890, stock: 120,
        shortDescription: 'Sixteen million colours, schedules and voice control over 2.4 GHz Wi-Fi.',
        description:
            '<p>Pairs over 2.4 GHz Wi-Fi with no hub. Set a warm dim for the evening, a daylight white for work, or a colour scene — and put any of them on a schedule.</p>'
            + '<ul><li>Works with Google Assistant and Alexa</li><li>Remembers its last state after a power cut</li><li>E27 base</li></ul>',
        specifications: [
            { key: 'Power', value: '9 W' },
            { key: 'Base', value: 'E27' },
            { key: 'Connectivity', value: 'Wi-Fi 2.4 GHz' },
            { key: 'Colours', value: 'RGB + 2700–6500K' },
        ],
        warrantyMonths: 12,
        isFeatured: true,
    },
    {
        name: 'BLDC Ceiling Fan 56" with Remote',
        slug: 'bldc-ceiling-fan-56-remote',
        sold: 196, rating: 4.8, reviews: 73,
        category: 'fans-cooling',
        brand: 'Aeromax', model: 'AM-BLDC56',
        price: 8950, originalPrice: 10900, stock: 22,
        shortDescription: 'Runs on 32 watts — roughly a third of a conventional fan.',
        description:
            '<p>A brushless motor draws about 32 W at full speed where an induction fan of the same sweep takes near 80 W. On an inverter or solar backup that difference decides how long the fan keeps running.</p>'
            + '<ul><li>Six speeds, remote with timer</li><li>Near-silent below speed four</li><li>Rust-treated blades</li></ul>',
        specifications: [
            { key: 'Sweep', value: '1400 mm (56")' },
            { key: 'Power', value: '32 W' },
            { key: 'Air delivery', value: '230 m³/min' },
            { key: 'Speeds', value: '6, remote controlled' },
        ],
        warrantyMonths: 36,
        isFeatured: true,
    },
    {
        name: 'Rechargeable Table Fan 12"',
        slug: 'rechargeable-table-fan-12',
        sold: 143, rating: 4.3, reviews: 29,
        category: 'fans-cooling',
        brand: 'Aeromax', model: 'AM-RT12',
        price: 3450, originalPrice: 4200, stock: 38,
        shortDescription: 'Eight hours on a charge, with a USB port for a phone.',
        description:
            '<p>Built for load shedding: a full charge runs the fan for about eight hours on low, and the built-in USB-A port will bring a phone back from flat.</p>'
            + '<ul><li>7800 mAh lithium pack</li><li>Three speeds, adjustable tilt</li><li>Charges while running</li></ul>',
        specifications: [
            { key: 'Blade size', value: '12 inch' },
            { key: 'Battery', value: '7800 mAh Li-ion' },
            { key: 'Runtime', value: 'Up to 8 h on low' },
            { key: 'Extras', value: 'USB-A output, LED light' },
        ],
        warrantyMonths: 12,
    },
    {
        name: 'Modular Switch & Socket Board (6 Gang)',
        slug: 'modular-switch-socket-board-6-gang',
        sold: 87, rating: 4.5, reviews: 18,
        category: 'wiring-switches',
        brand: 'Voltek', model: 'VT-M6',
        price: 1690, originalPrice: null, stock: 45,
        shortDescription: 'Six modules on a shockproof polycarbonate plate.',
        description:
            '<p>Polycarbonate plate with a captive-screw frame, so the modules stay square after years of use. Each switch is rated 10 A and the sockets take both round and flat pins.</p>'
            + '<ul><li>Fits a standard 6-module box</li><li>Shuttered sockets</li><li>Silver-alloy contacts</li></ul>',
        specifications: [
            { key: 'Modules', value: '6' },
            { key: 'Switch rating', value: '10 A, 240 V' },
            { key: 'Material', value: 'Polycarbonate' },
            { key: 'Finish', value: 'Matte white' },
        ],
        warrantyMonths: 24,
    },
    {
        name: 'Copper House Wire 1.5 mm² — 100 m Coil',
        slug: 'copper-house-wire-1-5mm-100m',
        sold: 64, rating: 4.7, reviews: 12,
        category: 'wiring-switches',
        brand: 'Voltek', model: 'VT-W15',
        price: 4850, originalPrice: 5600, stock: 30,
        shortDescription: '99.97% pure electrolytic copper, FR-PVC insulated.',
        description:
            '<p>Single-core wire for lighting circuits. The conductor is 99.97% electrolytic copper and the sheath is flame-retardant PVC that self-extinguishes rather than carrying a fire along the conduit.</p>'
            + '<ul><li>Suitable up to 16 A lighting circuits</li><li>Heat resistant to 70°C</li><li>ISI-pattern colour coding</li></ul>',
        specifications: [
            { key: 'Cross-section', value: '1.5 mm²' },
            { key: 'Length', value: '100 m' },
            { key: 'Conductor', value: '99.97% electrolytic copper' },
            { key: 'Insulation', value: 'FR-PVC, 70°C' },
        ],
        warrantyMonths: 0,
    },
    {
        name: 'Circuit Breaker MCB 32A Single Pole',
        slug: 'circuit-breaker-mcb-32a-single-pole',
        sold: 231, rating: 4.4, reviews: 26,
        category: 'wiring-switches',
        brand: 'Voltek', model: 'VT-C32',
        price: 540, originalPrice: 720, stock: 88,
        shortDescription: 'C-curve breaker for socket and appliance circuits.',
        description:
            '<p>A C-curve miniature circuit breaker: it rides out the inrush of a motor or a compressor starting, then trips quickly on a genuine fault. DIN-rail mount.</p>'
            + '<ul><li>6 kA breaking capacity</li><li>Trip-free mechanism — it opens even if the toggle is held</li><li>35 mm DIN rail</li></ul>',
        specifications: [
            { key: 'Rating', value: '32 A' },
            { key: 'Curve', value: 'C' },
            { key: 'Breaking capacity', value: '6 kA' },
            { key: 'Poles', value: 'Single' },
        ],
        warrantyMonths: 12,
    },
    {
        name: 'Pure Sine Wave IPS 1200VA',
        slug: 'pure-sine-wave-ips-1200va',
        sold: 58, rating: 4.9, reviews: 34,
        category: 'power-backup',
        brand: 'PowerCore', model: 'PC-1200S',
        price: 18900, originalPrice: 22500, stock: 12,
        shortDescription: 'Clean sine output that fridges and PCs will actually tolerate.',
        description:
            '<p>A square-wave inverter makes a fridge compressor and a desktop PSU run hot and hum. This one puts out a true sine wave, so sensitive loads behave exactly as they do on mains.</p>'
            + '<ul><li>Transfer time under 10 ms</li><li>Overload, short-circuit and deep-discharge protection</li><li>LCD panel showing load and battery state</li></ul>',
        specifications: [
            { key: 'Capacity', value: '1200 VA / 960 W' },
            { key: 'Waveform', value: 'Pure sine' },
            { key: 'Transfer time', value: '< 10 ms' },
            { key: 'Battery support', value: '12 V, external' },
        ],
        warrantyMonths: 24,
        isFeatured: true,
    },
    {
        name: 'Tubular Battery 150Ah',
        slug: 'tubular-battery-150ah',
        sold: 41, rating: 4.6, reviews: 21,
        category: 'power-backup',
        brand: 'PowerCore', model: 'PC-T150',
        price: 21500, originalPrice: null, stock: 9,
        shortDescription: 'Deep-cycle tubular plates built for daily load shedding.',
        description:
            '<p>Tubular plates tolerate being drained and refilled every day, which is what kills a flat-plate battery inside a year. Expect five to six years of daily cycling with the electrolyte topped up.</p>'
            + '<ul><li>Low water loss, topping up roughly twice a year</li><li>Handles deep discharge without plate damage</li><li>Float indicator for electrolyte level</li></ul>',
        specifications: [
            { key: 'Capacity', value: '150 Ah at C20' },
            { key: 'Voltage', value: '12 V' },
            { key: 'Plate type', value: 'Tubular, deep cycle' },
            { key: 'Weight', value: '48 kg' },
        ],
        warrantyMonths: 36,
    },
    {
        name: 'Automatic Voltage Stabiliser 5kVA',
        slug: 'automatic-voltage-stabiliser-5kva',
        sold: 76, rating: 4.5, reviews: 19,
        category: 'power-backup',
        brand: 'PowerCore', model: 'PC-AVR5',
        price: 12400, originalPrice: 14900, stock: 17,
        shortDescription: 'Holds output steady through the sags a weak line delivers.',
        description:
            '<p>Where the incoming line sags to 140 V in the evening and spikes overnight, a stabiliser is what keeps an air conditioner or a refrigerator alive. This one corrects anything from 140 V to 280 V back to a usable output.</p>'
            + '<ul><li>Servo-controlled, ±2% output regulation</li><li>Time-delay restart protects a compressor</li><li>Copper-wound transformer</li></ul>',
        specifications: [
            { key: 'Capacity', value: '5 kVA' },
            { key: 'Input range', value: '140–280 V' },
            { key: 'Output regulation', value: '±2%' },
            { key: 'Cooling', value: 'Natural convection' },
        ],
        warrantyMonths: 24,
    },
];

async function main() {
    await mongoose.connect(config.database_url as string);
    console.log('connected\n');

    // ── Categories ────────────────────────────────────────────────────────
    const idBySlug = new Map<string, mongoose.Types.ObjectId>();
    for (const [i, c] of CATEGORIES.entries()) {
        const doc = await Category.findOneAndUpdate(
            { slug: c.slug },
            {
                $set: {
                    name: c.name, slug: c.slug, icon: c.icon, image: c.image,
                    level: 0, order: i, isActive: true, isFeatured: true,
                    showInMenu: true, showInHome: true, isDeleted: false,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        idBySlug.set(c.slug, doc._id as mongoose.Types.ObjectId);
        console.log(`category  ${c.name}`);
    }

    // ── Products ──────────────────────────────────────────────────────────
    // The demo's sale runs from a week ago to a week ahead, recalculated each
    // time this is run, so the catalogue never shows an offer that has expired.
    const DAY = 24 * 60 * 60 * 1000;
    const offerStart = new Date(Date.now() - 7 * DAY);
    const offerEnd = new Date(Date.now() + 7 * DAY);

    let created = 0, updated = 0;
    for (const p of PRODUCTS) {
        const existing = await Product.findOne({ slug: p.slug });
        const discount = p.originalPrice
            ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
            : 0;

        await Product.findOneAndUpdate(
            { slug: p.slug },
            {
                $set: {
                    name: p.name,
                    slug: p.slug,
                    shortDescription: p.shortDescription,
                    description: p.description,
                    price: p.price,
                    originalPrice: p.originalPrice,
                    discount,
                    costPrice: Math.round(p.price * 0.62),
                    stock: p.stock,
                    thumbnail: art(p.slug),
                    images: [art(p.slug)],
                    category: idBySlug.get(p.category) ?? null,
                    brand: p.brand,
                    model: p.model,
                    specifications: p.specifications,
                    warranty: {
                        hasWarranty: p.warrantyMonths > 0,
                        duration: p.warrantyMonths,
                        durationUnit: 'months',
                        type: 'manufacturer',
                    },
                    // A live offer window, so the discount badges and the flash-sale
                    // countdown have something real to read. Without an end date
                    // getDisplayPrice treats the markdown as a permanent list price
                    // and deliberately shows no discount badge.
                    offerStartDate: discount > 0 ? offerStart : null,
                    offerEndDate: discount > 0 ? offerEnd : null,
                    status: p.stock > 0 ? 'active' : 'out-of-stock',
                    approvalStatus: 'approved',
                    isFeatured: Boolean(p.isFeatured),
                    totalSold: p.sold,
                    rating: p.rating,
                    reviewCount: p.reviews,
                    viewCount: p.sold * 34 + 120,
                    isOnSale: discount > 0,
                    isDeleted: false,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        existing ? updated++ : created++;
        console.log(`product   ${p.name}  ৳${p.price.toLocaleString()}`);
    }

    // Category product counts, so the storefront's category tiles are honest.
    for (const [slug, id] of idBySlug) {
        const count = await Product.countDocuments({ category: id, isDeleted: false });
        await Category.updateOne({ _id: id }, { $set: { productCount: count } });
        console.log(`count     ${slug}: ${count}`);
    }

    console.log(`\ndone — ${created} created, ${updated} updated, ${CATEGORIES.length} categories`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
