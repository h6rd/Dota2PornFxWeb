let cart = [];
const MAX_CART_ITEMS = 100;

let savedAssemblies = [];
const MAX_ASSEMBLIES = 10;

function loadAssemblies() {
    const saved = localStorage.getItem('savedAssemblies');
    if (saved) {
        try {
            savedAssemblies = JSON.parse(saved);
        } catch (e) {
            savedAssemblies = [];
        }
    }
}

function saveAssemblies() {
    localStorage.setItem('savedAssemblies', JSON.stringify(savedAssemblies));
}

function saveCurrentAssembly(name) {
    if (!name || !name.trim()) {
        showToast('Enter a name');
        return;
    }

    if (cart.length === 0) {
        showToast('Cart is empty');
        return;
    }

    if (savedAssemblies.length >= MAX_ASSEMBLIES) {
        showToast(`Maximum ${MAX_ASSEMBLIES} packs allowed`);
        return;
    }

    const assembly = {
        id: Date.now().toString(),
        name: name.trim(),
        items: [...cart],
        date: new Date().toISOString()
    };

    savedAssemblies.push(assembly);
    saveAssemblies();
    renderAssembliesList();
    showToast(`Pack <span style="color: var(--md-sys-color-shit); font-weight: bold;">${name}</span> saved`);
    vibrate(20);
}

function loadAssembly(assemblyId) {
    const assembly = savedAssemblies.find(a => a.id === assemblyId);
    if (!assembly) return;

    cart = [...assembly.items];
    saveCart();
    updateCartBadge();
    renderCartItems();
    updateCartButtons();
    renderAssembliesList();
    showToast(`Loaded <span style="color: var(--md-sys-color-shit); font-weight: bold;">${assembly.name}</span> pack`);
    vibrate(10);
}

function deleteAssembly(assemblyId, event) {
    if (event) {
        event.stopPropagation();
    }

    const assembly = savedAssemblies.find(a => a.id === assemblyId);
    if (!assembly) return;

    savedAssemblies = savedAssemblies.filter(a => a.id !== assemblyId);
    saveAssemblies();
    renderAssembliesList();
    showToast(`Deleted <span style="color: var(--md-sys-color-shit); font-weight: bold;">${assembly.name}</span> pack`);
    vibrate(10);
}

function renderAssembliesList() {
    const assembliesContainer = document.getElementById('assembliesList');
    if (!assembliesContainer) return;

    if (savedAssemblies.length === 0) {
        assembliesContainer.innerHTML = `
            <div class="assemblies-empty">
                <span class="material-symbols-rounded">inventory_2</span>
                <p>No saved packs</p>
            </div>
        `;
        return;
    }

    assembliesContainer.innerHTML = '';

    savedAssemblies.forEach(assembly => {
        const assemblyItem = document.createElement('div');
        assemblyItem.className = 'assembly-item';

        const isSelected = isAssemblyMatchingCurrentCart(assembly);
        if (isSelected) {
            assemblyItem.classList.add('selected');
        }

        const date = new Date(assembly.date);
        const dateStr = date.toLocaleDateString();

        assemblyItem.innerHTML = `
        <div class="assembly-info">
            <h4 class="assembly-name">${escapeHtml(assembly.name)}</h4>
            <p class="assembly-meta">${assembly.items.length} mod${assembly.items.length !== 1 ? 's' : ''} • ${dateStr}</p>
        </div>
        <button class="assembly-share-btn" data-id="${assembly.id}">
            <span class="material-symbols-rounded">share</span>
        </button>
        <button class="assembly-edit-btn" data-id="${assembly.id}">
            <span class="material-symbols-rounded">edit</span>
        </button>
        <button class="assembly-delete-btn" data-id="${assembly.id}">
            <span class="material-symbols-rounded">delete</span>
        </button>
        `;

        assemblyItem.addEventListener('click', (e) => {
            if (!e.target.closest('.assembly-edit-btn') && !e.target.closest('.assembly-delete-btn')) {
                loadAssembly(assembly.id);
            }
        });

        const editBtn = assemblyItem.querySelector('.assembly-edit-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditAssemblyDialog(assembly.id);
        });

        const shareBtn = assemblyItem.querySelector('.assembly-share-btn');
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            shareAssembly(assembly.id);
        });

        const deleteBtn = assemblyItem.querySelector('.assembly-delete-btn');
        deleteBtn.addEventListener('click', (e) => deleteAssembly(assembly.id, e));

        assembliesContainer.appendChild(assemblyItem);
    });
}

function isAssemblyMatchingCurrentCart(assembly) {
    if (cart.length !== assembly.items.length) return false;

    const cartIds = cart.map(item => item.id).sort();
    const assemblyIds = assembly.items.map(item => item.id).sort();

    return JSON.stringify(cartIds) === JSON.stringify(assemblyIds);
}

