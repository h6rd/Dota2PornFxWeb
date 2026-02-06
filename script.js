window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
});

const translations = {
    'shaders': 'Shaders',
    'shaders-desc': 'Replaces the fog of war effect',
    'ti-bp-effects': 'Effect Packs',
    'ti-bp-effects-desc': 'Battle Pass / The International / Pack effects',
    'item-effects': 'Item Effects',
    'item-effects-desc': 'Effects for various items',
    'creep-deny': 'Creep Deny',
    'creep-deny-desc': 'Creep deny animations and effects',
    'emblems': 'Emblems',
    'emblems-desc': 'Collection of various emblems',
    'versus-screens': 'Versus Screens',
    'versus-screens-desc': 'Custom versus screen',
    'terrains': 'Terrains',
    'terrains-desc': 'Terrains modifications',
    'trees': 'Trees',
    'trees-desc': 'Custom trees',
    'heroes': 'Heroes',
    'heroes-desc': 'Hero models and sets',
    'roshan': 'Roshan',
    'roshan-desc': 'Custom Roshan models and skins',
    'creeps': 'Creeps',
    'creeps-desc': 'Custom creeps',
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
    'weather-desc': 'Weather Changer',
    'mega-kill': 'Mega-Kill',
    'mega-kill-desc': 'Custom mega-kill announcers',
    'guides': 'Guides',
    'guides-desc': 'Guides and tutorials',
    'pedestal': 'Pedestal',
    'pedestal-desc': 'Custom hero pedestals',
    'other': 'Other',
    'other-desc': 'Miscellaneous mods',
    'download': 'Download',
    'source': 'Source',
    'author': 'Author',
    'sender': 'Sender',
    'guide': 'Guide',
    'preview': 'Preview',
    'bug': 'Bug',
    'optimization': 'Optimization',
    'optimization-desc': 'Dota2 optimization stuff',
    'sites': 'Websites',
    'sites-desc': 'Useful websites',
    'tools': 'Tools',
    'tools-desc': 'Various tools',
    'addToCart': 'Add to cart',
    'backgrounds': 'Backgrounds',
    'backgrounds-desc': 'Custom backgrounds',
    'river': 'River',
    'river-desc': 'Custom river colors',
    'ranks': 'Rank Icons',
    'ranks-desc': 'Custom Rank Icons',
    'item-icons': 'Item Icons',
    'item-icons-desc': 'Custom Icons for Items',
    'wards': 'Wards',
    'wards-desc': 'Custom Wards',
    'couriers': 'Couriers',
    'couriers-desc': 'Custom Couriers',
    'announcers': 'Announcers',
    'announcers-desc': 'Custom Announcers',
    'music': 'Music',
    'music-desc': 'Custom Music',
    'cursors': 'Cursors',
    'cursors-desc': 'Custom Cursors',
    'pings': 'Pings',
    'pings-desc': 'Custom Pings',
    'file-search-results': 'Mods by file:',
    'herofx': 'Hero Spells',
    'herofx-desc': 'Effect sets for hero spells',
    'hero-sounds': 'Hero Sounds',
    'hero-sounds-desc': 'Custom hero sounds',
    'how-to-install': 'How to install?',
    'not-safe': 'Not Safe',
    'info': 'info',
    'hero-items': 'Hero Items',
    'hero-items-desc': 'Individual items of heroes',
    'fonts': 'Fonts',
    'fonts-desc': 'Custom fonts',
};

const categories = [
    { id: 'shaders', emoji: '🎨', key: 'shaders', preview: 'shaders.webp', guideId: 'install' },
    { id: 'ti-bp-effects', emoji: '🌟', key: 'ti-bp-effects', preview: 'Effect-Packs.webp', guideId: 'install' },
    { id: 'heroes', emoji: '👤', key: 'heroes', preview: 'heroes.webp', guideId: 'install-heroes' },
    { id: 'terrains', emoji: '🏞️', key: 'terrains', preview: 'terrains.webp', guideId: 'install-terrains' },
    { id: 'trees', emoji: '🌲', key: 'trees', preview: 'trees.webp', guideId: 'install' },
    { id: 'creeps', emoji: '🕷', key: 'creeps', preview: 'creeps.webp', guideId: 'install' },
    { id: 'creep-deny', emoji: '🎯', key: 'creep-deny', preview: 'creep-deny.webp', guideId: 'install' },
    { id: 'emblems', emoji: '🏵', key: 'emblems', preview: 'emblems.webp', guideId: 'install' },
    { id: 'backgrounds', emoji: '🖼️', key: 'backgrounds', preview: 'backgrounds.webp', guideId: 'install' },
    { id: 'hero-items', emoji: '👤', key: 'hero-items', preview: 'hero-items.webp', guideId: 'install-heroes' },
    { id: 'herofx', emoji: '✨', key: 'herofx', preview: 'herofx.webp', guideId: 'install' },
    { id: 'hero-sounds', emoji: '🔊', key: 'hero-sounds', preview: 'hero-sounds.webp', guideId: 'install' },
    { id: 'wards', emoji: '📖', key: 'wards', preview: 'wards.webp', guideId: 'install' },
    { id: 'couriers', emoji: '📖', key: 'couriers', preview: 'couriers.webp', guideId: 'install' },
    { id: 'river', emoji: '📖', key: 'river', preview: 'river.webp', guideId: 'install' },
    { id: 'item-effects', emoji: '✨', key: 'item-effects', preview: 'item-effects.webp', guideId: 'install' },
    { id: 'ranged-attack', emoji: '🏹', key: 'ranged-attack', preview: 'ranged-attack.webp', guideId: 'install' },
    { id: 'pings', emoji: '🏹', key: 'pings', preview: 'pings.webp', guideId: 'install' },
    { id: 'packs', emoji: '📦', key: 'packs', preview: 'packs.webp' },
    { id: 'versus-screens', emoji: '🆚', key: 'versus-screens', preview: 'vs.webp', guideId: 'install' },
    { id: 'mega-kill', emoji: '🔊', key: 'mega-kill', preview: 'mega-kill.webp', guideId: 'install' },
    { id: 'announcers', emoji: '🔊', key: 'announcers', preview: 'Announcers.webp', guideId: 'install' },
    { id: 'music', emoji: '🔊', key: 'music', preview: 'music.webp', guideId: 'install' },
    { id: 'roshan', emoji: '🦖', key: 'roshan', preview: 'roshan.webp', guideId: 'install' },
    { id: 'ancient', emoji: '🗻', key: 'ancient', preview: 'ancient.webp', guideId: 'install' },
    { id: 'tormentor', emoji: '🎈', key: 'tormentor', preview: 'tormentor.webp', guideId: 'install' },
    { id: 'towers', emoji: '🗼', key: 'towers', preview: 'towers.webp', guideId: 'install' },
    { id: 'pedestal', emoji: '🗿', key: 'pedestal', preview: 'pedestal.webp', guideId: 'install' },
    { id: 'high-five', emoji: '🖐️', key: 'high-five', preview: 'high-five.webp', guideId: 'install' },
    { id: 'item-icons', emoji: '👀', key: 'item-icons', preview: 'item-icons.webp', guideId: 'install' },
    { id: 'ranks', emoji: '🎖️', key: 'ranks', preview: 'ranks.webp', guideId: 'install' },
    { id: 'cursors', emoji: '🛠️', key: 'cursors', preview: 'cursors.webp' },
    { id: 'fonts', emoji: '🔣', key: 'fonts', preview: '' },
    { id: 'other', emoji: '⚙️', key: 'other', preview: 'other.webp', guideId: 'install' },
    { id: 'tools', emoji: '🛠️', key: 'tools', preview: 'tools.webp' },
    { id: 'optimization', emoji: '🛠️', key: 'optimization', preview: 'optimization.webp' },
    { id: 'guides', emoji: '📖', key: 'guides', preview: 'guides.webp' },
    { id: 'sites', emoji: '🌐', key: 'sites', preview: '' }
    // { id: 'packs', emoji: '📦', key: 'packs', preview: 'packs.webp' },
];

const NOTES_DATA = [
    {
        type: 'update',
        icon: 'new_releases',
        title: 'Update',
        text: 'Added a button to copy the link to mod or category. Added option to save packs in cart'
    },
    {
        type: 'warning',
        icon: 'error',
        title: 'Known Issue',
        text: 'Due to patch 7.40, some mods no longer display visual effects on models (in match). Unfortunately, I don\'t know how to fix this 😕',
    },
];

const categoryNotes = {
    'item-effects': {
        enabled: true,
        text: `During events with custom effects (e.g. Quartero's Curios), some effects will not work. Use <a href="https://h6rd.github.io/Dota2PornFxWeb/?category=ti-bp-effects"><span id="tg">Effect Packs</span></a>.`
    },
    'emblems': {
        enabled: true,
        text: "If emblem not working, try enter <code>r_draw_selected_ring 1</code> into the console. If this does not work, ensure that you are not using the Minify mod: Misc Optimization"
    },
};

const addToCartRules = {
    hiddenCategories: ['guides', 'tools', 'fonts'],
    allowedMods: {
        other: ['Profile Graffiti & Phrases', 'Showcase Rotation', 'Rage Voice Icon', 'Gabe Shopkeeper'],
        optimization: ['Default Wards', 'Default Couriers'],
    }
};

