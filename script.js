const translations = {
    en: {
        'main-title': 'Dota 2 Mods Collection',
        'main-description': 'Discover and download mods for Dota 2 by @dota2pornfx',
        'back': 'Back',
        'download': 'Download',
        'shaders': 'Shaders',
        'shaders-desc': 'Replaces the fog of war effect',
        'ti-bp-effects': 'TI/BP Effects',
        'ti-bp-effects-desc': 'Battle Pass and The International effects collection',
        'item-effects': 'Item Effects',
        'item-effects-desc': 'Custom effects for various items',
        'creep-deny': 'Creep Deny',
        'creep-deny-desc': 'Custom creep deny animations and effects',
        'emblems': 'Emblems',
        'emblems-desc': 'Collection of various emblems',
        'versus-screens': 'Versus Screens',
        'versus-screens-desc': 'Custom versus screen',
        'terrains': 'Terrains',
        'terrains-desc': 'Terrains modifications',
        'trees': 'Trees',
        'trees-desc': 'Custom tree models',
        'heroes': 'Heroes',
        'heroes-desc': 'Hero models and sets mods',
        'roshan': 'Roshan',
        'roshan-desc': 'Custom Roshan models and skins',
        'creeps': 'Creeps',
        'creeps-desc': 'Custom creep models',
        'ancient': 'Ancient',
        'ancient-desc': 'Ancient mods',
        'tormentor': 'Tormentor',
        'tormentor-desc': 'Custom Tormentor',
        'towers': 'Towers',
        'towers-desc': 'Custom towers',
        'high-five': 'High Five',
        'high-five-desc': 'Custom high five animations',
        'packs': 'Packs',
        'packs-desc': 'Themed mods packs',
        'ranged-attack': 'Ranged Attack',
        'ranged-attack-desc': 'Custom ranged attack effects',
        'weather': 'Weather',
        'weather-desc': 'Weather modification tool',
        'mega-kill': 'Mega-Kill',
        'mega-kill-desc': 'Custom mega-kill announcers',
        'guides': 'Guides',
        'guides-desc': 'Installation guides and tutorials',
        'pedestal': 'Pedestal',
        'pedestal-desc': 'Custom hero pedestals',
        'other': 'Other',
        'other-desc': 'Miscellaneous mods'
    },
    ru: {
        'main-title': 'Dota 2 Mods Collection',
        'main-description': 'Discover and download mods for Dota 2 by @dota2pornfx',
        'back': 'Назад',
        'download': 'Скачать',
        'shaders': 'Shaders',
        'shaders-desc': 'Заменяет эффект тумана войны',
        'ti-bp-effects': 'TI/BP Effects',
        'ti-bp-effects-desc': 'Коллекция эффектов Battle Pass и The International, заменяет стандартные эффекты',
        'item-effects': 'Item Effects',
        'item-effects-desc': 'Эффекты для различных предметов',
        'creep-deny': 'Creep Deny',
        'creep-deny-desc': 'Анимации и эффекты добивания крипов',
        'emblems': 'Emblems',
        'emblems-desc': 'Коллекция различных эмблем',
        'versus-screens': 'Versus Screens',
        'versus-screens-desc': 'Заменяет стандартные VS',
        'terrains': 'Terrains',
        'terrains-desc': 'Модификация ландшафта',
        'trees': 'Trees',
        'trees-desc': 'Кастомные деревья',
        'heroes': 'Heroes',
        'heroes-desc': 'Кастомные модели и сеты героев',
        'roshan': 'Roshan',
        'roshan-desc': 'Кастомные модели и скины Рошана',
        'creeps': 'Creeps',
        'creeps-desc': 'Модели крипов',
        'ancient': 'Ancient',
        'ancient-desc': 'Кастомный Ancient',
        'tormentor': 'Tormentor',
        'tormentor-desc': 'Кастомный терзатель',
        'towers': 'Towers',
        'towers-desc': 'Кастомные башни',
        'high-five': 'High Five',
        'high-five-desc': 'Кастомные анимации и эффекты дай пять',
        'packs': 'Packs',
        'packs-desc': 'Тематические паки',
        'ranged-attack': 'Ranged Attack',
        'ranged-attack-desc': 'Эффекты для дальников',
        'weather': 'Weather',
        'weather-desc': 'Установка любой погоды (dota2changer)',
        'mega-kill': 'Mega-Kill',
        'mega-kill-desc': 'Кастомная озвучка мега-убийств',
        'guides': 'Guides',
        'guides-desc': 'Руководства по разной хуйне',
        'pedestal': 'Pedestal',
        'pedestal-desc': 'Кастомные пьедесталы',
        'other': 'Other',
        'other-desc': 'Разнообразные моды/штучки'
    }
};

