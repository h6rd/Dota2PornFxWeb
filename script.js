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
    'guide': 'Guide',
    'preview': 'Preview',
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
    'river-desc': 'Custom river colors'
};

const categories = [
    { id: 'shaders', emoji: '🎨', key: 'shaders', preview: 'shaders.webp' },
    { id: 'ti-bp-effects', emoji: '🌟', key: 'ti-bp-effects', preview: 'Effect-Packs.webp' },
    { id: 'item-effects', emoji: '✨', key: 'item-effects', preview: 'item-effects.webp' },
    { id: 'creep-deny', emoji: '🎯', key: 'creep-deny', preview: 'creep-deny.webp' },
    { id: 'emblems', emoji: '🏵', key: 'emblems', preview: 'emblems.webp' },
    { id: 'heroes', emoji: '👤', key: 'heroes', preview: 'heroes.webp' },
    { id: 'terrains', emoji: '🏞️', key: 'terrains', preview: 'terrains.webp' },
    { id: 'trees', emoji: '🌲', key: 'trees', preview: 'trees.webp' },
    { id: 'creeps', emoji: '🕷', key: 'creeps', preview: 'creeps.webp' },
    { id: 'ranged-attack', emoji: '🏹', key: 'ranged-attack', preview: 'ranged-attack.webp' },
    { id: 'river', emoji: '📖', key: 'river', preview: 'river.webp' },
    { id: 'roshan', emoji: '🦖', key: 'roshan', preview: 'roshan.webp' },
    { id: 'versus-screens', emoji: '🆚', key: 'versus-screens', preview: 'vs.webp' },
    { id: 'ancient', emoji: '🗻', key: 'ancient', preview: 'ancient.webp' },
    { id: 'tormentor', emoji: '🎈', key: 'tormentor', preview: 'tormentor.webp' },
    { id: 'towers', emoji: '🗼', key: 'towers', preview: 'towers.webp' },
    { id: 'mega-kill', emoji: '🔊', key: 'mega-kill', preview: 'mega-kill.webp' },
    { id: 'pedestal', emoji: '🗿', key: 'pedestal', preview: 'pedestal.webp' },
    { id: 'high-five', emoji: '🖐️', key: 'high-five', preview: 'high-five.webp' },
    { id: 'other', emoji: '⚙️', key: 'other', preview: 'other.webp' },
    { id: 'packs', emoji: '📦', key: 'packs', preview: 'packs.webp' },
    { id: 'backgrounds', emoji: '🖼️', key: 'backgrounds', preview: 'backgrounds.webp' },
    { id: 'tools', emoji: '🛠️', key: 'tools', preview: 'tools.webp' },
    { id: 'optimization', emoji: '🛠️', key: 'optimization', preview: 'optimization.webp' },
    { id: 'guides', emoji: '📖', key: 'guides', preview: 'guides.webp' },
    // { id: 'sites', emoji: '🌐', key: 'sites', preview: '.webp' }
];

const recentlyAddedMods = [
    { name: 'Cloudy Tree', category: 'backgrounds' },
    { name: 'Winter Solitude', category: 'backgrounds' },
    { name: 'Arcanas Items Icons', category: 'other' },
    { name: 'Black River', category: 'river' },
    { name: 'Moonflower Field', category: 'backgrounds' },
    { name: 'Green Diretide Ranged Attack', category: 'ranged-attack' },
    { name: 'Aghanim Ranged Attack', category: 'ranged-attack' },
    { name: 'Sakura Pink Invoker', category: 'heroes' },
    { name: 'Minimap Icons', category: 'guides' },
    { name: 'Darkness Pack', category: 'ti-bp-effects' },
    { name: 'Lifestealer Diretide Shimmer', category: 'heroes' },
    { name: 'Sherman Crystal Maiden', category: 'heroes' },
    { name: 'Low Poly Trees', category: 'trees' },
    { name: 'Mossy Cobblestone', category: 'terrains' }
];

const addToCartRules = {
    hiddenCategories: ['guides', 'optimization', 'packs', 'tools'],
    allowedMods: {
        terrains: ['Mossy Cobblestone', 'Dark Terrain Minify', 'Flat Dark Terrain Minify'],
        other: ['Profile Graffiti & Phrases', 'Showcase Rotation', 'High Five Aghanim Puppet', 'High Five Crownfall', 'Rage Voice Icon', 'Arcanas Items Icons', 'Beer Bottle'],
    }
};

let currentCategory = null;
let searchQuery = '';
let scrollPosition = 0;
let sortMode = 'default';
let currentSortModeIndex = 0;

const homePage = document.getElementById('homePage');
const categoryPage = document.getElementById('categoryPage');
const categoriesGrid = document.getElementById('categoriesGrid');
const modsGrid = document.getElementById('modsGrid');
const categoryTitle = document.getElementById('categoryTitle');
const categoryDescription = document.getElementById('categoryDescription');
const backButton = document.getElementById('backButton');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');