function showEditAssemblyDialog(assemblyId) {
    const assembly = savedAssemblies.find(a => a.id === assemblyId);
    if (!assembly) return;

    const dialog = document.createElement('div');
    dialog.className = 'assembly-dialog-overlay';
    dialog.innerHTML = `
        <div class="assembly-dialog">
            <h3>Edit pack name</h3>
            <input type="text" class="assembly-name-input" placeholder="Enter pack name..." maxlength="30" value="${escapeHtml(assembly.name)}">
            <div class="assembly-dialog-actions">
                <button class="assembly-cancel-btn">Cancel</button>
                <button class="assembly-save-btn">Save</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    const input = dialog.querySelector('.assembly-name-input');
    const saveBtn = dialog.querySelector('.assembly-save-btn');
    const cancelBtn = dialog.querySelector('.assembly-cancel-btn');

    const closeDialog = () => {
        dialog.classList.remove('active');
        setTimeout(() => dialog.remove(), 200);
    };

    saveBtn.addEventListener('click', () => {
        const newName = input.value.trim();
        if (newName && newName !== assembly.name) {
            assembly.name = newName;
            saveAssemblies();
            renderAssembliesList();
            showToast(`Pack renamed to <span style="color: var(--md-sys-color-shit); font-weight: bold;">${escapeHtml(newName)}</span>`);
        }
        closeDialog();
    });

    cancelBtn.addEventListener('click', closeDialog);
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) closeDialog();
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });

    requestAnimationFrame(() => {
        dialog.classList.add('active');
        input.focus();
        input.select();
    });
}

function showSaveAssemblyDialog() {
    if (cart.length === 0) {
        showToast('Cart is empty');
        return;
    }

    const dialog = document.createElement('div');
    dialog.className = 'assembly-dialog-overlay';
    dialog.innerHTML = `
        <div class="assembly-dialog">
            <h3>Save Pack</h3>
            <input type="text" class="assembly-name-input" placeholder="Enter pack name..." maxlength="50">
            <div class="assembly-dialog-actions">
                <button class="assembly-cancel-btn">Cancel</button>
                <button class="assembly-save-btn">Save</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    const input = dialog.querySelector('.assembly-name-input');
    const saveBtn = dialog.querySelector('.assembly-save-btn');
    const cancelBtn = dialog.querySelector('.assembly-cancel-btn');

    const closeDialog = () => {
        dialog.classList.remove('active');
        setTimeout(() => dialog.remove(), 200);
    };

    saveBtn.addEventListener('click', () => {
        saveCurrentAssembly(input.value);
        closeDialog();
    });

    cancelBtn.addEventListener('click', closeDialog);
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) closeDialog();
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveCurrentAssembly(input.value);
            closeDialog();
        }
    });

    requestAnimationFrame(() => {
        dialog.classList.add('active');
        input.focus();
    });
}

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function loadCart() {
    const saved = localStorage.getItem('modCart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
            updateCartBadge();
        } catch (e) {
            cart = [];
        }
    }
}

function saveCart() {
    localStorage.setItem('modCart', JSON.stringify(cart));
}

function addToCart(mod, categoryId) {
    const FORBIDDEN_CATEGORIES = ['guides', 'tools', 'fonts'];
    const SINGLE_ITEM_CATEGORIES = ['terrains', 'shaders', 'ti-bp-effects', 'emblems', 'versus-screens', 'trees', 'roshan', 'ancient', 'tormentor', 'ranged-attack', 'mega-kill', 'pedestal', 'high-five', 'backgrounds', 'river', 'ranks', 'wards', 'couriers', 'announcers', 'music', 'cursors', 'pings'];

    if (FORBIDDEN_CATEGORIES.includes(categoryId)) {
        showToast('Cannot add mods from this category.');
        return;
    }

    const button = event?.target?.closest('.add-to-cart-btn');
    const card = button?.closest('.card');
    const groupId = card?.getAttribute('data-group-id');

    const cartItem = {
        id: groupId ? `${categoryId}-${groupId}-${mod.name}` : `${categoryId}-${mod.name}`,
        name: mod.name,
        file: mod.file,
        categoryId: categoryId,
        groupId: groupId || null
    };

    const exists = cart.find(item => item.id === cartItem.id);
    if (exists) {
        removeFromCart(cartItem.id);
        updateCartButtons();
        return;
    }

    if (groupId) {
        const existingInGroup = cart.find(item =>
            item.categoryId === categoryId && item.groupId === groupId
        );
        if (existingInGroup) {
            showReplaceModal(existingInGroup, cartItem);
            return;
        }
    }

    if (SINGLE_ITEM_CATEGORIES.includes(categoryId)) {
        const existing = cart.find(item => item.categoryId === categoryId);
        if (existing) {
            showReplaceModal(existing, cartItem);
            return;
        }
    }

    if (categoryId === 'heroes') {
        const foundHeroes = HEROES_LIST.filter(hero =>
            mod.name.toLowerCase().includes(hero.toLowerCase())
        );

        if (foundHeroes.length > 0) {
            const newHeroName = foundHeroes.reduce((longest, current) =>
                current.length > longest.length ? current : longest
            );

            const existingHeroMod = cart.find(item => {
                if (item.categoryId !== 'heroes') return false;

                const existingHeroes = HEROES_LIST.filter(hero =>
                    item.name.toLowerCase().includes(hero.toLowerCase())
                );

                if (existingHeroes.length === 0) return false;

                const existingHeroName = existingHeroes.reduce((longest, current) =>
                    current.length > longest.length ? current : longest
                );

                return existingHeroName.toLowerCase() === newHeroName.toLowerCase();
            });

            if (existingHeroMod) {
                showReplaceModal(existingHeroMod, cartItem);
                return;
            }
        }
    }

    if (cart.length >= MAX_CART_ITEMS) {
        showToast('Cart is full (max 100 items)');
        return;
    }

    cart.push(cartItem);
    saveCart();
    updateCartBadge();
    showToast(`Added <span style="color: var(--md-sys-color-shit)">${escapeHtml(mod.name)}</span>`);

    const allButtons = document.querySelectorAll('.add-to-cart-btn');
    allButtons.forEach(btn => {
        const btnModData = JSON.parse(btn.getAttribute('data-mod'));
        const btnCategory = btn.getAttribute('data-category');
        const btnCard = btn.closest('.card');
        const btnGroupId = btnCard?.getAttribute('data-group-id');
        const btnId = btnGroupId ? `${btnCategory}-${btnGroupId}-${btnModData.name}` : `${btnCategory}-${btnModData.name}`;

        if (btnId === cartItem.id) {
            btn.classList.add('just-added');
            setTimeout(() => btn.classList.remove('just-added'), 600);
        }
    });

    updateCartButtons();

    if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
}

