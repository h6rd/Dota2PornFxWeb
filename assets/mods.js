const recentlyAddedMods = [
    { name: 'Night Stalker Feasts of Forever', category: 'heroes' },
    { name: 'Tinker Deathsman', category: 'heroes' },
    { name: 'Snapfire Whippersnapper', category: 'heroes' },
    { name: 'Bedrock', category: 'terrains' },
    { name: 'Kunkka & Tidehunter', category: 'announcers' },
    { name: 'Emerald Shadow Fiend', category: 'heroes' },
    { name: 'Diretide Dire Creeps', category: 'creeps' },
    { name: 'Diretide Radiant Creeps', category: 'creeps' },
    { name: 'Crownfall Dire Creeps', category: 'creeps' },
    { name: 'Crownfall Radiant Creeps', category: 'creeps' },
    { name: 'Crownfall Dire Siege', category: 'creeps' },
    { name: 'Crownfall Radiant Siege', category: 'creeps' },
    { name: 'Palico Odogaron', category: 'couriers' },
    { name: 'Portal', category: 'wards' },
    { name: 'Monty', category: 'wards' },
    { name: 'Trailgazer', category: 'wards' },
    { name: 'Chen Infernal Psychic', category: 'heroes' },
    { name: 'Lycan Red Wolf Clan', category: 'heroes' },
    { name: 'Billy Bounceback', category: 'couriers' },
    { name: 'Baby Roshan Crownfall', category: 'couriers' },
    { name: 'Waldi the Faithful', category: 'couriers' },
    { name: 'Floes Tower', category: 'wards' },
    { name: 'Curious Snaptrap', category: 'wards' },
    { name: 'Tinker Submerged Hazard', category: 'heroes' },
    { name: 'Sniper Odogaron Armor', category: 'heroes' },
    { name: 'Broodmother Undermount Gloom', category: 'heroes' },
    { name: 'Juggernaut Samurai of Wind', category: 'heroes' },
    { name: 'Cosmic Tinker', category: 'heroes' },
    { name: 'Dawnbreaker Moonbreaker', category: 'heroes' },
    { name: 'Viper Butch Dog', category: 'heroes' },
    { name: 'Windranger Autumn Arcana', category: 'heroes' },
    { name: 'Primal Beast Snowbeast', category: 'heroes' },
    { name: 'Morphling Megalodon', category: 'heroes' },
    { name: 'Kakehashi Subaru', category: 'backgrounds' },
    { name: 'Blossom Rem', category: 'backgrounds' },
    { name: 'Cyrene Song', category: 'backgrounds' },
    { name: 'Batrider Night Snotty', category: 'heroes' },
    { name: 'Snowfall In Forest', category: 'backgrounds' },
];

