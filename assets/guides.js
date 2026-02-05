const guidesData = {
  "vpk-tool": {
    title: "VPKTool Guide",
    content: {
      en: [
        {
          icon: "folder_zip",
          title: "Unpacking VPK",
          steps: [
            "Unpack the archive",
            "Place .vpk files next to VPKTool.exe",
            "Run VPKTool.exe",
          ],
          result: "VPK files will be unpacked",
        },
        {
          icon: "inventory_2",
          title: "Building VPK",
          steps: ["Place folders/files next to VPKTool.exe", "Run VPKTool.exe"],
          result: "Folders/files will be packed into vpk",
        },
      ],
      ru: [
        {
          icon: "folder_zip",
          title: "Распаковка VPK",
          steps: [
            "Распакуйте архив",
            "Положите .vpk файлы рядом с VPKTool.exe",
            "Запустите VPKTool.exe",
          ],
          result: "VPK файлы будут распакованы",
        },
        {
          icon: "inventory_2",
          title: "Сборка в VPK",
          steps: [
            "Положите папки/файлы рядом с VPKTool.exe",
            "Запустите VPKTool.exe",
          ],
          result: "Папки/файлы будут упакованы в vpk",
        },
      ],
    },
  },
  "vpk-tool-linux": {
    title: "VPKTool Linux Guide",
    content: {
      en: [
        {
          icon: "folder_zip",
          title: "Unpacking VPK",
          steps: [
            "Unpack the archive",
            "Place .vpk files next to VPKTool",
            "Make VPKTool executable: <code>chmod +x VPKTool</code>",
            "Run VPKTool: <code>./VPKTool</code>",
          ],
          result: "VPK files will be unpacked",
        },
        {
          icon: "inventory_2",
          title: "Building VPK",
          steps: [
            "Place folders/files next to VPKTool.exe",
            "Make VPKTool executable: <code>chmod +x VPKTool</code>",
            "Run VPKTool: <code>./VPKTool</code>",
          ],
          result: "Folders/files will be packed into pak20_dir.vpk",
        },
      ],
      ru: [
        {
          icon: "folder_zip",
          title: "Распаковка VPK",
          steps: [
            "Распакуйте архив",
            "Положите .vpk файлы рядом с VPKTool",
            "Сделайте VPKTool исполняемым: <code>chmod +x VPKTool</code>",
            "Запустите VPKTool: <code>./VPKTool</code>",
          ],
          result: "VPK файлы будут распакованы",
        },
        {
          icon: "inventory_2",
          title: "Сборка в VPK",
          steps: [
            "Положите папки/файлы рядом с VPKTool",
            "Сделайте VPKTool исполняемым: <code>chmod +x VPKTool</code>",
            "Запустите VPKTool: <code>./VPKTool</code>",
          ],
          result: "Папки/файлы будут упакованы в pak20_dir.vpk",
        },
      ],
    },
  },
  "vpk-merge": {
    title: "VPKMerge Guide",
    content: {
      en: [
        {
          steps: [
            "Unpack the archive",
            "Place the vpk files in the folder next to VPKMerge.exe",
            "Launch VPKMerge.exe",
          ],
          result: "It will combine all VPKs into pak10_dir.vpk",
          warning:
            "Doesn't work with packs from dota2changer - can't merge items_game.txt files!",
        },
      ],
      ru: [
        {
          warning:
            "Не работает с паками Dota2Changer - не может объединить файлы items_game.txt!",
          steps: [
            "Распакуйте архив",
            "Поместите vpk файлы в папку рядом с VPKMerge.exe",
            "Запустите VPKMerge.exe",
          ],
          result: "Он объединит все vpk в pak10_dir.vpk",
        },
      ],
    },
  },
  "vpk-merge-linux": {
    title: "VPKMerge Linux Guide",
    content: {
      en: [
        {
          steps: [
            "Unpack the archive",
            "Place the vpk files in the folder next to VPKMerge",
            "Make VPKMerge executable: <code>chmod +x VPKMerge</code>",
            "Run VPKMerge: <code>./VPKMerge</code>",
          ],
          result: "It will combine all VPKs into pak10_dir.vpk",
          warning:
            "Doesn't work with packs from dota2changer - can't merge items_game.txt files!",
        },
      ],
      ru: [
        {
          steps: [
            "Распакуйте архив",
            "Поместите vpk файлы в папку рядом с VPKMerge",
            "Сделайте VPKMerge исполняемым: <code>chmod +x VPKMerge</code>",
            "Запустите VPKMerge: <code>./VPKMerge</code>",
          ],
          result: "Он объединит все vpk в pak10_dir.vpk",
          warning:
            "Не работает с паками Dota2Changer - не может объединить файлы items_game.txt!",
        },
      ],
    },
  },
  weather: {
    title: "Weather Changer Guide",
    content: {
      en: [
        {
          info: "Update guide in archive",
          infoPosition: "bottom",
          steps: [
            "Unpack the archive",
            "Run Run.bat",
            "Doesn't let you enter the match? - use Fix MM",
          ],
        },
      ],
      ru: [
        {
          info: "Гайд по обновлению в архиве",
          infoPosition: "bottom",
          steps: [
            "Распакуйте архив",
            "Запустите Run.bat",
            "Не позволяет войти в матч? — используйте Fix MM",
          ],
        },
      ],
    },
  },
  install: {
    title: "Install Mods",
    content: {
      en: [
        {
          steps: [
            "Download the required .vpk files",
            "Create folder <code>dota_123</code> in <code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game</code>",
            "Put the downloaded mods in the folder <code>dota_123</code>",
            "Add to launch options: <code>-language 123</code>",
          ],
          info: 'You can also use <a href="https://h6rd.github.io/Dota2PornFxWeb/?category=tools&mod=VPKMerge+-+Combine+VPKs" target="_blank"><span id="tg"><span id="tg">VPKMerge</span></a> to combine the mods',
          infoPosition: "bottom",
          warning:
            'If files are duplicated, rename the repeated file to pak<span id="tg">XX</span>_dir.vpk, where <span id="tg">XX</span> is 10, 11, 12, 13...99.',
        },
      ],
      ru: [
        {
          steps: [
            "Скачайте нужные .vpk файлы",
            "Переместите их в папку <code>dota_russian</code> по пути <code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_russian\\</code>",
            "В параметрах запуска добавьте: <code>-language russian</code>",
          ],
          info: 'Вы можете использовать <a href="https://h6rd.github.io/Dota2PornFxWeb/?category=tools&mod=VPKMerge+-+Combine+VPKs" target="_blank"><span id="tg"><span id="tg">VPKMerge</span></a> для объединения модов',
          infoPosition: "bottom",
          warning:
            'Если файлы дублируются, переименуйте повторяющийся файл в pak<span id="tg">XX</span>_dir.vpk, где <span id="tg">XX</span> = 10, 11, 12, 13...99',
        },
      ],
    },
  },
  "install-heroes": {
    title: "Install Heroes Mods",
    content: {
      en: [
        {
          steps: [
            "Download the required mods",
            "Unzip the archive, it contains vpk",
            "Create folder <code>dota_123</code> in <code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game</code>",
            "Put the vpk in the folder <code>dota_123</code>",
            "Add to launch options: <code>-language 123</code>",
          ],
          info: 'You can also use <a href="https://h6rd.github.io/Dota2PornFxWeb/?category=tools&mod=VPKMerge+-+Combine+VPKs" target="_blank"><span id="tg"><span id="tg">VPKMerge</span></a> to combine the mods',
          infoPosition: "bottom",
          warning:
            'If files are duplicated, rename the repeated file to pak<span id="tg">XX</span>_dir.vpk, where <span id="tg">XX</span> is 10, 11, 12, 13...99.',
        },
      ],
      ru: [
        {
          steps: [
            "Скачайте нужные моды",
            "Распакуйте архив, в нем лежит vpk",
            "Переместите vpk в папку <code>dota_russian</code> по пути <code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_russian\\</code>",
            "В параметрах запуска добавьте: <code>-language russian</code>",
          ],
          info: 'Вы можете использовать <a href="https://h6rd.github.io/Dota2PornFxWeb/?category=tools&mod=VPKMerge+-+Combine+VPKs" target="_blank"><span id="tg"><span id="tg">VPKMerge</span></a> для объединения модов',
          infoPosition: "bottom",
          warning:
            'Если файлы дублируются, переименуйте повторяющийся файл в pak<span id="tg">XX</span>_dir.vpk, где <span id="tg">XX</span> = 10, 11, 12, 13...99',
        },
      ],
    },
  },
  "install-terrains": {
    title: "Install Terrains Mods",
    content: {
      en: [
        {
          steps: [
            "Download the required mod",
            "It will be a vpk or an archive with a maps folder inside",
            "Create folder <code>dota_123</code> in <code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game</code>",
            "Move the vpk or maps folder from the archive to the folder <code>dota_123</code>",
            "Add to launch options: <code>-language 123</code>",
          ],
          infoPosition: "bottom",
          warning:
            'If files are duplicated, rename the repeated file to pak<span id="tg">XX</span>_dir.vpk, where <span id="tg">XX</span> is 10, 11, 12, 13...99.',
        },
      ],
      ru: [
        {
          steps: [
            "Скачайте нужный мод",
            "Он будет в виде vpk, или архива с папкой maps внутри",
            "Переместите vpk или папку maps из архива в папку <code>dota_russian</code> по пути <code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_russian\\</code>",
            "В параметрах запуска добавьте: <code>-language russian</code>",
          ],
          infoPosition: "bottom",
          warning:
            'Если файлы дублируются, переименуйте повторяющийся файл в pak<span id="tg">XX</span>_dir.vpk, где <span id="tg">XX</span> = 10, 11, 12, 13...99',
        },
      ],
    },
  },
  "info-and-troubleshooting": {
    title: "Information & Troubleshooting",
    content: {
      en: [
        {
          icon: "info",
          title: "General information",
          steps: [
            {
              icon: "keep",
              text: 'Most of the mods presented here are not mine - they were taken from leaked packs <a href="https://dota2changer.com/" target="_blank"><span id="tg">Dota2Changer</span></a>',
            },
            {
              icon: "keep",
              text: 'Mods that don\'t have a <span id="tg">source</span>/<span id="tg">author</span> link at the bottom are my own (except for some mods)',
            },
          ],
        },
        {
          icon: "person",
          title: "Mod authors",
          steps: [
            {
              icon: "person",
              text: '<a href="https://github.com/Egezenn" target="_blank"><span id="tg">Egezenn</span></a> <fcode>Minify Background</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://github.com/robbyz512" target="_blank"><span id="tg">Robbyz512</span></a> <fcode>Minify Terrains & Trees</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://t.me/Darkness_Logovo" target="_blank"><span id="tg">Darkness🖤</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://vk.com/defiree2mods" target="_blank"><span id="tg">Defiree2Mods</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://vk.com/id363951132" target="_blank"><span id="tg">Kisilev_ind</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://vk.com/amir4an" target="_blank"><span id="tg">Amir4an</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://www.youtube.com/@mrkliromin7723" target="_blank"><span id="tg">MrKliromin</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://www.youtube.com/@skratch" target="_blank"><span id="tg">Skratch</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://t.me/hitman47attacks" target="_blank"><span id="tg">hitman47attacks</span></a> <fcode>Arcanas Items</fcode>',
            },
          ],
        },
        {
          icon: "build",
          title: "If the mod doesn't work",
          steps: [
            "Create a folder named <code>dota_test</code> in <code>steamapps\\common\\dota 2 beta\\game\\</code>",
            "Place the required mod inside it",
            "Add this to launch options: <code>-language test</code>",
            {
              icon: "sentiment_satisfied",
              text: "If everything works after that, the issue was in the installation process, check the folder with your language and reinstall the mods.",
            },
            {
              icon: "sentiment_dissatisfied",
              text: "If the problem persists, the issue lies within the mod itself.",
            },
          ],
        },
        {
          icon: "merge",
          title: "Mod merging issues",
          steps: [
            {
              icon: "error",
              text: "When merging mods you may have problems - try installing the buggy mod separately from the merged mods",
            },
          ],
        },
        {
          icon: "video_library",
          title: "Background replacement issues",
          steps: [
            "The video must be no longer than 30 seconds",
            'Format must be <span id="tg">.webm</span>',
            {
              icon: "error",
              text: "<fcode>An error occurred during playback</fcode>: Try another video.",
            },
            {
              icon: "error",
              text: '<fcode>Background doesn\'t change</fcode>: See the section <span id="tg">"If the mod doesn\'t work"</span> above.',
            },
          ],
        },
      ],
      ru: [
        {
          icon: "info",
          title: "Общая информация",
          steps: [
            {
              icon: "keep",
              text: 'Большая часть модов, представленных здесь, не являются моими - они были взяты из слитых паков <a href="https://dota2changer.com/" target="_blank"><span id="tg">Dota2Changer</span></a>',
            },
            {
              icon: "keep",
              text: 'Моды, у которых внизу нет кнопки <span id="tg">source</span>/<span id="tg">author</span> - мои (за исключением некоторых модов)',
            },
          ],
        },
        {
          icon: "person",
          title: "Авторы модов",
          steps: [
            {
              icon: "person",
              text: '<a href="https://github.com/Egezenn" target="_blank"><span id="tg">Egezenn</span></a> <fcode>Minify Background</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://github.com/robbyz512" target="_blank"><span id="tg">Robbyz512</span></a> <fcode>Minify Terrains & Trees</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://t.me/Darkness_Logovo" target="_blank"><span id="tg">Darkness🖤</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://vk.com/defiree2mods" target="_blank"><span id="tg">Defiree2Mods</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://vk.com/id363951132" target="_blank"><span id="tg">Kisilev_ind</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://vk.com/amir4an" target="_blank"><span id="tg">Amir4an</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://www.youtube.com/@mrkliromin7723" target="_blank"><span id="tg">MrKliromin</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://www.youtube.com/@skratch" target="_blank"><span id="tg">Skratch</span></a> <fcode>Heroes</fcode>',
            },
            {
              icon: "person",
              text: '<a href="https://t.me/hitman47attacks" target="_blank"><span id="tg">hitman47attacks</span></a> <fcode>Arcanas Items</fcode>',
            },
          ],
        },
        {
          icon: "build",
          title: "Если мод не работает",
          steps: [
            "Создайте папку <code>dota_test</code> в <code>steamapps\\common\\dota 2 beta\\game\\</code>",
            "Поместите туда нужный мод",
            "Добавьте в параметры запуска: <code>-language test</code>",
            {
              icon: "sentiment_satisfied",
              text: "Если после этого всё заработало - значит ранее была допущена ошибка в установке, проверьте папку с вашим языком и переустановите моды.",
            },
            {
              icon: "sentiment_dissatisfied",
              text: "Если проблема сохраняется - дело в самом моде.",
            },
          ],
        },
        {
          icon: "merge",
          title: "Проблемы при совмещении модов",
          steps: [
            {
              icon: "error",
              text: "При совмещении модов могут возникать проблемы с отображением - попробуйте установить багованный мод отдельно от объединённых.",
            },
          ],
        },
        {
          icon: "video_library",
          title: "Если возникли проблемы с заменой фона",
          steps: [
            "Видео должно быть не длиннее 30 секунд",
            'Формат <span id="tg">.webm</span>',
            {
              icon: "error",
              text: "<fcode>An error occurred during playback</fcode>: Попробуйте другой видос.",
            },
            {
              icon: "error",
              text: '<fcode>Фон не меняется</fcode>: См. раздел <span id="tg">"Если моды не работают"</span> выше.',
            },
          ],
        },
      ],
    },
  },
  "background-changer": {
    title: "Background Changer Guide",
    content: {
      en: [
        {
          icon: "auto_fix_high",
          title: "Recommended method",
          steps: [
            "Place video next to Changer.exe (I advise you to use 1920x1080, extensions: mp4, avi, mkv, mov, wmv, flv, webm)",
            "Run <fcode>Changer.exe</fcode> and wait for the end (the longer the video, the longer it takes to process)",
            "Press 1 - to replace full background, 2 - for the current patch/event (may not work).",
            "Put <fcode>pak33_dir.vpk</fcode> into <fcode>dota_123</fcode> game language folder",
          ],
        },
        {
          icon: "image",
          title: "If you need a picture",
          steps: [
            "Put an image (jpg, jpeg, png, bmp, gif) next to <fcode>Changer.exe</fcode>",
            "Run <fcode>Changer.exe</fcode> and wait for it to finish",
            "Put <fcode>pak33_dir.vpk</fcode> into <fcode>dota_123</fcode> game language folder",
          ],
        },
        {
          icon: "video_library",
          title: "Manual Method",
          steps: [
            "Find or make a video in webm format (1920x1080 & 5-10sec recommended)",
            'You can use <a href="https://online-video-cutter.com" target="_blank"><span id="tg">online-video-cutter.com</span></a> to create a video (e.g. crop to 16:9)',
            'If it\'s heavy, you can compress it here: <a href="https://ezgif.com/video-compressor" target="_blank"><span id="tg">ezgif.com/video-compressor</span></a>',
            "Rename it to <code>zxc.webm</code> and place it next to <code>Changer.exe</code>",
            "Run <fcode>Changer.exe</fcode>",
            "Press 1 - to replace full background, 2 - for the current patch/event (may not work).",
            "Put <fcode>pak33_dir.vpk</fcode> into <fcode>dota_123</fcode> game language folder",
          ],
        },
      ],
      ru: [
        {
          icon: "auto_fix_high",
          title: "Рекомендованный метод",
          steps: [
            "Положите видео рядом с <fcode>Changer.exe</fcode> (советую использовать 1920x1080, расширения: mp4, avi, mkv, mov, wmv, flv, webm)",
            "Запустите <fcode>Changer.exe</fcode> и дождитесь окончания (чем длинее видос, тем дольше он обрабатывает его)",
            "Нажмите 1 - для замены всего фона, 2 - под текущий патч/ивент (может не работать)",
            "Готовый <fcode>pak33_dir.vpk</fcode> поместите в <code>dota_russian</code> или <code>dota_123</code>",
          ],
        },
        {
          icon: "image",
          title: "Если нужна фотка",
          steps: [
            "Положите изображение (jpg, jpeg, png, bmp, gif) рядом с <fcode>Changer.exe</fcode>",
            "Запустите <fcode>Changer.exe</fcode> и дождитесь окончания",
            "Готовый <fcode>pak33_dir.vpk</fcode> поместите в <code>dota_russian</code> или <code>dota_123</code>",
          ],
        },
        {
          icon: "video_library",
          title: "Ручной метод",
          steps: [
            "Найдите или сделайте видос в формате webm (рекомендую 1920x1080, 5-10 сек)",
            'Для создания видоса можете заюзать <a href="https://online-video-cutter.com" target="_blank"><span id="tg">online-video-cutter.com</span></a>',
            'Если дохуя весит, то можете сжать его вот тут <a href="https://ezgif.com/video-compressor" target="_blank"><span id="tg">ezgif.com/video-compressor</span></a>',
            "Переименуйте в <code>zxc.webm</code> и положите рядом с <code>Changer.exe/</code>",
            "Запустите <fcode>Changer.exe</fcode>",
            "Нажмите 1 - для замены всего фона, 2 - под текущий патч/ивент (может не работать)",
            "Готовый <fcode>pak33_dir.vpk</fcode> поместите в <code>dota_russian</code> или <code>dota_123</code>",
          ],
        },
      ],
    },
  },
  "background-changer-linux": {
    title: "Background Changer Linux Guide",
    content: {
      en: [
        {
          icon: "video_library",
          title: "Manual Method",
          steps: [
            "Find or make a video in webm format (1920x1080 & 5-10sec recommended)",
            'You can use <a href="https://online-video-cutter.com" target="_blank"><span id="tg">online-video-cutter.com</span></a> to create a video (e.g. crop to 16:9)',
            'If it\'s heavy, you can compress it here: <a href="https://ezgif.com/video-compressor" target="_blank"><span id="tg">ezgif.com/video-compressor</span></a>',
            "Rename it to <code>zxc.webm</code> and drop it into <code>pak33_dir/zxc/</code>",
            "Make Create executable: <code>chmod +x Create</code>",
            "Run <fcode>./Create</fcode>",
            "Put <fcode>pak33_dir.vpk</fcode> into <fcode>dota_123</fcode> game language folder",
          ],
        },
        {
          icon: "auto_fix_high",
          title: "Using Convert Tool (Recommended)",
          steps: [
            "Put video in <fcode>Convert</fcode> folder (I advise you to use 1920x1080, extensions: mp4, avi, mkv, mov, wmv, flv. it won't work if you put zxc.webm there)",
            "Make Convert executable: <code>chmod +x Convert</code>",
            "Run <fcode>./Convert</fcode> and wait for the end (the longer the video, the longer it takes to process)",
            "It will move the created video to <fcode>pak33_dir/zxc/</fcode>, you only need to run <code>./Create</code>",
            "Put <fcode>pak33_dir.vpk</fcode> into <fcode>dota_123</fcode> game language folder",
          ],
        },
        {
          icon: "image",
          title: "If you need a picture",
          steps: [
            "Put the image (jpg, jpeg, png, bmp, gif) in the <fcode>Convert</fcode> folder",
            "Make Convert executable: <code>chmod +x Convert</code> and wait for it to finish",
            "It will move the created video to <fcode>pak33_dir/zxc/</fcode>, you only need to run <code>./Create</code>",
          ],
        },
      ],
      ru: [
        {
          icon: "video_library",
          title: "Ручной метод",
          steps: [
            "Найдите или сделайте видос в формате webm (рекомендую 1920x1080, 5-10 сек)",
            'Для создания видоса можете заюзать <a href="https://online-video-cutter.com" target="_blank"><span id="tg">online-video-cutter.com</span></a>',
            'Если дохуя весит, то можете сжать его вот тут <a href="https://ezgif.com/video-compressor" target="_blank"><span id="tg">ezgif.com/video-compressor</span></a>',
            "Переименуйте в <code>zxc.webm</code> и положите в папку <code>pak33_dir/zxc/</code>",
            "Сделайте Create исполняемым: <code>chmod +x Create</code>",
            "Запустите Create: <code>./Create</code>",
            "Готовый <fcode>pak33_dir.vpk</fcode> поместите в <code>dota_russian</code> или <code>dota_123</code>",
          ],
        },
        {
          icon: "auto_fix_high",
          title: "Использование Convert (Рекомендуется)",
          steps: [
            "Положите видео в папку <fcode>Convert</fcode> (советую использовать 1920x1080, расширения: mp4, avi, mkv, mov, wmv, flv, webm. нихуя не сработает если туда положить zxc.webm)",
            "Сделайте Convert исполняемым: <code>chmod +x Convert</code> и дождитесь окончания (чем длинее видос, тем дольше он обрабатывает его)",
            "Он переместит созданный видос в <fcode>pak33_dir/zxc/</fcode>, остается только запустить <code>./Create</code>",
            "Готовый <fcode>pak33_dir.vpk</fcode> поместите в <code>dota_russian</code> или <code>dota_123</code>",
          ],
        },
        {
          icon: "image",
          title: "Если нужна фотка",
          steps: [
            "Положите изображение (jpg, jpeg, png, bmp, gif) в папку <fcode>Convert</fcode>",
            "Сделайте Convert исполняемым: <code>chmod +x Convert</code>",
            "Запустите <code>./Convert</code> и дождитесь окончания",
            "Он переместит созданный видос в <fcode>pak33_dir/zxc/</fcode>, остается только запустить <code>./Create</code>",
            "Готовый <fcode>pak33_dir.vpk</fcode> поместите в <code>dota_russian</code> или <code>dota_123</code>",
          ],
        },
      ],
    },
  },
  "minimap-icons": {
    title: "Minimap Icons",
    content: {
      en: [
        {
          icon: "settings",
          title: "Creating Сfg",
          steps: [
            "Open <code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\cfg</code>",
            "Create a new text file",
            "Rename file to <code>autoexec.cfg</code>",
            "Add to launch options: <code>+exec autoexec.cfg</code>",
          ],
          info: "Everything that will be written below must be entered in this config",
          infoPosition: "bottom",
        },
        {
          icon: "palette",
          title: "Colors Allies/Enemies on minimap and hover",
          info: 'RGB colors here <a href="https://htmlcolorcodes.com" target="_blank"><span id="tg">htmlcolorcodes.com</span></a>',
          steps: [
            {
              icon: "code",
              text: "Allies <code>dota_friendly_color 255 255 0;</code>",
            },
            {
              icon: "code",
              text: "Enemies <code>dota_enemy_color 255 0 255;</code>",
            },
          ],
        },
        {
          icon: "track_changes",
          title: "Size runes on minimap",
          steps: [
            { icon: "code", text: "<code>dota_minimap_rune_size 500;</code>" },
          ],
        },
        {
          icon: "zoom_in",
          title: "Size creeps on minimap",
          steps: [
            {
              icon: "code",
              text: "<code>dota_minimap_creep_scale 1.3;</code>",
            },
          ],
        },
      ],
      ru: [
        {
          icon: "settings",
          title: "Создание cfg",
          steps: [
            "Откройте <code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\cfg</code>",
            "Создайте новый текстовый файл",
            "Переименуйте файл в <code>autoexec.cfg</code>",
            "В параметрах запуска добавьте: <code>+exec autoexec.cfg</code>",
          ],
          info: "Все, что будет написано ниже, необходимо писать в этот конфиг",
          infoPosition: "bottom",
        },
        {
          icon: "palette",
          title: "Цвета Союзников/Врагов на миникарте и наведении",
          info: 'Цвета RGB брать тут <a href="https://htmlcolorcodes.com" target="_blank"><span id="tg">htmlcolorcodes.com</span></a>',
          steps: [
            {
              icon: "code",
              text: "Союзники <code>dota_friendly_color 255 255 0;</code>",
            },
            {
              icon: "code",
              text: "Враги <code>dota_enemy_color 255 0 255;</code>",
            },
          ],
        },
        {
          icon: "track_changes",
          title: "Размер рун на миникарте",
          steps: [
            { icon: "code", text: "<code>dota_minimap_rune_size 500;</code>" },
          ],
        },
        {
          icon: "zoom_in",
          title: "Размер крипов на миникарте",
          steps: [
            {
              icon: "code",
              text: "<code>dota_minimap_creep_scale 1.3;</code>",
            },
          ],
        },
      ],
    },
  },
  warning: {
    title: "Important Safety Warning",
    content: {
      en: [
        {
          title: "Warning",
          icon: "warning",
          steps: [
            {
              icon: "exclamation",
              text: "This tool patches the <fcode>dota.signatures</fcode> and <fcode>gameinfo_branchspecific.gi</fcode> files. This is not safe. Use at your own risk, I am not responsible for any consequences.",
            },
          ],
          info: "No one has been banned for this yet, but who knows what Valve might come up with",
          infoPosition: "bottom",
        },
      ],
      ru: [
        {
          title: "Предупреждение",
          icon: "warning",
          steps: [
            {
              icon: "exclamation",
              text: "Этот инструмент патчит файлы <fcode>dota.signatures</fcode> и <fcode>gameinfo_branchspecific.gi</fcode>, это не безопасно. Используйте на свой страх и риск, я не несу ответственности за последствия.",
            },
          ],
          info: "За это ещё никого не банили, но кто знает, что Valve может придумать",
          infoPosition: "bottom",
        },
      ],
    },
  },
  "couriers-info": {
    title: "Courier Info",
    content: {
      en: [
        {
          title: "Effects",
          icon: "wand_stars",
          steps: [
            {
              icon: "priority_high",
              text: "This courier has effects. For them to work, you must select the courier <code>Dolfrat and Roshinante Scholar Edition</code> - Reward for completing the tier 1 welcoming quests",
            },
          ],
          info: "If you do not have this courier, choose a standard courier, but it will be without effects",
          infoPosition: "bottom",
        },
      ],
      ru: [
        {
          title: "Эффекты",
          icon: "wand_stars",
          steps: [
            {
              icon: "priority_high",
              text: "Этот курьер имеет эффекты. Чтобы они работали, необходимо выбрать курьера <code>Dolfrat and Roshinante Scholar Edition</code> - Его дают за выполнение заданий обучения 1 разряда",
            },
          ],
          info: "Если у вас нет этого курьера, выберите стандартного курьера, но он будет без эффектов",
          infoPosition: "bottom",
        },
      ],
    },
  },
  "compiler": {
    title: "Compiler Guide",
    content: {
      en: [
        {
          title: "Script for compiling: vtex_c, vpcf_c, vsnd_c, vxml_c, vcss_c",
          icon: "build",
          steps: [
            "Download <a href='https://dota2.fandom.com/wiki/Dota_2_Workshop_Tools#Installation' target='_blank'><span id='tg'>Dota 2 Workshop Tools DLC</span></a>",
            "Place <fcode>png</fcode>, <fcode>mp3/wav</fcode>, <fcode>vpcf</fcode>, <fcode>css</fcode>, <fcode>xml</fcode> files next to Compiler.exe",
            "Run Compiler.exe",
          ],
          result: "Files will be compiled",
        }
      ],
      ru: [
        {
          title: "Скрипт для компиляции: vtex_c, vpcf_c, vsnd_c, vxml_c, vcss_c",
          icon: "build",
          steps: [
            "Установите <a href='https://dota2.fandom.com/ru/wiki/%D0%98%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D1%8B_%D0%9C%D0%B0%D1%81%D1%82%D0%B5%D1%80%D1%81%D0%BA%D0%BE%D0%B9_Dota_2#%D0%A3%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0' target='_blank'><span id='tg'>Dota 2 Workshop Tools DLC</span></a>",
            "Положите <fcode>png</fcode>, <fcode>mp3/wav</fcode>, <fcode>vpcf</fcode>, <fcode>css</fcode>, <fcode>xml</fcode> файлы рядом с Compiler.exe",
            "Запустите Compiler.exe",
          ],
          result: "Файлы будут скомпилированы",
        }
      ],
    },
  },
};