const state = {
    currentCategory: null,
    searchQuery: '',
    scrollPosition: 0,
    sortMode: 'default',
    currentSortModeIndex: 0,
    carouselPosition: 0,
    itemsPerPage: 3,
    isCollapsed: false,
    isClosing: false
};

const elements = {
    homePage: document.getElementById('homePage'),
    categoryPage: document.getElementById('categoryPage'),
    categoriesGrid: document.getElementById('categoriesGrid'),
    modsGrid: document.getElementById('modsGrid'),
    categoryTitle: document.getElementById('categoryTitle'),
    categoryDescription: document.getElementById('categoryDescription'),
    backButton: document.getElementById('backButton'),
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear')
};

const SORT_MODES = [
    { key: 'default', label: 'Default', icon: 'sort' },
    { key: 'name', label: 'Name', icon: 'sort_by_alpha' },
    { key: 'date', label: 'Newest', icon: 'schedule' }
];

const LINK_ICONS = {
    'author': 'person',
    'sender': 'send',
    'preview': 'play_circle',
    'source': 'captive_portal',
    'guide': 'description',
    'bug': 'bug_report',
    'not-safe': 'warning',
    'info': 'warning'
};

const TAG_CONFIGS = {
    heroes: {
        allowForGuides: false,
        map: { effects: 'Effects', icons: 'Icons' }
    },
    backgrounds: {
        allowForGuides: false,
        map: { image: 'Image', video: 'Video', lowres: 'Shit Quality' }
    },
    sites: {
        allowForGuides: true,
        map: { stats: 'Stats', meta: 'Meta', fun: 'Fun' }
    },
    herofx: {
        allowForGuides: false,
        map: { effects: 'Effects', icons: 'Icons', sounds: 'Sounds' }
    },
    "hero-items": {
        allowForGuides: false,
        map: { weapon: 'Weapon', mount: 'Mount', effects: 'Effects', icons: 'Icons', sounds: 'Sounds', totem: 'Totem' }
    }
};

const GIF_CONFIG = {
    gifs: [
        'assets/files/hueta/ursa.gif',
        'assets/files/hueta/brew.gif',
        'assets/files/hueta/fura.gif',
        'assets/files/hueta/storm.gif',
        'assets/files/hueta/invoker.gif'
    ],
    themes: ['ursa', 'brew', 'fura', 'storm', 'invoker']
};

const HEROES_LIST = [
    'Anti-Mage', 'Axe', 'Bane', 'Bloodseeker', 'Crystal Maiden', 'Drow Ranger',
    'Earthshaker', 'Juggernaut', 'Mirana', 'Morphling', 'Shadow Fiend', 'Phantom Lancer',
    'Puck', 'Pudge', 'Razor', 'Sand King', 'Storm Spirit', 'Sven', 'Tiny', 'Vengeful Spirit',
    'Windranger', 'Zeus', 'Kunkka', 'Lina', 'Lion', 'Shadow Shaman', 'Slardar', 'Tidehunter',
    'Witch Doctor', 'Lich', 'Riki', 'Enigma', 'Tinker', 'Sniper', 'Necrophos', 'Warlock',
    'Beastmaster', 'Queen of Pain', 'Venomancer', 'Faceless Void', 'Wraith King', 'Death Prophet',
    'Phantom Assassin', 'Pugna', 'Templar Assassin', 'Viper', 'Luna', 'Dragon Knight', 'Dazzle',
    'Clockwerk', 'Leshrac', 'Natures Prophet', 'Lifestealer', 'Dark Seer', 'Clinkz', 'Omniknight',
    'Enchantress', 'Huskar', 'Night Stalker', 'Broodmother', 'Bounty Hunter', 'Weaver', 'Jakiro',
    'Batrider', 'Chen', 'Spectre', 'Ancient Apparition', 'Doom', 'Ursa', 'Spirit Breaker', 'Gyrocopter',
    'Alchemist', 'Invoker', 'Silencer', 'Outworld Destroyer', 'Lycan', 'Brewmaster', 'Shadow Demon',
    'Lone Druid', 'Chaos Knight', 'Meepo', 'Treant', 'Ogre Magi', 'Undying', 'Rubick',
    'Disruptor', 'Nyx Assassin', 'Naga Siren', 'Keeper of the Light', 'Io', 'Visage', 'Slark',
    'Medusa', 'Troll Warlord', 'Centaur', 'Magnus', 'Timbersaw', 'Bristleback', 'Tusk',
    'Skywrath Mage', 'Abaddon', 'Elder Titan', 'Legion Commander', 'Techies', 'Ember Spirit',
    'Earth Spirit', 'Underlord', 'Terrorblade', 'Phoenix', 'Oracle', 'Winter Wyvern', 'Arc Warden',
    'Monkey King', 'Dark Willow', 'Pangolier', 'Grimstroke', 'Hoodwink', 'Void Spirit', 'Snapfire',
    'Mars', 'Dawnbreaker', 'Marci', 'Primal Beast', 'Muerta', 'Ringmaster', 'Kez', 'Largo'
];

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

const vibrate = (pattern = 10) => {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
};

const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

//Highlight Hero Names
const highlightHeroNames = (text) => {
    if (!text) return text;

    let result = text;
    HEROES_LIST.forEach(hero => {
        const regex = new RegExp(`\\b${hero}\\b`, 'gi');
        result = result.replace(regex, (match) => {
            return `<span style="color: var(--md-sys-color-primary); font-weight: bold;">${match}</span>`;
        });
    });

    return result;
};

// FAB Menu
function closeFABMenu() {
    const fab = document.getElementById('fab');
    const fabMenu = document.getElementById('fabMenu');
    const fabMenuBackground = document.getElementById('fabMenuBackground');
    
    if (fab) fab.classList.remove('active');
    if (fabMenu) fabMenu.classList.remove('active');
    if (fabMenuBackground) {
        fabMenuBackground.classList.remove('active');
        fabMenuBackground.style.height = '0px';
    }
}

function setupFAB() {
    const fab = document.getElementById('fab');
    const fabMenu = document.getElementById('fabMenu');
    const fabMenuBackground = document.getElementById('fabMenuBackground');
    const infoButton = document.getElementById('infoButton');
    const infoModal = document.getElementById('infoModal');
    const infoOverlay = document.getElementById('infoOverlay');
    const closeModal = document.getElementById('closeModal');

    if (!fab || !fabMenu) return;

    const toggleFAB = () => {
        const isActive = fab.classList.toggle('active');
        fabMenu.classList.toggle('active');
        fabMenuBackground.classList.toggle('active');

        if (isActive) {
            const menuItems = fabMenu.querySelectorAll('.fab-menu-item');
            const itemCount = menuItems.length;
            const itemHeight = 48;
            const gap = 12;
            const bottomOffset = 68;
            const totalHeight = (itemHeight * itemCount) + (gap * (itemCount - 1)) + bottomOffset;
            fabMenuBackground.style.height = `${totalHeight}px`;
        } else {
            fabMenuBackground.style.height = '0px';
        }
    };

    const closeInfoModal = () => {
        infoModal.classList.remove('active');
        infoOverlay.classList.remove('active');

        const guideModal = document.getElementById('guideModal');
        if (!guideModal || !guideModal.classList.contains('active')) {
            document.body.style.overflow = '';
        }

        setTimeout(() => {
            const infoContent = infoModal.querySelector('.info-modal-content');
            if (infoContent) {
                infoContent.scrollTop = 0;
            }
        }, 300);
    };

    fab.addEventListener('click', toggleFAB);

    if (infoButton) {
        infoButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            infoModal.classList.add('active');
            infoOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            closeFABMenu();
        });
    }

    closeModal?.addEventListener('click', closeInfoModal);
    infoOverlay?.addEventListener('click', closeInfoModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoModal?.classList.contains('active')) {
            closeInfoModal();
        }
    });

    document.addEventListener('click', (e) => {
        if (!fab.contains(e.target) && !fabMenu.contains(e.target)) {
            closeFABMenu();
        }
    });
}

// Scroll to top
function setupScrollToTop() {
    const scrollFab = document.getElementById('scrollToTopFab');
    const fab = document.getElementById('fab');

    if (!scrollFab) return;

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const updateScrollButton = () => {
        const isFabActive = fab?.classList.contains('active');
        scrollFab.classList.toggle('visible', window.scrollY > 300 && !isFabActive);
    };

    window.addEventListener('scroll', debounce(updateScrollButton, 100));

    if (fab) {
        const observer = new MutationObserver(updateScrollButton);
        observer.observe(fab, { attributes: true, attributeFilter: ['class'] });
    }

    scrollFab.addEventListener('click', scrollToTop);
}

// Copy Link
function generateModLink(categoryId, modName, groupId = null) {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('category', categoryId);
    params.set('mod', modName);
    if (groupId) params.set('group', groupId);
    return `${baseUrl}?${params.toString()}`;
}

