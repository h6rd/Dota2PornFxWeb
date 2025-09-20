const translations = {
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
    'weather-desc': 'Weather Changer',
    'mega-kill': 'Mega-Kill',
    'mega-kill-desc': 'Custom mega-kill announcers',
    'guides': 'Guides',
    'guides-desc': 'Installation guides and tutorials',
    'pedestal': 'Pedestal',
    'pedestal-desc': 'Custom hero pedestals',
    'other': 'Other',
    'other-desc': 'Miscellaneous mods',
    'download': 'Download',
    'source': 'Source',
    'author': 'Author',
    'preview': 'Preview'
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
        { name: 'Purple Aghanim Shader', preview: 'purple_aghanim_shader.webp', file: 'pak48_dir.vpk' },
        { name: 'Green Aghanim Shader', preview: 'green_aghanim_shader.webp', file: 'pak60_dir.vpk' },
        { name: 'Purple Ancient Shader', preview: 'purple_ancient_shader.webp', file: 'pak47_dir.vpk' },
        { name: 'Ancient Shader', preview: 'ancient_shader.webp', file: 'pak32_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ancient_shader/' },
        { name: 'Haze Shader', preview: 'haze_shader.webp', file: 'pak40_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-haze_shader/' },
    ],
    'ti-bp-effects': [
        { name: 'TI 2019 Battle Pass', preview: 'TI 2019 Battle Pass.webp', file: 'pak09_dir.vpk', linkType: 'preview', linkUrl: 'assets/previews/ti-bp-effects/TI_2019_Battle_Pass.mp4' },
        { name: 'TI 2018 Battle Pass', preview: 'TI 2018 Battle Pass.webp', file: 'pak13_dir.vpk', linkType: 'preview', linkUrl: 'assets/previews/ti-bp-effects/TI_2018_Battle_Pass.mp4' },
        { name: 'TI 2017 Battle Pass', preview: 'TI 2017 Battle Pass.webp', file: 'pak17_dir.vpk', linkType: 'preview', linkUrl: 'assets/previews/ti-bp-effects/TI_2017_Battle_Pass.mp4' },
        { name: 'Winter 2016 Battle Pass', preview: 'Winter 2016 Battle Pass.webp', file: 'pak18_dir.vpk', linkType: 'preview', linkUrl: 'assets/previews/ti-bp-effects/Winter_2016_Battle_Pass.mp4' },
        { name: 'TI 2016 Battle Pass', preview: 'TI 2016 Battle Pass.webp', file: 'pak19_dir.vpk', linkType: 'preview', linkUrl: 'assets/previews/ti-bp-effects/TI_2016_Battle_Pass.mp4' },
        { name: 'TI 10 Battle Pass', preview: 'TI 10 Battle Pass.webp', file: 'pak24_dir.vpk', linkType: 'preview', linkUrl: 'assets/previews/ti-bp-effects/TI_10_Battle_Pass.mp4' },
        { name: 'Nemestice 2021 Battle Pass', preview: 'Nemestice 2021 Battle Pass.webp', file: 'pak27_dir.vpk', linkType: 'preview', linkUrl: 'assets/previews/ti-bp-effects/Nemestice_2021_Battle_Pass.mp4' },
        { name: 'Aghanims Labyrinth Battle Pass', preview: 'Aghanims Labyrinth Battle Pass.webp', file: 'pak39_dir.vpk', linkType: 'preview', linkUrl: 'assets/previews/ti-bp-effects/Aghanims_Labyrinth_Battle_Pass.mp4' },
        { name: 'Quarteros Curios', preview: 'Quarteros Curios.webp', file: 'pak40_dir.vpk', linkType: 'preview', linkUrl: 'assets/previews/ti-bp-effects/Quarteros_Curios.mp4' }
    ],
    'item-effects': [
        { name: 'GG Iron Branch', preview: 'gg_branch.webp', file: 'pak20_dir.vpk' },
        { name: 'Christmas Iron Branch', preview: 'christmas_branch.mp4', file: 'pak68_dir.vpk' },
        { name: 'Purple Dagon', preview: 'purple_dagon.mp4', file: 'pak41_dir.vpk' },
        { name: 'Blue Dagon', preview: 'blue_dagon.mp4', file: 'pak42_dir.vpk' },
        { name: 'Snow Dagon', preview: 'snow_dagon.mp4', file: 'pak43_dir.vpk' },
        { name: 'Green Dagon', preview: 'green_dagon.mp4', file: 'pak12_dir.vpk' },
        { name: 'White Dagon', preview: 'white_dagon.mp4', file: 'pak21_dir.vpk' },
        { name: 'Custom Runes', preview: 'сustom_runes.mp4', file: 'pak33_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_runes/' },
        { name: 'Aegis Hearts', preview: 'aegis_hearts.mp4', file: 'pak34_dir.vpk' },
        { name: 'Beer Bottle', preview: 'Beer Bottle.webp', file: 'pak26_dir.vpk' },
        { name: 'Red Bottle', preview: 'Red Bottle.mp4', file: 'pak50_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-red_bottle_effect/'},
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
        { name: 'Emblem Black Star', preview: 'Emblem Black Star.mp4', file: 'pak19_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-emblem_lsq_black_star/' },
        { name: 'Emblem Darkness', preview: 'Emblem Darkness.mp4', file: 'pak20_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-emblem_darkness/' }
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
        { name: 'Dark Terrain Minify', preview: 'Dark Terrain.webp', file: 'pak55_dir.vpk', linkType: 'source', linkUrl: 'https://github.com/Egezenn/dota2-minify' },
        { name: 'Flat Dark Terrain Minify', preview: 'Flat Dark Terrain.mp4', file: 'pak56_dir.vpk', linkType: 'source', linkUrl: 'https://github.com/Egezenn/dota2-minify' },
        { name: 'River Colors', preview: 'River Colors.mp4', file: 'Rivers.zip' }
    ],
    'trees': [
        { name: 'Pumpkin Trees', preview: 'Pumpkin Trees.webp', file: 'pak25_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-pumpkin_trees_up/' },
        { name: 'Small Trees Minify', preview: 'Small Trees.webp', file: 'pak7_dir.vpk', linkType: 'source', linkUrl: 'https://github.com/Egezenn/dota2-minify' },
        { name: 'Crystals Trees', preview: 'Crystals Trees.webp', file: 'pak22_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-blue_crystals_trees/' },
        { name: 'Wooden Trees', preview: 'Wooden Trees.webp', file: 'pak23_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-wooden_trees/' },
        { name: 'Stone Trees', preview: 'Stone Trees.webp', file: 'pak31_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-stone_forest_trees/' }
    ],
    'heroes': [
        { name: 'Alien Nyx Assassin', preview: 'Alien Nyx Assassin.webp', file: 'Alien Nyx Assassin.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-alien_nyx_assassin_megapack/' },
        { name: 'Ancients Lina', preview: 'Ancients Lina.webp', file: 'Ancients Lina.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ancients_lina/' },
        { name: 'Arc Warden Black Hole', preview: 'Arc Warden Black Hole.webp', file: 'Arc Warden Black Hole.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-black_hole_custom_arc_warden/' },
        { name: 'Arc Warden Sakura Winter', preview: 'Arc Warden Sakura Winter.webp', file: 'Arc Warden Sakura Winter.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-sakura_arc_warden/' },
        { name: 'Ashes Arc Warden', preview: 'Ashes Arc Warden.webp', file: 'Ashes Arc Warden.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ashes_arc_warden/' },
        { name: 'Axe Immortal Bootblack', preview: 'Axe Immortal Bootblack.webp', file: 'Axe Immortal Bootblack.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/' },
        { name: 'Bare Brewmaster 🥸', preview: 'Bare Brewmaster.webp', file: 'Bare Brewmaster.zip', tags: { effects: false, icons: false } },
        { name: 'Bloody Enigma', preview: 'Bloody Enigma.webp', file: 'Bloody Enigma.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-bloody_enigma/' },
        { name: 'Bloody Kez', preview: 'Bloody Kez.webp', file: 'Bloody Kez.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-bloody_kez/' },
        { name: 'Brewmaster Jousting Panda', preview: 'Brewmaster Jousting Panda.webp', file: 'Brewmaster Jousting Panda.zip', tags: { effects: false, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-brew_jousting_panda_and_donkey_kong/' },
        { name: 'Broodmother Redan', preview: 'Broodmother Redan.webp', file: 'Broodmother Redan.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-broodmother_redan_megapack/' },
        { name: 'Clinkz Silver Metall Pink', preview: 'Clinkz Silver Metall Pink.webp', file: 'Clinkz Silver Metall Pink.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-silver_metall_clinkz_pink_megapack/' },
        { name: 'Darkness Weaver', preview: 'Darkness Weaver.webp', file: 'Darkness Weaver.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-darkness_weaver_modpack/' },
        { name: 'Drow Ranger Stranger Arcana', preview: 'Drow Ranger Stranger Arcana.webp', file: 'Drow Ranger Stranger Arcana.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-stranger_in_the_wandering_isles/' },
        { name: 'Earthshaker Red Arcana', preview: 'Earthshaker Red Arcana.webp', file: 'Earthshaker Red Arcana.zip', tags: { effects: false, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-earthshaker_red_arcana/' },
        { name: 'Ghost Fiend', preview: 'Ghost Fiend.webp', file: 'Ghost Fiend.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ghost_fiend/' },
        { name: 'Ghosty Slark', preview: 'Ghosty Slark.webp', file: 'Ghosty Slark.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ghosty_slark_megapack/' },
        { name: 'GopoPudge 🥰', preview: 'GopoPudge.webp', file: 'GopoPudge.zip', tags: { effects: false, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-gopopudge/' },
        { name: 'GopoTide 🥰', preview: 'GopoTide.webp', file: 'GopoTide.zip', tags: { effects: false, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-gopotide/' },
        { name: 'Ice Phoenix', preview: 'Ice Phoenix.webp', file: 'Ice Phoenix.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ice_phoenix_v_2_0/' },
        { name: 'Ice Venomancer', preview: 'Ice Venomancer.webp', file: 'Ice Venomancer.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_ice_venomancer_megapack/' },
        { name: 'IO Pink Arcana', preview: 'IO Pink Arcana.webp', file: 'IO Pink Arcana.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_wisp_arcana_by_defiree/' },
        { name: 'IO Purple', preview: 'Purple IO.webp', file: 'IO Purple.zip', tags: { effects: true, icons: true } },
        { name: 'Kai Meepo', preview: 'Kai Meepo.webp', file: 'Kai Meepo.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-kai_meepo/' },
        { name: 'Legion Commander Crimson Black', preview: 'Legion Commander Crimson Black.webp', file: 'Legion Commander Crimson Black.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-legion_commander_custom_arcana_crimson_black_defireee/' },
        { name: 'Lion Cannonroar Confessor', preview: 'Lion Cannonroar Confessor.webp', file: 'Lion Cannonroar Confessor.zip', tags: { effects: true, icons: true } },
        { name: 'Morphling Darktrench Purple', preview: 'Morphling Darktrench Stalker Purple.webp', file: 'Morphling Darktrench Stalker Purple.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://vk.com/wall-127340251_11856' },
        { name: 'Natures Prophet Allfather', preview: 'Natures Prophet Allfather.webp', file: 'Natures Prophet Allfather.zip', tags: { effects: true, icons: true } },
        { name: 'Nightmare Chaos Knight', preview: 'Nightmare Chaos Knight.webp', file: 'Nightmare Chaos Knight.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-nightmare_chaos_knight_megapack/' },
        { name: 'Ogre Magi Custom Arcana', preview: 'Ogre Magi Custom Arcana.webp', file: 'Ogre Magi Custom Arcana.zip', tags: { effects: false, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_arcana_ogre_magi_by_defiree/' },
        { name: 'Old Storm Spirit', preview: 'Old Storm Spirit.webp', file: 'Old Storm Spirit.zip', tags: { effects: true, icons: true } },
        { name: 'Pudge Arcana Elephant', preview: 'Pudge Arcana Elephant.webp', file: 'Pudge Arcana Elephant.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_pudge_arcana_elephant/' },
        { name: 'Pudge CM', preview: 'Pudge CM.webp', file: 'Pudge CM.zip', tags: { effects: false, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-pudge-cm/' },
        { name: 'Queen of Pain Rose', preview: 'Queen of Pain Rose.webp', file: 'Queen of Pain Rose.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-pink_rose_custom_arcana_queen_of_pain/' },
        { name: 'Russian Ursa', preview: 'Russian Ursa.webp', file: 'Russian Ursa.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-russian_ursa-bear/' },
        { name: 'Scarlet Keeper', preview: 'Scarlet Keeper.webp', file: 'Scarlet Keeper.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-darkness_scarlet_keeper/' },
        { name: 'Shadow Fiend White', preview: 'Shadow Fiend White.webp', file: 'Shadow Fiend White.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/hero-tag:shadow%20fiend-list_skins_dlya_dota_2-0/#megapack' },
        { name: 'Shadow Shaman Purple', preview: 'Shadow Shaman Purple.webp', file: 'Shadow Shaman Purple.zip', tags: { effects: true, icons: false } },
        { name: 'Spectre Toxin', preview: 'Spectre Toxin.webp', file: 'Spectre Toxin.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-darkness_toxin_spectre/' },
        { name: 'Spirit Breaker Ghost Monster', preview: 'Spirit Breaker Ghost Monster.webp', file: 'Spirit Breaker Ghost Monster.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_spirit_breaker_ghost_monster/' },
        { name: 'Steel King', preview: 'Steel King.webp', file: 'Steel King.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-steel_king/' },
        { name: 'The Mawsworn Razor', preview: 'The Mawsworn Razor.webp', file: 'The Mawsworn Razor.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-the_mawsworn_razor/' },
        { name: 'Ursa White and Red', preview: 'Ursa White and Red.webp', file: 'Ursa White and Red.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ursa_sss_rank_or_white_and_red_megapack/' },
        { name: 'Warlock Puppet Bear', preview: 'Warlock Puppet Bear.webp', file: 'Warlock Puppet Bear.zip', tags: { effects: true, icons: false } },
        { name: 'Winter Ember Spirit', preview: 'Winter Ember Spirit.webp', file: 'Winter Ember Spirit.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-winter_ember_spirit/' },
        { name: 'Night Ursa', preview: 'Night Ursa.webp', file: 'Night Ursa.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-night_ursa_megapack/' },
        { name: 'Flameling Morphling', preview: 'Flameling Morphling.webp', file: 'Flameling Morphling.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-flameling_morphling_megapack/' },
        { name: 'Ghost Void Spirit', preview: 'Ghost Void Spirit.webp', file: 'Ghost Void Spirit.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ghost_void_spirit/' },
        { name: 'Anti-Mage Shadow Slayer', preview: 'Anti-Mage Shadow Slayer.webp', file: 'Anti-Mage Shadow Slayer.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-shadow_slayer/' },
        { name: 'Dawnbreaker Death Knight', preview: 'Dawnbreaker Death Knight.webp', file: 'Dawnbreaker Death Knight.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-death_knight/' },
        { name: 'Bloody Death Prophet', preview: 'Bloody Death Prophet.webp', file: 'Bloody Death Prophet.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-death_prophet_custom_modpack/' },
        { name: 'Blue Soul Huskar', preview: 'Blue Soul Huskar.webp', file: 'Blue Soul Huskar.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-blue_soul_huskar_megapack/' },
        { name: 'Bloody Lanaya', preview: 'Bloody Lanaya.webp', file: 'Bloody Lanaya.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-bloody_lanaya/' },
        { name: 'Red Abaddon', preview: 'Red Abaddon.webp', file: 'Red Abaddon.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-abaddon_red_megapack/' },
        { name: 'Void Morphling', preview: 'Void Morphling.webp', file: 'Void Morphling.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-void_morphling_by_darknessing/' },
        { name: 'Faceless Chrononaut Continuum', preview: 'Faceless Void Chrononaut Continuum.webp', file: 'Faceless Void Chrononaut Continuum.zip', tags: { effects: false, icons: false } },
        { name: 'Terrorblade Wrong Arcana', preview: 'Terrorblade Wrong Arcana.webp', file: 'Terrorblade Wrong Arcana.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/hero-tag:terrorblade-list_skins_dlya_dota_2-0/' },
        { name: 'Jakiro Himera', preview: 'Jakiro Himera.webp', file: 'Jakiro Himera.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-jakiro_himera/' },
        { name: 'Cosmic Spirit Breaker', preview: 'Cosmic Spirit Breaker.webp', file: 'Cosmic Spirit Breaker.zip', tags: { effects: false, icons: false } },
        { name: 'Cosmic Enigma', preview: 'Cosmic Enigma.webp', file: 'Cosmic Enigma.zip', tags: { effects: false, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-graviton_blackguard/' },
        { name: 'Medusa Gorgon', preview: 'Medusa Gorgon.webp', file: 'Medusa Gorgon.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-medusa_gorgon/' },
        { name: 'Ifrit Monkey King', preview: 'Ifrit Monkey King.webp', file: 'Ifrit Monkey King.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ifrit_monkey_king/' }
        // { name: '', preview: '.webp', file: '.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: '' },

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
        { name: 'Reptilian Creeps', preview: 'Reptilian _Creeps_Woodland_Siege.webp', file: 'pak65_dir.vpk' },
        { name: 'Woodland Creeps', preview: 'Woodland_Creeps_Woodland_Siege.webp', file: 'pak66_dir.vpk' },
        { name: 'Nemestice Creeps', preview: 'Nemestice_Creeps_Woodland_Siege.webp', file: 'pak67_dir.vpk' }
    ],
    'ancient': [
        { name: 'Ancient Dragon King', preview: 'Ancient Dragon King.webp', file: 'pak30_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ancient_dragon_king/' },
        { name: 'Frostivus Ancient', preview: 'Frostivus Ancient.webp', file: 'pak74_dir.vpk' }
    ],
    'tormentor': [
        { name: 'Frostivus Tormentor', preview: 'Frostivus Tormentor.webp', file: 'pak75_dir.vpk' }
    ],
    'towers': [
        { name: 'Holiday Radiant Tower', preview: 'Holiday Radiant Tower.webp', file: 'pak81_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-holiday_radiant_tower/' }
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
        { name: 'Weather Changer [18.09]', preview: 'Weather Changer.webp', file: 'Weather Changer.zip' }
    ],
    'mega-kill': [
        { name: 'Nedotrax Mega-Kill', preview: 'Nedotrax Mega-Kill.webp', file: 'pak39_dir.vpk' },
        { name: 'Siega Mega-Kill', preview: 'Siega Mega-Kill.webp', file: 'pak46_dir.vpk', linkType: 'source', linkUrl: 'https://github.com/SsixM/Dotafy-mods/tree/master/mods/!%20Golovach%20killstreak/files/sounds/vo/announcer_killing_spree' }
    ],
    'pedestal': [
        { name: 'Drow Ranger Pedestal', preview: 'Drow Ranger Pedestal.webp', file: 'pak78_dir.vpk' },
        { name: 'Earthshaker Pedestal', preview: 'Earthshaker Pedestal.webp', file: 'pak79_dir.vpk' },
        { name: 'Windranger Pedestal', preview: 'Windranger Pedestal.webp', file: 'pak80_dir.vpk' },
        { name: 'Snow Pedestal', preview: 'Snow Pedestal.webp', file: 'pak16_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-snow_pedestal/' }
    ],
    'other': [
        { name: 'Profile Graffiti & Phrases', preview: 'Profile Graffiti & Phrases.webp', file: 'pak44_dir.vpk', linkType: 'author', linkUrl: 'https://steamcommunity.com/profiles/76561199145739904' },
        { name: 'Rage Voice Icon', preview: 'Rage Voice Icon.webp', file: 'pak53_dir.vpk' },
        { name: 'Showcase Rotation', preview: 'Showcase Rotation.mp4', file: 'pak36_dir.vpk' },
        { name: 'Background Changer [16.09]', preview: 'Background Changer.webp', file: 'Background Changer.zip' }
    ]
};

let currentCategory = null;

const homePage = document.getElementById('homePage');
const categoryPage = document.getElementById('categoryPage');
const categoriesGrid = document.getElementById('categoriesGrid');
const modsGrid = document.getElementById('modsGrid');
const categoryTitle = document.getElementById('categoryTitle');
const categoryDescription = document.getElementById('categoryDescription');
const backButton = document.getElementById('backButton');

function init() {
    renderCategories();
    setupEventListeners();
}

function setupEventListeners() {
    backButton.addEventListener('click', showHomePage);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentCategory) {
            showHomePage();
        }
    });
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
                        <h3 class="card-title">${translations[category.key]}</h3>
                        <p class="card-subtitle">${translations[category.key + '-desc']}</p>
                    </div>
                `;

    card.addEventListener('click', () => showCategoryPage(category.id));
    return card;
}

function showCategoryPage(categoryId) {
    currentCategory = categoryId;
    const category = categories.find(cat => cat.id === categoryId);

    if (!category) return;

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

    let subtitleText, subtitleClass;
    if (mod.type === 'guide') {
        subtitleText = 'Open Guide';
        subtitleClass = 'card-subtitle';
    } else if (mod.linkType && mod.linkUrl) {
        subtitleText = translations[mod.linkType];
        subtitleClass = 'card-subtitle card-link';
    } else {
        subtitleText = translations['download'];
        subtitleClass = 'card-subtitle';
    }

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
                <p class="${subtitleClass}">${subtitleText}</p>
            </div>
        `;

    card.addEventListener('click', (e) => {
        if (e.target.classList.contains('card-link')) {
            return;
        }

        if (mod.type === 'guide') {
            window.open(mod.file, '_blank');
        } else {
            downloadMod(mod, categoryId);
        }
    });

    if (mod.linkType && mod.linkUrl) {
        const linkElement = card.querySelector('.card-link');
        linkElement.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(mod.linkUrl, '_blank');
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

function showHomePage() {
    currentCategory = null;
    categoryPage.classList.add('hidden');
    homePage.classList.remove('hidden');
    backButton.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

init();