function setupFAB() {
    const fab = document.getElementById('fab');
    const fabMenu = document.getElementById('fabMenu');
    const fabMenuBackground = document.getElementById('fabMenuBackground');
    const infoButton = document.getElementById('infoButton');
    const infoModal = document.getElementById('infoModal');
    const infoOverlay = document.getElementById('infoOverlay');
    const closeModal = document.getElementById('closeModal');

    fab.addEventListener('click', () => {
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

            fabMenuBackground.style.height = totalHeight + 'px';
        } else {
            fabMenuBackground.style.height = '0px';
        }
    });

    infoButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        infoModal.classList.add('active');
        infoOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        fab.classList.remove('active');
        fabMenu.classList.remove('active');
        fabMenuBackground.classList.remove('active');
        fabMenuBackground.style.height = '0px';
    });

    const closeModalWindow = () => {
        infoModal.classList.remove('active');
        infoOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    closeModal.addEventListener('click', closeModalWindow);
    infoOverlay.addEventListener('click', closeModalWindow);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoModal.classList.contains('active')) {
            closeModalWindow();
        }
    });

    document.addEventListener('click', (e) => {
        if (!fab.contains(e.target) && !fabMenu.contains(e.target)) {
            fab.classList.remove('active');
            fabMenu.classList.remove('active');
            fabMenuBackground.classList.remove('active');
            fabMenuBackground.style.height = '0px';
        }
    });
}

function setupScrollToTop() {
    const scrollFab = document.getElementById('scrollToTopFab');
    const fab = document.getElementById('fab');

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const updateScrollButton = () => {
        const isFabActive = fab.classList.contains('active');

        if (window.scrollY > 300 && !isFabActive) {
            scrollFab.classList.add('visible');
        } else {
            scrollFab.classList.remove('visible');
        }
    };

    window.addEventListener('scroll', updateScrollButton);

    const observer = new MutationObserver(() => {
        updateScrollButton();
    });

    observer.observe(fab, {
        attributes: true,
        attributeFilter: ['class']
    });

    scrollFab.addEventListener('click', scrollToTop);
}

function setupGuideModal() {
    const guideModal = document.getElementById('guideModal');
    const guideOverlay = document.getElementById('guideOverlay');
    const closeGuideModal = document.getElementById('closeGuideModal');
    const guideModalContent = document.getElementById('guideModalContent');
    const guideModalTitle = document.getElementById('guideModalTitle');

    const closeGuideWindow = () => {
        guideModal.classList.remove('active');
        guideOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    closeGuideModal.addEventListener('click', closeGuideWindow);
    guideOverlay.addEventListener('click', closeGuideWindow);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && guideModal.classList.contains('active')) {
            closeGuideWindow();
        }
    });

    window.openGuideModal = (guideData) => {
        guideModalTitle.textContent = guideData.title;
        guideModalContent.innerHTML = '';

        const languageToggle = document.createElement('div');
        languageToggle.className = 'guide-language-toggle';
        languageToggle.innerHTML = `
            <button class="guide-language-btn active" data-lang="en">
                English
            </button>
            <button class="guide-language-btn" data-lang="ru">
                Русский
            </button>
        `;
        guideModalContent.appendChild(languageToggle);

        ['en', 'ru'].forEach(lang => {
            const contentDiv = document.createElement('div');
            contentDiv.className = `guide-content ${lang === 'en' ? 'active' : ''}`;
            contentDiv.setAttribute('data-lang', lang);

            guideData.content[lang].forEach(section => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'info-modal-section';

                if (section.title) {
                    const sectionTitle = document.createElement('h3');
                    sectionTitle.className = 'guide-section-title';

                    if (section.icon) {
                        sectionTitle.innerHTML = `
                            <span class="material-symbols-rounded">${section.icon}</span>
                            ${section.title}
                        `;
                    } else {
                        sectionTitle.textContent = section.title;
                    }
                    sectionDiv.appendChild(sectionTitle);
                }
                if (section.info && (!section.infoPosition || section.infoPosition === 'top')) {
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'guide-info';
                    infoDiv.innerHTML = `
        <span class="material-symbols-rounded">info</span>
        <p class="guide-info-text">${section.info}</p>
    `;
                    sectionDiv.appendChild(infoDiv);
                }

                section.steps.forEach((step, index) => {
                    const stepDiv = document.createElement('div');
                    stepDiv.className = 'guide-step';

                    let stepContent = '';
                    let stepText = '';
                    let linkUrl = '';

                    if (typeof step === 'object' && step.icon) {
                        stepText = step.text;
                        stepContent = `
            <div class="guide-step-number">
                <span class="material-symbols-rounded">${step.icon}</span>
            </div>
            <div class="guide-step-content">
                <p class="guide-step-text">${step.text}</p>
            </div>
        `;
                    } else {
                        stepText = step;
                        stepContent = `
            <div class="guide-step-number">${index + 1}</div>
            <div class="guide-step-content">
                <p class="guide-step-text">${step}</p>
            </div>
        `;
                    }

                    stepDiv.innerHTML = stepContent;

                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = stepText;
                    const link = tempDiv.querySelector('a');

                    if (link) {
                        stepDiv.classList.add('has-link');
                        const href = link.getAttribute('href');
                        const target = link.getAttribute('target');

                        stepDiv.addEventListener('click', (e) => {
                            e.preventDefault();
                            if (href) {
                                window.open(href, target || '_self');
                            }
                        });
                    }

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
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'guide-info';
                    infoDiv.innerHTML = `
        <span class="material-symbols-rounded">info</span>
        <p class="guide-info-text">${section.info}</p>
    `;
                    sectionDiv.appendChild(infoDiv);
                }

                contentDiv.appendChild(sectionDiv);
            });

            const warningSection = guideData.content[lang].find(section => section.warning);
            if (warningSection && warningSection.warning) {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'guide-warning';
                warningDiv.innerHTML = `
                    <span class="material-symbols-rounded">warning</span>
                    <p class="guide-warning-text">${warningSection.warning}</p>
                `;
                contentDiv.appendChild(warningDiv);
            }

            guideModalContent.appendChild(contentDiv);
        });

        const langButtons = languageToggle.querySelectorAll('.guide-language-btn');
        const contentSections = guideModalContent.querySelectorAll('.guide-content');

        langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetLang = btn.getAttribute('data-lang');

                langButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                contentSections.forEach(section => {
                    if (section.getAttribute('data-lang') === targetLang) {
                        section.classList.add('active');
                    } else {
                        section.classList.remove('active');
                    }
                });

                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
            });
        });

        guideModal.classList.add('active');
        guideOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
}

