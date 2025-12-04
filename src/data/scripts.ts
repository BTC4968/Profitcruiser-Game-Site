import { Script } from '@/types/script';

/**
 * ============================================
 * HOW TO ADD A NEW SCRIPT (3 EASY STEPS):
 * ============================================
 *
 * 1. Upload thumbnail image to: /public/images/scripts/your-slug.webp
 *    - Size: 1280×720 or 1920×1080
 *    - Format: WebP (preferred) or JPG/PNG
 *    - Keep under 512 KB
 *
 * 2. Copy the template below and fill in all fields
 *
 * 3. Add it to the scripts array below
 *
 *    The homepage updates automatically:
 *    - The counters for "Total Scripts", "Active Scripts" and "Categories"
 *      are calculated from this list every time the site loads.
 *    - The "Browse by Category" grid only shows categories that have at
 *      least one script in this array.
 *
 * TEMPLATE:
 * {
 *   slug: 'your-script-slug',              // Used in URL (no spaces, lowercase)
 *   title: 'Your Script Title',            // Display name
 *   short: 'One-line description.',        // Short description (under 100 chars)
 *   category: 'shooter',                   // shooter | rpg | simulator | tycoon | fighting | adventure | misc
 *   tags: ['no-key', 'mobile'],            // Tags for filtering
 *   features: ['ESP', 'Aimbot', 'etc'],    // Main features
 *   thumbnail: '/images/scripts/your-slug.webp',
 *   workink_url: 'https://work.ink/pc/your-link',
 *   status: 'active',                      // active | patched | private | archived
 *   compatibility: {
 *     pc: true,
 *     mobile: false,
 *     executor_required: true,
 *   },
 *   version: '1.0.0',
 *   release_date: '2025-10-01',            // YYYY-MM-DD
 *   updated_at: '2025-10-01',              // YYYY-MM-DD
 *   seo: {
 *     title: 'SEO Title (60 chars max)',
 *     description: 'SEO description (160 chars max)',
 *     keywords: ['keyword1', 'keyword2'],
 *   },
 *   description: `# Overview
 * Your detailed description here with markdown formatting.
 *
 * ## Features
 * - Feature 1
 * - Feature 2
 *
 * ## How to use
 * Step by step instructions...`,
 *   views: 1200,                           // Optional: static view count for sorting
 *   featured: true,                        // Optional: show in featured section
 * },
 */