const categories = [
    { id: 'shaders', emoji: '🎨', key: 'shaders', preview: 'shaders.png' },
    { id: 'ti-bp-effects', emoji: '🌟', key: 'ti-bp-effects', preview: 'ti-bp-effects.png' },
    { id: 'item-effects', emoji: '✨', key: 'item-effects', preview: 'item-effects.png' },
    { id: 'creep-deny', emoji: '🎯', key: 'creep-deny', preview: 'creep-deny.png' },
    { id: 'emblems', emoji: '🏵', key: 'emblems', preview: 'emblems.png' },
    { id: 'versus-screens', emoji: '🆚', key: 'versus-screens', preview: 'vs.png' },
    { id: 'terrains', emoji: '🏞️', key: 'terrains', preview: 'terrains.png' },
    { id: 'trees', emoji: '🌲', key: 'trees', preview: 'trees.png' },
    { id: 'heroes', emoji: '👤', key: 'heroes', preview: 'heroes.png' },
    { id: 'roshan', emoji: '🦖', key: 'roshan', preview: 'roshan.png' },
    { id: 'creeps', emoji: '🕷', key: 'creeps', preview: 'creeps.png' },
    { id: 'ancient', emoji: '🗻', key: 'ancient', preview: 'ancient.png' },
    { id: 'tormentor', emoji: '🎈', key: 'tormentor', preview: 'tormentor.png' },
    { id: 'towers', emoji: '🗼', key: 'towers', preview: 'towers.png' },
    { id: 'high-five', emoji: '👋', key: 'high-five', preview: 'high-five.png' },
    { id: 'packs', emoji: '📦', key: 'packs', preview: 'packs.png' },
    { id: 'ranged-attack', emoji: '🏹', key: 'ranged-attack', preview: 'ranged-attack.png' },
    { id: 'weather', emoji: '🌦️', key: 'weather', preview: 'weather.png' },
    { id: 'mega-kill', emoji: '🔊', key: 'mega-kill', preview: 'mega-kill.png' },
    { id: 'pedestal', emoji: '🗿', key: 'pedestal', preview: 'pedestal.png' },
    { id: 'other', emoji: '⚙️', key: 'other', preview: 'other.png' }
    // { id: 'guides', emoji: '📖', key: 'guides', preview: null }
];