// copy code
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'CODE') {
        const codeText = e.target.textContent.trim();

        navigator.clipboard.writeText(codeText).then(() => {
            e.target.classList.add('copied');

            if ('vibrate' in navigator) navigator.vibrate(20);

            setTimeout(() => {
                e.target.classList.remove('copied');
            }, 1200);
        });
    }
});

function sortMods(mods, mode) {
    const sortedMods = [...mods];

    switch (mode) {
        case 'name':
            return sortedMods.sort((a, b) => a.name.localeCompare(b.name));
        case 'date':
            return sortedMods.reverse();
        case 'default':
        default:
            return sortedMods;
    }
}

function setupSortToggle() {
    const sortToggle = document.getElementById('sortToggle');
    const sortLabel = document.getElementById('sortLabel');
    const sortIcon = sortToggle.querySelector('.material-symbols-rounded');

    const sortModes = [
        { key: 'default', label: 'Default', icon: 'sort' },
        { key: 'name', label: 'Name', icon: 'sort_by_alpha' },
        { key: 'date', label: 'Newest', icon: 'schedule' }
    ];

    sortToggle.addEventListener('click', () => {
        currentSortModeIndex = (currentSortModeIndex + 1) % sortModes.length;
        const mode = sortModes[currentSortModeIndex];

        sortMode = mode.key;
        sortLabel.textContent = mode.label;
        sortIcon.textContent = mode.icon;

        if (currentCategory) {
            renderMods(currentCategory);
        }

        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    });
}