function removeFromCart(itemId) {
    const item = cart.find(i => i.id === itemId);
    const itemName = item ? item.name : '';

    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartBadge();
    renderCartItems();
    renderAssembliesList();
    updateCartButtons();

    if (itemName) {
        showToast(`Removed <span style="color: var(--md-sys-color-primary)">${escapeHtml(itemName)}</span>`);
    } else {
        showToast('Removed from cart');
    }

    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
}

function updateCartButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        const modData = JSON.parse(btn.getAttribute('data-mod'));
        const category = btn.getAttribute('data-category');
        const card = btn.closest('.card');
        const groupId = card?.getAttribute('data-group-id');
        const id = groupId ? `${category}-${groupId}-${modData.name}` : `${category}-${modData.name}`;
        const inCart = cart.some(item => item.id === id);

        const icon = btn.querySelector('.material-symbols-rounded');
        const text = btn.querySelector('.add-to-cart-text');

        if (inCart) {
            btn.classList.add('in-cart');
            btn.classList.remove('just-added');
            icon.textContent = 'check_circle';
            text.textContent = 'Added';
            btn.style.opacity = '1';
            btn.style.transform = 'scale(1)';

            btn.onmouseenter = () => {
                icon.textContent = 'delete';
                text.textContent = 'Remove';
            };
            btn.onmouseleave = () => {
                icon.textContent = 'check_circle';
                text.textContent = 'Added';
            };
        } else {
            btn.classList.remove('in-cart');
            btn.classList.remove('just-added');
            icon.textContent = 'add';
            text.textContent = translations['addToCart'] || 'Add to cart';
            btn.style.opacity = '';
            btn.style.transform = '';
            btn.onmouseenter = null;
            btn.onmouseleave = null;
        }
    });
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartBadge();
    renderCartItems();
    renderAssembliesList();
    updateCartButtons();
    showToast('Cart cleared');
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = cart.length;

    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function setupCartModal() {
    const cartButton = document.getElementById('cartButton');
    const cartModal = document.getElementById('cartModal');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartModal = document.getElementById('closeCartModal');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const packBtn = document.getElementById('packBtn');

    const saveAssemblyBtn = document.getElementById('saveAssemblyBtn');
    if (saveAssemblyBtn) {
        saveAssemblyBtn.addEventListener('click', showSaveAssemblyDialog);
    }

    const openCart = () => {
        cartModal.classList.remove('expanded');

        const logPanel = document.getElementById('packLogPanel');
        if (logPanel) {
            logPanel.classList.remove('active');
        }

        const elementsToReset = [
            cartModal,
            document.querySelector('.cart-main-content'),
            cartModal.querySelector('.info-modal-content'),
            document.getElementById('cartItems'),
            document.getElementById('cartEmpty'),
            document.getElementById('cartActions')
        ];

        elementsToReset.forEach(element => {
            if (element) {
                element.removeAttribute('style');
            }
        });

        requestAnimationFrame(() => {
            renderCartItems();
            cartModal.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    };

    const closeCart = () => {
        cartModal.classList.remove('active');
        cartModal.classList.remove('expanded');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';

        const logPanel = document.getElementById('packLogPanel');
        if (logPanel) {
            logPanel.classList.remove('active');
        }

        setTimeout(() => {
            const elementsToReset = [
                cartModal,
                document.querySelector('.cart-main-content'),
                cartModal.querySelector('.info-modal-content'),
                document.getElementById('cartItems'),
                document.getElementById('cartEmpty'),
                document.getElementById('cartActions')
            ];

            elementsToReset.forEach(element => {
                if (element) {
                    element.removeAttribute('style');
                }
            });
        }, 400);
    };

    cartButton.addEventListener('click', openCart);
    closeCartModal.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    clearCartBtn.addEventListener('click', () => {
        clearCart();
    });

    packBtn.addEventListener('click', packAndDownload);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartModal.classList.contains('active')) {
            closeCart();
        }
    });
}