function generateCategoryLink(categoryId) {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?category=${categoryId}`;
}

function copyToClipboard(text, successMessage = 'Link copied!') {
    navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage);
        vibrate(20);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy link');
    });
}

function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('category');
    const modName = params.get('mod');
    const groupId = params.get('group');

    if (categoryId) {
        const category = categories.find(cat => cat.id === categoryId);
        if (!category) {
            console.warn(`Category "${categoryId}" not found`);
            showToast('Category not found');
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        if (modName) {
            const categoryData = modsData[categoryId];
            let modExists = false;

            if (categoryData?.groups && Array.isArray(categoryData.groups)) {
                for (const group of categoryData.groups) {
                    if (group.mods.some(m => m.name === modName)) {
                        modExists = true;
                        break;
                    }
                }
            } else if (Array.isArray(categoryData)) {
                modExists = categoryData.some(m => m.name === modName);
            }

            if (!modExists) {
                console.warn(`Mod "${modName}" not found in category "${categoryId}"`);
                showToast('Mod not found');
                showCategoryPage(categoryId);
                return;
            }

            openCategoryAndHighlightMod(categoryId, modName);
        } else {
            showCategoryPage(categoryId);
        }
    }
}

// Guide modal
function setupGuideModal() {
    const guideModal = document.getElementById('guideModal');
    const guideOverlay = document.getElementById('guideOverlay');
    const closeGuideModal = document.getElementById('closeGuideModal');
    const guideModalContent = document.getElementById('guideModalContent');
    const guideModalTitle = document.getElementById('guideModalTitle');

    if (!guideModal || !guideOverlay) return;

    const closeGuideWindow = () => {
        guideModal.classList.remove('active');
        guideOverlay.classList.remove('active');

        const infoModal = document.getElementById('infoModal');
        if (!infoModal || !infoModal.classList.contains('active')) {
            document.body.style.overflow = '';
        }

        setTimeout(() => {
            if (guideModalContent) {
                guideModalContent.scrollTop = 0;
            }
        }, 300);
    };

    closeGuideModal?.addEventListener('click', closeGuideWindow);
    guideOverlay.addEventListener('click', closeGuideWindow);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && guideModal.classList.contains('active')) {
            closeGuideWindow();
        }
    });

    window.openGuideModal = (guideData) => {
        guideModalTitle.textContent = guideData.title;
        guideModalContent.innerHTML = '';
        guideModalContent.scrollTop = 0;

        const languageToggle = createLanguageToggle();
        guideModalContent.appendChild(languageToggle);

        ['en', 'ru'].forEach(lang => {
            const contentDiv = createGuideContent(guideData, lang);
            guideModalContent.appendChild(contentDiv);
        });

        setupLanguageToggleListeners(languageToggle, guideModalContent);

        guideModal.classList.add('active');
        guideOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            guideModalContent.scrollTop = 0;
        });
    };
}

function createLanguageToggle() {
    const toggle = document.createElement('div');
    toggle.className = 'guide-language-toggle';
    toggle.innerHTML = `
        <button class="guide-language-btn active" data-lang="en">English</button>
        <button class="guide-language-btn" data-lang="ru">Русский</button>
    `;
    return toggle;
}

function createGuideContent(guideData, lang) {
    const contentDiv = document.createElement('div');
    contentDiv.className = `guide-content ${lang === 'en' ? 'active' : ''}`;
    contentDiv.setAttribute('data-lang', lang);

    guideData.content[lang].forEach(section => {
        const sectionDiv = createGuideSection(section);
        contentDiv.appendChild(sectionDiv);
    });

    const warningSection = guideData.content[lang].find(s => s.warning);
    if (warningSection?.warning) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'guide-warning';
        warningDiv.innerHTML = `
            <span class="material-symbols-rounded">warning</span>
            <p class="guide-warning-text">${warningSection.warning}</p>
        `;
        contentDiv.appendChild(warningDiv);
    }

    return contentDiv;
}

function createGuideSection(section) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'info-modal-section';

    if (section.title) {
        const sectionTitle = document.createElement('h3');
        sectionTitle.className = 'guide-section-title';
        sectionTitle.innerHTML = section.icon
            ? `<span class="material-symbols-rounded">${section.icon}</span>${section.title}`
            : section.title;
        sectionDiv.appendChild(sectionTitle);
    }

    if (section.info && (!section.infoPosition || section.infoPosition === 'top')) {
        sectionDiv.appendChild(createInfoBlock(section.info));
    }

    if (section.image && (!section.imagePosition || section.imagePosition === 'top')) {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'guide-image';
        imageDiv.innerHTML = `<img src="${section.image}" alt="${section.title || 'Guide illustration'}">`;
        sectionDiv.appendChild(imageDiv);
    }

    section.steps.forEach((step, index) => {
        const stepDiv = createGuideStep(step, index);
        sectionDiv.appendChild(stepDiv);
    });

    if (section.result) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'guide-result';
        resultDiv.innerHTML = `
            <span class="material-symbols-rounded">check_circle</span>
            <p class="guide-result-text">${section.result}</p>
        `;
        sectionDiv.appendChild(resultDiv);
    }

    if (section.info && section.infoPosition === 'bottom') {
        sectionDiv.appendChild(createInfoBlock(section.info));
    }

    if (section.image && section.imagePosition === 'bottom') {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'guide-image';
        imageDiv.innerHTML = `<img src="${section.image}" alt="${section.title || 'Guide illustration'}">`;
        sectionDiv.appendChild(imageDiv);
    }

    return sectionDiv;
}

function createInfoBlock(info) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'guide-info';
    infoDiv.innerHTML = `
        <span class="material-symbols-rounded">info</span>
        <p class="guide-info-text">${info}</p>
    `;
    return infoDiv;
}

function createGuideStep(step, index) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'guide-step';

    const stepText = typeof step === 'object' && step.icon ? step.text :
        typeof step === 'object' && step.text ? step.text : step;
    const stepNumber = typeof step === 'object' && step.icon
        ? `<span class="material-symbols-rounded">${step.icon}</span>`
        : index + 1;

    stepDiv.innerHTML = `
        <div class="guide-step-number">${stepNumber}</div>
        <div class="guide-step-content">
            <p class="guide-step-text">${stepText}</p>
            ${typeof step === 'object' && step.image ? `<img src="${step.image}" class="guide-step-image" alt="Guide step illustration">` : ''}
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = stepText;
    const link = tempDiv.querySelector('a');

    if (link) {
        stepDiv.classList.add('has-link');
        const href = link.getAttribute('href');
        const target = link.getAttribute('target');
        stepDiv.addEventListener('click', (e) => {
            e.preventDefault();
            if (href) window.open(href, target || '_self');
        });
    }

    return stepDiv;
}

function setupLanguageToggleListeners(toggle, content) {
    const langButtons = toggle.querySelectorAll('.guide-language-btn');
    const contentSections = content.querySelectorAll('.guide-content');

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetLang = btn.getAttribute('data-lang');
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            contentSections.forEach(section => {
                section.classList.toggle('active', section.getAttribute('data-lang') === targetLang);
            });

            vibrate(10);
        });
    });
}

// Copy
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'CODE') {
        const codeText = e.target.textContent.trim();
        navigator.clipboard.writeText(codeText).then(() => {
            e.target.classList.add('copied');
            vibrate(20);
            setTimeout(() => e.target.classList.remove('copied'), 1200);
        }).catch(err => console.error('Failed to copy:', err));
    }
});

// Sorting
function sortMods(mods, mode) {
    const sortedMods = [...mods];
    switch (mode) {
        case 'name':
            if (state.currentCategory === 'heroes') {
                return sortedMods.sort((a, b) => {
                    const getHeroName = (modName) => {
                        const foundHeroes = HEROES_LIST.filter(hero =>
                            modName.toLowerCase().includes(hero.toLowerCase())
                        );

                        if (foundHeroes.length === 0) {
                            return modName;
                        }

                        let earliestHero = foundHeroes[0];
                        let earliestPosition = modName.toLowerCase().indexOf(earliestHero.toLowerCase());

                        foundHeroes.forEach(hero => {
                            const position = modName.toLowerCase().indexOf(hero.toLowerCase());
                            if (position < earliestPosition) {
                                earliestPosition = position;
                                earliestHero = hero;
                            }
                        });

                        return earliestHero;
                    };

                    const aHero = getHeroName(a.name);
                    const bHero = getHeroName(b.name);

                    const heroComparison = aHero.localeCompare(bHero);

                    if (heroComparison === 0) {
                        return a.name.localeCompare(b.name);
                    }

                    return heroComparison;
                });
            }
            return sortedMods.sort((a, b) => a.name.localeCompare(b.name));
        case 'date':
            return sortedMods.reverse();
        default:
            return sortedMods;
    }
}

function setupSortToggle() {
    const sortToggle = document.getElementById('sortToggle');
    const sortLabel = document.getElementById('sortLabel');
    const sortIcon = sortToggle?.querySelector('.material-symbols-rounded');

    if (!sortToggle || !sortLabel || !sortIcon) return;

    sortToggle.addEventListener('click', () => {
        state.currentSortModeIndex = (state.currentSortModeIndex + 1) % SORT_MODES.length;
        const mode = SORT_MODES[state.currentSortModeIndex];

        state.sortMode = mode.key;
        sortLabel.textContent = mode.label;
        sortIcon.textContent = mode.icon;

        if (state.currentCategory) {
            renderMods(state.currentCategory);
        }

        vibrate(10);
    });
}