function setupVideoModal() {
    const videoModal = document.getElementById('videoModal');
    const videoOverlay = document.getElementById('videoOverlay');
    const closeVideoModal = document.getElementById('closeVideoModal');
    const modalVideo = document.getElementById('modalVideo');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const progressBar = document.querySelector('.video-progress-bar');
    const progressFilled = document.querySelector('.video-progress-filled');
    const playIcon = playPauseBtn.querySelector('.material-symbols-rounded');
    const videoSpinner = document.querySelector('.video-loading-spinner');

    let clickTimer = null;
    let isDoubleClick = false;

    const closeVideoWindow = () => {
        isClosing = true;
        videoModal.classList.remove('active');
        videoOverlay.classList.remove('active');
        document.body.style.overflow = '';
        modalVideo.pause();
        modalVideo.currentTime = 0;
        playIcon.textContent = 'play_arrow';
        if (videoSpinner) videoSpinner.classList.add('hidden');

        setTimeout(() => {
            modalVideo.src = '';
            isClosing = false;
        }, 150);
    };

    closeVideoModal.addEventListener('click', closeVideoWindow);
    videoOverlay.addEventListener('click', closeVideoWindow);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoWindow();
        }
    });

    modalVideo.addEventListener('loadstart', () => {
        if (isClosing) return;
        if (videoSpinner) videoSpinner.classList.remove('hidden');
    });

    modalVideo.addEventListener('waiting', () => {
        if (isClosing) return;
        if (videoSpinner) videoSpinner.classList.remove('hidden');
    });

    modalVideo.addEventListener('canplay', () => {
        if (videoSpinner) videoSpinner.classList.add('hidden');
    });

    modalVideo.addEventListener('playing', () => {
        if (videoSpinner) videoSpinner.classList.add('hidden');
    });

    modalVideo.addEventListener('stalled', () => {
        if (videoSpinner) videoSpinner.classList.remove('hidden');
    });

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
                    if (modalVideo.paused) {
                        modalVideo.play();
                    } else {
                        modalVideo.pause();
                    }
                }
                clickTimer = null;
            }, 250);
        }
    });

    playPauseBtn.addEventListener('click', () => {
        if (modalVideo.paused) {
            modalVideo.play();
            playIcon.textContent = 'pause';
        } else {
            modalVideo.pause();
            playIcon.textContent = 'play_arrow';
        }
    });

    fullscreenBtn.addEventListener('click', () => {
        const videoContainer = document.querySelector('.video-modal-content');
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    const volumeBtn = document.getElementById('volumeBtn');
    const volumeIcon = document.getElementById('volumeIcon');

    volumeBtn.addEventListener('click', () => {
        if (modalVideo.muted || modalVideo.volume === 0) {
            modalVideo.muted = false;
            modalVideo.volume = 1;
            volumeIcon.textContent = 'volume_up';
        } else {
            modalVideo.muted = true;
            volumeIcon.textContent = 'volume_off';
        }
    });


    modalVideo.addEventListener('timeupdate', () => {
        const percent = (modalVideo.currentTime / modalVideo.duration) * 100;
        progressFilled.style.width = percent + '%';
    });

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentTimeDisplay = document.getElementById('videoCurrentTime');
    const totalTimeDisplay = document.getElementById('videoTotalTime');

    modalVideo.addEventListener('loadedmetadata', () => {
        totalTimeDisplay.textContent = formatTime(modalVideo.duration);
    });

    modalVideo.addEventListener('timeupdate', () => {
        const percent = (modalVideo.currentTime / modalVideo.duration) * 100;
        progressFilled.style.width = percent + '%';
        currentTimeDisplay.textContent = formatTime(modalVideo.currentTime);
    });

    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        modalVideo.currentTime = percent * modalVideo.duration;
    });

    modalVideo.addEventListener('play', () => {
        playIcon.textContent = 'pause';
    });

    modalVideo.addEventListener('pause', () => {
        playIcon.textContent = 'play_arrow';
    });

    window.openVideoModal = (videoUrl) => {
        if (videoSpinner) {
            videoSpinner.classList.remove('hidden');
        }

        videoModal.classList.add('no-transition', 'active');
        videoOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        modalVideo.src = videoUrl;

        const enableAndShow = () => {
            setTimeout(() => {
                videoModal.classList.remove('no-transition');
                videoModal.offsetHeight;
                videoModal.classList.add('active');
                if (videoSpinner) videoSpinner.classList.add('hidden');
                playIcon.textContent = 'pause';
            }, 40);

            modalVideo.removeEventListener('loadedmetadata', enableAndShow);
            modalVideo.removeEventListener('canplay', enableAndShow);
        };

        modalVideo.addEventListener('loadedmetadata', enableAndShow);
        modalVideo.addEventListener('canplay', enableAndShow);

        setTimeout(() => {
            if (!videoModal.classList.contains('active')) {
                enableAndShow();
            }
        }, 700);
    };
}

// hueta
const gifElement = document.getElementById('clickable-gif');
const hintElement = document.getElementById('click-hint');
const html = document.documentElement;

const gifs = [
    'assets/files/hueta/ursa.gif',
    'assets/files/hueta/brew.gif',
    'assets/files/hueta/fura.gif',
    'assets/files/hueta/storm.gif',
    'assets/files/hueta/invoker.gif'
];

const themes = ['ursa', 'brew', 'fura', 'storm', 'invoker'];

let currentIndex = 0;
const savedIndex = localStorage.getItem('gifIndex');
if (savedIndex !== null) {
    currentIndex = parseInt(savedIndex);
    gifElement.src = gifs[currentIndex];
}

const hasClicked = localStorage.getItem('gifClicked') === 'true';
if (!hasClicked && hintElement) {
    hintElement.classList.add('show');
}