function renderCartItems() {
    const cartEmpty = document.getElementById('cartEmpty');
    const cartItems = document.getElementById('cartItems');
    const cartActions = document.getElementById('cartActions');

    if (cart.length === 0) {
        cartEmpty.style.display = 'flex';
        cartItems.innerHTML = '';
        cartActions.classList.add('hidden');
        return;
    }

    cartEmpty.style.display = 'none';
    cartActions.classList.remove('hidden');
    cartItems.innerHTML = '';

    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';

        const category = categories.find(cat => cat.id === item.categoryId);
        const categoryName = category ? translations[category.key] : item.categoryId;

        const categoryData = modsData[item.categoryId];
        let mod = null;
        let previewPath = '';
        let isVideo = false;

        if (categoryData?.groups && Array.isArray(categoryData.groups)) {
            const group = categoryData.groups.find(g => g.id === item.groupId);
            if (group) {
                mod = group.mods.find(m => m.name === item.name);
            }
        } else if (Array.isArray(categoryData)) {
            mod = categoryData.find(m => m.name === item.name);
        }

        if (mod && mod.preview) {
            previewPath = `assets/previews/${item.categoryId}/${mod.preview}`;
            isVideo = mod.preview.endsWith('.mp4');
        }

        let previewHtml = '';
        if (previewPath) {
            if (isVideo) {
                previewHtml = `<video src="${previewPath}" class="cart-item-image" autoplay muted loop playsinline onerror="this.style.display='none'"></video>`;
            } else {
                previewHtml = `<img src="${previewPath}" alt="${escapeHtml(item.name)}" class="cart-item-image" onerror="this.style.display='none'">`;
            }
        }

        cartItem.innerHTML = `
    ${previewHtml}
    <div class="cart-item-info">
        <h3 class="cart-item-name">${escapeHtml(item.name)}</h3>
        <p class="cart-item-category">${escapeHtml(categoryName)}</p>
    </div>
    <button class="cart-item-remove" data-id="${escapeHtml(item.id)}">
        <span class="material-symbols-rounded">close</span>
    </button>
`;

        cartItems.appendChild(cartItem);
    });

    const removeButtons = cartItems.querySelectorAll('.cart-item-remove');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.currentTarget.getAttribute('data-id');
            removeFromCart(itemId);
        });
    });
}

function isZipFile(fileName) {
    return fileName.toLowerCase().endsWith('.zip');
}

function getUniqueFileName(fileName, existingNames) {
    if (!existingNames.has(fileName.toLowerCase())) {
        existingNames.add(fileName.toLowerCase());
        return fileName;
    }

    const nameParts = fileName.split('.');
    const extension = nameParts.length > 1 ? '.' + nameParts.pop() : '';
    const baseName = nameParts.join('.');

    let counter = 1;
    let newFileName;

    do {
        newFileName = `${baseName}_${counter}${extension}`;
        counter++;
    } while (existingNames.has(newFileName.toLowerCase()));

    existingNames.add(newFileName.toLowerCase());
    return newFileName;
}