// Video modal
function setupVideoModal() {
    const videoModal = document.getElementById('videoModal');
    const videoOverlay = document.getElementById('videoOverlay');
    const closeVideoModal = document.getElementById('closeVideoModal');
    const modalVideo = document.getElementById('modalVideo');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const progressBar = document.querySelector('.video-progress-bar');
    const progressFilled = document.querySelector('.video-progress-filled');
    const playIcon = playPauseBtn?.querySelector('.material-symbols-rounded');
    const videoSpinner = document.querySelector('.video-loading-spinner');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeIcon = document.getElementById('volumeIcon');
    const currentTimeDisplay = document.getElementById('videoCurrentTime');
    const totalTimeDisplay = document.getElementById('videoTotalTime');

    if (!videoModal || !modalVideo) return;

    let clickTimer = null;
    let isDoubleClick = false;

    const closeVideoWindow = () => {
        state.isClosing = true;
        if (spinnerTimeout) {
            clearTimeout(spinnerTimeout);
            spinnerTimeout = null;
        }
        if (hideSpinnerTimeout) {
            clearTimeout(hideSpinnerTimeout);
            hideSpinnerTimeout = null;
        }
        if (videoSpinner) {
            videoSpinner.classList.add('hidden');
        }

        videoModal.classList.remove('active');
        videoOverlay.classList.remove('active');
        document.body.style.overflow = '';
        modalVideo.pause();
        modalVideo.currentTime = 0;
        if (playIcon) playIcon.textContent = 'play_arrow';

        setTimeout(() => {
            modalVideo.src = '';
            state.isClosing = false;
        }, 150);
    };

    closeVideoModal?.addEventListener('click', closeVideoWindow);
    videoOverlay?.addEventListener('click', closeVideoWindow);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoWindow();
        }
    });

    let spinnerTimeout = null;
    let hideSpinnerTimeout = null;

    const showSpinner = () => {
        if (state.isClosing) return;
        if (hideSpinnerTimeout) {
            clearTimeout(hideSpinnerTimeout);
            hideSpinnerTimeout = null;
        }
        if (spinnerTimeout) clearTimeout(spinnerTimeout);
        spinnerTimeout = setTimeout(() => {
            if (!state.isClosing && videoSpinner) {
                videoSpinner.classList.remove('hidden');
            }
            spinnerTimeout = null;
        }, 200);
    };

    const hideSpinner = () => {
        if (spinnerTimeout) {
            clearTimeout(spinnerTimeout);
            spinnerTimeout = null;
        }
        if (hideSpinnerTimeout) clearTimeout(hideSpinnerTimeout);
        hideSpinnerTimeout = setTimeout(() => {
            if (videoSpinner) {
                videoSpinner.classList.add('hidden');
            }
            hideSpinnerTimeout = null;
        }, 100);
    };

    modalVideo.addEventListener('loadstart', showSpinner);
    modalVideo.addEventListener('waiting', showSpinner);
    modalVideo.addEventListener('canplay', hideSpinner);
    modalVideo.addEventListener('playing', hideSpinner);
    modalVideo.addEventListener('loadeddata', hideSpinner);
    modalVideo.addEventListener('stalled', showSpinner);

    modalVideo.addEventListener('click', (e) => {
        e.preventDefault();

        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
            isDoubleClick = true;
            const videoContainer = document.querySelector('.video-modal-content');
            if (!document.fullscreenElement) {
                videoContainer.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        } else {
            isDoubleClick = false;
            clickTimer = setTimeout(() => {
                if (!isDoubleClick) {
                    modalVideo.paused ? modalVideo.play() : modalVideo.pause();
                }
                clickTimer = null;
            }, 250);
        }
    });

    playPauseBtn?.addEventListener('click', () => {
        if (modalVideo.paused) {
            modalVideo.play();
            if (playIcon) playIcon.textContent = 'pause';
        } else {
            modalVideo.pause();
            if (playIcon) playIcon.textContent = 'play_arrow';
        }
    });

    fullscreenBtn?.addEventListener('click', () => {
        const videoContainer = document.querySelector('.video-modal-content');
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    volumeBtn?.addEventListener('click', () => {
        if (modalVideo.muted || modalVideo.volume === 0) {
            modalVideo.muted = false;
            modalVideo.volume = 1;
            if (volumeIcon) volumeIcon.textContent = 'volume_up';
        } else {
            modalVideo.muted = true;
            if (volumeIcon) volumeIcon.textContent = 'volume_off';
        }
    });

    modalVideo.addEventListener('loadedmetadata', () => {
        if (totalTimeDisplay) totalTimeDisplay.textContent = formatTime(modalVideo.duration);
    });

    modalVideo.addEventListener('timeupdate', () => {
        const percent = (modalVideo.currentTime / modalVideo.duration) * 100;
        if (progressFilled) progressFilled.style.width = `${percent}%`;
        if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(modalVideo.currentTime);
    });

    progressBar?.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        modalVideo.currentTime = percent * modalVideo.duration;
    });

    modalVideo.addEventListener('play', () => {
        if (playIcon) playIcon.textContent = 'pause';
    });

    modalVideo.addEventListener('pause', () => {
        if (playIcon) playIcon.textContent = 'play_arrow';
    });

    window.openVideoModal = (videoUrl) => {
        if (spinnerTimeout) clearTimeout(spinnerTimeout);
        if (hideSpinnerTimeout) clearTimeout(hideSpinnerTimeout);

        if (videoSpinner) {
            videoSpinner.classList.remove('hidden');
        }
        videoModal.classList.add('no-transition', 'active');
        videoOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        modalVideo.src = videoUrl;

        const enableAndShow = () => {
            modalVideo.removeEventListener('loadedmetadata', enableAndShow);
            modalVideo.removeEventListener('canplay', enableAndShow);

            setTimeout(() => {
                videoModal.classList.remove('no-transition');
                videoModal.offsetHeight;
                videoModal.classList.add('active');
                videoSpinner?.classList.add('hidden');
                if (playIcon) playIcon.textContent = 'pause';
            }, 40);
        };

        modalVideo.addEventListener('loadedmetadata', enableAndShow, { once: true });
        modalVideo.addEventListener('canplay', enableAndShow, { once: true });

        setTimeout(() => {
            if (!videoModal.classList.contains('active')) enableAndShow();
        }, 700);
    };
}

// Notes Modal
function setupNotesModal() {
    const notesButton = document.getElementById('notesButton');
    const notesModal = document.getElementById('notesModal');
    const notesOverlay = document.getElementById('notesOverlay');
    const closeNotesModal = document.getElementById('closeNotesModal');
    const notesContent = document.getElementById('notesContent');
    const notesBadge = document.getElementById('notesBadge');

    if (!notesModal || !notesButton) return;

    const generateNotesHash = () => {
        if (NOTES_DATA.length === 0) return 'empty';
        return JSON.stringify(NOTES_DATA.map(note => ({
            type: note.type,
            title: note.title,
            text: note.text
        })));
    };

    const lastSeenNotesHash = localStorage.getItem('lastSeenNotesHash') || '';
    const currentNotesHash = generateNotesHash();
    
    if (currentNotesHash !== lastSeenNotesHash && NOTES_DATA.length > 0) {
        notesBadge.classList.add('show');
    }

    const openNotesModal = () => {
        notesContent.innerHTML = '';

        if (NOTES_DATA.length === 0) {
            notesContent.innerHTML = `
                <div class="notes-empty">
                    <span class="material-symbols-rounded">description</span>
                    <p>Nothing new at the moment.<br>Check back later for updates!</p>
                </div>
            `;
        } else {
            NOTES_DATA.forEach(note => {
                const noteItem = document.createElement('div');
                noteItem.className = `note-item ${note.type}`;
                noteItem.innerHTML = `
                    <div class="note-header">
                        <div class="note-icon">
                            <span class="material-symbols-rounded">${note.icon}</span>
                        </div>
                        <div class="note-meta">
                            <h3 class="note-title">${note.title}</h3>
                        </div>
                    </div>
                    <p class="note-text">${note.text}</p>
                `;
                notesContent.appendChild(noteItem);
            });
        }

        notesModal.classList.add('active');
        notesOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        const currentHash = generateNotesHash();
        localStorage.setItem('lastSeenNotesHash', currentHash);
        notesBadge.classList.remove('show');

        setTimeout(() => {
            const modalContent = notesModal.querySelector('.info-modal-content');
            if (modalContent) modalContent.scrollTop = 0;
        }, 100);
    };

    const closeNotesWindow = () => {
        notesModal.classList.remove('active');
        notesOverlay.classList.remove('active');
        document.body.style.overflow = '';

        setTimeout(() => {
            const modalContent = notesModal.querySelector('.info-modal-content');
            if (modalContent) modalContent.scrollTop = 0;
        }, 300);
    };

    notesButton.addEventListener('click', openNotesModal);
    closeNotesModal?.addEventListener('click', closeNotesWindow);
    notesOverlay?.addEventListener('click', closeNotesWindow);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && notesModal.classList.contains('active')) {
            closeNotesWindow();
        }
    });
}