gifElement.addEventListener('click', () => {
    if (hintElement && !hasClicked) {
        hintElement.classList.remove('show');
        setTimeout(() => {
            hintElement.style.display = 'none';
        }, 300);
        localStorage.setItem('gifClicked', 'true');
    }

    gifElement.classList.add('clicked');
    gifElement.classList.add('no-hover');

    setTimeout(() => {
        gifElement.classList.remove('clicked');

        currentIndex = (currentIndex + 1) % gifs.length;
        const newTheme = themes[currentIndex];

        gifElement.src = gifs[currentIndex];
        html.setAttribute('data-gif-theme', newTheme);
        localStorage.setItem('gifIndex', currentIndex);

        gifElement.classList.add('appear');

        setTimeout(() => {
            gifElement.classList.remove('appear');

            setTimeout(() => {
                gifElement.classList.remove('no-hover');
            }, 400);

        }, 400);

    }, 400);

    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
});

// dark/light theme
(function () {
    const themeToggle = document.getElementById('themeToggle');

    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    });
})();

// Recently Added
let carouselPosition = 0;
let itemsPerPage = 3;
let isCollapsed = false;

function calculateItemsPerPage() {
    const width = window.innerWidth;
    if (width < 768) return 1;
    if (width < 1024) return 2;
    return 3;
}

function updateCarouselButtons() {
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const totalMods = recentlyAddedMods.length;

    if (prevBtn && nextBtn) {
        prevBtn.disabled = carouselPosition === 0;
        nextBtn.disabled = carouselPosition + itemsPerPage >= totalMods;

        const controls = document.querySelector('.carousel-controls');
        if (controls) {
            controls.style.display = totalMods <= itemsPerPage ? 'none' : 'flex';
        }
    }
}