const modsData = {
    'shaders': [
        { name: 'Aghanim Labyrinth Shader', preview: 'aghanim_shader.jpg', file: 'pak07_dir.vpk' },
        { name: 'Diretide Shader', preview: 'diretide_shader.jpg', file: 'pak10_dir.vpk' },
        { name: 'Ancient Shader', preview: 'ancient_shader.jpg', file: 'pak32_dir.vpk' },
        { name: 'Haze Shader', preview: 'haze_shader.mp4', file: 'pak40_dir.vpk' },
        { name: 'Purple Ancient Shader', preview: 'purple_ancient_shader.jpg', file: 'pak47_dir.vpk' },
        { name: 'Purple Aghanim Shader', preview: 'purple_aghanim_shader.jpg', file: 'pak48_dir.vpk' }
    ],
    'ti-bp-effects': [
        { name: 'The International 2019 Effects', preview: 'ti19.jpg', file: 'pak09_dir.vpk' },
        { name: 'The International 2018 Effects', preview: 'ti18.jpg', file: 'pak13_dir.vpk' },
        { name: 'The International 2017 Effects', preview: 'ti17.jpg', file: 'pak17_dir.vpk' },
        { name: 'Winter 2016 BP Effects', preview: 'winter2016.jpg', file: 'pak18_dir.vpk' },
        { name: 'The International 2016 Effects', preview: 'ti16.jpg', file: 'pak19_dir.vpk' },
        { name: 'The International 2021 Effects', preview: 'ti10.jpg', file: 'pak24_dir.vpk' },
        { name: 'Nemestice 2021 BP Effects', preview: 'bp21.jpg', file: 'pak27_dir.vpk' },
        { name: 'Aghanims BP Effects', preview: 'Aghanims BP.jpg', file: 'pak39_dir.vpk' },
        { name: 'Quartero Effects', preview: 'Quartero.jpg', file: 'pak40_dir.vpk' }
    ],
    'item-effects': [
        { name: 'GG Iron Branch', preview: 'gg_branch.jpg', file: 'pak20_dir.vpk' },
        { name: 'Christmas Iron Branch', preview: 'christmas_branch.mp4', file: 'pak68_dir.vpk' },
        { name: 'Purple Dagon', preview: 'purple_dagon.mp4', file: 'pak41_dir.vpk' },
        { name: 'Blue Dagon', preview: 'blue_dagon.mp4', file: 'pak42_dir.vpk' },
        { name: 'Snow Dagon', preview: 'snow_dagon.mp4', file: 'pak43_dir.vpk' },
        { name: 'Green Dagon', preview: 'green_dagon.mp4', file: 'pak12_dir.vpk' },
        { name: 'White Dagon', preview: 'white_dagon.mp4', file: 'pak21_dir.vpk' },
        { name: 'Custom Runes', preview: 'сustom_runes.mp4', file: 'pak33_dir.vpk' },
        { name: 'Aegis Hearts', preview: 'aegis_hearts.mp4', file: 'pak34_dir.vpk' },
        { name: 'Beer Bottle', preview: 'Beer Bottle.jpg', file: 'pak26_dir.vpk' }
    ],
    'creep-deny': [
        { name: 'Deny ?', preview: 'deny_huh.jpg', file: 'pak08_dir.vpk' },
        { name: 'Soul Deny', preview: 'soul_deny.mp4', file: 'pak11_dir.vpk' },
        { name: 'Fuck Deny', preview: 'fuck_deny.jpg', file: 'pak12_dir.vpk' },
        { name: 'Deny Fall 2022', preview: 'deny_fall_2022.mp4', file: 'pak21_dir.vpk' },
        { name: 'Deny Spring', preview: 'deny_spring.mp4', file: 'pak22_dir.vpk' },
        { name: 'Deny Fall 2021', preview: 'deny_fall_2021.mp4', file: 'pak23_dir.vpk' },
        { name: 'lasthit Golden Shards', preview: 'lasthit_golden_shards.mp4', file: 'pak35_dir.vpk' }
    ],
    'emblems': [
        { name: 'Emblem of the Diretide Green', preview: 'Emblem of the Diretide Green.jpg', file: 'pak28_dir.vpk' },
        { name: 'Emblem of the Diretide Blue', preview: 'Emblem of the Diretide Blue.jpg', file: 'pak29_dir.vpk' },
        { name: 'Emblem of the Diretide Yellow', preview: 'Emblem of the Diretide Yellow.jpg', file: 'pak30_dir.vpk' },
        { name: 'Emblem of the Diretide Red', preview: 'Emblem of the Diretide Red.jpg', file: 'pak31_dir.vpk' },
        { name: 'Battle Pass 2022 Emblem', preview: 'Battle Pass 2022 Emblem.mp4', file: 'pak32_dir.vpk' },
        { name: 'Emblem of the Crystal Echelon', preview: 'Emblem of the Crystal Echelon.mp4', file: 'pak33_dir.vpk' },
        { name: 'Emblem of Divinity', preview: 'Emblem of Divinity.mp4', file: 'pak34_dir.vpk' },
        { name: 'Nemestice Emblem', preview: 'Nemestice Emblem.mp4', file: 'pak35_dir.vpk' },
        { name: 'Overgrown Emblem', preview: 'Overgrown Emblem.mp4', file: 'pak36_dir.vpk' },
        { name: 'Aghanims Emblem', preview: 'Aghanims Emblem.jpg', file: 'pak37_dir.vpk' },
        { name: 'Sunken Emblem', preview: 'Sunken Emblem.mp4', file: 'pak38_dir.vpk' },
        { name: 'Emblem Black Star', preview: 'Emblem Black Star.mp4', file: 'pak19_dir.vpk' },
        { name: 'Emblem Darkness', preview: 'Emblem Darkness.mp4', file: 'pak20_dir.vpk' }
    ],
    'versus-screens': [
        { name: 'Winter Versus Screen', preview: 'Winter Versus Screen.mp4', file: 'pak45_dir.vpk' },
        { name: 'TI9 Versus Screen I', preview: 'TI9 Versus Screen I.mp4', file: 'pak46_dir.vpk' },
        { name: 'TI9 Versus Screen II', preview: 'TI9 Versus Screen II.mp4', file: 'pak47_dir.vpk' },
        { name: 'Nemestice Versus Screen', preview: 'Nemestice Versus Screen.mp4', file: 'pak48_dir.vpk' },
        { name: 'TI 2024 Versus Screen', preview: 'TI 2024 Versus Screen.mp4', file: 'pak69_dir.vpk' },
        { name: 'Muerta Radiant Versus Screen', preview: 'Muerta Radiant Versus Screen.mp4', file: 'pak70_dir.vpk' },
        { name: 'Muerta Dire Versus Screen', preview: 'Muerta Dire Versus Screen.mp4', file: 'pak71_dir.vpk' },
        { name: 'Diretide Radiant Versus Screen', preview: 'Diretide Radiant Versus Screen.mp4', file: 'pak72_dir.vpk' },
        { name: 'Diretide Dire Versus Screen', preview: 'Diretide Dire Versus Screen.mp4', file: 'pak73_dir.vpk' }
    ],
    'terrains': [
        { name: 'All Terrains', preview: 'All Terrains.jpg', file: 'README.txt' },
        { name: 'Dark Terrain', preview: 'Dark Terrain.jpg', file: 'pak55_dir.vpk' },
        { name: 'Flat Dark Terrain', preview: 'Flat Dark Terrain.mp4', file: 'pak56_dir.vpk' },
        { name: 'River Colors', preview: 'River Colors.mp4', file: 'Rivers.zip' }
    ],
    'trees': [
        { name: 'Pumpkin Trees', preview: 'Pumpkin Trees.jpg', file: 'pak25_dir.vpk' },
        { name: 'Small Trees', preview: 'Small Trees.jpg', file: 'pak7_dir.vpk' },
        { name: 'Crystals Trees', preview: 'Crystals Trees.jpg', file: 'pak22_dir.vpk' },
        { name: 'Wooden Trees', preview: 'Wooden Trees.jpg', file: 'pak23_dir.vpk' },
        { name: 'Stone Trees', preview: 'Stone Trees.jpg', file: 'pak31_dir.vpk' }
    ],
    'heroes': [
        { name: 'Lion Dark Magician Girl', preview: 'Lion Dark Magician Girl.jpg', file: 'pak50_dir.zip' },
        { name: 'Old Storm Spirit', preview: 'Old Storm Spirit.jpg', file: 'pak51_dir.vpk' },
        { name: 'Bare Brewmaster', preview: 'Bare Brewmaster.mp4', file: 'pak54_dir.vpk' },
        { name: 'Пока лень', preview: '', file: 'pak_dir.vpk' }
    ],
    'roshan': [
        { name: 'Aghanims Roshan', preview: 'Aghanims Roshan.jpg', file: 'pak52_dir.vpk' },
        { name: 'Greevil Grief Roshan', preview: 'Greevil Grief Roshan.jpg', file: 'pak58_dir.vpk' },
        { name: 'Winter Roshan', preview: 'Winter Roshan.jpg', file: 'pak59_dir.vpk' },
        { name: 'Desert Roshan', preview: 'Desert Roshan.jpg', file: 'pak60_dir.vpk' },
        { name: 'Gardens Roshan', preview: 'Gardens Roshan.jpg', file: 'pak61_dir.vpk' },
        { name: 'Golden Roshan', preview: 'Golden Roshan.jpg', file: 'pak62_dir.vpk' },
        { name: 'Journey Roshan', preview: 'Journey Roshan.jpg', file: 'pak63_dir.vpk' },
        { name: 'Reef Roshan', preview: 'Reef Roshan.jpg', file: 'pak64_dir.vpk' }
    ],
    'creeps': [
        { name: 'Reptilian Creeps + Woodland Siege', preview: 'Reptilian Creeps + Woodland Siege.jpg', file: 'pak65_dir.vpk' },
        { name: 'Woodland Creeps + Woodland Siege', preview: 'Woodland Creeps + Woodland Siege.jpg', file: 'pak66_dir.vpk' },
        { name: 'Nemestice Creeps + Woodland Siege', preview: 'Nemestice Creeps + Woodland Siege.jpg', file: 'pak67_dir.vpk' }
    ],
    'ancient': [
        { name: 'Ancient Dragon King', preview: 'Ancient Dragon King.jpg', file: 'pak30_dir.vpk' },
        { name: 'Frostivus Ancient', preview: 'Frostivus Ancient.jpg', file: 'pak74_dir.vpk' }
    ],
    'tormentor': [
        { name: 'Frostivus Tormentor', preview: 'Frostivus Tormentor.jpg', file: 'pak75_dir.vpk' }
    ],
    'towers': [
        { name: 'Holiday Radiant Tower', preview: 'Holiday Radiant Tower.jpg', file: 'pak81_dir.vpk' }
    ],
    'high-five': [
        { name: 'High Five Aghanim Puppet', preview: 'High Five Aghanim Puppet.mp4', file: 'pak76_dir.vpk' },
        { name: 'High Five Crownfall', preview: 'High Five Crownfall.mp4', file: 'pak77_dir.vpk' }
    ],
    'packs': [
        { name: 'Winter Pack', preview: 'Winter Pack.mp4', file: 'Winter Pack [7.39d].zip' },
        { name: 'Autumn Pack', preview: 'Autumn Pack.mp4', file: 'Autumn Pack [7.39d].zip' },
        { name: 'Aqua Pack', preview: 'Aqua Pack.mp4', file: 'Aqua Pack [7.39d].zip' }
    ],
    'ranged-attack': [
        { name: 'Nemestice Ranged Attack', preview: 'Nemestice Ranged Attack.mp4', file: 'pak13_dir.vpk' }
    ],
    'weather': [
        { name: 'Weather Changer', preview: 'Weather Changer.jpg', file: 'Weather Changer.zip' }
    ],
    'mega-kill': [
        { name: 'Nedotrax Mega-Kill', preview: 'Nedotrax Mega-Kill.jpg', file: 'pak39_dir.vpk' },
        { name: 'Siega Mega-Kill', preview: 'Siega Mega-Kill.jpg', file: 'pak46_dir.vpk' }
    ],
    'pedestal': [
        { name: 'Drow Ranger Pedestal', preview: 'Drow Ranger Pedestal.jpg', file: 'pak78_dir.vpk' },
        { name: 'Earthshaker Pedestal', preview: 'Earthshaker Pedestal.jpg', file: 'pak79_dir.vpk' },
        { name: 'Windranger Pedestal', preview: 'Windranger Pedestal.jpg', file: 'pak80_dir.vpk' },
        { name: 'Snow Pedestal', preview: 'Snow Pedestal.jpg', file: 'pak16_dir.vpk' }
    ],
    'other': [
        { name: 'Profile Graffiti & Phrases', preview: 'Profile Graffiti & Phrases.jpg', file: 'pak44_dir.vpk' },
        { name: 'Rage Voice Icon', preview: 'Rage Voice Icon.jpg', file: 'pak53_dir.vpk' },
        { name: 'Showcase Rotation', preview: 'Showcase Rotation.mp4', file: 'pak36_dir.vpk' }
    ],
    '': [
        { name: '', preview: '', file: 'pak_dir.vpk' },
        { name: '', preview: '', file: 'pak_dir.vpk' },
        { name: '', preview: '', file: 'pak_dir.vpk' },
        { name: '', preview: '', file: 'pak_dir.vpk' },
        { name: '', preview: '', file: 'pak_dir.vpk' },
        { name: '', preview: '', file: 'pak_dir.vpk' },
        { name: '', preview: '', file: 'pak_dir.vpk' },
        { name: '', preview: '', file: 'pak_dir.vpk' },
        { name: '', preview: '', file: 'pak_dir.vpk' }
    ]
};