// Hueta
function setupGifSwitcher() {
    const gifElement = document.getElementById('clickable-gif');
    const hintElement = document.getElementById('click-hint');
    const html = document.documentElement;

    if (!gifElement) return;

    let currentIndex = 0;
    const savedIndex = localStorage.getItem('gifIndex');
    if (savedIndex !== null) {
        currentIndex = parseInt(savedIndex, 10);
        gifElement.src = GIF_CONFIG.gifs[currentIndex];
    }

    const hasClicked = localStorage.getItem('gifClicked') === 'true';
    if (!hasClicked && hintElement) {
        hintElement.classList.add('show');
    }

    gifElement.addEventListener('click', () => {
        if (hintElement && !hasClicked) {
            hintElement.classList.remove('show');
            setTimeout(() => hintElement.style.display = 'none', 300);
            localStorage.setItem('gifClicked', 'true');
        }

        gifElement.classList.add('clicked', 'no-hover');

        setTimeout(() => {
            gifElement.classList.remove('clicked');
            currentIndex = (currentIndex + 1) % GIF_CONFIG.gifs.length;
            const newTheme = GIF_CONFIG.themes[currentIndex];

            gifElement.src = GIF_CONFIG.gifs[currentIndex];
            html.setAttribute('data-gif-theme', newTheme);
            localStorage.setItem('gifIndex', currentIndex.toString());

            gifElement.classList.add('appear');
            setTimeout(() => {
                gifElement.classList.remove('appear');
                setTimeout(() => gifElement.classList.remove('no-hover'), 400);
            }, 400);
        }, 400);

        vibrate(10);
    });
}

// Theme
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    if (!themeToggle) return;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        vibrate(10);
    });
}

// Winter & Halloween FX
// function initSeasonalEffects() {
//     const now = new Date();
//     const month = now.getMonth();
//     const day = now.getDate();

//     const isWinter = (month === 11) || (month === 0) || (month === 1);

//     const isHalloween = (month === 9);
    
//     const garland = document.querySelector('.lightrope');
//     const particles = document.getElementById('particles-js');
//     const halloweenEffects = document.getElementById('halloween-effects');
    
//     if (isWinter) {
//         if (garland) garland.style.display = 'block';
//         if (particles) particles.style.display = 'block';
//         if (halloweenEffects) halloweenEffects.style.display = 'none';
//         initParticles();
//     } else if (isHalloween) {
//         if (garland) garland.style.display = 'none';
//         if (particles) particles.style.display = 'none';
//         if (halloweenEffects) halloweenEffects.style.display = 'block';
//     } else {
//         if (garland) garland.style.display = 'none';
//         if (particles) particles.style.display = 'none';
//         if (halloweenEffects) halloweenEffects.style.display = 'none';
//     }
// }

// Snow
// function initParticles() {
//     const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
//     const snowColor = isDark ? '#ffffff' : '#000000';
//     const themeToggle = document.getElementById('themeToggle');
//     if (themeToggle) {
//       themeToggle.addEventListener('click', () => {
//         setTimeout(initParticles, 100);
//       });
//     }
    
//     if (typeof particlesJS !== 'undefined') {
//         particlesJS('particles-js', {
//             particles: {
//                 number: {
//                     value: 45,
//                     density: {
//                         enable: true,
//                         value_area: 200
//                     }
//                 },
//                 color: {
//                     value: snowColor
//                 },
//                 shape: {
//                     type: 'circle'
//                 },
//                 opacity: {
//                     value: isDark ? 0.8 : 0.6,
//                     random: true,
//                     anim: {
//                         enable: true,
//                         speed: 1,
//                         opacity_min: 0.5,
//                         sync: false
//                     }
//                 },
//                 size: {
//                     value: 4,
//                     random: true,
//                     anim: {
//                         enable: true,
//                         speed: 1,
//                         size_min: 2,
//                         sync: false
//                     }
//                 },
//                 line_linked: {
//                     enable: false
//                 },
//                 move: {
//                     enable: true,
//                     speed: 1.5,
//                     direction: 'bottom',
//                     random: false,
//                     straight: false,
//                     out_mode: 'out',
//                     bounce: false
//                 }
//             },
//             interactivity: {
//                 detect_on: 'canvas',
//                 events: {
//                     onhover: {
//                         enable: false
//                     },
//                     onclick: {
//                         enable: false
//                     },
//                     resize: false
//                 }
//             },
//             retina_detect: true
//         });
//     }
// }

// Recently Added Carousel
function calculateItemsPerPage() {
    const width = window.innerWidth;
    if (width < 768) return 1;
    if (width < 1024) return 2;
    return 3;
}

function updateCarouselButtons() {
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const controls = document.querySelector('.carousel-controls');

    if (!prevBtn || !nextBtn || !recentlyAddedMods) return;

    const totalMods = recentlyAddedMods.length;
    prevBtn.disabled = state.carouselPosition === 0;
    nextBtn.disabled = state.carouselPosition + state.itemsPerPage >= totalMods;

    if (controls) {
        controls.style.display = totalMods <= state.itemsPerPage ? 'none' : 'flex';
    }
}

function moveCarousel(direction) {
    const track = document.getElementById('carouselTrack');
    const container = document.getElementById('carouselContainer');

    if (!track || !container || !recentlyAddedMods) return;

    const totalMods = recentlyAddedMods.length;
    state.carouselPosition += direction * state.itemsPerPage;
    state.carouselPosition = Math.max(0, Math.min(state.carouselPosition, totalMods - state.itemsPerPage));

    const containerWidth = container.offsetWidth;
    const gap = window.innerWidth < 768 ? 16 : 24;
    const cardWidth = (containerWidth - (gap * (state.itemsPerPage - 1))) / state.itemsPerPage;
    const offset = state.carouselPosition * (cardWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;
    updateCarouselButtons();
    vibrate(10);
}

function toggleRecentlyAdded() {
    const wrapper = document.querySelector('.carousel-wrapper');
    const collapseBtn = document.getElementById('collapseBtn');
    const categoriesTitle = document.getElementById('categoriesTitle');
    const track = document.getElementById('carouselTrack');
    const header = document.querySelector('.recently-added-header');
    const controls = document.querySelector('.carousel-controls');

    if (!wrapper || !track) return;

    state.isCollapsed = !state.isCollapsed;

    if (state.isCollapsed) {
        const currentHeight = wrapper.scrollHeight;
        wrapper.style.maxHeight = `${currentHeight}px`;
        requestAnimationFrame(() => {
            wrapper.classList.add('collapsed');
            wrapper.style.maxHeight = '0px';
            collapseBtn?.classList.add('collapsed');
            header?.classList.add('collapsed');
            controls?.classList.add('collapsed');
        });
        setTimeout(() => categoriesTitle?.classList.add('hidden'), 200);
    } else {
        categoriesTitle?.classList.remove('hidden');
        const targetHeight = track.scrollHeight + 48;
        wrapper.style.maxHeight = '0px';
        requestAnimationFrame(() => {
            wrapper.classList.remove('collapsed');
            wrapper.style.maxHeight = `${targetHeight}px`;
            collapseBtn?.classList.remove('collapsed');
            header?.classList.remove('collapsed');
            controls?.classList.remove('collapsed');
        });
        setTimeout(() => {
            wrapper.style.maxHeight = '1000px';
            if (controls) controls.style.maxHeight = '48px';
        }, 400);
    }

    localStorage.setItem('recentlyAddedCollapsed', state.isCollapsed.toString());
    vibrate(10);
}

function openCategoryAndHighlightMod(categoryId, modName) {
    state.scrollPosition = window.pageYOffset;
    state.currentCategory = categoryId;

    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    resetSort();

    elements.categoryTitle.textContent = translations[category.key];
    elements.categoryDescription.textContent = translations[category.key + '-desc'];

    renderMods(categoryId);

    elements.homePage.classList.add('hidden');
    elements.categoryPage.classList.remove('hidden');
    elements.backButton.style.display = 'flex';

    window.scrollTo({ top: 0, behavior: 'instant' });

    setTimeout(() => {
        const targetCard = elements.modsGrid.querySelector(
            `[data-mod-name="${modName}"][data-category-id="${categoryId}"]`
        );

        if (targetCard) {
            targetCard.classList.remove('fade-in');
            targetCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });

            setTimeout(() => {
                requestAnimationFrame(() => targetCard.classList.add('highlighted'));
                vibrate([50, 100, 50]);
                setTimeout(() => {
                    requestAnimationFrame(() => targetCard.classList.remove('highlighted'));
                }, 1500);
            }, 800);
        }
    }, 100);
}

