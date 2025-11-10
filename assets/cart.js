let cart = [];
const MAX_CART_ITEMS = 50;

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
    const FORBIDDEN_CATEGORIES = ['guides', 'optimization', 'packs', 'tools'];
    const SINGLE_ITEM_CATEGORIES = ['terrains', 'shaders', 'creep-deny', 'ti-bp-effects', 'emblems', 'versus-screens', 'trees', 'roshan', 'creeps', 'ancient', 'tormentor', 'towers', 'ranged-attack', 'mega-kill', 'pedestal', 'high-five', 'backgrounds', 'river'];

    if (FORBIDDEN_CATEGORIES.includes(categoryId)) {
        showToast('Cannot add mods from this category.');
        return;
    }

    const cartItem = {
        id: `${categoryId}-${mod.name}`,
        name: mod.name,
        file: mod.file,
        categoryId: categoryId
    };

    const exists = cart.find(item => item.id === cartItem.id);
    if (exists) {
        removeFromCart(cartItem.id);
        updateCartButtons();
        return;
    }

    if (SINGLE_ITEM_CATEGORIES.includes(categoryId)) {
        const existing = cart.find(item => item.categoryId === categoryId);
        if (existing) {
            showReplaceModal(existing, cartItem);
            return;
        }
    }

    if (cart.length >= MAX_CART_ITEMS) {
        showToast('Cart is full (max 50 items)');
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
        const btnId = `${btnCategory}-${btnModData.name}`;

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
        const id = `${category}-${modData.name}`;
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

        cartItem.innerHTML = `
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

        entry.innerHTML = `
            <span class="material-symbols-rounded">${icons[type]}</span>
            <span>${escapeHtml(message)}</span>
        `;

        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    let packSuccess = false;

    try {
        addLog('Starting pack creation...', 'start');

        if (typeof JSZip === 'undefined') {
            addLog('Loading JSZip library...', 'loading');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            document.head.appendChild(script);

            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
            addLog('JSZip loaded successfully', 'success');
        }

        addLog(`Creating archive for ${cart.length} mods...`, 'archive');
        statusText.textContent = 'Creating archive...';

        const mainZip = new JSZip();
        const modsFolder = mainZip.folder('mods');
        const existingFileNames = new Set();

        let processedCount = 0;

        const modFileNames = {};

        for (const item of cart) {
            const filePath = `assets/files/${item.categoryId}/${item.file}`;
            addLog(`Processing: ${item.name}`, 'info');
            statusText.textContent = `Processing ${processedCount + 1}/${cart.length}...`;

            try {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Failed to fetch ${item.file}`);

                const blob = await response.blob();

                if (isZipFile(item.file)) {
                    addLog(`Extracting ZIP: ${item.name}`, 'extract');
                    const zipContent = await JSZip.loadAsync(blob);
                    const extractedFiles = [];

                    for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
                        if (!zipEntry.dir) {
                            const fileBlob = await zipEntry.async('blob');
                            const fileName = relativePath.split('/').pop();
                            const uniqueName = getUniqueFileName(fileName, existingFileNames);
                            modsFolder.file(uniqueName, fileBlob);
                            extractedFiles.push(uniqueName);
                        }
                    }
                    modFileNames[item.name] = extractedFiles.join(', ');
                    addLog(`Extracted ${item.name}`, 'success');
                } else {
                    const uniqueName = getUniqueFileName(item.file, existingFileNames);
                    modsFolder.file(uniqueName, blob);
                    modFileNames[item.name] = uniqueName;
                    addLog(`Added ${item.name}`, 'success');
                }

                processedCount++;
            } catch (error) {
                console.error(`Error processing ${item.name}:`, error);
                addLog(`Failed to add ${item.name}`, 'warning');
            }
        }

        addLog('Creating mods list...', 'info');
        let modsListText = 'Mods in this pack:\n';
        modsListText += '='.repeat(50) + '\n\n';

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

        modsListText += '='.repeat(50) + '\n';
        modsListText += `Total mods: ${cart.length}\n`;
        modsListText += `Generated: ${new Date().toLocaleString()}\n`;

        mainZip.file('Mods_List.txt', modsListText);
        addLog('Mods list created', 'success');

        addLog('Adding installation guide...', 'info');
        const guideText = `Dota2PornFX Guide
=================

EN
1. Open mods folder

2. Launch VPKMerge.exe and wait for the end

3. Create folder dota_123 in C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\

4. Put the finished pak10_dir.vpk in the folder dota_123

5. Add to launch options: -language 123


RU
1. Откройте папку mods

2. Запустите VPKMerge.exe и дождитесь окончания

3. Переместите готовый pak10_dir.vpk в папку с языком игры
   - Для русского: C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_russian
   - Для английского: C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_123

4. Добавьте в параметры запуска игры:
   - Для русского: -language russian
   - Для английского: -language 123`;

        mainZip.file('Guide.txt', guideText);
        addLog('Guide added', 'success');

        addLog('Adding VPKMerge.exe...', 'info');
        try {
            const exeResponse = await fetch('assets/files/VPKMerge.exe');
            if (exeResponse.ok) {
                const exeBlob = await exeResponse.blob();
                modsFolder.file('VPKMerge.exe', exeBlob);
                addLog('VPKMerge.exe added', 'success');
            } else {
                addLog('VPKMerge.exe not found', 'warning');
            }
        } catch (error) {
            addLog('Could not add VPKMerge.exe', 'warning');
        }

        addLog('Compressing files...', 'archive');
        statusText.textContent = 'Compressing...';

        const now = new Date();
        const timestamp = `${now.getHours()}.${now.getMinutes()}-${now.getDate()}.${now.getMonth() + 1}`;

        const content = await mainZip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        }, (metadata) => {
            const percent = metadata.percent.toFixed(0);
            statusText.textContent = `Compressing... ${percent}%`;
        });

        addLog('Archive compressed', 'success');
        addLog('Starting download...', 'info');
        statusText.textContent = 'Download starting...';

        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `d2pfxPack-${timestamp}.zip`;
        link.click();
        URL.revokeObjectURL(url);

        addLog('Pack downloaded successfully!', 'download');
        statusText.textContent = '';

        logHeader.innerHTML = `
            <span class="material-symbols-rounded success">check_circle</span>
            <h3>Completed!</h3>
        `;

        packSuccess = true;

    } catch (error) {
        console.error('Pack error:', error);
        addLog(`✗ Error: ${error.message}`, 'error');
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
        setupCartModal();
        updateCartButtons();
    });
} else {
    loadCart();
    setupCartModal();
    updateCartButtons();
}