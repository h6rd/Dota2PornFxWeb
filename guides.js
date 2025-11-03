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
  'info-and-troubleshooting': {
    title: 'Information & Troubleshooting',
    content: {
      en: [
        {
          icon: 'info',
          title: 'General information',
          steps: [
            { icon: 'keep', text: 'Most of the mods presented here are not mine - they were taken from leaked packs <span id="tg">Dota2Changer</span>' },
            { icon: 'keep', text: 'Mods that don\'t have a <span id="tg">source</span>/<span id="tg">author</span> link at the bottom are my own (except for some mods)' }
          ]
        },
        {
          icon: 'person',
          title: 'Mod authors',
          steps: [
            { icon: 'person', text: '<a href="https://github.com/Egezenn" target="_blank"><span id="tg">Egezenn</span></a> <fcode>Minify Background</fcode>' },
            { icon: 'person', text: '<a href="https://github.com/robbyz512" target="_blank"><span id="tg">Robbyz512</span></a> <fcode>Minify Terrains</fcode>' },
            { icon: 'person', text: '<a href="https://t.me/Darkness_Logovo" target="_blank"><span id="tg">Darkness</span></a>' },
            { icon: 'person', text: '<a href="https://vk.com/defiree2mods" target="_blank"><span id="tg">Defiree2Mods</span></a>' },
            { icon: 'person', text: '<a href="https://vk.com/id363951132" target="_blank"><span id="tg">Kisilev_ind</span></a>' }
          ]
        },
        {
          icon: 'build',
          title: 'If the mod doesn\'t work',
          steps: [
            'Create a folder named <code>dota_test</code> in <code>steamapps\\common\\dota 2 beta\\game\\</code>',
            'Place the required mod inside it',
            'Add this to launch options: <code>-language test</code>',
            { icon: 'sentiment_satisfied', text: 'If everything works after that, the issue was in the installation process, check the folder with your language and reinstall the mods.' },
            { icon: 'sentiment_dissatisfied', text: 'If the problem persists, the issue lies within the mod itself.' }
          ], 
        },
        {
          icon: 'merge',
          title: 'Mod merging issues',
          steps: [
            { icon: 'error', text: 'When merging mods you may have problems - try installing the buggy mod separately from the merged mods'}
          ]
        },
        {
          icon: 'video_library',
          title: 'Background replacement issues',
          steps: [
            'The video must be no longer than 30 seconds',
            'Format must be <span id="tg">.webm</span>',
            'It\'s recommended to use <span id="tg">Convert</span> — Panorama is sensitive to codecs',
            { icon: 'error', text: '<fcode>An error occurred during playback</fcode>: Run the video through <span id="tg">Convert</span>. If that doesn\'t help, try another video.' },
            { icon: 'error', text: '<fcode>Background doesn\'t change</fcode>: See the section <span id="tg">"If the mod doesn\'t work"</span> above.' }
          ]
        }
      ],
      ru: [
        {
          icon: 'info',
          title: 'Общая информация',
          steps: [
            { icon: 'keep', text: 'Большая часть модов, представленных здесь, не являются моими - они были взяты из слитых паков <span id="tg">Dota2Changer</span>' },
            { icon: 'keep', text: 'Моды, у которых внизу нет кнопки <span id="tg">source</span>/<span id="tg">author</span> - мои (за исключением некоторых модов)' }
          ]
        },
        {
          icon: 'person',
          title: 'Авторы модов',
          steps: [
            { icon: 'person', text: '<a href="https://github.com/Egezenn" target="_blank"><span id="tg">Egezenn</span></a> <fcode>Minify Background</fcode>' },
            { icon: 'person', text: '<a href="https://github.com/robbyz512" target="_blank"><span id="tg">Robbyz512</span></a> <fcode>Minify Terrains</fcode>' },
            { icon: 'person', text: '<a href="https://t.me/Darkness_Logovo" target="_blank"><span id="tg">Darkness</span></a>' },
            { icon: 'person', text: '<a href="https://vk.com/defiree2mods" target="_blank"><span id="tg">Defiree2Mods</span></a>' },
            { icon: 'person', text: '<a href="https://vk.com/id363951132" target="_blank"><span id="tg">Kisilev_ind</span></a>' }
          ]
        },
        {
          icon: 'build',
          title: 'Если мод не работает',
          steps: [
            'Создайте папку <code>dota_test</code> в <code>steamapps\\common\\dota 2 beta\\game\\</code>',
            'Поместите туда нужный мод',
            'Добавьте в параметры запуска: <code>-language test</code>',
            { icon: 'sentiment_satisfied', text: 'Если после этого всё заработало - значит ранее была допущена ошибка в установке, проверьте папку с вашим языком и переустановите моды.' },
            { icon: 'sentiment_dissatisfied', text: 'Если проблема сохраняется - дело в самом моде.' }

          ]
        },
        {
          icon: 'merge',
          title: 'Проблемы при совмещении модов',
          steps: [
            { icon: 'error', text: 'При совмещении модов могут возникать проблемы с отображением - попробуйте установить багованный мод отдельно от объединённых.' }
          ]
        },
        {
          icon: 'video_library',
          title: 'Если возникли проблемы с заменой фона',
          steps: [
            'Видео должно быть не длиннее 30 секунд',
            'Формат <span id="tg">.webm</span>',
            'Рекомендуется использовать <span id="tg">Convert</span> - Panorama чувствительна к кодекам',
            { icon: 'error', text: '<fcode>An error occurred during playback</fcode>: Прогоните видос через <span id="tg">Convert</span>. Если не помогло - попробуйте другой видос.' }, 
            { icon: 'error', text: '<fcode>Фон не меняется</fcode>: См. раздел <span id="tg">"Если моды не работают"</span> выше.' },
          ]
        }
      ]
    }
  }
};