async function packAndDownload() {
    if (cart.length === 0) return;
    const packBtn = document.getElementById('packBtn');
    const originalContent = packBtn.innerHTML;

    packBtn.disabled = true;
    packBtn.innerHTML = `
        <div class="spinner small"></div>
        Packing...
    `;

    const cartModal = document.getElementById('cartModal');
    const logPanel = document.getElementById('packLogPanel');
    const logContainer = document.getElementById('packLog');
    const statusText = document.getElementById('packStatus');
    const logHeader = logPanel.querySelector('.pack-log-header');

    cartModal.classList.add('expanded');
    logPanel.classList.add('active');
    logContainer.innerHTML = '';
    logHeader.innerHTML = `
        <div class="spinner"></div>
        <h3>Packing Progress</h3>
    `;

    function addLog(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `pack-log-entry ${type}`;

        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info',
            extract: 'unarchive',
            archive: 'folder_zip',
            loading: 'cached',
            start: 'rocket_launch',
            download: 'download'
        };

        const highlightedMessage = message
            .replace(/Added (.*?)(?=$)/g, 'Added <span style="color: var(--md-sys-color-primary); font-weight: 600;">$1</span>');
        entry.innerHTML = `
            <span class="material-symbols-rounded">${icons[type]}</span>
            <span>${highlightedMessage}</span>
        `;

        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    let packSuccess = false;
    const RENAME_CATEGORIES = ['trees', 'river', 'shaders', 'herofx', 'ranged-attack', 'hero-items'];

    try {
        addLog('Starting pack creation...', 'start');

        if (typeof JSZip === 'undefined') {
            const script = document.createElement('script');
            script.src = 'assets/jszip.min.js';
            document.head.appendChild(script);

            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
        }

        addLog(`Creating archive for ${cart.length} mods...`, 'archive');
        statusText.textContent = 'Creating archive...';

        const mainZip = new JSZip();
        const modsFolder = mainZip.folder('mods');
        const existingFileNames = new Set();
        const modFileNames = {};
        const BATCH_SIZE = 8;
        const batches = [];

        for (let i = 0; i < cart.length; i += BATCH_SIZE) {
            batches.push(cart.slice(i, i + BATCH_SIZE));
        }

        let processedCount = 0;

        for (const batch of batches) {
            await Promise.all(batch.map(async (item) => {
                const filePath = `assets/files/${item.categoryId}/${item.file}`;

                try {
                    const response = await fetch(filePath);
                    if (!response.ok) throw new Error(`Failed to fetch ${item.file}`);

                    const blob = await response.blob();

                    if (isZipFile(item.file)) {
                        const zipContent = await JSZip.loadAsync(blob);
                        const extractedFiles = [];

                        const isTerrainMod = item.categoryId === 'terrains';
                        const isCursorMod = item.categoryId === 'cursors';
                        const shouldRename = RENAME_CATEGORIES.includes(item.categoryId);

                        const zipFiles = Object.entries(zipContent.files);

                        if (zipFiles.length === 0) {
                            addLog(`Warning: ${item.name} appears to be empty`, 'warning');
                        }

                        for (const [relativePath, zipEntry] of zipFiles) {
                            if (zipEntry.dir) continue;

                            try {
                                const fileBlob = await zipEntry.async('blob');

                                if (isTerrainMod) {
                                    if (relativePath.includes('maps/') && !relativePath.includes('!guide')) {
                                        const pathParts = relativePath.split('/');
                                        const mapsIndex = pathParts.indexOf('maps');
                                        if (mapsIndex !== -1) {
                                            const relativeMapsPath = pathParts.slice(mapsIndex).join('/');
                                            modsFolder.file(relativeMapsPath, fileBlob);
                                            extractedFiles.push(relativeMapsPath);
                                        }
                                    }
                                } else if (isCursorMod) {
                                    mainZip.file(relativePath, fileBlob);
                                    extractedFiles.push(relativePath);
                                } else {
                                    const fileName = relativePath.split('/').pop();
                                    if (fileName) {
                                        let finalFileName = fileName;
                                        if (shouldRename) {
                                            finalFileName = '!' + fileName;
                                        }
                                        const uniqueName = getUniqueFileName(finalFileName, existingFileNames);
                                        modsFolder.file(uniqueName, fileBlob);
                                        extractedFiles.push(uniqueName);
                                    }
                                }
                            } catch (err) {
                                console.error(`Error extracting file ${relativePath} from ${item.name}:`, err);
                                addLog(`Failed to extract file from ${item.name}`, 'warning');
                            }
                        }

                        if (extractedFiles.length > 0) {
                            if (isCursorMod && extractedFiles.length > 0) {
                                const folderName = extractedFiles[0].split('/')[0];
                                modFileNames[item.name] = folderName + '/';
                            } else {
                                modFileNames[item.name] = extractedFiles.join(', ');
                            }
                            addLog(`Added ${item.name}`, 'success');
                        } else {
                            modFileNames[item.name] = 'No files extracted';
                            addLog(`No files extracted from ${item.name}`, 'warning');
                        }
                    } else {
                        let fileName = item.file;
                        if (RENAME_CATEGORIES.includes(item.categoryId)) {
                            fileName = '!' + fileName;
                        }
                        const uniqueName = getUniqueFileName(fileName, existingFileNames);
                        modsFolder.file(uniqueName, blob);
                        modFileNames[item.name] = uniqueName;
                        addLog(`Added ${item.name}`, 'success');
                    }

                    processedCount++;
                } catch (error) {
                    console.error(`Error processing ${item.name}:`, error);
                    addLog(`Failed to add ${item.name}`, 'warning');
                }
            }));

            statusText.textContent = `Processing ${processedCount}/${cart.length} mods...`;
        }

        let modsListText = `╔══════════════════════════════════════════╗
              MODS IN THIS PACK
╚══════════════════════════════════════════╝\n\n`;

        const modsByCategory = {};
        cart.forEach(item => {
            const category = categories.find(cat => cat.id === item.categoryId);
            const categoryName = category ? translations[category.key] : item.categoryId;

            if (!modsByCategory[categoryName]) {
                modsByCategory[categoryName] = [];
            }
            modsByCategory[categoryName].push(item.name);
        });

        for (const [categoryName, mods] of Object.entries(modsByCategory)) {
            modsListText += `${categoryName}:\n`;
            mods.forEach(modName => {
                const fileName = modFileNames[modName] || '';
                modsListText += `  • ${modName} ➜ ${fileName}\n`;
            });
            modsListText += '\n';
        }

        modsListText += `╔══════════════════════════════════════════╗\n`;
        modsListText += `              TOTAL MODS: ${cart.length}\n`;
        modsListText += `      GENERATED: ${new Date().toLocaleString()}\n`;
        modsListText += `╚══════════════════════════════════════════╝\n`;
        modsListText += `    Thanks for downloading, have fun! 😘`;

        mainZip.file('Mods.txt', modsListText);
        addLog('Mods list created', 'success');

        const guideText = `╔══════════════════════════════════════════╗
       Dota2PornFX Installation Guide      
╚══════════════════════════════════════════╝


RU WINDOWS
═══════════
1. Откройте папку mods
2. Запустите VPKMerge.exe и дождитесь окончания
3. Переместите готовый pak10_dir.vpk в папку с языком игры:
   • Для русского: C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_russian
   • Для английского: C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_123
   • Для англ Minify: C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_minify
- Если вы выбрали ландшафт, у вас будет папка maps, которую также надо переместить в папку языка игры вместе с pak10_dir.vpk
- Если вы добавили курсор, у вас будет папка "Название Cursor" в ней вы должны запустить Install.bat (если bat не работает, переместите содержимое папки cursor в Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\resource\\cursor)

4. Добавьте в параметры запуска игры:
   • Для русского: -language russian
   • Для английского: -language 123
   • Для англ Minify: -language minify

При использовании VPKMerge могут возникнуть проблемы с отображением некоторых модов или героев
Если вы столкнулись с такой проблемой, пожалуйста, напишите мне в Telegram: https://t.me/f4cks0ciety
Укажите, какие моды отображаются некорректно, и прикрепите полный список установленных модов из файла Mods.txt


EN WINDOWS 
═══════════
1. Open the mods folder
2. Run VPKMerge.exe and wait until it finishes
3. Create folder dota_123 in C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\
4. Put the finished pak10_dir.vpk in the folder dota_123 (If you are using Minify, put vpk in dota_minify folder)
- If you chosen terrain, you will have a folder "maps" it should also be moved to the language folder together with pak10_dir.vpk
- If you added a cursor, you will have the folder "Name Cursor" in it, you must run Install.bat (if bat does not work, move the contents of the cursor folder to Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\resource\\cursor)
5. Add to launch options: -language 123 (or "-language minify" if you're using it)

When using VPKMerge, some mods or heroes may not display correctly
If you encounter this issue, please contact me on Telegram: https://t.me/f4cks0ciety
Specify which mods are displaying incorrectly and attach the full list of installed mods from the Mods.txt file


RU LINUX
═════════
1. Откройте папку mods в терминале
2. Сделайте VPKMerge исполняемым: chmod +x VPKMerge
3. Запустите VPKMerge: ./VPKMerge 
4. Переместите готовый pak10_dir.vpk в папку с языком игры:
   • Для русского: Steam//steamapps//common//dota 2 beta//game//dota_russian
   • Для английского: Steam//steamapps//common//dota 2 beta//game//dota_123
   • Для англ Minify: Steam//steamapps//common//dota 2 beta//game//dota_minify
- Если вы выбрали ландшафт, у вас будет папка maps, которую также надо переместить в папку языка игры вместе с pak10_dir.vpk
- Если вы добавили курсор, у вас будет папка "Название Cursor", переместите содержимое папки cursor в Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\resource\\cursor

4. Добавьте в параметры запуска игры:
   • Для русского: -language russian
   • Для английского: -language 123
   • Для англ Minify: -language minify

При использовании VPKMerge могут возникнуть проблемы с отображением некоторых модов или героев
Если вы столкнулись с такой проблемой, пожалуйста, напишите мне в Telegram: https://t.me/f4cks0ciety
Укажите, какие моды отображаются некорректно, и прикрепите полный список установленных модов из файла Mods.txt


EN LINUX
═════════
1. Open the mods folder in terminal
2. Make VPKMerge executable: chmod +x VPKMerge
3. Run VPKMerge: ./VPKMerge
4. Create folder dota_123 in Steam//steamapps//common//dota 2 beta//game//
5. Move the generated pak10_dir.vpk to dota_123 folder (If you are using Minify, put vpk in dota_minify folder)
- If you chosen terrain, you will have a folder "maps" it should also be moved to the language folder together with pak10_dir.vpk
- If you added a cursor, you will have a folder "Name Cursor", move the contents of the cursor folder to Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\resource\\cursor
6. Add to Dota 2 launch options: -language 123 (or "-language minify" if you're using it)

When using VPKMerge, some mods or heroes may not display correctly
If you encounter this issue, please contact me on Telegram: https://t.me/f4cks0ciety
Specify which mods are displaying incorrectly and attach the full list of installed mods from the Mods.txt file`;

        mainZip.file('Guide.txt', guideText);
        addLog('Guide added', 'success');
        addLog('Adding VPKMerge scripts...', 'info');

        const [exeResponse, linuxResponse] = await Promise.all([
            fetch('assets/files/VPKMerge/VPKMerge.exe'),
            fetch('assets/files/VPKMerge/VPKMerge')
        ]);

        let exeAdded = false;
        let linuxAdded = false;

        if (exeResponse.ok) {
            const exeBlob = await exeResponse.blob();
            modsFolder.file('VPKMerge.exe', exeBlob);
            exeAdded = true;
        } else {
            addLog('VPKMerge.exe not found', 'warning');
        }

        if (linuxResponse.ok) {
            const linuxBlob = await linuxResponse.blob();
            modsFolder.file('VPKMerge', linuxBlob);
            linuxAdded = true;
        } else {
            addLog('VPKMerge Linux not found', 'warning');
        }

        if (exeAdded || linuxAdded) {
            addLog('VPKMerge added', 'success');
        }

        addLog('Compressing files...', 'archive');
        statusText.textContent = 'Compressing...';

        const now = new Date();
        const timestamp = `${now.getHours()}.${now.getMinutes()}-${now.getDate()}.${now.getMonth() + 1}`;

        const content = await mainZip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 1 }
        }, (metadata) => {
            const percent = metadata.percent.toFixed(0);
            statusText.textContent = `Compressing... ${percent}%`;
        });

        addLog('Archive compressed', 'success');
        addLog('Downloading...');
        statusText.textContent = 'Download starting...';

        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `d2pfxPack-${timestamp}.zip`;
        link.click();
        URL.revokeObjectURL(url);

        showToast('Thanks for downloading, have fun! 😘');

        addLog('Pack downloaded successfully!', 'download');
        statusText.textContent = '';

        logHeader.innerHTML = `
            <span class="material-symbols-rounded success">check_circle</span>
            <h3>Completed!</h3>
        `;

        packSuccess = true;

    } catch (error) {
        console.error('Pack error:', error);
        addLog(`Error: ${error.message}`, 'error');
        statusText.textContent = 'Failed!';

        logHeader.innerHTML = `
            <span class="material-symbols-rounded error">error</span>
            <h3>Failed!</h3>
        `;

        packSuccess = false;
    } finally {
        packBtn.disabled = false;
        packBtn.innerHTML = originalContent;
    }
}