function setupRecentlyAdded() {
    const section = document.getElementById('recentlyAddedSection');
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const collapseBtn = document.getElementById('collapseBtn');
    const wrapper = document.querySelector('.carousel-wrapper');
    const categoriesTitle = document.getElementById('categoriesTitle');

    if (!recentlyAddedMods || recentlyAddedMods.length === 0) {
        section?.classList.add('hidden');
        categoriesTitle?.classList.add('hidden');
        return;
    }

    section?.classList.remove('hidden');
    if (track) track.innerHTML = '';

    const savedCollapsed = localStorage.getItem('recentlyAddedCollapsed') === 'true';
    state.isCollapsed = savedCollapsed;

    if (state.isCollapsed) {
        wrapper?.classList.add('collapsed');
        if (wrapper) wrapper.style.maxHeight = '0px';
        collapseBtn?.classList.add('collapsed');
        categoriesTitle?.classList.add('hidden');
        document.querySelector('.recently-added-header')?.classList.add('collapsed');
        document.querySelector('.carousel-controls')?.classList.add('collapsed');
    } else {
        categoriesTitle?.classList.remove('hidden');
        document.querySelector('.recently-added-header')?.classList.remove('collapsed');
        document.querySelector('.carousel-controls')?.classList.remove('collapsed');
    }

    recentlyAddedMods.forEach(recentMod => {
        const category = categories.find(cat => cat.id === recentMod.category);
        if (!category) return;

        const categoryData = modsData[recentMod.category];
        let mod = null;
        let groupId = null;

        if (categoryData?.groups && Array.isArray(categoryData.groups)) {
            for (const group of categoryData.groups) {
                mod = group.mods.find(m => m.name === recentMod.name);
                if (mod) {
                    groupId = group.id;
                    break;
                }
            }
        } else {
            const mods = categoryData || [];
            mod = mods.find(m => m.name === recentMod.name);
        }

        if (mod && track) {
            const card = createModCard(mod, recentMod.category, groupId);
            const newCard = card.cloneNode(true);

            const subtitleElement = newCard.querySelector('.card-subtitle');
            if (subtitleElement && mod.type !== 'guide') {
                subtitleElement.textContent = translations[category.key];
            }

            if (recentMod.category === 'backgrounds' && mod.preview && mod.preview.endsWith('.mp4')) {
                const video = newCard.querySelector('video');
                if (video) {
                    newCard.addEventListener('mouseenter', () => {
                        video.play().catch(err => console.log('Play failed:', err));
                    });
                    newCard.addEventListener('mouseleave', () => {
                        video.pause();
                        video.currentTime = 0;
                    });
                }
            }

            newCard.querySelector('.add-to-cart-btn')?.remove();
            newCard.querySelector('.copy-link-btn')?.remove();

            const downloadIcon = newCard.querySelector('.download-icon .material-symbols-rounded');
            if (downloadIcon) downloadIcon.textContent = 'expand_circle_down';

            const linkButtonElements = newCard.querySelectorAll('.link-button');
            linkButtonElements.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();

                    const guideId = button.getAttribute('data-guide-id');
                    if (guideId) {
                        openGuideForMod({ guideId });
                        return;
                    }

                    const url = button.getAttribute('data-url');
                    const isVideo = button.getAttribute('data-video') === 'true';
                    if (isVideo) {
                        window.openVideoModal(url);
                    } else {
                        window.open(url, '_blank');
                    }
                });
            });

            const copyLinkBtn = newCard.querySelector('.copy-link-btn');
            if (copyLinkBtn) {
                copyLinkBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const link = generateModLink(recentMod.category, recentMod.name, groupId);
                    copyToClipboard(link, 'Mod link copied!');
                });
            }

            newCard.addEventListener('click', (e) => {
                if (e.target.classList.contains('link-button') ||
                    e.target.closest('.link-button') ||
                    e.target.classList.contains('copy-link-btn') ||
                    e.target.closest('.copy-link-btn')) {
                    return;
                }
                openCategoryAndHighlightMod(recentMod.category, recentMod.name);
                vibrate(10);
            });
            track.appendChild(newCard);
        }
    });

    state.itemsPerPage = calculateItemsPerPage();
    state.carouselPosition = 0;
    updateCarouselButtons();

    prevBtn?.addEventListener('click', () => moveCarousel(-1));
    nextBtn?.addEventListener('click', () => moveCarousel(1));
    collapseBtn?.addEventListener('click', toggleRecentlyAdded);

    const handleResize = debounce(() => {
        const newItemsPerPage = calculateItemsPerPage();
        if (newItemsPerPage !== state.itemsPerPage) {
            state.itemsPerPage = newItemsPerPage;
            state.carouselPosition = 0;
            if (track) track.style.transform = 'translateX(0)';
            updateCarouselButtons();
        }
    }, 250);

    window.addEventListener('resize', handleResize);
}

function init() {
    elements.homePage.classList.remove('hidden');
    elements.categoryPage.classList.add('hidden');
    elements.backButton.style.display = 'none';

    state.currentCategory = null;
    state.searchQuery = '';
    state.sortMode = 'default';
    state.currentSortModeIndex = 0;

    renderCategories();
    setupEventListeners();
    setupSearch();
    setupSortToggle();
    setupFAB();
    setupScrollToTop();
    setupGuideModal();
    setupVideoModal();
    setupNotesModal();
    setupRecentlyAdded();
    setupGifSwitcher();
    setupThemeToggle();
    // initSeasonalEffects();
    handleUrlParams();
}

function setupEventListeners() {
    elements.backButton.addEventListener('click', showHomePage);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.currentCategory) {
            showHomePage();
        }
    });
}

function setupSearch() {
    const debouncedSearch = debounce(() => {
        if (state.searchQuery) {
            if (!state.currentCategory && state.scrollPosition === 0) {
                state.scrollPosition = window.pageYOffset;
            }
            state.currentCategory = null;
            if (state.searchQuery.startsWith('#')) {
                renderFileSearch(state.searchQuery.substring(1));
            } else {
                renderAllModsSearch();
            }
        } else {
            showHomePage();
        }
    }, 360);

    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        elements.searchClear.style.display = state.searchQuery ? 'flex' : 'none';
        debouncedSearch();
    });

    elements.searchClear.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.searchClear.style.display = 'none';
        showHomePage();
        elements.searchInput.focus();
    });
}

function resetSort() {
    state.sortMode = 'default';
    state.currentSortModeIndex = 0;

    const sortLabel = document.getElementById('sortLabel');
    const sortIcon = document.querySelector('#sortToggle .material-symbols-rounded');
    const sortToggle = document.getElementById('sortToggle');

    if (sortLabel) sortLabel.textContent = 'Default';
    if (sortIcon) sortIcon.textContent = 'sort';
    if (sortToggle) sortToggle.style.display = 'flex';
}

function renderCategories() {
    elements.categoriesGrid.innerHTML = '';
    let filteredCategories = categories;

    if (state.searchQuery) {
        filteredCategories = categories.filter(category =>
            translations[category.key].toLowerCase().includes(state.searchQuery) ||
            translations[category.key + '-desc'].toLowerCase().includes(state.searchQuery)
        );
    }

    if (filteredCategories.length === 0) {
        elements.categoriesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 40px;">
                <p>No results found</p>
            </div>
        `;
        return;
    }

    filteredCategories.forEach(category => {
        const card = createCategoryCard(category);
        elements.categoriesGrid.appendChild(card);
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
        <div class="card-media">${mediaContent}</div>
        <div class="card-content">
            <h3 class="card-title">${translations[category.key]}</h3>
            <div class="card-subtitle-wrapper">
                <p class="card-subtitle">${translations[category.key + '-desc']}</p>
                <button class="copy-category-link-btn" title="Copy link">
                    <span class="material-symbols-rounded">link</span>
                </button>
            </div>
        </div>
    `;

    const copyBtn = card.querySelector('.copy-category-link-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const link = generateCategoryLink(category.id);
            copyToClipboard(link, 'Category link copied!');
        });
    }

    card.addEventListener('click', () => showCategoryPage(category.id));
    return card;
}

