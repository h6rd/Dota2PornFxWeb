<div align="center">
  <img src="assets/banner-git.png" alt="Dota2PornFxWeb Banner" width="100%">
  
  <p><b>Discover and download a vast collection of Dota 2 customization mods</b></p>
  
  [![website](https://custom-icon-badges.demolab.com/badge/Website-404040?style=for-the-badge&logo=globe&logoColor=white)](https://h6rd.github.io/Dota2PornFxWeb)
  [![website mirror](https://custom-icon-badges.demolab.com/badge/Website%20Mirror-404040?style=for-the-badge&logo=globe&logoColor=white)](https://d2pfx.netlify.app)
  [![telegram](https://img.shields.io/badge/Telegram-2d87ad?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/dota2pornfx)
  [![discord](https://img.shields.io/badge/Discord-5e78d5?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/invite/PBvG8D9MxT)
</div>

---

# About

**Dota2PornFx** is a comprehensive collection of mods for Dota 2 that allows players to customize their gaming experience. From hero skins and visual effects to backgrounds and announcers, this repository provides an extensive library of content to personalize your Dota 2.

### Features

- **Extensive Categories**: Over 30+ categories including heroes, terrains, shaders, item effects, backgrounds, announcers, and more
- **Easy Access**: Simple web interface to browse and download mods
- **Regular Updates**: New content added regularly with latest updates
- **User-Friendly**: Intuitive interface with search, sorting, and cart functionality
- **Previews Available**: Video and image previews for most mods

### Available Categories

<details>
<summary><b>Click to expand all categories</b></summary>

- **Shaders** - Replaces the fog of war effect
- **Effect Packs** - Battle Pass / The International / Pack effects
- **Item Effects** - Effects for various items
- **Creep Deny** - Creep deny animations and effects
- **Emblems** - Collection of various emblems
- **Versus Screens** - Custom versus screen
- **Terrains** - Terrains modifications
- **Trees** - Custom trees
- **Heroes** - Hero models and sets
- **Roshan** - Custom Roshan models and skins
- **Creeps** - Custom creeps
- **Ancient** - Ancient mods
- **Tormentor** - Custom Tormentor
- **Ranged Attack** - Custom ranged attack effects
- **Mega-Kill** - Custom mega-kill announcers
- **Pedestal** - Custom hero pedestals
- **Other** - Miscellaneous mods
- **Backgrounds** - Custom backgrounds
- **River** - Custom river colors
- **Rank Icons** - Custom Rank Icons
- **Item Icons** - Custom Icons for Items
- **Wards** - Custom Wards
- **Couriers** - Custom Couriers
- **Announcers** - Custom Announcers
- **Music** - Custom Music
- **Cursors** - Custom Cursors
- **Pings** - Custom Pings
- **Hero Spells** - Effect sets for hero spells
- **Tools** - Various tools for modding

</details>

---

## 🚀 Quick Start

1. **Browse**: Explore the various categories on the website
2. **Download**: Click on any mod to download it, or add it to cart to make a pack
3. **Install**: Follow the installation instructions in the guides section

### Installation Guide

<details>
<summary><b>How to install mods 🇺🇸</b></summary>

1. **Download the required `.vpk` files**
2. **Create folder `dota_123` in:** `Steam\steamapps\common\dota 2 beta\game\`
3. **Put the downloaded mods in the folder `dota_123`**
4. **Add to launch options: `-language 123`**
   - If you are using **Minify**, place mods in the `dota_minify` folder and add `-language minify` to launch options
 
> **Note:** If files are duplicated, rename the repeated file to `pakXX_dir.vpk`, where XX is 10, 11, 12, 13...99
- You can also use **[VPKMerge](https://h6rd.github.io/Dota2PornFxWeb/?category=tools&mod=VPKMerge+-+Combine+VPKs)** to combine the mods

</details>

<details>
<summary><b>Как установить моды 🇷🇺</b></summary>

1. Скачайте нужный файл `.vpk`
2. Переместите его в папку с языком игры:

Для **русского языка** используйте папку `dota_russian`: `Steam\steamapps\common\dota 2 beta\game\dota_russian\` 
- добавьте в параметры запуска `-language russian`

Для **английского языка** создайте папку `dota_123`: `Steam\steamapps\common\dota 2 beta\game\dota_123\` 
- добавьте в параметры запуска `-language 123`

Если вы используете **Minify**, положите моды в папку  `dota_minify` и добавьте в параметры запуска `-language minify`

> **Важно:** Если файлы дублируются, переименуйте повторяющийся файл в `pakXX_dir.vpk`, где XX = 10, 11, 12, 13...99
- Вы можете использовать **[VPKMerge](https://h6rd.github.io/Dota2PornFxWeb/?category=tools&mod=VPKMerge+-+Combine+VPKs)** для объединения модов

</details>

---

## 🛠️ Tools & Utilities

The project includes several useful tools for modding:

- [**VPKTool**](https://h6rd.github.io/Dota2PornFxWeb/?category=tools&mod=VPKTool+-+Extract+%26+Pack+VPKs): Extract and pack VPK files
- [**VPKMerge**](https://h6rd.github.io/Dota2PornFxWeb/?category=tools&mod=VPKMerge+-+Combine+VPKs): Combine multiple VPKs into one
- [**Compiler**](https://h6rd.github.io/Dota2PornFxWeb/?category=tools&mod=Compiler): Script for compiling: vtex_c, vpcf_c, vsnd_c, vxml_c, vcss_c

---

## 📖 Troubleshooting

<details>
<summary><b>Common issues and solutions</b></summary>

### If the mod doesn't work:
1. Create a folder named `dota_test` in `steamapps\common\dota 2 beta\game\`
2. Place the required mod inside it
3. Add this to your launch options: `-language test`
 - If everything works after that, the issue was in the installation process, check the folder with your language and reinstall the mods 😊
 - If the problem persists, the issue lies within the mod itself 😔

### Mod merging issues:
- When merging mods you may have problems - try installing the buggy mod separately from the merged mods

### Background replacement issues:
- The video must be no longer than 30 seconds
- Format must be `.webm`
- **"An error occurred during playback"**: Try another video
- **"Background doesn't change"**: See the section "If the mod doesn't work" above

### Emblems issues:
- If you don't see the emblems, try entering this command `r_draw_selected_ring 1` in the game console, and also make sure you are not using the Misc Optimization mod in Minify (but this applies to standard emblems)

</details>

---

## 📜 Credits

This project contains content from various sources:

- [**Dota2Changer**](https://dota2changer.com/)
- [**MOR**](https://vk.com/amir4anmods)
<details>
<summary><b>Mod Authors:</b></summary>
  
  - [Egezenn](https://github.com/Egezenn)
  - [Robbyz](https://github.com/robbyz512)
  - [Darkness](https://t.me/Darkness_Logovo)
  - [Defiree](https://vk.com/defiree2mods)
  - [Kisilev](https://vk.com/id363951132)
  - [Amir4an](https://vk.com/amir4an)
  - [Skratch](https://www.youtube.com/@skratch)
  - [Lenz](https://www.youtube.com/@Lenz13377)
  - [Kliromin](https://www.youtube.com/@mrkliromin7723)
  - [Pinkpapa](https://www.patreon.com/Pinkpapa)
  - [laskotdota](https://t.me/laskotdota)
  - [NahuiToSay](https://t.me/NahuiToSay)
  - [lebensinhalt](https://t.me/turnoffyourlebensinhalt)
  - [Kynomi](https://vk.com/kynomi)
  - [Pinkie](https://steamcommunity.com/profiles/76561198142595363)
  - [VPKDota](https://t.me/vpkdota)
  - [ya_lyosha](https://www.twitch.tv/ya_lyosha)
  - [SanyaBane](https://steamcommunity.com/profiles/76561198072955043)
  - [translation](https://t.me/skinDota2byPapich)
  - kebabmaker
  - [YMOM77](https://t.me/YMOM77)
  - [Slipersone](https://t.me/slipersone)
  - [Timmyone](https://t.me/timmyone)
  - [HiddenPool](https://t.me/hiddenpoolcm)
  - [BackSpace](https://t.me/BackSpaceHub)
  - [zzzebra](https://vk.com/zzzfans)
  - [arti4e](https://t.me/d2modsreborn)
  - [Hooorde](https://steamcommunity.com/profiles/76561199405322406)
  - [HyrX](https://steamcommunity.com/profiles/76561198016243370)
  - [Sarath](https://steamcommunity.com/profiles/76561198127797541)
  - [Naix](https://www.youtube.com/channel/UCOfO6lf7jJO88NMlHDBkkCw)
  - [Shiro_R](https://t.me/shiro_rez)
  - [apathydxd](https://discord.com/users/538760177470668810)
</details>

## ⚠️ Disclaimer

**All actions to modify the game files you do at your OWN RISK. In case of a ban, the responsibility lies entirely with YOU.**
This project is not affiliated with Valve or Dota 2. Use at your own discretion.
