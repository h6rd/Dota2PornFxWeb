const guidesData = {
  'vpk-tool': {
    title: 'VPKTool Guide',
    content: {
      en: [
        {
          icon: 'folder_zip',
          title: 'Unpacking VPK',
          steps: [
            'Unpack the archive',
            'Place .vpk files next to VPKTool.exe',
            'Run VPKTool.exe',
          ],
          result: 'VPK files will be unpacked'
        },
        {
          icon: 'inventory_2',
          title: 'Building VPK',
          steps: [
            'Place folders/files next to VPKTool.exe',
            'Run VPKTool.exe',
          ],
          result: 'Folders/files will be packed into pak20_dir.vpk'
        }
      ],
      ru: [
        {
          icon: 'folder_zip',
          title: 'Распаковка VPK',
          steps: [
            'Распакуйте архив',
            'Положите .vpk файлы рядом с VPKTool.exe',
            'Запустите VPKTool.exe',
          ],
          result: 'VPK файлы будут распакованы'
        },
        {
          icon: 'inventory_2',
          title: 'Сборка в VPK',
          steps: [
            'Положите папки/файлы рядом с VPKTool.exe',
            'Запустите VPKTool.exe',
          ],
          result: 'Папки/файлы будут упакованы в pak20_dir.vpk'
        }
      ]
    }
  },
  'vpk-merge': {
    title: 'VPKMerge Guide',
    content: {
      en: [
        {
          steps: [
            'Unpack the archive',
            'Place the vpk files in the folder next to VPKMerge.exe',
            'Launch VPKMerge.exe',
          ],
          result: 'It will combine all VPKs into pak10_dir.vpk',
          warning: "Doesn't work with packs from dota2changer - can't merge items_game.txt files!",
        },
      ],
      ru: [
        {
          warning: "Не работает с паками Dota2Changer - не может объединить файлы items_game.txt!",
          steps: [
            'Распакуйте архив',
            'Поместите vpk файлы в папку рядом с VPKMerge.exe',
            'Запустите VPKMerge.exe',
          ],
          result: 'Он объединит все vpk в pak10_dir.vpk'
        },
      ]
    }
  },
  'weather': {
    title: 'Weather Changer Guide',
    content: {
      en: [
        {
          warning: "Updates are released rarely",
          steps: [
            'Unpack the archive',
            'Run Run.bat',
            "Doesn't let you enter the match? - use Fix MM",
          ]
        },
      ],
      ru: [
        {
          warning: "Обновления выходят редко",
          steps: [
            'Распакуйте архив',
            'Запустите Run.bat',
            'Не позволяет войти в матч? — используйте Fix MM',
          ]
        },
      ]
    }
  },
  'install': {
    title: 'Install Mods Guide',
    content: {
      en: [
        {
          steps: [
            'Download the required .vpk files',
            'Create folder <code>dota_123</code> in <code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game</code>',
            'Put the downloaded mods in the folder <code>dota_123</code>',
            'Add to launch options: <code>-language 123</code>',
          ],
          result: 'Done! You can also use <span id="tg">VPKMerge</span> to combine the mods.',
          warning: 'If files are duplicated, rename the repeated file to pak<span id="tg">XX</span>_dir.vpk, where <span id="tg">XX</span> is 10, 11, 12, 13...99.',
        }
      ],
      ru: [
        {
          steps: [
            'Скачайте нужные .vpk файлы',
            'Переместите их в папку <code>dota_russian</code> по пути <code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_russian\\</code>',
            'В параметрах запуска добавьте: <code>-language russian</code>',
          ],
          result: 'Готово! Вы можете использовать <span id="tg">VPKMerge</span> для объединения модов.',
          warning: 'Если файлы дублируются, переименуйте повторяющийся файл в pak<span id="tg">XX</span>_dir.vpk, где <span id="tg">XX</span> = 10, 11, 12, 13...99'
        }
      ]
    }
  },
};