function showCategoryPage(categoryId) {
    state.scrollPosition = window.pageYOffset;
    state.currentCategory = categoryId;

    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    resetSort();

    elements.categoryTitle.textContent = translations[category.key];

    const descriptionText = translations[category.key + '-desc'];
    if (category.guideId) {
        elements.categoryDescription.innerHTML = `${descriptionText} <span class="category-guide-link" data-guide-id="${category.guideId}">${translations['how-to-install']}</span>`;

        const guideLink = elements.categoryDescription.querySelector('.category-guide-link');
        guideLink.addEventListener('click', () => {
            openGuideForMod({ guideId: category.guideId });
            vibrate(10);
        });
    } else {
        elements.categoryDescription.textContent = descriptionText;
    }

    const existingNote = document.querySelector('.category-note');
    if (existingNote) {
        existingNote.remove();
    }

    if (categoryNotes[categoryId] && categoryNotes[categoryId].enabled) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'category-note';
        noteDiv.innerHTML = `
        <span class="material-symbols-rounded">info</span>
        <p>${categoryNotes[categoryId].text}</p>
    `;
        const categoryHeader = document.querySelector('.category-header');
        if (categoryHeader && categoryHeader.parentElement) {
            categoryHeader.parentElement.insertBefore(noteDiv, categoryHeader.nextSibling);
        }
    }

    renderMods(categoryId);

    elements.homePage.classList.add('hidden');
    elements.categoryPage.classList.remove('hidden');
    elements.backButton.style.display = 'flex';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderMods(categoryId) {
    elements.modsGrid.innerHTML = '';
    elements.modsGrid.style.display = '';
    let mods = modsData[categoryId] || [];

    const sortToggle = document.getElementById('sortToggle');
    if (sortToggle) sortToggle.style.display = 'flex';

    const isGroupedCategory = mods.groups && Array.isArray(mods.groups);

    if (isGroupedCategory) {
        renderGroupedMods(categoryId, mods.groups);
    } else {
        if (state.searchQuery) {
            mods = mods.filter(mod => mod.name.toLowerCase().includes(state.searchQuery));
        }

        mods = sortMods(mods, state.sortMode);

        if (mods.length === 0) {
            const message = state.searchQuery
                ? 'No results found'
                : 'No mods available in this category yet.';

            elements.modsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 40px;">
                    <p>${message}</p>
                </div>
            `;
            return;
        }

        mods.forEach(mod => {
            const card = createModCard(mod, categoryId);
            elements.modsGrid.appendChild(card);
        });
    }

    if (typeof updateCartButtons === 'function') {
        updateCartButtons();
    }
}

function renderGroupedMods(categoryId, groups) {
    groups.forEach(group => {
        let filteredMods = group.mods;

        if (state.searchQuery) {
            filteredMods = filteredMods.filter(mod =>
                mod.name.toLowerCase().includes(state.searchQuery) ||
                group.name.toLowerCase().includes(state.searchQuery)
            );
        }

        if (filteredMods.length === 0) return;

        const groupHeader = document.createElement('div');
        groupHeader.className = 'mod-group-header';
        groupHeader.innerHTML = `
            <h3 class="mod-group-title">${group.name}</h3>
            <div class="mod-group-divider"></div>
        `;
        elements.modsGrid.appendChild(groupHeader);

        const groupContainer = document.createElement('div');
        groupContainer.className = 'mod-group-container';
        groupContainer.setAttribute('data-group-id', group.id);

        const sortedMods = sortMods(filteredMods, state.sortMode);
        sortedMods.forEach(mod => {
            const card = createModCard(mod, categoryId, group.id);
            groupContainer.appendChild(card);
        });

        elements.modsGrid.appendChild(groupContainer);
    });
}

function renderAllModsSearch() {
    elements.modsGrid.innerHTML = '';
    elements.modsGrid.style.display = '';
    elements.homePage.classList.add('hidden');
    elements.categoryPage.classList.remove('hidden');
    elements.backButton.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const sortToggle = document.getElementById('sortToggle');
    if (sortToggle) sortToggle.style.display = 'none';

    const existingGuideLink = document.querySelector('.category-guide-link');
    if (existingGuideLink) {
        existingGuideLink.remove();
    }

    let allResults = [];

    for (const category of categories) {
        const categoryData = modsData[category.id];
        const isGroupedCategory = categoryData?.groups && Array.isArray(categoryData.groups);

        if (isGroupedCategory) {
            categoryData.groups.forEach(group => {
                const filtered = group.mods.filter(mod =>
                    mod.name.toLowerCase().includes(state.searchQuery) ||
                    group.name.toLowerCase().includes(state.searchQuery)
                );
                filtered.forEach(mod => {
                    allResults.push({
                        mod,
                        category,
                        groupId: group.id,
                        groupName: group.name
                    });
                });
            });
        } else {
            const mods = categoryData || [];
            const filtered = mods.filter(mod =>
                mod.name.toLowerCase().includes(state.searchQuery)
            );
            filtered.forEach(mod => allResults.push({ mod, category }));
        }
    }

    if (allResults.length === 0) {
        elements.modsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 40px;">
                <p>No results found</p>
            </div>
        `;
        elements.categoryTitle.textContent = 'Search results';
        elements.categoryDescription.textContent = '';
        return;
    }

    if (state.sortMode === 'name') {
        allResults.sort((a, b) => a.mod.name.localeCompare(b.mod.name));
    } else if (state.sortMode === 'date') {
        allResults.reverse();
    }

    elements.categoryTitle.textContent = 'Search results';
    elements.categoryDescription.textContent = `Found ${allResults.length} mods`;

    allResults.forEach(({ mod, category, groupId }) => {
    const card = createModCard(mod, category.id, groupId);

    const subtitleElement = card.querySelector('.card-subtitle');
    if (subtitleElement && mod.type !== 'guide') {
        subtitleElement.textContent = translations[category.key];
    }
    
    elements.modsGrid.appendChild(card);
    });

    if (typeof updateCartButtons === 'function') {
        updateCartButtons();
    }
}

function renderFileSearch(filename) {
    elements.modsGrid.innerHTML = '';
    elements.modsGrid.style.display = '';
    elements.homePage.classList.add('hidden');
    elements.categoryPage.classList.remove('hidden');
    elements.backButton.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const sortToggle = document.getElementById('sortToggle');
    if (sortToggle) sortToggle.style.display = 'none';

    const existingGuideLink = document.querySelector('.category-guide-link');
    if (existingGuideLink) {
        existingGuideLink.remove();
    }

    const resultsByCategory = {};

    for (const category of categories) {
        const categoryData = modsData[category.id];
        const isGroupedCategory = categoryData?.groups && Array.isArray(categoryData.groups);

        if (isGroupedCategory) {
            categoryData.groups.forEach(group => {
                const matchingMods = group.mods.filter(mod => 
                    mod.file && mod.file.toLowerCase().includes(filename.toLowerCase())
                );
                
                if (matchingMods.length > 0) {
                    if (!resultsByCategory[category.id]) {
                        resultsByCategory[category.id] = {
                            category: category,
                            mods: []
                        };
                    }
                    matchingMods.forEach(mod => {
                        resultsByCategory[category.id].mods.push({
                            mod,
                            groupId: group.id,
                            groupName: group.name
                        });
                    });
                }
            });
        } else {
            const mods = categoryData || [];
            const matchingMods = mods.filter(mod => 
                mod.file && mod.file.toLowerCase().includes(filename.toLowerCase())
            );
            
            if (matchingMods.length > 0) {
                resultsByCategory[category.id] = {
                    category: category,
                    mods: matchingMods.map(mod => ({ mod }))
                };
            }
        }
    }

    const totalResults = Object.values(resultsByCategory).reduce(
        (sum, cat) => sum + cat.mods.length, 
        0
    );

    if (totalResults === 0) {
        elements.modsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 40px;">
                <p>No mods found using file: <code>${filename}</code></p>
            </div>
        `;
        elements.categoryTitle.textContent = 'File search results';
        elements.categoryDescription.textContent = '';
        return;
    }

    elements.categoryTitle.textContent = `${translations['file-search-results']} #${filename}`;
    elements.categoryDescription.textContent = `Found ${totalResults} mod${totalResults !== 1 ? 's' : ''} in ${Object.keys(resultsByCategory).length} categor${Object.keys(resultsByCategory).length !== 1 ? 'ies' : 'y'}`;

    Object.values(resultsByCategory).forEach(({ category, mods }) => {
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'mod-group-header';
        categoryHeader.innerHTML = `
            <h3 class="mod-group-title">${translations[category.key]}</h3>
            <div class="mod-group-divider"></div>
        `;
        elements.modsGrid.appendChild(categoryHeader);

        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'mod-group-container';
        categoryContainer.setAttribute('data-category-id', category.id);

        mods.forEach(({ mod, groupId }) => {
            const card = createModCard(mod, category.id, groupId);
            categoryContainer.appendChild(card);
        });

        elements.modsGrid.appendChild(categoryContainer);
    });

    if (typeof updateCartButtons === 'function') {
        updateCartButtons();
    }
}

function createModCard(mod, categoryId, groupId = null) {
    const card = document.createElement('div');
    card.className = 'card fade-in';
    card.setAttribute('data-mod-name', mod.name);
    card.setAttribute('data-category-id', categoryId);
    if (groupId) card.setAttribute('data-group-id', groupId);

    const preview = mod.preview || '';
    const isVideo = preview.endsWith('.mp4');
    const mediaElement = isVideo ? 'video' : 'img';
    const mediaAttrs = isVideo && categoryId !== 'backgrounds'
        ? 'autoplay muted loop playsinline'
        : isVideo ? 'muted loop playsinline' : '';

    const tagsHtml = generateTagsHtml(mod, categoryId);
    const linkButtonsHtml = generateLinkButtonsHtml(mod, categoryId);
    const downloadIcon = mod.type === 'guide' ? 'captive_portal' : 'download';
    const subtitleText = mod.type === 'guide' ? 'Open' : translations['download'];
    const hideAddToCart = shouldHideAddToCart(mod, categoryId);

    card.innerHTML = `
        <div class="card-media">
            ${preview
                ? `<${mediaElement} src="assets/previews/${categoryId}/${preview}" ${mediaAttrs} 
                     onerror="this.parentElement.innerHTML='<span style=\\'font-size: 48px; opacity: 0.5;\\'>📖</span>'"></${mediaElement}>`
                : `<span style="font-size: 48px; opacity: 0.5;">📖</span>`
            }
            ${tagsHtml}
            ${!hideAddToCart ? `
                <button class="add-to-cart-btn" data-mod='${JSON.stringify({ name: mod.name, file: mod.file })}' data-category="${categoryId}">
                    <span class="material-symbols-rounded">add</span>
                    <span class="add-to-cart-text">${translations['addToCart'] || 'Add to cart'}</span>
                </button>
            ` : ''}
            <div class="download-icon">
                <span class="material-symbols-rounded">${downloadIcon}</span>
            </div>
        </div>
        <div class="card-content">
            <h3 class="card-title">${categoryId === 'heroes' ? highlightHeroNames(mod.name) : mod.name}${mod.name.toLowerCase().includes('linux') ? " <i class='bxl bx-tux bx-sm' style='vertical-align: text-bottom;'></i>" : ''}</h3>
            <div class="card-subtitle-wrapper">
                <p class="card-subtitle">${subtitleText}</p>
                <div class="card-buttons-group">
                    ${linkButtonsHtml}
                    <button class="copy-link-btn" title="Copy link">
                        <span class="material-symbols-rounded">link</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    attachCardEventListeners(card, mod, categoryId, groupId);
    return card;
}

function loadPackToCart(pack) {
    const currentCartIsPack = savedAssemblies.some(assembly =>
        assembly.name !== 'Backup' && isAssemblyMatchingCurrentCart(assembly)
    );

    if (cart.length > 0 && !currentCartIsPack) {

        const backupAssembly = {
            id: Date.now().toString(),
            name: 'Backup',
            items: [...cart],
            date: new Date().toISOString()
        };

        savedAssemblies.unshift(backupAssembly);
        if (savedAssemblies.length > MAX_ASSEMBLIES) {
            savedAssemblies.pop();
        }
        saveAssemblies();
    }

    cart = [];

    pack.mods.forEach(modName => {
        let found = false;
        for (const categoryId in modsData) {
            if (found) break;
            
            const categoryData = modsData[categoryId];
            if (categoryData?.groups && Array.isArray(categoryData.groups)) {
                for (const group of categoryData.groups) {
                    const mod = group.mods.find(m => m.name === modName);
                    if (mod) {
                        cart.push({
                            id: `${categoryId}-${group.id}-${mod.name}`,
                            name: mod.name,
                            file: mod.file,
                            categoryId: categoryId,
                            groupId: group.id
                        });
                        found = true;
                        break;
                    }
                }
            }
            else if (Array.isArray(categoryData)) {
                const mod = categoryData.find(m => m.name === modName);
                if (mod) {
                    cart.push({
                        id: `${categoryId}-${mod.name}`,
                        name: mod.name,
                        file: mod.file,
                        categoryId: categoryId,
                        groupId: null
                    });
                    found = true;
                }
            }
        }
        if (!found) {
            console.warn(`Mod not found: ${modName}`);
        }
    });

    saveCart();
    updateCartBadge();
    renderCartItems();
    updateCartButtons();
    renderAssembliesList();

    const foundCount = cart.length;
    const totalCount = pack.mods.length;
    const message = foundCount === totalCount
        ? `Loaded: <span style="color: var(--md-sys-color-shit); font-weight: bold;">${escapeHtml(pack.name)}</span>`
        : `Loaded: <span style="color: var(--md-sys-color-shit); font-weight: bold;">${escapeHtml(pack.name)}</span> (${foundCount}/${totalCount} mods found)`;

    showToast(message);

    const cartButton = document.getElementById('cartButton');
    if (cartButton) cartButton.click();
}

function generateTagsHtml(mod, categoryId) {
    const cfg = TAG_CONFIGS[categoryId];
    const canShowTags = !!cfg && mod.tags && (mod.type !== 'guide' || cfg.allowForGuides);

    if (!canShowTags) return '';

    const activeTags = [];
    const tagMap = cfg.map || {};

    for (const key in tagMap) {
        if (Object.prototype.hasOwnProperty.call(mod.tags, key) && mod.tags[key]) {
            activeTags.push(`<span class="mod-tag">${tagMap[key]}</span>`);
        }
    }

    return activeTags.length > 0 ? `<div class="mod-tags">${activeTags.join('')}</div>` : '';
}

function generateLinkButtonsHtml(mod, categoryId) {
    const linkButtons = [];

    if (mod.links && mod.links.length > 0) {
        mod.links.forEach(link => {
            const icon = LINK_ICONS[link.type] || 'link';
            const isNotSafe = link.type === 'not-safe';

            let displayText = translations[link.type];
            let hasCustomName = false;

            if (link.type === 'sender' && link.name) {
                displayText = link.name;
                hasCustomName = true;
            }

            linkButtons.push(`
                <span class="link-button ${isNotSafe ? 'not-safe' : ''}" 
                      data-url="${link.url}" 
                      data-video="${link.url.endsWith('.mp4') || link.url.endsWith('.webm')}"
                      ${hasCustomName ? 'data-custom-name="true"' : ''}>
                    <span class="material-symbols-rounded">${icon}</span>
                    ${displayText}
                </span>
            `);
        });
    } else if (mod.linkType && mod.linkUrl) {
        const icon = LINK_ICONS[mod.linkType] || 'link';
        const isNotSafe = mod.linkType === 'not-safe';

        let displayText = translations[mod.linkType];
        let hasCustomName = false;

        if (mod.linkType === 'sender' && mod.senderName) {
            displayText = mod.senderName;
            hasCustomName = true;
        }
        linkButtons.push(`
            <span class="link-button ${isNotSafe ? 'not-safe' : ''}" 
                  data-url="${mod.linkUrl}" 
                  data-video="${mod.linkUrl.endsWith('.mp4') || mod.linkUrl.endsWith('.webm')}"
                  ${hasCustomName ? 'data-custom-name="true"' : ''}>
                <span class="material-symbols-rounded">${icon}</span>
                ${displayText}
            </span>
        `);
    }

    const hideGuideButtonCategories = ['guides'];
    if (mod.guideId && !hideGuideButtonCategories.includes(categoryId)) {
        const isNotSafe = mod.guideType === 'not-safe';
        const isInfo = mod.guideType === 'info';
        const guideClass = isNotSafe ? 'not-safe' : (isInfo ? 'info' : '');
        const guideIcon = isNotSafe ? 'warning' : (isInfo ? 'text_snippet' : 'description');
        const guideText = isNotSafe ? 'not-safe' : (isInfo ? 'info' : 'guide');

        linkButtons.push(`
        <span class="link-button guide-button ${guideClass}" data-guide-id="${mod.guideId}">
            <span class="material-symbols-rounded">${guideIcon}</span>
            ${translations[guideText]}
        </span>
    `);
    }

    return linkButtons.length > 0 ? `<div class="link-buttons">${linkButtons.join('')}</div>` : '';
}

function shouldHideAddToCart(mod, categoryId) {
    if (addToCartRules.hiddenCategories.includes(categoryId)) {
        return true;
    }

    if (addToCartRules.allowedMods[categoryId]) {
        const allowedList = addToCartRules.allowedMods[categoryId].map(name => name.toLowerCase());
        if (!allowedList.includes(mod.name.toLowerCase())) {
            return true;
        }
    }

    if (mod.type === 'guide') {
        return true;
    }

    return false;
}

function attachCardEventListeners(card, mod, categoryId, groupId = null) {
    const copyLinkBtn = card.querySelector('.copy-link-btn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const link = generateModLink(categoryId, mod.name, groupId);
            copyToClipboard(link, 'Mod link copied!');
        });
    }

    if (categoryId === 'backgrounds' && mod.preview && mod.preview.endsWith('.mp4')) {
        const video = card.querySelector('video');
        if (video) {
            card.addEventListener('mouseenter', () => {
                video.play().catch(err => console.log('Play failed:', err));
            });
            card.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
            });
        }
    }

    card.addEventListener('click', (e) => {
        if (e.target.classList.contains('link-button') || e.target.closest('.link-button')) {
            return;
        }
        if (e.target.classList.contains('copy-link-btn') || e.target.closest('.copy-link-btn')) {
            return;
        }
        if (mod.type === 'pack') {
            loadPackToCart(mod);
            return;
        }
        if (mod.type === 'guide') {
            if (mod.guideId) {
                if (!mod.file || !mod.file.startsWith('http')) {
                    openGuideForMod({ guideId: mod.guideId });
                } else {
                    window.open(mod.file, '_blank');
                }
            } else {
                window.open(mod.file, '_blank');
            }
        } else {
            downloadMod(mod, categoryId);
        }
    });

    const linkButtonElements = card.querySelectorAll('.link-button');
    linkButtonElements.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();

            const guideId = button.getAttribute('data-guide-id');
            if (guideId) {
                openGuideForMod({ guideId });
                return;
            }

            const url = button.getAttribute('data-url');
            const isVideo = button.getAttribute('data-video') === 'true';
            if (isVideo) {
                window.openVideoModal(url);
            } else {
                window.open(url, '_blank');
            }
        });
    });

    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const modData = JSON.parse(addToCartBtn.getAttribute('data-mod'));
            const category = addToCartBtn.getAttribute('data-category');
            addToCart(modData, category);
            updateCartButtons();
        });
    }
}

const GITHUB_RAW_ENDPOINT = 'https://raw.githubusercontent.com/h6rd/Dota2PornFxWeb/main';
const ALLOWED_DOMAINS = ['h6rd.github.io', 'd2pfx.netlify.app', '127.0.0.1'];

function downloadMod(mod, categoryId) {
    if (!ALLOWED_DOMAINS.some(domain => window.location.hostname.includes(domain))) {
        console.error('Unauthorized access attempt');
        showToast('Access denied');
        return;
    }

    const link = document.createElement('a');
    link.href = `assets/files/${categoryId}/${mod.file}`;
    link.download = mod.file;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`Downloading: ${mod.name}`);
}

function openGuideForMod(mod) {
    if (!mod.guideId || !guidesData[mod.guideId]) {
        console.error('Guide not found:', mod.guideId);
        return;
    }

    const guideData = guidesData[mod.guideId];
    window.openGuideModal(guideData);
}

function showHomePage() {
    state.currentCategory = null;
    state.sortMode = 'default';
    state.currentSortModeIndex = 0;

    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.searchClear.style.display = 'none';

    elements.categoryPage.classList.add('hidden');
    elements.homePage.classList.remove('hidden');
    elements.backButton.style.display = 'none';

    const sortToggle = document.getElementById('sortToggle');
    if (sortToggle) sortToggle.style.display = 'none';

    resetSort();
    renderCategories();

    const baseUrl = window.location.origin + window.location.pathname;
    window.history.pushState({}, '', baseUrl);

    const scrollTo = state.scrollPosition;
    state.scrollPosition = 0;

    requestAnimationFrame(() => {
        window.scrollTo(0, scrollTo);
    });
}

init();