function moveCarousel(direction) {
    const track = document.getElementById('carouselTrack');
    const container = document.getElementById('carouselContainer');
    const totalMods = recentlyAddedMods.length;

    carouselPosition += direction * itemsPerPage;
    carouselPosition = Math.max(0, Math.min(carouselPosition, totalMods - itemsPerPage));

    const containerWidth = container.offsetWidth;
    const gap = window.innerWidth < 768 ? 16 : 24;
    const cardWidth = (containerWidth - (gap * (itemsPerPage - 1))) / itemsPerPage;
    const offset = carouselPosition * (cardWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;
    updateCarouselButtons();

    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
}

function toggleRecentlyAdded() {
    const wrapper = document.querySelector('.carousel-wrapper');
    const collapseBtn = document.getElementById('collapseBtn');
    const categoriesTitle = document.getElementById('categoriesTitle');
    const track = document.getElementById('carouselTrack');
    const header = document.querySelector('.recently-added-header');
    const controls = document.querySelector('.carousel-controls');

    isCollapsed = !isCollapsed;

    if (isCollapsed) {
        const currentHeight = wrapper.scrollHeight;
        wrapper.style.maxHeight = currentHeight + 'px';
        requestAnimationFrame(() => {
            wrapper.classList.add('collapsed');
            wrapper.style.maxHeight = '0px';
            collapseBtn.classList.add('collapsed');
            header.classList.add('collapsed');
            controls.classList.add('collapsed');
        });
        setTimeout(() => {
            categoriesTitle.classList.add('hidden');
        }, 200);
    } else {
        categoriesTitle.classList.remove('hidden');
        const targetHeight = track.scrollHeight + 48;
        wrapper.style.maxHeight = '0px';
        requestAnimationFrame(() => {
            wrapper.classList.remove('collapsed');
            wrapper.style.maxHeight = targetHeight + 'px';
            collapseBtn.classList.remove('collapsed');
            header.classList.remove('collapsed');
            controls.classList.remove('collapsed');
        });
        setTimeout(() => {
            wrapper.style.maxHeight = '1000px';
            controls.style.maxHeight = '48px';
        }, 400);
    }

    localStorage.setItem('recentlyAddedCollapsed', isCollapsed);
    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
}

function openCategoryAndHighlightMod(categoryId, modName) {
    scrollPosition = window.pageYOffset;

    currentCategory = categoryId;
    const category = categories.find(cat => cat.id === categoryId);

    if (!category) return;

    sortMode = 'default';
    currentSortModeIndex = 0;

    const sortLabel = document.getElementById('sortLabel');
    const sortIcon = document.querySelector('#sortToggle .material-symbols-rounded');
    const sortToggle = document.getElementById('sortToggle');

    if (sortLabel) sortLabel.textContent = 'Default';
    if (sortIcon) sortIcon.textContent = 'sort';
    if (sortToggle) sortToggle.style.display = 'flex';

    categoryTitle.textContent = translations[category.key];
    categoryDescription.textContent = translations[category.key + '-desc'];

    renderMods(categoryId);

    homePage.classList.add('hidden');
    categoryPage.classList.remove('hidden');
    backButton.style.display = 'flex';

    window.scrollTo({ top: 0, behavior: 'instant' });

    setTimeout(() => {
        const targetCard = modsGrid.querySelector(
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
                requestAnimationFrame(() => {
                    targetCard.classList.add('highlighted');
                });

                if ('vibrate' in navigator) {
                    navigator.vibrate([50, 100, 50]);
                }

                setTimeout(() => {
                    requestAnimationFrame(() => {
                        targetCard.classList.remove('highlighted');
                    });
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

    if (recentlyAddedMods.length === 0) {
        section.classList.add('hidden');
        categoriesTitle.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    track.innerHTML = '';

    const savedCollapsed = localStorage.getItem('recentlyAddedCollapsed') === 'true';
    isCollapsed = savedCollapsed;

    if (isCollapsed) {
        wrapper.classList.add('collapsed');
        wrapper.style.maxHeight = '0px';
        collapseBtn.classList.add('collapsed');
        categoriesTitle.classList.add('hidden');
        document.querySelector('.recently-added-header').classList.add('collapsed');
        document.querySelector('.carousel-controls').classList.add('collapsed');
    } else {
        categoriesTitle.classList.remove('hidden');
        document.querySelector('.recently-added-header').classList.remove('collapsed');
        document.querySelector('.carousel-controls').classList.remove('collapsed');
    }

    recentlyAddedMods.forEach(recentMod => {
        const category = categories.find(cat => cat.id === recentMod.category);
        if (!category) return;

        const mods = modsData[recentMod.category] || [];
        const mod = mods.find(m => m.name === recentMod.name);

        if (mod) {
            const card = createModCard(mod, recentMod.category);
            const newCard = card.cloneNode(true);

            const addToCartBtn = newCard.querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
                addToCartBtn.remove();
            }

            const downloadIcon = newCard.querySelector('.download-icon .material-symbols-rounded');
            if (downloadIcon) {
                downloadIcon.textContent = 'expand_circle_down';
            }

            newCard.addEventListener('click', (e) => {
                if (e.target.classList.contains('link-button') ||
                    e.target.closest('.link-button')) {

                    e.stopPropagation();

                    const button = e.target.classList.contains('link-button')
                        ? e.target
                        : e.target.closest('.link-button');

                    const guideId = button.getAttribute('data-guide-id');
                    if (guideId) {
                        openGuideForMod({ guideId: guideId });
                        return;
                    }

                    const url = button.getAttribute('data-url');
                    const isVideo = button.getAttribute('data-video') === 'true';
                    if (isVideo) {
                        window.openVideoModal(url);
                    } else {
                        window.open(url, '_blank');
                    }
                    return;
                }

                openCategoryAndHighlightMod(recentMod.category, recentMod.name);

                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
            });

            track.appendChild(newCard);
        }
    });

    itemsPerPage = calculateItemsPerPage();
    carouselPosition = 0;
    updateCarouselButtons();

    prevBtn.addEventListener('click', () => moveCarousel(-1));
    nextBtn.addEventListener('click', () => moveCarousel(1));
    collapseBtn.addEventListener('click', toggleRecentlyAdded);

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newItemsPerPage = calculateItemsPerPage();
            if (newItemsPerPage !== itemsPerPage) {
                itemsPerPage = newItemsPerPage;
                carouselPosition = 0;
                track.style.transform = 'translateX(0)';
                updateCarouselButtons();
            }
        }, 250);
    });
}

function init() {
    homePage.classList.remove('hidden');
    categoryPage.classList.add('hidden');
    backButton.style.display = 'none';

    currentCategory = null;
    searchQuery = '';
    sortMode = 'default';
    currentSortModeIndex = 0;

    renderCategories();
    setupEventListeners();
    setupSearch();
    setupSortToggle();
    setupFAB();
    setupScrollToTop();
    setupGuideModal();
    setupVideoModal();
    setupRecentlyAdded()
}

function setupEventListeners() {
    backButton.addEventListener('click', showHomePage);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentCategory) {
            showHomePage();
        }
    });
}

let searchTimeout;

function setupSearch() {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchQuery = e.target.value.toLowerCase().trim();
        searchClear.style.display = searchQuery ? 'flex' : 'none';

        searchTimeout = setTimeout(() => {
            if (searchQuery) {
                currentCategory = null;
                renderAllModsSearch();
            } else {
                showHomePage();
            }
        }, 360);
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';

        showHomePage();

        searchInput.focus();
    });
}