export const scripts: Script[] = [
  {
    slug: 'cut-trees',
    title: 'Cut Trees',
    short: 'Automates logging with smart chopping and selling tools.',
    category: 'simulator',
    tags: ['auto-farm', 'no-key'],
    features: ['Auto Chop', 'Auto Sell', 'Teleport to Trees', 'Anti-AFK'],
    thumbnail: '/images/scripts/cut-trees.webp',
    workink_url: 'https://work.ink/pc/cut-trees',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Cut Trees Script – Auto Chop & Sell',
      description: 'Roblox Cut Trees script with auto chop, auto sell, and teleport helpers.',
      keywords: ['cut trees', 'script', 'auto chop', 'roblox'],
    },
    description: `# Overview
Automate your lumber runs in Cut Trees with smart chopping and selling tools.

## Features
- **Auto Chop** nearest trees with configurable delay
- **Auto Sell** when your bag is full
- **Teleport** to rare tree spawns
- **Anti-AFK** protection

## How to use
1. Join Cut Trees and execute the script.
2. Open the GUI and enable the modules you need.
3. Customize chop speed and teleport options to match your route.`,
    views: 1200,
    featured: true,
  },
  {
    slug: 'empty-server',
    title: 'Empty Server (Join Any Game)',
    short: 'Finds low population servers for any Roblox experience.',
    category: 'misc',
    tags: ['utility', 'no-key'],
    features: ['Server Scanner', 'Auto Join', 'Favorites', 'Region Filter'],
    thumbnail: '/images/scripts/empty-server.webp',
    workink_url: 'https://work.ink/pc/empty-server',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: false,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Empty Server Script – Auto Join Low Pop Games',
      description: 'Jump into empty or low population Roblox servers instantly with smart filters.',
      keywords: ['empty server', 'roblox', 'script', 'server finder'],
    },
    description: `# Overview
Skip crowded lobbies with the Empty Server utility that finds low population servers for any game.

## Features
- **Server Scanner** pulls the lowest population servers
- **Auto Join** teleports you directly
- **Favorites** save your preferred games
- **Region Filter** match servers in your area

## How to use
1. Execute the utility from your executor or external tool.
2. Select the Roblox game from the list.
3. Filter by player count or region and press Join.`,
    views: 900,
  },
  {
    slug: 'arsenal',
    title: 'Arsenal',
    short: 'Competitive aimbot, ESP, and weapon tweaks for Arsenal.',
    category: 'shooter',
    tags: ['aimbot', 'premium'],
    features: ['Silent Aim', 'ESP', 'No Recoil', 'Auto BHop'],
    thumbnail: '/images/scripts/arsenal.webp',
    workink_url: 'https://work.ink/pc/arsenal',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: false,
      executor_required: true,
    },
    version: '2.0.0',
    release_date: '2025-09-30',
    updated_at: '2025-10-06',
    seo: {
      title: 'Arsenal Script – Silent Aim & ESP',
      description: 'Dominate Arsenal with silent aim, ESP, recoil control, and extra mobility tools.',
      keywords: ['arsenal', 'script', 'silent aim', 'esp'],
    },
    description: `# Overview
Lock onto the competition with a clean Arsenal hub packed with combat upgrades.

## Features
- **Silent Aim** with smoothing and FOV controls
- **ESP** player outlines, distance, and health
- **No Recoil** and weapon tweaks for perfect beams
- **Auto Bunny Hop** to keep your momentum

## How to use
1. Load into Arsenal and run the script.
2. Configure the combat tab to match your playstyle.
3. Save your settings for quick reuse in future matches.`,
    views: 4500,
    featured: true,
  },
  {
    slug: 'brainrot',
    title: 'Brainrot',
    short: 'Party-style hub with emotes, auto dance, and fun trolling tools.',
    category: 'misc',
    tags: ['trolling', 'no-key'],
    features: ['Auto Dance', 'Emote Spam', 'Soundboard', 'Avatar FX'],
    thumbnail: '/images/scripts/brainrot.webp',
    workink_url: 'https://work.ink/pc/brainrot',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Brainrot Script – Emotes, Audio & Troll Tools',
      description: 'Brainrot party script with auto dance, emote spam, soundboard, and avatar effects.',
      keywords: ['brainrot', 'script', 'roblox', 'trolling'],
    },
    description: `# Overview
Turn any Brainrot server into a party with instant emotes, music, and trolling modules.

## Features
- **Auto Dance** syncs your moves to the beat
- **Emote Spam** cycles through dances automatically
- **Soundboard** plays curated audio drops
- **Avatar FX** for glow, trails, and color swaps

## How to use
1. Join a Brainrot lobby and execute the script.
2. Toggle the dance controller to pick your vibe.
3. Share the link with friends so the whole server can sync.`,
    views: 1600,
  },
  {
    slug: 'blox-fruit',
    title: 'Blox Fruit',
    short: 'All-in-one Blox Fruits hub with questing and mastery tools.',
    category: 'rpg',
    tags: ['auto-farm', 'quest'],
    features: ['Smart Auto Farm', 'Quest Selector', 'Fruit Sniper', 'Auto Stats'],
    thumbnail: '/images/scripts/blox-fruit.webp',
    workink_url: 'https://work.ink/pc/blox-fruit',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: false,
      executor_required: true,
    },
    version: '2.1.0',
    release_date: '2025-09-15',
    updated_at: '2025-10-06',
    seo: {
      title: 'Blox Fruits Script – Auto Farm & Fruit Sniper',
      description: 'Complete Blox Fruits script for smart quest farming, fruit sniping, and auto stats.',
      keywords: ['blox fruits', 'script', 'auto farm', 'fruit sniper'],
    },
    description: `# Overview
Level up faster in Blox Fruits with a guided hub that handles quests, farming, and fruit tracking.

## Features
- **Smart Auto Farm** that adapts to your level
- **Quest Selector** always picks the best XP option
- **Fruit Sniper** alerts and teleports to rare spawns
- **Auto Stats** distributes points instantly

## How to use
1. Launch Blox Fruits and run the script.
2. Choose your weapon build and enable auto farm.
3. Configure fruit sniping alerts for your favorite drops.`,
    views: 5200,
    featured: true,
  },
  {
    slug: 'hypershot',
    title: 'Hypershot',
    short: 'FPS enhancer with legit aim and performance tweaks.',
    category: 'shooter',
    tags: ['legit', 'aimbot'],
    features: ['Legit Aim', 'ESP', 'Performance Boost', 'Hit Sound'],
    thumbnail: '/images/scripts/hypershot.webp',
    workink_url: 'https://work.ink/pc/hypershot',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: false,
      executor_required: true,
    },
    version: '1.3.0',
    release_date: '2025-09-25',
    updated_at: '2025-10-06',
    seo: {
      title: 'Hypershot Script – Legit Aim & FPS Tweaks',
      description: 'Hypershot FPS script with legit aim assist, ESP, performance tuning, and hit sounds.',
      keywords: ['hypershot', 'script', 'fps', 'aim assist'],
    },
    description: `# Overview
Boost your aim and frames in Hypershot with a legit-focused enhancement suite.

## Features
- **Legit Aim** customizable smoothing and FOV
- **ESP** callouts for enemies and objectives
- **Performance Boost** disables heavy effects automatically
- **Hit Sound** feedback so every shot feels crisp

## How to use
1. Run the script once you load into Hypershot.
2. Set your smoothing and FOV for legit play.
3. Bind a toggle key to swap between aim profiles mid-match.`,
    views: 1900,
  },
  {
    slug: 'rivals',
    title: 'Rivals',
    short: 'Team shooter assistance with ESP and anti-flash tools.',
    category: 'shooter',
    tags: ['esp', 'utility'],
    features: ['Team ESP', 'Anti Flash', 'Recoil Control', 'Auto Buy'],
    thumbnail: '/images/scripts/rivals.webp',
    workink_url: 'https://work.ink/pc/rivals',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: false,
      executor_required: true,
    },
    version: '1.1.0',
    release_date: '2025-09-18',
    updated_at: '2025-10-06',
    seo: {
      title: 'Rivals Script – ESP, Anti Flash & Auto Buy',
      description: 'Rivals shooter script with team ESP, anti flash, recoil control, and economy helper.',
      keywords: ['rivals', 'roblox', 'script', 'esp'],
    },
    description: `# Overview
Coordinate with your squad in Rivals using visibility, utility, and shop automations.

## Features
- **Team ESP** highlights enemies and teammates
- **Anti Flash** removes blinding effects instantly
- **Recoil Control** keeps rifles on target
- **Auto Buy** grabs the best loadout each round

## How to use
1. Execute the script in Rivals before the round starts.
2. Enable ESP layers to track enemy pushes.
3. Configure your preferred weapon buy order in the economy tab.`,
    views: 1700,
  },
  {
    slug: 'bedwars',
    title: 'BedWars',
    short: 'BedWars utility with bed protection and combat macros.',
    category: 'fighting',
    tags: ['auto-farm', 'combat'],
    features: ['Bed Shield', 'Auto Bridger', 'Kill Aura', 'Anti Void'],
    thumbnail: '/images/scripts/bedwars.webp',
    workink_url: 'https://work.ink/pc/bedwars',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '2.0.0',
    release_date: '2025-09-10',
    updated_at: '2025-10-06',
    seo: {
      title: 'BedWars Script – Kill Aura & Anti Void',
      description: 'BedWars script with kill aura, bed shield, auto bridger, and anti void safety.',
      keywords: ['bedwars', 'roblox', 'script', 'kill aura'],
    },
    description: `# Overview
Hold your bed and win more queues with a BedWars macro suite built for offense and defense.

## Features
- **Bed Shield** auto places blast-proof protection
- **Auto Bridger** speed builds safe bridges
- **Kill Aura** clears anyone who pushes you
- **Anti Void** snaps you back from falling

## How to use
1. Queue into BedWars and start the script.
2. Enable your preferred combat profile.
3. Toggle builder tools when rotating between islands.`,
    views: 3800,
    featured: true,
  },
  {
    slug: 'rocitizens',
    title: 'RoCitizens',
    short: 'Quality of life boosters for money grinding and housing.',
    category: 'tycoon',
    tags: ['money', 'utility'],
    features: ['Auto Job', 'Auto Collect', 'Teleport', 'House Tools'],
    thumbnail: '/images/scripts/rocitizens.webp',
    workink_url: 'https://work.ink/pc/rocitizens',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-01',
    updated_at: '2025-10-06',
    seo: {
      title: 'RoCitizens Script – Auto Job & House Manager',
      description: 'RoCitizens automation hub with auto jobs, collectables, teleports, and building tools.',
      keywords: ['rocitizens', 'script', 'auto job', 'roblox'],
    },
    description: `# Overview
Handle your daily grind in RoCitizens with helpers for jobs, income, and house customization.

## Features
- **Auto Job** completes shift tasks automatically
- **Auto Collect** grabs paychecks and drops
- **Teleport** to stores, jobs, and events
- **House Tools** fast place furniture layouts

## How to use
1. Execute the script after loading into RoCitizens.
2. Pick the job routine you want to automate.
3. Save your favorite house layouts for quick redecorating.`,
    views: 1400,
  },
  {
    slug: 'build-a-boat',
    title: 'Build a Boat',
    short: 'Ultimate Build a Boat GUI with automation and travel tools.',
    category: 'simulator',
    tags: ['no-key', 'gui'],
    features: ['Auto Build', 'Treasure Farm', 'Teleport', 'Fly'],
    thumbnail: '/images/scripts/build-a-boat.webp',
    workink_url: 'https://work.ink/pc/build-a-boat',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.8.3',
    release_date: '2025-08-20',
    updated_at: '2025-10-06',
    seo: {
      title: 'Build a Boat Script – Auto Build & Treasure Farm',
      description: 'Feature-packed Build a Boat script with auto build, treasure farm, teleport, and fly mode.',
      keywords: ['build a boat', 'script', 'auto build', 'roblox'],
    },
    description: `# Overview
Create faster and travel farther in Build a Boat using a polished GUI built for automation.

## Features
- **Auto Build** loads optimized boat templates
- **Treasure Farm** loops stages and collects rewards
- **Teleport** to key islands and hidden chests
- **Fly Mode** explore the map freely

## How to use
1. Launch Build a Boat and run the script.
2. Select a template or design your own auto build.
3. Enable farm mode to gather gold hands-free.`,
    views: 2100,
  },
  {
    slug: 'murder-mystery-2',
    title: 'Murder Mystery 2',
    short: 'Round winning advantages with player ESP and role reveal.',
    category: 'adventure',
    tags: ['esp', 'utility'],
    features: ['Role Reveal', 'Player ESP', 'Coin Farm', 'Knife Aura'],
    thumbnail: '/images/scripts/murder-mystery-2.webp',
    workink_url: 'https://work.ink/pc/murder-mystery-2',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.4.0',
    release_date: '2025-09-05',
    updated_at: '2025-10-06',
    seo: {
      title: 'Murder Mystery 2 Script – ESP & Coin Farm',
      description: 'Murder Mystery 2 script with role reveal, ESP, coin farming, and knife aura.',
      keywords: ['murder mystery 2', 'script', 'esp', 'coin farm'],
    },
    description: `# Overview
Spot the murderer instantly and stay ahead of every round with a reliable Murder Mystery 2 toolkit.

## Features
- **Role Reveal** shows who is murderer, sheriff, or hero
- **Player ESP** traces everyone through walls
- **Coin Farm** pathing with safe routes
- **Knife Aura** defends you in close range fights

## How to use
1. Execute the script on the loading screen.
2. Keep role reveal on to plan your moves quickly.
3. Use coin farm between rounds to stack cash.`,
    views: 3300,
  },
  {
    slug: '99-nights-in-the-forest',
    title: '99 Nights in the Forest',
    short: 'Survival assistance with item ESP and auto craft.',
    category: 'adventure',
    tags: ['survival', 'utility'],
    features: ['Item ESP', 'Auto Craft', 'Safehouse TP', 'Weather Control'],
    thumbnail: '/images/scripts/99-nights-in-the-forest.webp',
    workink_url: 'https://work.ink/pc/99-nights-in-the-forest',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: false,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: '99 Nights in the Forest Script – Survival ESP & Auto Craft',
      description: 'Stay alive in 99 Nights in the Forest with item ESP, auto craft, and safehouse teleports.',
      keywords: ['99 nights in the forest', 'script', 'survival', 'roblox'],
    },
    description: `# Overview
Survive the long haul in 99 Nights in the Forest with visibility and crafting helpers.

## Features
- **Item ESP** highlights loot, tools, and food
- **Auto Craft** builds essentials when materials are ready
- **Safehouse Teleport** warp back to base instantly
- **Weather Control** clears fog and rain for visibility

## How to use
1. Execute once you spawn in the forest.
2. Toggle ESP layers to highlight the resources you need.
3. Queue auto crafts so gear is ready before night falls.`,
    views: 1100,
  },
  {
    slug: 'blockspin',
    title: 'Blockspin',
    short: 'Blockspin macro suite for spins, quests, and travel.',
    category: 'simulator',
    tags: ['auto-farm', 'utility'],
    features: ['Auto Spin', 'Quest Farm', 'Chest Finder', 'Speed Boost'],
    thumbnail: '/images/scripts/blockspin.webp',
    workink_url: 'https://work.ink/pc/blockspin',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Blockspin Script – Auto Spin & Quest Farm',
      description: 'Blockspin automation script with auto spin, quest farming, chest finder, and speed boost.',
      keywords: ['blockspin', 'script', 'auto spin', 'roblox'],
    },
    description: `# Overview
Stack spins and rewards faster in Blockspin with reliable automation.

## Features
- **Auto Spin** loops daily spins with cooldown checks
- **Quest Farm** completes rotating challenges
- **Chest Finder** guides you to hidden crates
- **Speed Boost** adds adjustable walk speed

## How to use
1. Start Blockspin and attach your executor.
2. Enable the modules you need from the hub GUI.
3. Let the script run while you collect your daily rewards.`,
    views: 1250,
  },
  {
    slug: 'forsaken',
    title: 'Forsaken',
    short: 'Horror experience assistant with monster alerts and safe spots.',
    category: 'misc',
    tags: ['horror', 'utility'],
    features: ['Monster ESP', 'Safe Spot Finder', 'Auto Candle', 'Sprint Boost'],
    thumbnail: '/images/scripts/forsaken.webp',
    workink_url: 'https://work.ink/pc/forsaken',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: false,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Forsaken Script – Monster ESP & Safe Spots',
      description: 'Navigate Forsaken safely with monster ESP, safe spot finder, auto candle, and sprint boost.',
      keywords: ['forsaken', 'roblox', 'script', 'horror'],
    },
    description: `# Overview
Outsmart the entities in Forsaken with visibility tools and emergency escapes.

## Features
- **Monster ESP** warns you before the jumpscares
- **Safe Spot Finder** marks safe hiding locations
- **Auto Candle** keeps your light source active
- **Sprint Boost** adds stamina-free running

## How to use
1. Execute the script at the lobby screen.
2. Enable ESP layers for the monsters you are facing.
3. Toggle safe spot markers whenever you enter a new area.`,
    views: 980,
  },
  {
    slug: 'anime-rangers-x',
    title: 'Anime Rangers X',
    short: 'Tower defense automation with unit upgrades and wave skip.',
    category: 'fighting',
    tags: ['auto-farm', 'tower-defense'],
    features: ['Auto Place', 'Auto Upgrade', 'Wave Skip', 'Drop Collector'],
    thumbnail: '/images/scripts/anime-rangers-x.webp',
    workink_url: 'https://work.ink/pc/anime-rangers-x',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Anime Rangers X Script – Auto Place & Wave Skip',
      description: 'Anime Rangers X automation script with auto place, upgrades, wave skip, and drop collector.',
      keywords: ['anime rangers x', 'script', 'tower defense', 'roblox'],
    },
    description: `# Overview
Clear waves in Anime Rangers X without the grind using automated placements and upgrades.

## Features
- **Auto Place** drops your best units on optimal tiles
- **Auto Upgrade** spends currency intelligently
- **Wave Skip** speeds through early rounds
- **Drop Collector** vacuums rewards to your base

## How to use
1. Run the script before starting a match.
2. Pick your unit loadout and let auto place handle positions.
3. Enable wave skip for faster gem farming.`,
    views: 2050,
  },
  {
    slug: 'restaurant-tycoon-3',
    title: 'Restaurant Tycoon 3',
    short: 'Manage staff, menu, and customers with automation tools.',
    category: 'tycoon',
    tags: ['money', 'auto-farm'],
    features: ['Auto Cook', 'Auto Serve', 'Supply Restock', 'Design Saver'],
    thumbnail: '/images/scripts/restaurant-tycoon-3.webp',
    workink_url: 'https://work.ink/pc/restaurant-tycoon-3',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Restaurant Tycoon 3 Script – Auto Cook & Serve',
      description: 'Automate Restaurant Tycoon 3 with auto cook, auto serve, restock, and design saving tools.',
      keywords: ['restaurant tycoon 3', 'script', 'auto cook', 'roblox'],
    },
    description: `# Overview
Keep your Restaurant Tycoon 3 cafe running 24/7 with staff automation and design utilities.

## Features
- **Auto Cook** completes kitchen minigames instantly
- **Auto Serve** keeps guests happy for better tips
- **Supply Restock** orders ingredients before you run out
- **Design Saver** exports and imports layouts

## How to use
1. Launch the script in your restaurant.
2. Enable kitchen and service automation to stabilize income.
3. Save your favorite builds and load them on new plots.`,
    views: 1750,
  },
  {
    slug: 'break-your-bones',
    title: 'Break Your Bones',
    short: 'High score helper with force multipliers and auto farm.',
    category: 'simulator',
    tags: ['auto-farm', 'grind'],
    features: ['Auto Launch', 'Force Multiplier', 'Ragdoll Tweaks', 'Cash Farm'],
    thumbnail: '/images/scripts/break-your-bones.webp',
    workink_url: 'https://work.ink/pc/break-your-bones',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Break Your Bones Script – Auto Farm & Force Boost',
      description: 'Break Your Bones script with auto launch, force multiplier, ragdoll tweaks, and cash farm.',
      keywords: ['break your bones', 'script', 'auto farm', 'roblox'],
    },
    description: `# Overview
Rack up absurd damage totals in Break Your Bones using physics boosts and auto farming tools.

## Features
- **Auto Launch** repeatedly flings your avatar
- **Force Multiplier** pushes harder for higher scores
- **Ragdoll Tweaks** adjust angles and spin
- **Cash Farm** reinvests rewards into upgrades

## How to use
1. Attach the script in Break Your Bones.
2. Enable your preferred launch preset.
3. Let the auto farm loop run while you bank rewards.`,
    views: 2600,
  },
  {
    slug: 'taxi-boss',
    title: 'Taxi Boss',
    short: 'Driving helper with passenger finder and route optimizer.',
    category: 'simulator',
    tags: ['auto-farm', 'utility'],
    features: ['Passenger Finder', 'Auto Drive', 'Route Optimizer', 'Garage Manager'],
    thumbnail: '/images/scripts/taxi-boss.webp',
    workink_url: 'https://work.ink/pc/taxi-boss',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Taxi Boss Script – Auto Drive & Passenger Finder',
      description: 'Taxi Boss automation script with passenger finder, auto drive, route optimizer, and garage manager.',
      keywords: ['taxi boss', 'script', 'auto drive', 'roblox'],
    },
    description: `# Overview
Become the top driver in Taxi Boss with automation that keeps fares rolling in nonstop.

## Features
- **Passenger Finder** scans for the highest paying clients
- **Auto Drive** navigates to destinations safely
- **Route Optimizer** calculates fastest drop-offs
- **Garage Manager** tunes and upgrades cars automatically

## How to use
1. Run the script at the Taxi Boss HQ.
2. Choose auto or manual driving assistance.
3. Track your profit per hour with the built-in stats.`,
    views: 1850,
  },
  {
    slug: 'blox-fruits-rain-raid',
    title: 'Blox Fruits (Rain / Raid)',
    short: 'Specialized raid assistant for Blox Fruits events.',
    category: 'rpg',
    tags: ['raid', 'auto-farm'],
    features: ['Auto Raid', 'Rain Tracker', 'Boss Highlights', 'Team Buffs'],
    thumbnail: '/images/scripts/blox-fruits-rain-raid.webp',
    workink_url: 'https://work.ink/pc/blox-fruits-rain-raid',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: false,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Blox Fruits Raid Script – Auto Rain Events',
      description: 'Rain and raid focused Blox Fruits script with auto raid, rain tracker, boss highlights, and team buffs.',
      keywords: ['blox fruits', 'raid script', 'rain event', 'roblox'],
    },
    description: `# Overview
Clear rain events and raids faster in Blox Fruits with a hub tuned for boss rotations.

## Features
- **Auto Raid** handles wave spawns and ability casts
- **Rain Tracker** announces the next event timer
- **Boss Highlights** outlines the target even in chaos
- **Team Buffs** shares enhancements with your squad

## How to use
1. Launch the script inside the raid lobby.
2. Select your element and configure ability priorities.
3. Enable auto raid before the countdown reaches zero.`,
    views: 3100,
    featured: true,
  },
  {
    slug: 'grow-a-kingdom',
    title: 'Grow a Kingdom',
    short: 'Strategy helper with resource automation and troop macros.',
    category: 'tycoon',
    tags: ['auto-farm', 'strategy'],
    features: ['Resource Farm', 'Auto Build', 'Troop Macro', 'Defense Planner'],
    thumbnail: '/images/scripts/grow-a-kingdom.webp',
    workink_url: 'https://work.ink/pc/grow-a-kingdom',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Grow a Kingdom Script – Auto Build & Troop Macros',
      description: 'Grow a Kingdom script with resource farming, auto build, troop macros, and defense planning.',
      keywords: ['grow a kingdom', 'script', 'auto farm', 'roblox'],
    },
    description: `# Overview
Expand your empire in Grow a Kingdom using automation to handle resources, troops, and defenses.

## Features
- **Resource Farm** harvests farms, mines, and lumber
- **Auto Build** places structures following your blueprint
- **Troop Macro** trains and deploys squads automatically
- **Defense Planner** sets up patrols and alerts

## How to use
1. Open the script in your kingdom lobby.
2. Load or create a build order for auto placement.
3. Monitor wars while the macro manages your economy.`,
    views: 1500,
  },
  {
    slug: 'huntly-zombie',
    title: 'Huntly Zombie',
    short: 'Zombie survival toolkit with gun aimbot and loot radar.',
    category: 'fighting',
    tags: ['aimbot', 'survival'],
    features: ['Zombie Aimbot', 'Loot Radar', 'Auto Barricade', 'Party Share'],
    thumbnail: '/images/scripts/huntly-zombie.webp',
    workink_url: 'https://work.ink/pc/huntly-zombie',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: false,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Huntly Zombie Script – Aimbot & Loot Radar',
      description: 'Huntly Zombie script with zombie aimbot, loot radar, auto barricade, and party sharing.',
      keywords: ['huntly zombie', 'script', 'aimbot', 'roblox'],
    },
    description: `# Overview
Outlast every wave in Huntly Zombie with aim assistance, loot visibility, and base support tools.

## Features
- **Zombie Aimbot** sticks to heads for max damage
- **Loot Radar** pings ammo, weapons, and perks
- **Auto Barricade** repairs boards between waves
- **Party Share** syncs drops with teammates

## How to use
1. Execute the script when you load into Huntly Zombie.
2. Flip on aimbot for intense waves and disable for casual play.
3. Keep loot radar running to maximize supplies.`,
    views: 1420,
  },
  {
    slug: 'rotubelife-2',
    title: 'RotubeLife 2',
    short: 'Creator grind assistant with recording macros and stat tracking.',
    category: 'tycoon',
    tags: ['grind', 'utility'],
    features: ['Auto Record', 'Task Scheduler', 'Comment Manager', 'Stat Tracker'],
    thumbnail: '/images/scripts/rotubelife-2.webp',
    workink_url: 'https://work.ink/pc/rotubelife-2',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: true,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'RotubeLife 2 Script – Auto Record & Task Scheduler',
      description: 'RotubeLife 2 automation script with auto record, task scheduler, comment manager, and stat tracker.',
      keywords: ['rotubelife 2', 'script', 'auto record', 'roblox'],
    },
    description: `# Overview
Grind trending videos in RotubeLife 2 around the clock with a creator-focused automation suite.

## Features
- **Auto Record** films videos and edits automatically
- **Task Scheduler** completes daily and weekly missions
- **Comment Manager** responds to boost channel growth
- **Stat Tracker** logs revenue and subscriber gains

## How to use
1. Execute the script in your studio.
2. Configure the scheduler with the content types you want.
3. Watch your channel grow while the macro loops tasks.`,
    views: 1680,
  },
  {
    slug: 'afk-script',
    title: 'AFK Script',
    short: 'Universal AFK hub with anti-kick and custom macros.',
    category: 'misc',
    tags: ['utility', 'anti-afk'],
    features: ['Anti Kick', 'Custom Macro', 'Auto Rejoin', 'Session Timer'],
    thumbnail: '/images/scripts/afk-script.webp',
    workink_url: 'https://work.ink/pc/afk-script',
    status: 'active',
    compatibility: {
      pc: true,
      mobile: true,
      executor_required: false,
    },
    version: '1.0.0',
    release_date: '2025-10-06',
    updated_at: '2025-10-06',
    seo: {
      title: 'Universal AFK Script – Anti Kick & Auto Rejoin',
      description: 'Stay online longer with an AFK script that prevents kicks, re-joins servers, and runs simple macros.',
      keywords: ['afk script', 'anti kick', 'roblox', 'macro'],
    },
    description: `# Overview
Keep any Roblox experience running with a universal AFK utility that fights idle kicks and runs simple tasks.

## Features
- **Anti Kick** moves your character to avoid idle detection
- **Custom Macro** executes keystrokes or chat commands
- **Auto Rejoin** loads the last server if you disconnect
- **Session Timer** tracks how long you have been farming

## How to use
1. Attach the AFK script in the game you want to grind.
2. Choose a built-in macro or record your own actions.
3. Enable auto rejoin before you leave the keyboard.`,
    views: 2950,
    featured: true,
  },
];