let currentLanguage = 'en';
let currentCategory = null;

const homePage = document.getElementById('homePage');
const categoryPage = document.getElementById('categoryPage');
const categoriesGrid = document.getElementById('categoriesGrid');
const modsGrid = document.getElementById('modsGrid');
const categoryTitle = document.getElementById('categoryTitle');
const categoryDescription = document.getElementById('categoryDescription');
const backButton = document.getElementById('backButton');
const langButtons = document.querySelectorAll('.lang-btn');

function init() {
    renderCategories();
    setupEventListeners();
    updateLanguage();
}

function setupEventListeners() {
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            if (lang !== currentLanguage) {
                switchLanguage(lang);
            }
        });
    });

    backButton.addEventListener('click', showHomePage);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentCategory) {
            showHomePage();
        }
    });
}

function switchLanguage(lang) {
    currentLanguage = lang;
    langButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    updateLanguage();
}

function updateLanguage() {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.dataset.translate;
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });

    if (currentCategory) {
        const category = categories.find(cat => cat.id === currentCategory);
        if (category) {
            categoryTitle.textContent = translations[currentLanguage][category.key];
            categoryDescription.textContent = translations[currentLanguage][category.key + '-desc'];
        }
    }
}

function renderCategories() {
    categoriesGrid.innerHTML = '';
    categories.forEach(category => {
        const card = createCategoryCard(category);
        categoriesGrid.appendChild(card);
    });
}

