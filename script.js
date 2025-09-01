const translations = {
    en: {
        'main-title': 'Dota 2 Mods',
        'main-description': 'Discover and download mods for Dota 2',
        'back': 'Back',
        'download': 'Download',
        'shaders': 'Shaders',
        'shaders-desc': 'Replaces the fog of war effect',
        'ti-bp-effects': 'TI/BP Effects',
        'ti-bp-effects-desc': 'Battle Pass and The International effects',
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
        'weather-desc': 'Weather Changer [Last Update: 29.08]',
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
        'main-title': 'Dota 2 Mods',
        'main-description': 'Discover and download mods for Dota 2',
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
    { id: 'shaders', emoji: '🎨', key: 'shaders', preview: 'shaders.webp' },
    { id: 'ti-bp-effects', emoji: '🌟', key: 'ti-bp-effects', preview: 'ti-bp-effects.webp' },
    { id: 'item-effects', emoji: '✨', key: 'item-effects', preview: 'item-effects.webp' },
    { id: 'creep-deny', emoji: '🎯', key: 'creep-deny', preview: 'creep-deny.webp' },
    { id: 'emblems', emoji: '🏵', key: 'emblems', preview: 'emblems.webp' },
    { id: 'versus-screens', emoji: '🆚', key: 'versus-screens', preview: 'vs.webp' },
    { id: 'terrains', emoji: '🏞️', key: 'terrains', preview: 'terrains.webp' },
    { id: 'trees', emoji: '🌲', key: 'trees', preview: 'trees.webp' },
    { id: 'heroes', emoji: '👤', key: 'heroes', preview: 'heroes.webp' },
    { id: 'roshan', emoji: '🦖', key: 'roshan', preview: 'roshan.webp' },
    { id: 'creeps', emoji: '🕷', key: 'creeps', preview: 'creeps.webp' },
    { id: 'ancient', emoji: '🗻', key: 'ancient', preview: 'ancient.webp' },
    { id: 'tormentor', emoji: '🎈', key: 'tormentor', preview: 'tormentor.webp' },
    { id: 'towers', emoji: '🗼', key: 'towers', preview: 'towers.webp' },
    { id: 'high-five', emoji: '👋', key: 'high-five', preview: 'high-five.webp' },
    { id: 'packs', emoji: '📦', key: 'packs', preview: 'packs.webp' },
    { id: 'ranged-attack', emoji: '🏹', key: 'ranged-attack', preview: 'ranged-attack.webp' },
    { id: 'weather', emoji: '🌦️', key: 'weather', preview: 'weather.webp' },
    { id: 'mega-kill', emoji: '🔊', key: 'mega-kill', preview: 'mega-kill.webp' },
    { id: 'pedestal', emoji: '🗿', key: 'pedestal', preview: 'pedestal.webp' },
    { id: 'other', emoji: '⚙️', key: 'other', preview: 'other.webp' }
    // { id: 'guides', emoji: '📖', key: 'guides', preview: null }
];

const modsData = {
    'shaders': [
        { name: 'Aghanim Labyrinth Shader', preview: 'aghanim_shader.webp', file: 'pak07_dir.vpk' },
        { name: 'Diretide Shader', preview: 'diretide_shader.webp', file: 'pak10_dir.vpk' },
        { name: 'Ancient Shader', preview: 'ancient_shader.webp', file: 'pak32_dir.vpk' },
        { name: 'Haze Shader', preview: 'haze_shader.mp4', file: 'pak40_dir.vpk' },
        { name: 'Purple Ancient Shader', preview: 'purple_ancient_shader.webp', file: 'pak47_dir.vpk' },
        { name: 'Purple Aghanim Shader', preview: 'purple_aghanim_shader.webp', file: 'pak48_dir.vpk' },
        { name: 'Green Aghanim Shader', preview: 'green_aghanim_shader.webp', file: 'pak60_dir.vpk' }
    ],
    'ti-bp-effects': [
        { name: 'The International 2019 Effects', preview: 'ti19.webp', file: 'pak09_dir.vpk' },
        { name: 'The International 2018 Effects', preview: 'ti18.webp', file: 'pak13_dir.vpk' },
        { name: 'The International 2017 Effects', preview: 'ti17.webp', file: 'pak17_dir.vpk' },
        { name: 'Winter 2016 BP Effects', preview: 'winter2016.webp', file: 'pak18_dir.vpk' },
        { name: 'The International 2016 Effects', preview: 'ti16.webp', file: 'pak19_dir.vpk' },
        { name: 'The International 2021 Effects', preview: 'ti10.webp', file: 'pak24_dir.vpk' },
        { name: 'Nemestice 2021 BP Effects', preview: 'bp21.webp', file: 'pak27_dir.vpk' },
        { name: 'Aghanims BP Effects', preview: 'Aghanims BP.webp', file: 'pak39_dir.vpk' },
        { name: 'Quartero Effects', preview: 'Quartero.webp', file: 'pak40_dir.vpk' }
    ],
    'item-effects': [
        { name: 'GG Iron Branch', preview: 'gg_branch.webp', file: 'pak20_dir.vpk' },
        { name: 'Christmas Iron Branch', preview: 'christmas_branch.mp4', file: 'pak68_dir.vpk' },
        { name: 'Purple Dagon', preview: 'purple_dagon.mp4', file: 'pak41_dir.vpk' },
        { name: 'Blue Dagon', preview: 'blue_dagon.mp4', file: 'pak42_dir.vpk' },
        { name: 'Snow Dagon', preview: 'snow_dagon.mp4', file: 'pak43_dir.vpk' },
        { name: 'Green Dagon', preview: 'green_dagon.mp4', file: 'pak12_dir.vpk' },
        { name: 'White Dagon', preview: 'white_dagon.mp4', file: 'pak21_dir.vpk' },
        { name: 'Custom Runes', preview: 'сustom_runes.mp4', file: 'pak33_dir.vpk' },
        { name: 'Aegis Hearts', preview: 'aegis_hearts.mp4', file: 'pak34_dir.vpk' },
        { name: 'Beer Bottle', preview: 'Beer Bottle.webp', file: 'pak26_dir.vpk' },
        { name: 'Red Bottle', preview: 'Red Bottle.mp4', file: 'pak50_dir.vpk' },
        { name: 'White Ethereal', preview: 'White Ethereal.mp4', file: 'pak49_dir.vpk' }
    ],
    'creep-deny': [
        { name: 'Deny ?', preview: 'deny_huh.webp', file: 'pak08_dir.vpk' },
        { name: 'Soul Deny', preview: 'soul_deny.mp4', file: 'pak11_dir.vpk' },
        { name: 'Fuck Deny', preview: 'fuck_deny.webp', file: 'pak12_dir.vpk' },
        { name: 'Deny Fall 2022', preview: 'deny_fall_2022.mp4', file: 'pak21_dir.vpk' },
        { name: 'Deny Spring', preview: 'deny_spring.mp4', file: 'pak22_dir.vpk' },
        { name: 'Deny Fall 2021', preview: 'deny_fall_2021.mp4', file: 'pak23_dir.vpk' },
        { name: 'lasthit Golden Shards', preview: 'lasthit_golden_shards.mp4', file: 'pak35_dir.vpk' }
    ],
    'emblems': [
        { name: 'Emblem of the Diretide Green', preview: 'Emblem of the Diretide Green.webp', file: 'pak28_dir.vpk' },
        { name: 'Emblem of the Diretide Blue', preview: 'Emblem of the Diretide Blue.webp', file: 'pak29_dir.vpk' },
        { name: 'Emblem of the Diretide Yellow', preview: 'Emblem of the Diretide Yellow.webp', file: 'pak30_dir.vpk' },
        { name: 'Emblem of the Diretide Red', preview: 'Emblem of the Diretide Red.webp', file: 'pak31_dir.vpk' },
        { name: 'Battle Pass 2022 Emblem', preview: 'Battle Pass 2022 Emblem.mp4', file: 'pak32_dir.vpk' },
        { name: 'Emblem of the Crystal Echelon', preview: 'Emblem of the Crystal Echelon.mp4', file: 'pak33_dir.vpk' },
        { name: 'Emblem of Divinity', preview: 'Emblem of Divinity.mp4', file: 'pak34_dir.vpk' },
        { name: 'Nemestice Emblem', preview: 'Nemestice Emblem.mp4', file: 'pak35_dir.vpk' },
        { name: 'Overgrown Emblem', preview: 'Overgrown Emblem.mp4', file: 'pak36_dir.vpk' },
        { name: 'Aghanims Emblem', preview: 'Aghanims Emblem.webp', file: 'pak37_dir.vpk' },
        { name: 'Sunken Emblem', preview: 'Sunken Emblem.mp4', file: 'pak38_dir.vpk' },
        { name: 'Emblem Black Star', preview: 'Emblem Black Star.mp4', file: 'pak19_dir.vpk' },
        { name: 'Emblem Darkness', preview: 'Emblem Darkness.mp4', file: 'pak20_dir.vpk' }
    ],
    'versus-screens': [
        { name: 'Winter Versus Screen', preview: 'Winter Versus Screen.webp', file: 'pak45_dir.vpk' },
        { name: 'TI9 Versus Screen I', preview: 'TI9 Versus Screen I.webp', file: 'pak46_dir.vpk' },
        { name: 'TI9 Versus Screen II', preview: 'TI9 Versus Screen II.webp', file: 'pak47_dir.vpk' },
        { name: 'Nemestice Versus Screen', preview: 'Nemestice Versus Screen.webp', file: 'pak48_dir.vpk' },
        { name: 'TI 2024 Versus Screen', preview: 'TI 2024 Versus Screen.webp', file: 'pak69_dir.vpk' },
        { name: 'Muerta Radiant Versus Screen', preview: 'Muerta Radiant Versus Screen.webp', file: 'pak70_dir.vpk' },
        { name: 'Muerta Dire Versus Screen', preview: 'Muerta Dire Versus Screen.webp', file: 'pak71_dir.vpk' },
        { name: 'Diretide Radiant Versus Screen', preview: 'Diretide Radiant Versus Screen.webp', file: 'pak72_dir.vpk' },
        { name: 'Diretide Dire Versus Screen', preview: 'Diretide Dire Versus Screen.webp', file: 'pak73_dir.vpk' }
    ],
    'terrains': [
        { name: 'TI5 Desert Terrain', preview: 'TI5 Desert Terrain.webp', file: 'TI5 Desert Terrain.zip' },
        { name: 'TI6 Immortal Gardens', preview: 'TI6 Immortal Gardens.webp', file: 'TI6 Immortal Gardens.zip' },
        { name: 'TI7 Reefs Edge', preview: 'TI7 Reefs Edge.webp', file: 'TI7 Reefs Edge.zip' },
        { name: 'TI8 Emerald Abyss', preview: 'TI8 Emerald Abyss.webp', file: 'TI8 Emerald Abyss.zip' },
        { name: 'TI9 Overgrown Empire', preview: 'TI9 Overgrown Empire.webp', file: 'TI9 Overgrown Empire.zip' },
        { name: 'TI10 Sanctum of the Divine', preview: 'TI10 Sanctum of the Divine.webp', file: 'TI10 Sanctum of the Divine.zip' },
        { name: 'The Kings New Journey', preview: 'The Kings New Journey.webp', file: 'The Kings New Journey.zip' },
        { name: 'Winter', preview: 'Winter.webp', file: 'Winter.zip' },
        { name: 'Spring', preview: 'Spring.webp', file: 'Spring.zip' },
        { name: 'Summer', preview: 'Summer.webp', file: 'Summer.zip' },
        { name: 'Autumn', preview: 'Autumn.webp', file: 'Autumn.zip' },
        { name: 'Crownfall', preview: 'Crownfall.webp', file: 'Crownfall.zip' },
        { name: 'Dark Terrain Minify', preview: 'Dark Terrain.webp', file: 'pak55_dir.vpk' },
        { name: 'Flat Dark Terrain Minify', preview: 'Flat Dark Terrain.mp4', file: 'pak56_dir.vpk' },
        { name: 'River Colors', preview: 'River Colors.mp4', file: 'Rivers.zip' }
    ],
    'trees': [
        { name: 'Pumpkin Trees', preview: 'Pumpkin Trees.webp', file: 'pak25_dir.vpk' },
        { name: 'Small Trees Minify', preview: 'Small Trees.webp', file: 'pak7_dir.vpk' },
        { name: 'Crystals Trees', preview: 'Crystals Trees.webp', file: 'pak22_dir.vpk' },
        { name: 'Wooden Trees', preview: 'Wooden Trees.webp', file: 'pak23_dir.vpk' },
        { name: 'Stone Trees', preview: 'Stone Trees.webp', file: 'pak31_dir.vpk' }
    ],
    'heroes': [
        { name: 'Alien Nyx Assassin', preview: 'Alien Nyx Assassin.webp', file: 'Alien Nyx Assassin.zip', tags: { effects: true, icons: true } },
        { name: 'Ancients Lina', preview: 'Ancients Lina.webp', file: 'Ancients Lina.zip', tags: { effects: true, icons: true } },
        { name: 'Arc Warden Black Hole', preview: 'Arc Warden Black Hole.webp', file: 'Arc Warden Black Hole.zip', tags: { effects: true, icons: true } },
        { name: 'Arc Warden Sakura Winter', preview: 'Arc Warden Sakura Winter.webp', file: 'Arc Warden Sakura Winter.zip', tags: { effects: true, icons: true } },
        { name: 'Ashes Arc Warden', preview: 'Ashes Arc Warden.webp', file: 'Ashes Arc Warden.zip', tags: { effects: true, icons: true } },
        { name: 'Axe Immortal Bootblack', preview: 'Axe Immortal Bootblack.webp', file: 'Axe Immortal Bootblack.zip', tags: { effects: true, icons: false } },
        { name: 'Bare Brewmaster 🥸', preview: 'Bare Brewmaster.webp', file: 'Bare Brewmaster.zip', tags: { effects: false, icons: false } },
        { name: 'Bloody Enigma', preview: 'Bloody Enigma.webp', file: 'Bloody Enigma.zip', tags: { effects: true, icons: true } },
        { name: 'Bloody Kez', preview: 'Bloody Kez.webp', file: 'Bloody Kez.zip', tags: { effects: true, icons: false } },
        { name: 'Brewmaster Jousting Panda', preview: 'Brewmaster Jousting Panda.webp', file: 'Brewmaster Jousting Panda.zip', tags: { effects: false, icons: false } },
        { name: 'Broodmother Redan', preview: 'Broodmother Redan.webp', file: 'Broodmother Redan.zip', tags: { effects: true, icons: true } },
        { name: 'Clinkz Silver Metall Pink', preview: 'Clinkz Silver Metall Pink.webp', file: 'Clinkz Silver Metall Pink.zip', tags: { effects: true, icons: true } },
        { name: 'Darkness Weaver', preview: 'Darkness Weaver.webp', file: 'Darkness Weaver.zip', tags: { effects: true, icons: true } },
        { name: 'Drow Ranger Stranger Arcana', preview: 'Drow Ranger Stranger Arcana.webp', file: 'Drow Ranger Stranger Arcana.zip', tags: { effects: true, icons: false } },
        { name: 'Earthshaker Red Arcana', preview: 'Earthshaker Red Arcana.webp', file: 'Earthshaker Red Arcana.zip', tags: { effects: false, icons: true } },
        { name: 'Ghost Fiend', preview: 'Ghost Fiend.webp', file: 'Ghost Fiend.zip', tags: { effects: true, icons: true } },
        { name: 'Ghosty Slark', preview: 'Ghosty Slark.webp', file: 'Ghosty Slark.zip', tags: { effects: true, icons: true } },
        { name: 'GopoPudge 🥰', preview: 'GopoPudge.webp', file: 'GopoPudge.zip', tags: { effects: false, icons: false } },
        { name: 'GopoTide 🥰', preview: 'GopoTide.webp', file: 'GopoTide.zip', tags: { effects: false, icons: true } },
        { name: 'Ice Phoenix', preview: 'Ice Phoenix.webp', file: 'Ice Phoenix.zip', tags: { effects: true, icons: true } },
        { name: 'Ice Venomancer', preview: 'Ice Venomancer.webp', file: 'Ice Venomancer.zip', tags: { effects: true, icons: true } },
        { name: 'IO Pink Arcana', preview: 'IO Pink Arcana.webp', file: 'IO Pink Arcana.zip', tags: { effects: true, icons: true } },
        { name: 'IO Purple', preview: 'Purple IO.webp', file: 'IO Purple.zip', tags: { effects: true, icons: true } },
        { name: 'Kai Meepo', preview: 'Kai Meepo.webp', file: 'Kai Meepo.zip', tags: { effects: true, icons: true } },
        { name: 'Legion Commander Crimson Black', preview: 'Legion Commander Crimson Black.webp', file: 'Legion Commander Crimson Black.zip', tags: { effects: true, icons: true } },
        { name: 'Lion Cannonroar Confessor', preview: 'Lion Cannonroar Confessor.webp', file: 'Lion Cannonroar Confessor.zip', tags: { effects: true, icons: true } },
        { name: 'Lion Dark Magician Girl', preview: 'Lion Dark Magician Girl.webp', file: 'Lion Dark Magician Girl.zip', tags: { effects: true, icons: true } },
        { name: 'Morphling Darktrench Stalker Purple', preview: 'Morphling Darktrench Stalker Purple.webp', file: 'Morphling Darktrench Stalker Purple.zip', tags: { effects: true, icons: true } },
        { name: 'Natures Prophet Allfather', preview: 'Natures Prophet Allfather.webp', file: 'Natures Prophet Allfather.zip', tags: { effects: true, icons: true } },
        { name: 'Nightmare Chaos Knight', preview: 'Nightmare Chaos Knight.webp', file: 'Nightmare Chaos Knight.zip', tags: { effects: true, icons: true } },
        { name: 'Ogre Magi Custom Arcana', preview: 'Ogre Magi Custom Arcana.webp', file: 'Ogre Magi Custom Arcana.zip', tags: { effects: false, icons: false } },
        { name: 'Old Storm Spirit', preview: 'Old Storm Spirit.webp', file: 'Old Storm Spirit.zip', tags: { effects: true, icons: true } },
        { name: 'Pudge Arcana Elephant', preview: 'Pudge Arcana Elephant.webp', file: 'Pudge Arcana Elephant.zip', tags: { effects: true, icons: false } },
        { name: 'Pudge CM', preview: 'Pudge CM.webp', file: 'Pudge CM.zip', tags: { effects: false, icons: false } },
        { name: 'Queen of Pain Rose', preview: 'Queen of Pain Rose.webp', file: 'Queen of Pain Rose.zip', tags: { effects: true, icons: true } },
        { name: 'Russian Ursa', preview: 'Russian Ursa.webp', file: 'Russian Ursa.zip', tags: { effects: true, icons: true } },
        { name: 'Scarlet Keeper', preview: 'Scarlet Keeper.webp', file: 'Scarlet Keeper.zip', tags: { effects: true, icons: true } },
        { name: 'Shadow Fiend White', preview: 'Shadow Fiend White.webp', file: 'Shadow Fiend White.zip', tags: { effects: true, icons: true } },
        { name: 'Shadow Shaman Purple', preview: 'Shadow Shaman Purple.webp', file: 'Shadow Shaman Purple.zip', tags: { effects: true, icons: false } },
        { name: 'Spectre Toxin', preview: 'Spectre Toxin.webp', file: 'Spectre Toxin.zip', tags: { effects: true, icons: true } },
        { name: 'Spirit Breaker Ghost Monster', preview: 'Spirit Breaker Ghost Monster.webp', file: 'Spirit Breaker Ghost Monster.zip', tags: { effects: true, icons: true } },
        { name: 'Steel King', preview: 'Steel King.webp', file: 'Steel King.zip', tags: { effects: true, icons: true } },
        { name: 'The Mawsworn Razor', preview: 'The Mawsworn Razor.webp', file: 'The Mawsworn Razor.zip', tags: { effects: true, icons: false } },
        { name: 'Ursa White and Red', preview: 'Ursa White and Red.webp', file: 'Ursa White and Red.zip', tags: { effects: true, icons: true } },
        { name: 'Warlock Puppet Bear', preview: 'Warlock Puppet Bear.webp', file: 'Warlock Puppet Bear.zip', tags: { effects: true, icons: false } },
        { name: 'Winter Ember Spirit', preview: 'Winter Ember Spirit.webp', file: 'Winter Ember Spirit.zip', tags: { effects: true, icons: true } },
        { name: 'Night Ursa', preview: 'Night Ursa.webp', file: 'Night Ursa.zip', tags: { effects: true, icons: true } },
        { name: 'Flameling Morphling', preview: 'Flameling Morphling.webp', file: 'Flameling Morphling.zip', tags: { effects: true, icons: true } },
        { name: 'Ghost Void Spirit', preview: 'Ghost Void Spirit.webp', file: 'Ghost Void Spirit.zip', tags: { effects: true, icons: true } }

    ],
    'roshan': [
        { name: 'Aghanims Roshan', preview: 'Aghanims Roshan.webp', file: 'pak52_dir.vpk' },
        { name: 'Greevil Grief Roshan', preview: 'Greevil Grief Roshan.webp', file: 'pak58_dir.vpk' },
        { name: 'Winter Roshan', preview: 'Winter Roshan.webp', file: 'pak59_dir.vpk' },
        { name: 'Desert Roshan', preview: 'Desert Roshan.webp', file: 'pak60_dir.vpk' },
        { name: 'Gardens Roshan', preview: 'Gardens Roshan.webp', file: 'pak61_dir.vpk' },
        { name: 'Golden Roshan', preview: 'Golden Roshan.webp', file: 'pak62_dir.vpk' },
        { name: 'Journey Roshan', preview: 'Journey Roshan.webp', file: 'pak63_dir.vpk' },
        { name: 'Reef Roshan', preview: 'Reef Roshan.webp', file: 'pak64_dir.vpk' }
    ],
    'creeps': [
        { name: 'Reptilian Creeps + Woodland Siege', preview: 'Reptilian _Creeps_Woodland_Siege.webp', file: 'pak65_dir.vpk' },
        { name: 'Woodland Creeps + Woodland Siege', preview: 'Woodland_Creeps_Woodland_Siege.webp', file: 'pak66_dir.vpk' },
        { name: 'Nemestice Creeps + Woodland Siege', preview: 'Nemestice_Creeps_Woodland_Siege.webp', file: 'pak67_dir.vpk' }
    ],
    'ancient': [
        { name: 'Ancient Dragon King', preview: 'Ancient Dragon King.webp', file: 'pak30_dir.vpk' },
        { name: 'Frostivus Ancient', preview: 'Frostivus Ancient.webp', file: 'pak74_dir.vpk' }
    ],
    'tormentor': [
        { name: 'Frostivus Tormentor', preview: 'Frostivus Tormentor.webp', file: 'pak75_dir.vpk' }
    ],
    'towers': [
        { name: 'Holiday Radiant Tower', preview: 'Holiday Radiant Tower.webp', file: 'pak81_dir.vpk' }
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
        { name: 'Weather Changer', preview: 'Weather Changer.webp', file: 'Weather Changer.zip' }
    ],
    'mega-kill': [
        { name: 'Nedotrax Mega-Kill', preview: 'Nedotrax Mega-Kill.webp', file: 'pak39_dir.vpk' },
        { name: 'Siega Mega-Kill', preview: 'Siega Mega-Kill.webp', file: 'pak46_dir.vpk' }
    ],
    'pedestal': [
        { name: 'Drow Ranger Pedestal', preview: 'Drow Ranger Pedestal.webp', file: 'pak78_dir.vpk' },
        { name: 'Earthshaker Pedestal', preview: 'Earthshaker Pedestal.webp', file: 'pak79_dir.vpk' },
        { name: 'Windranger Pedestal', preview: 'Windranger Pedestal.webp', file: 'pak80_dir.vpk' },
        { name: 'Snow Pedestal', preview: 'Snow Pedestal.webp', file: 'pak16_dir.vpk' }
    ],
    'other': [
        { name: 'Profile Graffiti & Phrases', preview: 'Profile Graffiti & Phrases.webp', file: 'pak44_dir.vpk' },
        { name: 'Rage Voice Icon', preview: 'Rage Voice Icon.webp', file: 'pak53_dir.vpk' },
        { name: 'Showcase Rotation', preview: 'Showcase Rotation.mp4', file: 'pak36_dir.vpk' },
        { name: 'Background Changer', preview: 'Background Changer.webp', file: 'Background Changer [7.39d].zip' }
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
    const mediaElement = isVideo ? 'video' : 'img';
    const mediaAttrs = isVideo ? 'autoplay muted loop playsinline' : '';

    let tagsHtml = '';
    if (categoryId === 'heroes' && mod.tags && mod.type !== 'guide') {
        const activeTags = [];

        if (mod.tags.effects) {
            activeTags.push('<span class="mod-tag">Effects</span>');
        }

        if (mod.tags.icons) {
            activeTags.push('<span class="mod-tag">Icons</span>');
        }

        if (activeTags.length > 0) {
            tagsHtml = `<div class="mod-tags">${activeTags.join('')}</div>`;
        }
    }

    const iconSvg = mod.type === 'guide'
        ? '<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />'
        : '<path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />';

    const subtitle = mod.type === 'guide'
        ? (currentLanguage === 'ru' ? 'Открыть гайд' : 'Open Guide')
        : translations[currentLanguage]['download'];

    card.innerHTML = `
        <div class="card-media">
            <${mediaElement} src="assets/previews/${categoryId}/${mod.preview}" ${mediaAttrs} onerror="this.parentElement.innerHTML='<span style=\\'font-size: 48px; opacity: 0.5;\\'>📖</span>'"></${mediaElement}>
            ${tagsHtml}
            <div class="download-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    ${iconSvg}
                </svg>
            </div>
        </div>
        <div class="card-content">
            <h3 class="card-title">${mod.name}</h3>
            <p class="card-subtitle">${subtitle}</p>
        </div>
    `;

    card.addEventListener('click', () => {
        if (mod.type === 'guide') {
            window.open(mod.file, '_blank');
        } else {
            downloadMod(mod, categoryId);
        }
    });

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