const modsData = {
    'shaders': [
        { name: 'Aghanim Labyrinth Shader', preview: 'aghanim_shader.webp', file: 'pak07_dir.vpk' },
        { name: 'Aghanim Peach Shader', preview: 'Aghanim Peach Shader.webp', file: 'pak78_dir.vpk' },
        { name: 'Aghanim Red Shader', preview: 'Aghanim Red Shader.webp', file: 'pak79_dir.vpk' },
        { name: 'Aghanim White Shader', preview: 'Aghanim White Shader.webp', file: 'pak80_dir.vpk' },
        { name: 'Aghanim Purple Shader', preview: 'Aghanim Purple Shader.webp', file: 'pak48_dir.vpk' },
        { name: 'Aghanim Green Shader', preview: 'Aghanim Green Shader.webp', file: 'pak60_dir.vpk' },
        { name: 'Wave Green Shader', preview: 'Wave Green Shader.webp', file: 'pak81_dir.vpk' },
        { name: 'Wave Peach Shader', preview: 'Wave Peach Shader.webp', file: 'pak82_dir.vpk' },
        { name: 'Wave Purple Shader', preview: 'Wave Purple Shader.webp', file: 'pak83_dir.vpk' },
        { name: 'Wave Red Shader', preview: 'Wave Red Shader.webp', file: 'pak84_dir.vpk' },
        { name: 'Wave White Shader', preview: 'Wave White Shader.webp', file: 'pak85_dir.vpk' },
        { name: 'Diretide Shader (outline)', preview: 'diretide_shader.webp', file: 'pak10_dir.vpk' },
        { name: 'Haze Shader', preview: 'haze_shader.webp', file: 'pak40_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-haze_shader/' },
        { name: 'Ancient Shader', preview: 'ancient_shader.webp', file: 'pak32_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ancient_shader/' },
        { name: 'Purple Ancient Shader', preview: 'purple_ancient_shader.webp', file: 'pak47_dir.vpk' }
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
        { name: 'Quarteros Curios', preview: 'Quarteros Curios.webp', file: 'pak40_dir.vpk', linkType: 'preview', linkUrl: 'assets/previews/ti-bp-effects/Quarteros_Curios.mp4' },
        { name: 'Purple Quarteros Curios', preview: 'Purple Quarteros Curios.webp', file: 'pak97_dir.vpk', linkType: 'preview', linkUrl: 'assets/previews/ti-bp-effects/Purple_Quarteros_Curios.mp4' },
        { name: 'Darkness Pack', preview: 'Darkness Pack.webp', file: 'pak10_dir.vpk', links: [{ type: 'author', url: 'https://t.me/Darkness_Logovo' }, { type: 'preview', url: 'assets/previews/ti-bp-effects/Darkness_Pack.mp4' }] }
    ],
    'item-effects': {
        groups: [
            {
                id: 'dagon', name: 'Dagon', mods: [
                    { name: 'Purple Dagon', preview: 'purple_dagon.mp4', file: 'pak41_dir.vpk' },
                    { name: 'Blue Dagon', preview: 'blue_dagon.mp4', file: 'pak42_dir.vpk' },
                    { name: 'Snow Dagon', preview: 'snow_dagon.mp4', file: 'pak43_dir.vpk' },
                    { name: 'Green Dagon', preview: 'green_dagon.mp4', file: 'pak12_dir.vpk' },
                    { name: 'White Dagon', preview: 'white_dagon.mp4', file: 'pak21_dir.vpk' },
                ]
            },
            {
                id: 'branch', name: 'Iron Branch', mods: [
                    { name: 'GG Iron Branch', preview: 'gg_branch.webp', file: 'pak20_dir.vpk' },
                    { name: 'Christmas Iron Branch', preview: 'christmas_branch.mp4', file: 'pak68_dir.vpk' },
                ]
            },
            {
                id: 'ethereal', name: 'Ethereal', mods: [
                    { name: 'White Ethereal', preview: 'White Ethereal.mp4', file: 'pak49_dir.vpk' },
                ]
            },
            {
                id: 'bottle', name: 'Bottle', mods: [
                    { name: 'Red Bottle', preview: 'Red Bottle.mp4', file: 'pak50_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-red_bottle_effect/' },
                    { name: 'Darkness Bottle', preview: 'Darkness Bottle.mp4', file: 'Darkness Bottle.zip', linkType: 'author', linkUrl: 'https://t.me/Darkness_Logovo' },
                ]
            },
            {
                id: 'blink', name: 'Blink Dagger', mods: [
                    { name: 'Darkness Blink Dagger', preview: 'Darkness Blink Dagger.mp4', file: 'Darkness Blink Dagger.zip', linkType: 'author', linkUrl: 'https://t.me/Darkness_Logovo' },
                ]
            },
            {
                id: 'eul', name: "Eul's / Wind Waker", mods: [
                    { name: 'Darkness Euls Scepter', preview: 'Darkness Euls Scepter.mp4', file: 'Darkness Euls Scepter.zip', linkType: 'author', linkUrl: 'https://t.me/Darkness_Logovo' },
                ]
            },
            {
                id: 'lvlup', name: 'Lvl Up', mods: [
                    { name: 'Darkness Lvl Up', preview: 'Darkness Lvl up.mp4', file: 'Darkness Lvl up.zip', linkType: 'author', linkUrl: 'https://t.me/Darkness_Logovo' },
                ]
            },
            {
                id: 'shivas', name: "Shiva's Guard", mods: [
                    { name: 'Darkness Shivas', preview: 'Darkness Shivas.mp4', file: 'Darkness Shivas.zip', linkType: 'author', linkUrl: 'https://t.me/Darkness_Logovo' }
                ]
            },
            {
                id: 'mekansm', name: 'Mekansm', mods: [
                    { name: 'Darkness Mekansm', preview: 'Darkness Mekanism.mp4', file: 'Darkness Mekanism.zip', linkType: 'author', linkUrl: 'https://t.me/Darkness_Logovo' },
                ]
            },
            {
                id: 'mjollnir', name: 'Maelstrom / Mjollnir', mods: [
                    { name: 'Darkness Mjollnir', preview: 'Darkness Mjollner.mp4', file: 'Darkness Mjollner.zip', linkType: 'author', linkUrl: 'https://t.me/Darkness_Logovo' },
                ]
            },
            {
                id: 'radiance', name: 'Radiance', mods: [
                    { name: 'Darkness Radiance', preview: 'Darkness Radiance.mp4', file: 'Darkness Radiance.zip', linkType: 'author', linkUrl: 'https://t.me/Darkness_Logovo' },
                ]
            },
            {
                id: 'phase-boots', name: 'Phase Boots', mods: [
                    { name: 'Darkness Phase Boots', preview: 'Darkness Phase Boots.mp4', file: 'Darkness Phase Boots.zip', linkType: 'author', linkUrl: 'https://t.me/Darkness_Logovo' },
                ]
            },
            {
                id: 'aegis', name: 'Aegis', mods: [
                    { name: 'Aegis Hearts', preview: 'aegis_hearts.mp4', file: 'pak34_dir.vpk' },
                ]
            },
            {
                id: 'runes', name: 'Runes', mods: [
                    { name: 'Custom Runes', preview: 'сustom_runes.mp4', file: 'pak33_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_runes/' },
                ]
            },
            {
                id: 'teleport', name: 'Teleport', mods: [
                ]
            },
            {
                id: 'fountain', name: 'Fountain', mods: [
                ]
            },
            {
                id: 'aghanim', name: 'Aghanim', mods: [
                ]
            },
        ]
    },
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
        { name: 'Dark Terrain Minify', preview: 'Dark Terrain.webp', file: 'pak55_dir.vpk', links: [{ type: 'author', url: 'https://github.com/robbyz512' }, { type: 'source', url: 'https://github.com/Egezenn/dota2-minify' }] },
        { name: 'Flat Dark Terrain Minify', preview: 'Flat Dark Terrain.mp4', file: 'pak56_dir.vpk', links: [{ type: 'author', url: 'https://github.com/robbyz512' }, { type: 'source', url: 'https://github.com/Egezenn/dota2-minify' }] },
        { name: 'Mossy Cobblestone', preview: 'Mossy Cobblestone.webp', file: 'pak96_dir.vpk' },
        { name: 'Bedrock', preview: 'Bedrock.webp', file: 'pak20_dir.vpk' },
        { name: 'LowPoly', preview: 'LowPolyMap.webp', file: 'pak10_dir.vpk', links: [{ type: 'author', url: 'https://t.me/Darkness_Logovo' }] },
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
        { name: 'Crownfall', preview: 'Crownfall.webp', file: 'Crownfall.zip' }
    ],
    'trees': [
        { name: 'Pumpkin Trees', preview: 'Pumpkin Trees.webp', file: 'pak25_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-pumpkin_trees_up/' },
        { name: 'Small Trees Minify', preview: 'Small Trees.webp', file: 'pak57_dir.vpk', links: [{ type: 'author', url: 'https://github.com/robbyz512' }, { type: 'source', url: 'https://github.com/Egezenn/dota2-minify' }] },
        { name: 'Crystals Trees', preview: 'Crystals Trees.webp', file: 'pak22_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-blue_crystals_trees/' },
        { name: 'Wooden Trees', preview: 'Wooden Trees.webp', file: 'pak23_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-wooden_trees/' },
        { name: 'Stone Trees', preview: 'Stone Trees.webp', file: 'pak31_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-stone_forest_trees/' },
        { name: 'Low Poly Trees', preview: 'Low Poly Trees.webp', file: 'pak91_dir.vpk' },
        { name: 'Cartoon Trees', preview: 'Cartoon Trees.webp', file: 'pak92_dir.vpk', links: [{ type: 'author', url: 'https://t.me/Darkness_Logovo' }] },
    ],
    'heroes': [
        { name: 'Bare Brewmaster 🥰', preview: 'Bare Brewmaster.webp', file: 'Bare Brewmaster.zip', tags: { effects: false, icons: false } },
        { name: 'IO Purple', preview: 'Purple IO.webp', file: 'IO Purple.zip', tags: { effects: true, icons: true } },
        { name: 'Natures Prophet Allfather', preview: 'Natures Prophet Allfather.webp', file: 'Natures Prophet Allfather.zip', tags: { effects: true, icons: true } },
        { name: 'Shadow Shaman Purple', preview: 'Shadow Shaman Purple.webp', file: 'Shadow Shaman Purple.zip', tags: { effects: true, icons: false } },
        { name: 'Warlock Puppet Bear', preview: 'Warlock Puppet Bear.webp', file: 'Warlock Puppet Bear.zip', tags: { effects: true, icons: false } },
        { name: 'Cosmic Spirit Breaker', preview: 'Cosmic Spirit Breaker.webp', file: 'Cosmic Spirit Breaker.zip', tags: { effects: false, icons: false } },
        { name: 'Visage Grimfeather Сorpse', preview: 'Visage Grimfeather Сorpse.webp', file: 'Visage Grimfeather Сorpse.zip', tags: { effects: true, icons: true } },
        { name: 'Mars Diretide Shimmer', preview: 'Mars Diretide Shimmer.webp', file: 'Mars Diretide Shimmer.zip', tags: { effects: true, icons: true } },
        { name: 'Cosmic Zeus', preview: 'Cosmic Zeus.webp', file: 'Cosmic Zeus.zip', tags: { effects: false, icons: false } },
        { name: 'Lifestealer Diretide Shimmer', preview: 'Lifestealer Diretide Shimmer.webp', file: 'Lifestealer Diretide Shimmer.zip', tags: { effects: false, icons: false } },
        { name: 'Lion Cannonroar Confessor', preview: 'Lion Cannonroar Confessor.webp', file: 'Lion Cannonroar Confessor.zip', tags: { effects: true, icons: true } },
        { name: 'Cosmic Faceless Void', preview: 'Faceless Void Chrononaut Continuum.webp', file: 'Faceless Void Chrononaut Continuum.zip', tags: { effects: false, icons: false } },
        { name: 'Spectre Shadowveil', preview: 'Spectre Shadowveil.webp', file: 'Spectre Shadowveil.zip', tags: { effects: true, icons: true } },
        { name: 'Alien Nyx Assassin', preview: 'Alien Nyx Assassin.webp', file: 'Alien Nyx Assassin.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-alien_nyx_assassin_megapack/' },
        { name: 'Ancients Lina', preview: 'Ancients Lina.webp', file: 'Ancients Lina.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ancients_lina/' },
        { name: 'Arc Warden Black Hole', preview: 'Arc Warden Black Hole.webp', file: 'Arc Warden Black Hole.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-black_hole_custom_arc_warden/' },
        { name: 'Arc Warden Sakura Winter', preview: 'Arc Warden Sakura Winter.webp', file: 'Arc Warden Sakura Winter.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-sakura_arc_warden/' },
        { name: 'Ashes Arc Warden', preview: 'Ashes Arc Warden.webp', file: 'Ashes Arc Warden.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ashes_arc_warden/' },
        { name: 'Axe Immortal Bootblack', preview: 'Axe Immortal Bootblack.webp', file: 'Axe Immortal Bootblack.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/' },
        { name: 'Bloody Enigma', preview: 'Bloody Enigma.webp', file: 'Bloody Enigma.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-bloody_enigma/' },
        { name: 'Bloody Kez', preview: 'Bloody Kez.webp', file: 'Bloody Kez.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-bloody_kez/' },
        { name: 'Brewmaster Jousting Panda', preview: 'Brewmaster Jousting Panda.webp', file: 'Brewmaster Jousting Panda.zip', tags: { effects: false, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-brew_jousting_panda_and_donkey_kong/' },
        { name: 'Broodmother Redan', preview: 'Broodmother Redan.webp', file: 'Broodmother Redan.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-broodmother_redan_megapack/' },
        { name: 'Clinkz Silver Metall Pink', preview: 'Clinkz Silver Metall Pink.webp', file: 'Clinkz Silver Metall Pink.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-silver_metall_clinkz_pink_megapack/' },
        { name: 'Darkness Weaver', preview: 'Darkness Weaver.webp', file: 'Darkness Weaver.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-darkness_weaver_modpack/' },
        { name: 'Drow Ranger Stranger Arcana', preview: 'Drow Ranger Stranger Arcana.webp', file: 'Drow Ranger Stranger Arcana.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-stranger_in_the_wandering_isles/' },
        { name: 'Earthshaker Red Arcana', preview: 'Earthshaker Red Arcana.webp', file: 'Earthshaker Red Arcana.zip', tags: { effects: false, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-earthshaker_red_arcana/' },
        { name: 'Ghost Shadow Fiend', preview: 'Ghost Fiend.webp', file: 'Ghost Fiend.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ghost_fiend/' },
        { name: 'Ghosty Slark', preview: 'Ghosty Slark.webp', file: 'Ghosty Slark.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ghosty_slark_megapack/' },
        { name: 'Gopo Pudge 🥰', preview: 'GopoPudge.webp', file: 'GopoPudge.zip', tags: { effects: false, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-gopopudge/' },
        { name: 'Gopo Tidehunter 🥰', preview: 'GopoTide.webp', file: 'GopoTide.zip', tags: { effects: false, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-gopotide/' },
        { name: 'Ice Phoenix', preview: 'Ice Phoenix.webp', file: 'Ice Phoenix.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ice_phoenix_v_2_0/' },
        { name: 'Ice Venomancer', preview: 'Ice Venomancer.webp', file: 'Ice Venomancer.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_ice_venomancer_megapack/' },
        { name: 'IO Pink Arcana', preview: 'IO Pink Arcana.webp', file: 'IO Pink Arcana.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_wisp_arcana_by_defiree/' },
        { name: 'Kai Meepo', preview: 'Kai Meepo.webp', file: 'Kai Meepo.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-kai_meepo/' },
        { name: 'Legion Commander Crimson Black', preview: 'Legion Commander Crimson Black.webp', file: 'Legion Commander Crimson Black.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-legion_commander_custom_arcana_crimson_black_defireee/' },
        { name: 'Morphling Darktrench Purple', preview: 'Morphling Darktrench Stalker Purple.webp', file: 'Morphling Darktrench Stalker Purple.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://vk.com/wall-127340251_11856' },
        { name: 'Nightmare Chaos Knight', preview: 'Nightmare Chaos Knight.webp', file: 'Nightmare Chaos Knight.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-nightmare_chaos_knight_megapack/' },
        { name: 'Ogre Magi Custom Arcana', preview: 'Ogre Magi Custom Arcana.webp', file: 'Ogre Magi Custom Arcana.zip', tags: { effects: false, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_arcana_ogre_magi_by_defiree/' },
        { name: 'Old Storm Spirit', preview: 'Old Storm Spirit.webp', file: 'Old Storm Spirit.zip', tags: { effects: true, icons: true } },
        { name: 'Pudge Arcana Elephant', preview: 'Pudge Arcana Elephant.webp', file: 'Pudge Arcana Elephant.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_pudge_arcana_elephant/' },
        { name: 'Pudge CM', preview: 'Pudge CM.webp', file: 'Pudge CM.zip', tags: { effects: false, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-pudge-cm/' },
        { name: 'Queen of Pain Rose', preview: 'Queen of Pain Rose.webp', file: 'Queen of Pain Rose.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-pink_rose_custom_arcana_queen_of_pain/' },
        { name: 'Russian Ursa', preview: 'Russian Ursa.webp', file: 'Russian Ursa.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-russian_ursa-bear/' },
        { name: 'Scarlet Keeper', preview: 'Scarlet Keeper.webp', file: 'Scarlet Keeper.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-darkness_scarlet_keeper/' },
        { name: 'Shadow Fiend White', preview: 'Shadow Fiend White.webp', file: 'Shadow Fiend White.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/hero-tag:shadow%20fiend-list_skins_dlya_dota_2-0/#megapack' },
        { name: 'Spectre Toxin', preview: 'Spectre Toxin.webp', file: 'Spectre Toxin.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-darkness_toxin_spectre/' },
        { name: 'Spirit Breaker Ghost Monster', preview: 'Spirit Breaker Ghost Monster.webp', file: 'Spirit Breaker Ghost Monster.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-custom_spirit_breaker_ghost_monster/' },
        { name: 'Steel Sand King', preview: 'Steel King.webp', file: 'Steel King.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-steel_king/' },
        { name: 'The Mawsworn Razor', preview: 'The Mawsworn Razor.webp', file: 'The Mawsworn Razor.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-the_mawsworn_razor/' },
        { name: 'Ursa White and Red', preview: 'Ursa White and Red.webp', file: 'Ursa White and Red.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ursa_sss_rank_or_white_and_red_megapack/' },
        { name: 'Winter Ember Spirit', preview: 'Winter Ember Spirit.webp', file: 'Winter Ember Spirit.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-winter_ember_spirit/' },
        { name: 'Night Ursa', preview: 'Night Ursa.webp', file: 'Night Ursa.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-night_ursa_megapack/' },
        { name: 'Flameling Morphling', preview: 'Flameling Morphling.webp', file: 'Flameling Morphling.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-flameling_morphling_megapack/' },
        { name: 'Ghost Void Spirit', preview: 'Ghost Void Spirit.webp', file: 'Ghost Void Spirit.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ghost_void_spirit/' },
        { name: 'Anti-Mage Shadow Slayer', preview: 'Anti-Mage Shadow Slayer.webp', file: 'Anti-Mage Shadow Slayer.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-shadow_slayer/' },
        { name: 'Dawnbreaker Death Knight', preview: 'Dawnbreaker Death Knight.webp', file: 'Dawnbreaker Death Knight.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-death_knight/' },
        { name: 'Bloody Death Prophet', preview: 'Bloody Death Prophet.webp', file: 'Bloody Death Prophet.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-death_prophet_custom_modpack/' },
        { name: 'Blue Soul Huskar', preview: 'Blue Soul Huskar.webp', file: 'Blue Soul Huskar.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-blue_soul_huskar_megapack/' },
        { name: 'Bloody Templar Assassin', preview: 'Bloody Lanaya.webp', file: 'Bloody Lanaya.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-bloody_lanaya/' },
        { name: 'Red Abaddon', preview: 'Red Abaddon.webp', file: 'Red Abaddon.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-abaddon_red_megapack/' },
        { name: 'Void Morphling', preview: 'Void Morphling.webp', file: 'Void Morphling.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-void_morphling_by_darknessing/' },
        { name: 'Terrorblade Wrong Arcana', preview: 'Terrorblade Wrong Arcana.webp', file: 'Terrorblade Wrong Arcana.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/hero-tag:terrorblade-list_skins_dlya_dota_2-0/' },
        { name: 'Jakiro Himera', preview: 'Jakiro Himera.webp', file: 'Jakiro Himera.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-jakiro_himera/' },
        { name: 'Cosmic Enigma', preview: 'Cosmic Enigma.webp', file: 'Cosmic Enigma.zip', tags: { effects: false, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-graviton_blackguard/' },
        { name: 'Medusa Gorgon', preview: 'Medusa Gorgon.webp', file: 'Medusa Gorgon.zip', tags: { effects: true, icons: false }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-medusa_gorgon/' },
        { name: 'Ifrit Monkey King', preview: 'Ifrit Monkey King.webp', file: 'Ifrit Monkey King.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ifrit_monkey_king/' },
        { name: 'Morphling Darktrench Tears', preview: 'Morphling Darktrench Tears.webp', file: 'Morphling Darktrench Tears.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-darktrench_stalker_and_blade_of_tears/' },
        { name: 'Sven Blue Angel', preview: 'Sven Blue Angel.webp', file: 'Sven Blue Angel.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-blue_angel_of_sven/' },
        { name: 'Pinkie Sven', preview: 'Pinkie Sven.webp', file: 'Pinkie Sven.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-pinkie_sven/' },
        { name: 'Sherman Crystal Maiden', preview: 'Sherman Crystal Maiden.webp', file: 'Sherman Crystal Maiden.zip', tags: { effects: true, icons: true }, linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-sherman_maiden_v_4_1/' },
        { name: 'Sakura Pink Invoker', preview: 'Sakura Pink Invoker.webp', file: 'Sakura Pink Invoker.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: 'https://t.me/Darkness_Logovo' }] },
        { name: 'Razor Rainbow Statics', preview: 'Razor Rainbow Statics.webp', file: 'Razor Rainbow Statics.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: 'https://vk.com/amir4an' }] },
        { name: 'Maid Marci', preview: 'Maid Marci.webp', file: 'Maid Marci.zip', tags: { effects: false, icons: false }, links: [{ type: 'author', url: 'https://www.youtube.com/@mrkliromin7723' }] },
        { name: 'Terrorblade Unblinking Horror', preview: 'Terrorblade Unblinking Horror.webp', file: 'Terrorblade Unblinking Horror.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: 'https://vk.com/defiree2mods' }] },
        { name: 'Purple Shadow Fiend', preview: 'Purple Shadow Fiend.webp', file: 'Purple Shadow Fiend.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: 'https://t.me/Darkness_Logovo' }] },
        { name: 'Bloody Gore Spectre', preview: 'Bloody Gore Spectre.webp', file: 'Bloody Gore Spectre.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: 'https://t.me/Darkness_Logovo' }] },
        { name: 'Cursed Shadow Fiend', preview: 'Cursed Shadow Fiend.webp', file: 'Cursed Shadow Fiend.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: 'https://t.me/Darkness_Logovo' }] },
        { name: 'Juggernaut Ice and Fire', preview: 'Juggernaut Ice and Fire.webp', file: 'Juggernaut Ice and Fire.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: 'https://vk.com/id363951132' }] },
        { name: 'Cosmic Alchemist', preview: 'Cosmic Alchemist.webp', file: 'Cosmic Alchemist.zip', tags: { effects: true, icons: false } },
        { name: 'Frostivus Alchemist', preview: 'Frostivus Alchemist.webp', file: 'Frostivus Alchemist.zip', tags: { effects: true, icons: false } },
        { name: 'Tiny Majesty of the Colossus', preview: 'Tiny Majesty of the Colossus.webp', file: 'Tiny Majesty of the Colossus.zip', tags: { effects: true, icons: true }, links: [{ type: 'source', url: 'https://dota2changer.com' }] },
        { name: 'Batrider Night Snotty', preview: 'Batrider Night Snotty.webp', file: 'Batrider Night Snotty.zip', tags: { effects: true, icons: false }, links: [{ type: 'sender', url: 'https://t.me/hitman47attacks' }, { type: 'source', url: 'https://dota2changer.com' }] },
        { name: 'Morphling Megalodon', preview: 'Morphling Megalodon.webp', file: 'Morphling Megalodon.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: 'https://vk.com/defiree2mods' }] },
        { name: 'Primal Beast Snowbeast', preview: 'Primal Beast Snowbeast.webp', file: 'Primal Beast Snowbeast.zip', tags: { effects: false, icons: false }, links: [{ type: 'author', url: 'https://vk.com/id363951132' }] },
        { name: 'Windranger Autumn Arcana', preview: 'Windranger Autumn Arcana.webp', file: 'Windranger Autumn Arcana.zip', tags: { effects: true, icons: false }, links: [{ type: 'author', url: 'https://vk.com/defiree2mods' }] },
        { name: 'Viper Butch Dog', preview: 'Viper Butch Dog.webp', file: 'Viper Butch Dog.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: 'https://vk.com/defiree2mods' }] },
        { name: 'Dawnbreaker Moonbreaker', preview: 'Dawnbreaker Moonbreaker.webp', file: 'Dawnbreaker Moonbreaker.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: 'https://vk.com/defiree2mods' }] },
        { name: 'Cosmic Tinker', preview: 'Cosmic Tinker.webp', file: 'Cosmic Tinker.zip', tags: { effects: false, icons: false }, links: [{ type: 'author', url: 'https://vk.com/id363951132' }, { type: 'sender', url: 'https://t.me/hitman47attacks' }] },
        { name: 'Juggernaut Samurai of Wind', preview: 'Juggernaut Samurai of Wind.webp', file: 'Juggernaut Samurai of Wind.zip', tags: { effects: true, icons: true }, links: [{ type: 'source', url: 'https://dota2changer.com' }] },
        { name: 'Broodmother Undermount Gloom', preview: 'Broodmother Undermount Gloom.webp', file: 'Broodmother Undermount Gloom.zip', tags: { effects: false, icons: false }, links: [{ type: 'author', url: 'https://vk.com/id363951132' }, { type: 'sender', url: 'https://t.me/hitman47attacks' }] },
        { name: 'Sniper Odogaron Armor', preview: 'Sniper Odogaron Armor.webp', file: 'Sniper Odogaron Armor.zip', tags: { effects: false, icons: false }, links: [{ type: 'source', url: 'https://dota2changer.com' }] },
        { name: 'Tinker Submerged Hazard', preview: 'Tinker Submerged Hazard.webp', file: 'Tinker Submerged Hazard.zip', tags: { effects: true, icons: true } },
        { name: 'Lycan Red Wolf Clan', preview: 'Lycan Red Wolf Clan.webp', file: 'Lycan Red Wolf Clan.zip', tags: { effects: false, icons: false } },
        { name: 'Chen Infernal Psychic', preview: 'Chen Infernal Psychic.webp', file: 'Chen Infernal Psychic.zip', tags: { effects: false, icons: false } },
        { name: 'Emerald Shadow Fiend', preview: 'Emerald Shadow Fiend.webp', file: 'Emerald Shadow Fiend.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: 'https://www.youtube.com/@skratch' }] },
        { name: 'Snapfire Whippersnapper', preview: 'Snapfire Whippersnapper.webp', file: 'Snapfire Whippersnapper.zip', tags: { effects: false, icons: false } },
        { name: 'Tinker Deathsman', preview: 'Tinker Deathsman.webp', file: 'Tinker Deathsman.zip', tags: { effects: false, icons: false }, links: [{ type: 'source', url: 'https://dota2changer.com' }] },
        { name: 'Night Stalker Feasts of Forever', preview: 'Night Stalker Feasts of Forever.webp', file: 'Night Stalker Feasts of Forever.zip', tags: { effects: false, icons: false }, links: [{ type: 'source', url: 'https://dota2changer.com' }] },
        // { name: '', preview: '.webp', file: '.zip', tags: { effects: true, icons: true }, links: [{ type: 'author', url: '' }] },
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
    'creeps': {
        groups: [
            {
                id: 'radiant-creeps', name: 'Radiant Creeps', mods: [
                    { name: 'Nemestice Radiant Creeps', preview: 'Nemestice Radiant.webp', file: 'pak14_dir.vpk' },
                    { name: 'Woodland Radiant Creeps', preview: 'Woodland Radiant.webp', file: 'pak10_dir.vpk' },
                    { name: 'Reptilian Radiant Creeps', preview: 'Reptilian Radiant.webp', file: 'pak16_dir.vpk' },
                    { name: 'Crownfall Radiant Creeps', preview: 'Crownfall Radiant.webp', file: 'pak18_dir.vpk' },
                    { name: 'Diretide Radiant Creeps', preview: 'Diretide Radiant.webp', file: 'pak22_dir.vpk' },
                ]
            },
            {
                id: 'dire-creeps', name: 'Dire Creeps', mods: [
                    { name: 'Nemestice Dire Creeps', preview: 'Nemestice Dire.webp', file: 'pak15_dir.vpk' },
                    { name: 'Woodland Dire Creeps', preview: 'Woodland Dire.webp', file: 'pak11_dir.vpk' },
                    { name: 'Reptilian Dire Creeps', preview: 'Reptilian Dire.webp', file: 'pak17_dir.vpk' },
                    { name: 'Crownfall Dire Creeps', preview: 'Crownfall Dire.webp', file: 'pak19_dir.vpk' },
                    { name: 'Diretide Dire Creeps', preview: 'Diretide Dire.webp', file: 'pak23_dir.vpk' },
                ]
            },
            {
                id: 'radiant-siege', name: 'Radiant Siege', mods: [
                    { name: 'Woodland Radiant Siege', preview: 'Woodland Radiant Siege.webp', file: 'pak12_dir.vpk' },
                    { name: 'Crownfall Radiant Siege', preview: 'Crownfall Radiant Siege.webp', file: 'pak20_dir.vpk' },
                ]
            },
            {
                id: 'dire-siege', name: 'Dire Siege', mods: [
                    { name: 'Woodland Dire Siege', preview: 'Woodland Dire Siege.webp', file: 'pak13_dir.vpk' },
                    { name: 'Crownfall Dire Siege', preview: 'Crownfall Dire Siege.webp', file: 'pak21_dir.vpk' },
                ]
            },
        ]
    },
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
    'packs': [
        { name: 'Winter Pack', preview: 'Winter Pack.mp4', file: 'Winter Pack [7.39d].zip' },
        { name: 'Autumn Pack', preview: 'Autumn Pack.mp4', file: 'Autumn Pack [7.39d].zip' },
        { name: 'Aqua Pack', preview: 'Aqua Pack.mp4', file: 'Aqua Pack [7.39d].zip' }
    ],
    'ranged-attack': [
        { name: 'Nemestice Ranged Attack', preview: 'Nemestice Ranged Attack.mp4', file: 'pak13_dir.vpk' },
        { name: 'Aghanim Ranged Attack', preview: 'Aghanim Ranged Attack.mp4', file: 'pak14_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ranged_attack_effect_aghanim_2021/' },
        { name: 'Green Diretide Ranged Attack', preview: 'Green Diretide Ranged Attack.mp4', file: 'pak15_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-ranged_attack_effect_diretide_-_green/' }
    ],
    'mega-kill': [
        { name: 'Nedotrax Mega-Kill', preview: 'Nedotrax Mega-Kill.webp', file: 'pak10_dir.vpk', links: [{ type: 'source', url: 'https://ru.dota2changer.com/skins_dota_2_mods-sexy_woman_mega-kill/' }, { type: 'preview', url: 'assets/previews/mega-kill/Nedotrax-Mega-Kill.mp4' }] },
        { name: 'Siega Mega-Kill', preview: 'Siega Mega-Kill.webp', file: 'pak11_dir.vpk', links: [{ type: 'source', url: 'https://github.com/SsixM/Dotafy-mods/tree/master/mods/!%20Golovach%20killstreak/files/sounds/vo/announcer_killing_spree' }, { type: 'preview', url: 'assets/previews/mega-kill/Siega-Mega-Kill.mp4' }] },
        { name: 'Kunkka & Tidehunter', preview: 'kunkatide.webp', file: 'pak16_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Rick & Morty', preview: 'rickmorty.webp', file: 'pak15_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Axe', preview: 'axe.webp', file: 'pak12_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Bristleback', preview: 'bristleback.webp', file: 'pak13_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Clockwerk', preview: 'clockwerk.webp', file: 'pak14_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Crystal Maiden', preview: 'cm.webp', file: 'pak17_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Dark Willow', preview: 'darkwillow.webp', file: 'pak18_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Meepo', preview: 'meepo.webp', file: 'pak19_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Monkey King', preview: 'mk.webp', file: 'pak20_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Natures Prophet', preview: 'fura.webp', file: 'pak21_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Juggernaut', preview: 'jugger.webp', file: 'pak22_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Lina', preview: 'lina.webp', file: 'pak23_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Techies', preview: 'techies.webp', file: 'pak24_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Storm Spirit', preview: 'storm.webp', file: 'pak25_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'GLaDOS', preview: 'portal.webp', file: 'pak26_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Gabe Newell', preview: 'gabe.webp', file: 'pak27_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Pirate Cap', preview: 'pirate.webp', file: 'pak28_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Fallout 4', preview: 'Fallout4.webp', file: 'pak29_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Voice of The International', preview: 'VoiceOfTheInternational.webp', file: 'pak30_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Deus Ex', preview: 'deusex.webp', file: 'pak31_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Diretide', preview: 'diretide.webp', file: 'pak32_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Defense Grid', preview: 'DefenseGrid.webp', file: 'pak33_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Darkest Dungeon', preview: 'DurkestDungeon.webp', file: 'pak34_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Pyrion Flax', preview: 'PyrionFlax.webp', file: 'pak35_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Stanley Parable', preview: 'TheStanleyParable.webp', file: 'pak36_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
        { name: 'Trine', preview: 'Trine.webp', file: 'pak37_dir.vpk', links: [{ type: 'author', url: 'https://t.me/BLUADD' }] },
    ],
    'announcers': [
        { name: 'Kunkka & Tidehunter', preview: 'Kunkka & Tidehunter.webp', file: 'pak10_dir.vpk' },
        { name: 'Rick & Morty', preview: 'Rick and Morty.webp', file: 'pak11_dir.vpk' },
        { name: 'Meepo', preview: 'Meepo.webp', file: 'pak12_dir.vpk' },
        { name: 'Lina', preview: 'Lina.webp', file: 'pak13_dir.vpk' },
        { name: 'Dark Willow', preview: 'Dark Willow.webp', file: 'pak14_dir.vpk' },
        { name: 'Darkest Dungeon', preview: 'Darkest Dungeon.webp', file: 'pak15_dir.vpk' },
        { name: 'Voice of The International', preview: 'Voice of The International.webp', file: 'pak16_dir.vpk' },
        { name: 'Pyrion Flax', preview: 'Pyrion Flax.webp', file: 'pak17_dir.vpk' },
    ],
    'pedestal': [
        { name: 'Drow Ranger Pedestal', preview: 'Drow Ranger Pedestal.webp', file: 'pak78_dir.vpk' },
        { name: 'Earthshaker Pedestal', preview: 'Earthshaker Pedestal.webp', file: 'pak79_dir.vpk' },
        { name: 'Windranger Pedestal', preview: 'Windranger Pedestal.webp', file: 'pak80_dir.vpk' },
        { name: 'Snow Pedestal', preview: 'Snow Pedestal.webp', file: 'pak16_dir.vpk', linkType: 'source', linkUrl: 'https://dota2changer.com/skins_dota_2_mods-snow_pedestal/' }
    ],
    'high-five': [
        { name: 'High Five Aghanim Puppet', preview: 'High Five Aghanim Puppet.mp4', file: 'pak76_dir.vpk' },
        { name: 'High Five Crownfall', preview: 'High Five Crownfall.mp4', file: 'pak77_dir.vpk' }
    ],
    'other': [
        { name: 'Profile Graffiti & Phrases', preview: 'Profile Graffiti & Phrases.webp', file: 'pak44_dir.vpk', linkType: 'author', linkUrl: 'https://steamcommunity.com/profiles/76561199145739904' },
        { name: 'Showcase Rotation', preview: 'Showcase Rotation.mp4', file: 'pak36_dir.vpk' },
        { name: 'Rage Voice Icon', preview: 'Rage Voice Icon.webp', file: 'pak53_dir.vpk' },
    ],
    'river': [
        { name: 'Black River', preview: 'Black.webp', file: 'pak10_dir.vpk' },
        { name: 'Blood River', preview: 'Blood.webp', file: 'pak11_dir.vpk' },
        { name: 'Blue River', preview: 'Blue.webp', file: 'pak12_dir.vpk' },
        { name: 'Boiling Blood River', preview: 'Boiling Blood.webp', file: 'pak13_dir.vpk' },
        { name: 'Boiling River', preview: 'Boiling.webp', file: 'pak14_dir.vpk' },
        { name: 'Chrome River', preview: 'Chrome.webp', file: 'pak15_dir.vpk' },
        { name: 'Cola River', preview: 'Cola.webp', file: 'pak16_dir.vpk' },
        { name: 'Dry River', preview: 'Dry.webp', file: 'pak17_dir.vpk' },
        { name: 'Electric River', preview: 'Electric.webp', file: 'pak18_dir.vpk' },
        { name: 'Frozen River', preview: 'Frozen.webp', file: 'pak19_dir.vpk' },
        { name: 'Gold River', preview: 'Gold.webp', file: 'pak20_dir.vpk' },
        { name: 'Green River', preview: 'Green.webp', file: 'pak21_dir.vpk' },
        { name: 'Oil River', preview: 'Oil.webp', file: 'pak22_dir.vpk' },
        { name: 'Orange River', preview: 'Orange.webp', file: 'pak23_dir.vpk' },
        { name: 'Pink River', preview: 'Pink.webp', file: 'pak24_dir.vpk' },
        { name: 'Potion River', preview: 'Potion.webp', file: 'pak25_dir.vpk' },
        { name: 'Purple River', preview: 'Purple.webp', file: 'pak26_dir.vpk' },
        { name: 'Red River', preview: 'Red.webp', file: 'pak27_dir.vpk' },
        { name: 'Slime River', preview: 'Slime.webp', file: 'pak28_dir.vpk' },
        { name: 'Yellow River', preview: 'Yellow.webp', file: 'pak29_dir.vpk' },
    ],
    'backgrounds': [
        { name: 'Ulquiorra', preview: 'Ulquiorra.webp', file: 'pak10_dir.vpk', tags: { image: true, video: false } },
        { name: 'Brewmaster', preview: 'Brewmaster.webp', file: 'pak11_dir.vpk', tags: { image: true, video: false } },
        { name: 'Moonflower Field', preview: 'Moonflower Field.mp4', file: 'pak12_dir.vpk', tags: { image: false, video: true } },
        { name: 'Forgotten Sword', preview: 'Forgotten Sword.mp4', file: 'pak13_dir.vpk', tags: { image: false, video: true } },
        { name: 'Depressed SpongeBob', preview: 'Depressed SpongeBob.mp4', file: 'pak14_dir.vpk', tags: { image: false, video: true } },
        { name: 'Lonely Quay', preview: 'Lonely Quay.mp4', file: 'pak15_dir.vpk', tags: { image: false, video: true, lowres: true } },
        { name: 'Code Geass', preview: 'Code Geass.mp4', file: 'pak16_dir.vpk', tags: { image: false, video: true } },
        { name: 'Winter Solitude', preview: 'Winter.mp4', file: 'pak17_dir.vpk', tags: { image: false, video: true, lowres: true } },
        { name: 'Cloudy Tree', preview: 'Tree.mp4', file: 'pak18_dir.vpk', tags: { image: false, video: true, lowres: true } },
        { name: 'Zenitsu White', preview: 'Zenitsu White.mp4', file: 'pak19_dir.vpk', tags: { image: false, video: true } },
        { name: 'Nier Automata', preview: 'Nier Automata.mp4', file: 'pak20_dir.vpk', tags: { image: false, video: true } },
        { name: 'Kurumi Tokisaki', preview: 'Kurumi Tokisaki.mp4', file: 'pak21_dir.vpk', tags: { image: false, video: true } },
        { name: 'Sad Maomao', preview: 'Sad Maomao.mp4', file: 'pak22_dir.vpk', tags: { image: false, video: true } },
        { name: 'Dead Eyes', preview: 'Dead Eyes.mp4', file: 'pak23_dir.vpk', tags: { image: false, video: true } },
        { name: 'Katana In Forest', preview: 'Katana In Forest.mp4', file: 'pak24_dir.vpk', tags: { image: false, video: true } },
        { name: 'Field Grass', preview: 'Field Grass.mp4', file: 'pak25_dir.vpk', tags: { image: false, video: true } },
        { name: 'Snowfall In Forest', preview: 'Snowfall In Forest.mp4', file: 'pak26_dir.vpk', tags: { image: false, video: true } },
        { name: 'Cyrene Song', preview: 'Cyrene Song.mp4', file: 'pak27_dir.vpk', tags: { image: false, video: true } },
        { name: 'Blossom Rem', preview: 'Blossom Rem.mp4', file: 'pak28_dir.vpk', tags: { image: false, video: true } },
        { name: 'Kakehashi Subaru', preview: 'Kakehashi Subaru.mp4', file: 'pak29_dir.vpk', tags: { image: false, video: true } },
        // { name: '', preview: '.mp4', file: 'pak_dir.vpk', tags: { image: false, video: true } },
    ],
    'tools': [
        { name: 'Background Changer', preview: 'Background Changer.webp', file: 'Background Changer.zip', guideId: 'background-changer' },
        { name: 'Weather Changer [NotSafe]', preview: 'Weather Changer.webp', file: 'Weather Changer.zip', guideId: 'weather' },
        { name: 'VPKMerge - Combine VPKs', preview: 'VPKMerge.webp', file: 'VPKMerge.zip', guideId: 'vpk-merge' },
        { name: 'VPKTool - Extract & Pack VPKs', preview: 'VPKTool.webp', file: 'VPKTool.zip', guideId: "vpk-tool" },
        // { name: 'Extract - Extract Hero From VPKs', preview: 'Extract.webp', file: 'Extract.zip' },
        { name: 'Background Changer Linux', preview: 'Background Changer Linux.webp', file: 'Background Changer Linux.zip', guideId: 'background-changer-linux' },
        { name: 'VPKMerge Linux', preview: 'VPKMerge Linux.webp', file: 'VPKMerge Linux.zip', guideId: 'vpk-merge-linux' },
        { name: 'VPKTool Linux', preview: 'VPKTool-Linux.webp', file: 'VPKTool Linux.zip', guideId: "vpk-tool-linux" },
    ],
    'optimization': [
        { name: 'Dota2 Minify', preview: 'Minify.webp', file: 'https://github.com/egezenn/dota2-minify', type: 'guide' },
        { name: 'Commands', preview: 'Commands.mp4', file: 'https://github.com/h6rd/Dota2PornFxWeb/tree/main/assets/files/optimization/Commands.md', type: 'guide' }
    ],
    'sites': [
        { name: 'Stratz', preview: 'stratz.webp', file: 'https://stratz.com/', type: 'guide', tags: { stats: true, meta: true } },
        { name: 'DotaBuff', preview: 'dotabuff.webp', file: 'https://www.dotabuff.com/', type: 'guide', tags: { stats: true, meta: true } },
        { name: 'OpenDota', preview: 'opendota.webp', file: 'https://www.opendota.com/', type: 'guide', tags: { stats: true, meta: true } },
        { name: 'Dota2ProTracker', preview: 'dota2protracker.webp', file: 'https://dota2protracker.com/', type: 'guide', tags: { meta: true } },
        { name: 'Dota2 Emoji Nickname', preview: '', file: 'https://l4wio.github.io/dota2-emoji-nickname/', type: 'guide', tags: { fun: false } },
        { name: 'Steam Status', preview: 'steamstatus.webp', file: 'https://steamstat.us/', type: 'guide' }
    ],
    'guides': [
        { name: 'Minimap Icons', preview: 'minimap.webp', guideId: 'minimap-icons', type: 'guide' },
        { name: 'Install Mods', preview: '', guideId: 'install', type: 'guide' },
        { name: 'Commands & Binds', preview: 'Commands.mp4', file: 'https://github.com/h6rd/Dota2PornFxWeb/tree/main/assets/files/other/Commands.md', type: 'guide' }
    ],
    'ranks': [
        { name: 'Imperial Medals', preview: 'Imperial Medals.webp', file: 'pak10_dir.vpk' },
        { name: 'Flaming Medals', preview: 'Flaming Medals.webp', file: 'pak11_dir.vpk' },
    ],
    'item-icons': [
        { name: 'Beer Bottle', preview: 'Beer Bottle.webp', file: 'pak26_dir.vpk' },
        { name: 'Arcanas Items Icons', preview: 'Arcanas Items.webp', file: 'pak83_dir.vpk', linkType: 'author', linkUrl: 'https://t.me/hitman47attacks' }
    ],
    'wards': [
        { name: 'Curious Snaptrap', preview: 'Curious Snaptrap.webp', file: 'pak10_dir.vpk' },
        { name: 'Floes Tower', preview: 'Floes Tower.webp', file: 'pak11_dir.vpk' },
        { name: 'Trailgazer', preview: 'Trailgazer.webp', file: 'pak12_dir.vpk' },
        { name: 'Monty', preview: 'Monty.webp', file: 'pak13_dir.vpk' },
        { name: 'Portal', preview: 'Portal.webp', file: 'pak14_dir.vpk' },
    ],
    'couriers': [
        { name: 'Waldi the Faithful', preview: 'Waldi the Faithful.webp', file: 'pak10_dir.vpk' },
        { name: 'Baby Roshan Crownfall', preview: 'BabyRoshan Crownfall.webp', file: 'pak11_dir.vpk' },
        { name: 'Billy Bounceback', preview: 'Billy Bounceback.webp', file: 'pak12_dir.vpk' },
        { name: 'Palico Odogaron', preview: 'Palico Odogaron.webp', file: 'pak13_dir.vpk' },
    ],
}