function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'card fade-in';

    let mediaContent;
    if (category.preview) {
        const isVideo = category.preview.endsWith('.mp4');
        const mediaElement = isVideo ? 'video' : 'img';
        const mediaAttrs = isVideo ? 'autoplay muted loop playsinline' : '';
        mediaContent = `<${mediaElement} src="assets/previews/categories/${category.preview}" ${mediaAttrs} onerror="this.parentElement.innerHTML='<span style=\\'font-size: 64px; opacity: 0.7;\\'>${category.emoji}</span>'"></${mediaElement}>`;
    } else {
        mediaContent = `<span style="font-size: 64px;">${category.emoji}</span>`;
    }

    card.innerHTML = `
                <div class="card-media">
                    ${mediaContent}
                </div>
                <div class="card-content">
                    <h3 class="card-title">${translations[currentLanguage][category.key]}</h3>
                    <p class="card-subtitle">${translations[currentLanguage][category.key + '-desc']}</p>
                </div>
            `;

    card.addEventListener('click', () => showCategoryPage(category.id));
    return card;
}

function showCategoryPage(categoryId) {
    currentCategory = categoryId;
    const category = categories.find(cat => cat.id === categoryId);

    if (!category) return;

    categoryTitle.textContent = translations[currentLanguage][category.key];
    categoryDescription.textContent = translations[currentLanguage][category.key + '-desc'];

    renderMods(categoryId);

    homePage.classList.add('hidden');
    categoryPage.classList.remove('hidden');
    backButton.style.display = 'flex';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderMods(categoryId) {
    modsGrid.innerHTML = '';
    const mods = modsData[categoryId] || [];

    if (mods.length === 0) {
        modsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 40px;">
                        <p>No mods available in this category yet.</p>
                    </div>
                `;
        return;
    }

    mods.forEach(mod => {
        const card = createModCard(mod, categoryId);
        modsGrid.appendChild(card);
    });
}

function createModCard(mod, categoryId) {
    const card = document.createElement('div');
    card.className = 'card fade-in';

    const isVideo = mod.preview.endsWith('.mp4');
    const isGif = mod.preview.endsWith('.gif');
    const mediaElement = isVideo ? 'video' : 'img';
    const mediaAttrs = isVideo ? 'autoplay muted loop playsinline' : '';

    card.innerHTML = `
                <div class="card-media">
                    <${mediaElement} src="assets/previews/${categoryId}/${mod.preview}" ${mediaAttrs} onerror="this.parentElement.innerHTML='<span style=\\'font-size: 48px; opacity: 0.5;\\'>🖼️</span>'"></${mediaElement}>
                    <div class="download-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                        </svg>
                    </div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${mod.name}</h3>
                    <p class="card-subtitle">${translations[currentLanguage]['download']}</p>
                </div>
            `;

    card.addEventListener('click', () => downloadMod(mod, categoryId));
    return card;
}

function downloadMod(mod, categoryId) {
    const link = document.createElement('a');
    link.href = `assets/files/${categoryId}/${mod.file}`;
    link.download = mod.file;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Downloading: ${mod.name}`);
}

function showHomePage() {
    currentCategory = null;
    categoryPage.classList.add('hidden');
    homePage.classList.remove('hidden');
    backButton.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

init();