function renderCategories() {
    categoriesGrid.innerHTML = '';
    let filteredCategories = categories;

    if (searchQuery) {
        filteredCategories = categories.filter(category =>
            translations[category.key].toLowerCase().includes(searchQuery) ||
            translations[category.key + '-desc'].toLowerCase().includes(searchQuery)
        );
    }

    if (filteredCategories.length === 0) {
        categoriesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 40px;">
                <p>No results found</p>
            </div>
        `;
        return;
    }

    filteredCategories.forEach(category => {
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
            <h3 class="card-title">${translations[category.key]}</h3>
            <p class="card-subtitle">${translations[category.key + '-desc']}</p>
        </div>
    `;

    card.addEventListener('click', () => showCategoryPage(category.id));
    return card;
}

function showCategoryPage(categoryId) {
    scrollPosition = window.pageYOffset;

    currentCategory = categoryId;
    const category = categories.find(cat => cat.id === categoryId);

    if (!category) return;

    sortMode = 'default';
    currentSortModeIndex = 0;

    const sortLabel = document.getElementById('sortLabel');
    const sortIcon = document.querySelector('#sortToggle .material-symbols-rounded');
    const sortToggle = document.getElementById('sortToggle');

    if (sortLabel) {
        sortLabel.textContent = 'Default';
    }
    if (sortIcon) {
        sortIcon.textContent = 'sort';
    }
    if (sortToggle) {
        sortToggle.style.display = 'flex';
    }

    categoryTitle.textContent = translations[category.key];
    categoryDescription.textContent = translations[category.key + '-desc'];

    renderMods(categoryId);

    homePage.classList.add('hidden');
    categoryPage.classList.remove('hidden');
    backButton.style.display = 'flex';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderMods(categoryId) {
    modsGrid.innerHTML = '';
    let mods = modsData[categoryId] || [];

    const sortToggle = document.getElementById('sortToggle');
    if (sortToggle) {
        sortToggle.style.display = 'flex';
    }

    if (searchQuery) {
        mods = mods.filter(mod =>
            mod.name.toLowerCase().includes(searchQuery)
        );
    }

    mods = sortMods(mods, sortMode);

    if (mods.length === 0) {
        const message = searchQuery
            ? 'No results found'
            : 'No mods available in this category yet.';

        modsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 40px;">
                <p>${message}</p>
            </div>
        `;
        return;
    }

    mods.forEach(mod => {
        const card = createModCard(mod, categoryId);
        modsGrid.appendChild(card);
    });

    if (typeof updateCartButtons === 'function') {
        updateCartButtons();
    }
}

function renderAllModsSearch() {
    modsGrid.innerHTML = '';
    homePage.classList.add('hidden');
    categoryPage.classList.remove('hidden');
    backButton.style.display = 'flex';

    const sortToggle = document.getElementById('sortToggle');
    if (sortToggle) {
        sortToggle.style.display = 'none';
    }

    let allResults = [];

    for (const category of categories) {
        const mods = modsData[category.id] || [];
        const filtered = mods.filter(mod =>
            mod.name.toLowerCase().includes(searchQuery)
        );
        filtered.forEach(mod => allResults.push({ mod, category }));
    }

    if (allResults.length === 0) {
        modsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 40px;">
                <p>No results found</p>
            </div>
        `;
        categoryTitle.textContent = 'Search results';
        categoryDescription.textContent = '';
        return;
    }

    if (sortMode === 'name') {
        allResults.sort((a, b) => a.mod.name.localeCompare(b.mod.name));
    } else if (sortMode === 'date') {
        allResults.reverse();
    }

    categoryTitle.textContent = 'Search results';
    categoryDescription.textContent = `Found ${allResults.length} mods`;

    allResults.forEach(({ mod, category }) => {
        const card = createModCard(mod, category.id);
        modsGrid.appendChild(card);
    });

    if (typeof updateCartButtons === 'function') {
        updateCartButtons();
    }
}

function createModCard(mod, categoryId) {
    const card = document.createElement('div');
    card.className = 'card fade-in';
    card.setAttribute('data-mod-name', mod.name);
    card.setAttribute('data-category-id', categoryId);
    const preview = mod.preview || '';
    const isVideo = preview.endsWith('.mp4');
    const mediaElement = isVideo ? 'video' : 'img';
    const mediaAttrs = isVideo ? 'autoplay muted loop playsinline' : '';

    let tagsHtml = '';

    const tagConfigs = {
        heroes: {
            allowForGuides: false,
            map: {
                effects: 'Effects',
                icons: 'Icons'
            }
        },
        backgrounds: {
            allowForGuides: false,
            map: {
                image: 'Image',
                video: 'Video',
                lowres: 'Shit Quality'
            }
        },
        sites: {
            allowForGuides: true,
            map: {
                stats: 'Stats',
                meta: 'Meta',
                fun: 'Fun'
            }
        }
    };

    const cfg = tagConfigs[categoryId];
    const canShowTags = !!cfg && mod.tags && (mod.type !== 'guide' || cfg.allowForGuides);
    if (canShowTags) {
        const activeTags = [];
        const tagMap = cfg.map || {};

        for (const key in tagMap) {
            if (Object.prototype.hasOwnProperty.call(mod.tags, key) && mod.tags[key]) {
                activeTags.push(`<span class="mod-tag">${tagMap[key]}</span>`);
            }
        }

        if (activeTags.length > 0) {
            tagsHtml = `<div class="mod-tags">${activeTags.join('')}</div>`;
        }
    }

    const linkIcons = {
        'author': 'person',
        'preview': 'play_circle',
        'source': 'captive_portal',
        'guide': 'description'
    };

    let linkButtonsHtml = '';
    const linkButtons = [];
    if (mod.links && mod.links.length > 0) {
        mod.links.forEach(link => {
            const icon = linkIcons[link.type] || 'link';
            linkButtons.push(`
                <span class="link-button" 
                      data-url="${link.url}" 
                      data-video="${link.url.endsWith('.mp4') || link.url.endsWith('.webm')}">
                    <span class="material-symbols-rounded">${icon}</span>
                    ${translations[link.type]}
                </span>
            `);
        });
    } else if (mod.linkType && mod.linkUrl) {
        const icon = linkIcons[mod.linkType] || 'link';
        linkButtons.push(`
            <span class="link-button" 
                  data-url="${mod.linkUrl}" 
                  data-video="${mod.linkUrl.endsWith('.mp4') || mod.linkUrl.endsWith('.webm')}">
                <span class="material-symbols-rounded">${icon}</span>
                ${translations[mod.linkType]}
            </span>
        `);
    }
    const hideGuideButtonCategories = ['guides'];

    if (mod.guideId && !hideGuideButtonCategories.includes(categoryId)) {
        linkButtons.push(`
        <span class="link-button guide-button" data-guide-id="${mod.guideId}">
            <span class="material-symbols-rounded">description</span>
            ${translations['guide'] || 'Guide'}
        </span>
    `);
    }
    if (linkButtons.length > 0) {
        linkButtonsHtml = `<div class="link-buttons">${linkButtons.join('')}</div>`;
    }

    const downloadIcon = mod.type === 'guide' ? 'captive_portal' : 'download';
    const subtitleText = mod.type === 'guide' ? 'Open' : translations['download'];
    let hideAddToCart = false;
    if (addToCartRules.hiddenCategories.includes(categoryId)) {
        hideAddToCart = true;
    }
    else if (addToCartRules.allowedMods[categoryId]) {
        const allowedList = addToCartRules.allowedMods[categoryId].map(name => name.toLowerCase());
        if (!allowedList.includes(mod.name.toLowerCase())) {
            hideAddToCart = true;
        }
    }
    else if (mod.type === 'guide') {
        hideAddToCart = true;
    }

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
            <h3 class="card-title">${mod.name}${mod.name.toLowerCase().includes('linux') ? " <i class='bxl bx-tux bx-sm' style='vertical-align: text-bottom;'></i>" : ''}</h3>
            <div class="card-subtitle-wrapper">
                <p class="card-subtitle">${subtitleText}</p>
                ${linkButtonsHtml}
            </div>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (e.target.classList.contains('link-button') || e.target.closest('.link-button')) {
            return;
        }
        if (mod.type === 'guide' && mod.guideId) {
            openGuideForMod({ guideId: mod.guideId });
        }
        else if (mod.type === 'guide' && !mod.guideId) {
            window.open(mod.file, '_blank');
        }
        else {
            downloadMod(mod, categoryId);
        }
    });

    const linkButtonElements = card.querySelectorAll('.link-button');
    linkButtonElements.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();

            const guideId = button.getAttribute('data-guide-id');
            if (guideId) {
                openGuideForMod({ guideId: guideId });
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

function openGuideForMod(mod) {
    if (!mod.guideId || !guidesData[mod.guideId]) {
        console.error('Guide not found:', mod.guideId);
        return;
    }

    const guideData = guidesData[mod.guideId];
    window.openGuideModal(guideData);
}

function showHomePage() {
    currentCategory = null;
    sortMode = 'default';
    currentSortModeIndex = 0;

    searchInput.value = '';
    searchQuery = '';
    searchClear.style.display = 'none';

    categoryPage.classList.add('hidden');
    homePage.classList.remove('hidden');
    backButton.style.display = 'none';

    const sortToggle = document.getElementById('sortToggle');
    if (sortToggle) {
        sortToggle.style.display = 'none';
    }
    const sortLabel = document.getElementById('sortLabel');
    const sortIcon = document.querySelector('#sortToggle .material-symbols-rounded');
    if (sortLabel) {
        sortLabel.textContent = 'Default';
    }
    if (sortIcon) {
        sortIcon.textContent = 'sort';
    }

    renderCategories();

    requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
    });
}

init()