function showReplaceModal(existingItem, newItem) {
    document.querySelector('.replace-modal-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'replace-modal-overlay';

    overlay.innerHTML = `
        <div class="replace-modal">
            <div class="replace-modal-header">
                <h2>Replace Mod?</h2>
            </div>
            <div class="replace-modal-body">
                <p>You already have a mod from this category.</p>
                <p>Replace <b>${escapeHtml(existingItem.name)}</b> with <b>${escapeHtml(newItem.name)}</b>?</p>
            </div>
            <div class="replace-modal-actions">
                <button id="replaceConfirm" class="cart-pack-btn">
                    <span class="material-symbols-rounded">sync</span> Replace
                </button>
                <button id="replaceCancel" class="cart-clear-btn">
                    <span class="material-symbols-rounded">close</span> Cancel
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const closeModal = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
        document.body.style.overflow = '';
    };

    document.getElementById('replaceCancel').addEventListener('click', closeModal);
    document.getElementById('replaceConfirm').addEventListener('click', () => {
        removeFromCart(existingItem.id);
        cart.push(newItem);
        saveCart();
        updateCartBadge();
        renderCartItems();
        updateCartButtons();
        showToast('Replaced successfully');
        closeModal();
    });

    requestAnimationFrame(() => overlay.classList.add('active'));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadCart();
        loadAssemblies();
        setupCartModal();
        updateCartButtons();
        renderAssembliesList();
        loadSharedAssembly();
    });
} else {
    loadCart();
    loadAssemblies();
    setupCartModal();
    updateCartButtons();
    renderAssembliesList();
    loadSharedAssembly();
}

// Base64
// function compressAssembly(assembly) {
//     const catMap = {
//         'heroes': 'h', 'shaders': 's', 'terrains': 't', 'trees': 'r',
//         'creeps': 'c', 'ti-bp-effects': 'e', 'item-effects': 'i',
//         'creep-deny': 'd', 'emblems': 'b', 'versus-screens': 'v',
//         'roshan': 'o', 'ancient': 'a', 'tormentor': 'm', 'towers': 'w',
//         'high-five': 'f', 'ranged-attack': 'g', 'mega-kill': 'k',
//         'pedestal': 'p', 'other': 'x', 'backgrounds': 'z', 'river': 'l',
//         'ranks': 'n', 'item-icons': 'y', 'wards': 'u', 'couriers': 'q',
//         'announcers': 'j', 'music': '1', 'cursors': '2', 'pings': '3',
//         'herofx': '4', 'hero-sounds': '5', 'hero-items': '6'
//     };

//     const items = assembly.items.map(item => {
//         const parts = [
//             catMap[item.categoryId] || item.categoryId,
//             item.file.replace('.zip', ''),
//             item.groupId || ''
//         ];
//         return parts.filter(p => p).join(',');
//     });

//     const data = assembly.name + '|' + items.join('|');
//     return LZString.compressToEncodedURIComponent(data);
// }

// function decompressAssembly(compressed) {
//     try {
//         const data = LZString.decompressFromEncodedURIComponent(compressed);
//         if (!data) return null;

//         const catMap = {
//             'h': 'heroes', 's': 'shaders', 't': 'terrains', 'r': 'trees',
//             'c': 'creeps', 'e': 'ti-bp-effects', 'i': 'item-effects',
//             'd': 'creep-deny', 'b': 'emblems', 'v': 'versus-screens',
//             'o': 'roshan', 'a': 'ancient', 'm': 'tormentor', 'w': 'towers',
//             'f': 'high-five', 'g': 'ranged-attack', 'k': 'mega-kill',
//             'p': 'pedestal', 'x': 'other', 'z': 'backgrounds', 'l': 'river',
//             'n': 'ranks', 'y': 'item-icons', 'u': 'wards', 'q': 'couriers',
//             'j': 'announcers', '1': 'music', '2': 'cursors', '3': 'pings',
//             '4': 'herofx', '5': 'hero-sounds', '6': 'hero-items'
//         };

//         const parts = data.split('|');
//         const name = parts[0];

//         const items = parts.slice(1).map(itemStr => {
//             const [catCode, file, groupId] = itemStr.split(',');
//             const categoryId = catMap[catCode] || catCode;
//             const fullFile = file.includes('.') ? file : file + '.zip';

//             const categoryData = modsData[categoryId];
//             let modName = file;

//             if (categoryData?.groups && groupId) {
//                 const group = categoryData.groups.find(g => g.id === groupId);
//                 const mod = group?.mods.find(m => m.file === fullFile);
//                 if (mod) modName = mod.name;
//             } else if (Array.isArray(categoryData)) {
//                 const mod = categoryData.find(m => m.file === fullFile);
//                 if (mod) modName = mod.name;
//             }

//             return {
//                 id: groupId ? `${categoryId}-${groupId}-${modName}` : `${categoryId}-${modName}`,
//                 name: modName,
//                 file: fullFile,
//                 categoryId: categoryId,
//                 groupId: groupId || null
//             };
//         });

//         return { name, items };
//     } catch (e) {
//         console.error('Failed to decompress pack:', e);
//         return null;
//     }
// }

// function shareAssembly(assemblyId) {
//     const assembly = savedAssemblies.find(a => a.id === assemblyId);
//     if (!assembly) return;

//     const compressed = compressAssembly(assembly);
//     const baseUrl = window.location.origin + window.location.pathname;
//     const shareUrl = `${baseUrl}?pack=${compressed}`;

//     copyToClipboard(shareUrl, `Share link copied for <span style="color: var(--md-sys-color-shit); font-weight: bold;">${escapeHtml(assembly.name)}</span>`);
// }

// function loadSharedAssembly() {
//     const params = new URLSearchParams(window.location.search);
//     const packData = params.get('pack');

//     if (!packData) return;

//     const assembly = decompressAssembly(packData);
//     if (!assembly) {
//         showToast('Invalid pack link');
//         return;
//     }

//     cart = [...assembly.items];
//     saveCart();
//     updateCartBadge();
//     renderCartItems();
//     updateCartButtons();

//     showToast(`Loaded pack: <span style="color: var(--md-sys-color-shit); font-weight: bold;">${escapeHtml(assembly.name)}</span>`);

//     window.history.replaceState({}, '', window.location.pathname);

//     const cartButton = document.getElementById('cartButton');
//     if (cartButton) cartButton.click();
// }


// Workers
function compressAssembly(assembly) {
    return btoa(encodeURIComponent(JSON.stringify({
        name: assembly.name,
        items: assembly.items.map(item => ({
            n: item.name,
            f: item.file,
            c: item.categoryId,
            g: item.groupId
        }))
    })));
}

function decompressAssembly(compressed) {
    try {
        const data = JSON.parse(decodeURIComponent(atob(compressed)));
        
        const items = data.items.map(item => {
            const categoryId = item.c;
            const groupId = item.g || null;
            
            return {
                id: groupId ? `${categoryId}-${groupId}-${item.n}` : `${categoryId}-${item.n}`,
                name: item.n,
                file: item.f,
                categoryId: categoryId,
                groupId: groupId
            };
        });

        return { name: data.name, items };
    } catch (e) {
        console.error('Failed to decompress pack:', e);
        return null;
    }
}

function generateShortCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

async function shareAssembly(assemblyId) {
    const assembly = savedAssemblies.find(a => a.id === assemblyId);
    if (!assembly) return;

    const compressed = compressAssembly(assembly);
    const baseUrl = window.location.origin + window.location.pathname;
    const longUrl = `${baseUrl}?pack=${compressed}`;

    try {
        const shortCode = generateShortCode();
        
        const response = await fetch('https://share.d2pfx.workers.dev/api/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                code: shortCode, 
                url: longUrl 
            })
        });

        if (!response.ok) throw new Error('Failed to shorten URL');

        const data = await response.json();
        const shortUrl = data.shortUrl;

        copyToClipboard(
            shortUrl,
            `Share link copied for <span style="color: var(--md-sys-color-shit); font-weight: bold;">${escapeHtml(assembly.name)}</span>`
        );
    } catch (e) {
        console.error('Error creating short link:', e);
        copyToClipboard(
            longUrl,
            `Share link copied for <span style="color: var(--md-sys-color-shit); font-weight: bold;">${escapeHtml(assembly.name)}</span>`
        );
    }
}

function loadSharedAssembly() {
    const params = new URLSearchParams(window.location.search);
    const packData = params.get('pack');

    if (!packData) return;

    const assembly = decompressAssembly(packData);
    if (!assembly) {
        showToast('Invalid pack link');
        return;
    }

    cart = [...assembly.items];
    saveCart();
    updateCartBadge();
    renderCartItems();
    updateCartButtons();
    renderAssembliesList();

    showToast(`Loaded pack <span style="color: var(--md-sys-color-shit); font-weight: bold;">${escapeHtml(assembly.name)}</span>`);

    window.history.replaceState({}, '', window.location.pathname);

    const cartButton = document.getElementById('cartButton');
    if (cartButton) cartButton.click();
}