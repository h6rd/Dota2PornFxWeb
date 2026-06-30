let cart = [];
const MAX_CART_ITEMS = 150;

let savedAssemblies = [];
const MAX_ASSEMBLIES = 10;

function openModal() {
    document.body.classList.add('modal-open');
}

function closeModal() {
    document.body.classList.remove('modal-open');
}

if (!window.modalScrollListenersAdded) {
    document.addEventListener('wheel', (e) => {
        if (document.body.classList.contains('modal-open')) {
            const scrollable = e.target.closest('.info-modal-content, .cart-items, .pack-log-container, .assemblies-list, .notes-content');
            if (!scrollable) e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (document.body.classList.contains('modal-open')) {
            const scrollable = e.target.closest('.info-modal-content, .cart-items, .pack-log-container, .assemblies-list, .notes-content');
            if (!scrollable) e.preventDefault();
        }
    }, { passive: false });

    window.modalScrollListenersAdded = true;
}

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
        items: cart.map(item => ({ ...item })),
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

    cart = assembly.items.map(item => ({ ...item }));

    cart.forEach(item => {
        const categoryData = modsData[item.categoryId];
        const mods = categoryData?.groups
            ? categoryData.groups.flatMap(g => g.mods)
            : (Array.isArray(categoryData) ? categoryData : []);
        const mod = mods.find(m => m.styles && m.styles.some(s =>
            m.name + ' ' + s.label.replace('Style ', '') === item.name
        ));
        if (mod) {
            const idx = mod.styles.findIndex(s =>
                mod.name + ' ' + s.label.replace('Style ', '') === item.name
            );
            if (idx !== -1) {
                saveStyleIndex(mod.name, idx);

                document.querySelectorAll(`.card[data-mod-name="${CSS.escape(mod.name)}"]`).forEach(card => {
                    const btn = card.querySelector('.add-to-cart-btn');
                    if (btn) {
                        btn.setAttribute('data-mod', JSON.stringify({
                            name: item.name
                        }));
                    }
                    card.querySelectorAll('.style-circle').forEach(c => {
                        c.classList.toggle('active', +c.dataset.styleIndex === idx);
                    });
                    const img = card.querySelector('.card-media img, .card-media video');
                    if (img) img.src = `assets/previews/${item.categoryId}/${mod.styles[idx].preview}`;
                });
            }
        }
    });

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
            const before = cart.length;
            cart = cart.filter(item => {
                const { file } = resolveItemFiles(item);
                return file !== null;
            });
            if (cart.length < before) {
                saveCart();
                const removed = before - cart.length;
                console.info(`[Cart] Removed ${removed} unavailable mod(s) from cart`);
            }
            updateCartBadge();
        } catch (e) {
            cart = [];
        }
    }
}

function saveCart() {
    localStorage.setItem('modCart', JSON.stringify(cart));
}

function resolveItemFiles(item) {
    const categoryData = modsData[item.categoryId];
    let mod = null;

    function findMod(mods) {
        return mods.find(m =>
            m.name === item.name ||
            (m.styles && m.styles.some(s =>
                m.name + ' ' + s.label.replace('Style ', '') === item.name
            ))
        );
    }

    if (categoryData?.groups && Array.isArray(categoryData.groups)) {
        const group = categoryData.groups.find(g => g.id === item.groupId);
        if (group) mod = findMod(group.mods);
    } else if (Array.isArray(categoryData)) {
        mod = findMod(categoryData);
    }

    if (!mod) return { file: null, preview: null };

    if (mod.styles) {
        const idx = mod.styles.findIndex(s =>
            mod.name + ' ' + s.label.replace('Style ', '') === item.name
        );
        if (idx !== -1) return { file: mod.styles[idx].file, preview: mod.styles[idx].preview || null };
    }

    return { file: mod.file, preview: mod.preview || null };
}

function addToCart(mod, categoryId) {
    const FORBIDDEN_CATEGORIES = ['guides', 'tools'];
    const SINGLE_ITEM_CATEGORIES = ['terrains', 'shaders', 'ti-bp-effects', 'emblems', 'versus-screens', 'trees', 'roshan', 'ancient', 'tormentor', 'ranged-attack', 'mega-kill', 'pedestal', 'high-five', 'backgrounds', 'river', 'ranks', 'wards', 'couriers', 'announcers', 'music', 'cursors', 'pings', 'fonts', 'huds'];

    if (FORBIDDEN_CATEGORIES.includes(categoryId)) {
        showToast('Cannot add mods from this category.');
        return;
    }

    // if (mod.tags?.anime) {
    //     showToast('Anime mods are temporarily unavailable, install them as separate vpk files');
    //     return;
    // }

    const button = event?.target?.closest('.add-to-cart-btn');
    const card = button?.closest('.card');
    const groupId = card?.getAttribute('data-group-id');

    const cartItem = {
        id: groupId ? `${categoryId}-${groupId}-${mod.name}` : `${categoryId}-${mod.name}`,
        name: mod.name,
        categoryId: categoryId,
        groupId: groupId || null
    };

    const exists = cart.find(item => item.id === cartItem.id);
    if (exists) {
        removeFromCart(cartItem.id);
        updateCartButtons();
        return;
    }

    const MULTI_ITEM_GROUPS = ['runes'];
    const SLOT_TAGS_GROUP_CHECK = ['totem', 'weapon', 'mount', 'head', 'arm', 'arms', 'armor', 'shoulders', 'back', "shield", 'hair'];

    if (groupId && !MULTI_ITEM_GROUPS.includes(groupId)) {
        if (categoryId === 'hero-items') {
            const heroItemsCategoryData = modsData['hero-items'];
            const heroItemsData = heroItemsCategoryData?.groups
                ? heroItemsCategoryData.groups.flatMap(g => g.mods)
                : (Array.isArray(heroItemsCategoryData) ? heroItemsCategoryData : []);
            const newModData = heroItemsData.find(m => mod.name === m.name || mod.name.startsWith(m.name + ' '));
            const hasSlotTag = newModData?.tags && SLOT_TAGS_GROUP_CHECK.some(t => newModData.tags[t]);
            if (!hasSlotTag) {
                const existingInGroup = cart.find(item =>
                    item.categoryId === categoryId && item.groupId === groupId
                );
                if (existingInGroup) {
                    showReplaceModal(existingInGroup, cartItem);
                    return;
                }
            }
        } else {
            const existingInGroup = cart.find(item =>
                item.categoryId === categoryId && item.groupId === groupId
            );
            if (existingInGroup) {
                showReplaceModal(existingInGroup, cartItem);
                return;
            }
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

    if (categoryId === 'hero-items') {
        const heroItemsCategoryData = modsData['hero-items'];
        const heroItemsData = heroItemsCategoryData?.groups
            ? heroItemsCategoryData.groups.flatMap(g => g.mods)
            : (Array.isArray(heroItemsCategoryData) ? heroItemsCategoryData : []);
        const newModData = heroItemsData.find(m => mod.name === m.name || mod.name.startsWith(m.name + ' '));
        const SLOT_TAGS = ['totem', 'weapon', 'mount', 'head', 'arm', 'arms', 'armor', 'shoulders', 'back', 'shield', 'hair'];

        if (newModData && newModData.tags) {
            const newSlots = SLOT_TAGS.filter(tag => newModData.tags[tag]);

            const foundNewHeroes = HEROES_LIST.filter(hero => mod.name.toLowerCase().includes(hero.toLowerCase()));
            const newHero = foundNewHeroes.length > 0
                ? foundNewHeroes.reduce((longest, current) => current.length > longest.length ? current : longest).toLowerCase()
                : mod.name.split(' ')[0].toLowerCase();

            const existingHeroItem = cart.find(item => {
                if (item.categoryId !== 'hero-items') return false;

                const foundExistingHeroes = HEROES_LIST.filter(hero => item.name.toLowerCase().includes(hero.toLowerCase()));
                const existingHero = foundExistingHeroes.length > 0
                    ? foundExistingHeroes.reduce((longest, current) => current.length > longest.length ? current : longest).toLowerCase()
                    : item.name.split(' ')[0].toLowerCase();

                if (existingHero !== newHero) return false;

                const existingModData = heroItemsData.find(m => item.name === m.name || item.name.startsWith(m.name + ' '));
                if (!existingModData || !existingModData.tags) return false;

                return SLOT_TAGS.some(tag => newModData.tags[tag] && existingModData.tags[tag]);
            });

            if (existingHeroItem) {
                showReplaceModal(existingHeroItem, cartItem);
                return;
            }
        }
    }

    if (cart.length >= MAX_CART_ITEMS) {
        showToast('Cart is full (max 150 items)');
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
    renderAssembliesList();

    if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
}

function removeFromCart(itemId) {
    const item = cart.find(i => i.id === itemId);
    const itemName = item ? item.name : '';
    const cartItemsEl = document.getElementById('cartItems');
    const domItem = cartItemsEl
        ?.querySelector(`.cart-item-remove[data-id="${CSS.escape(itemId)}"]`)
        ?.closest('.cart-item');
    const doRemove = () => {
        cart = cart.filter(i => i.id !== itemId);
        saveCart();
        updateCartBadge();
        updateCartButtons();
        renderAssembliesList();

        if (cart.length === 0) {
            renderCartItems();
        }
    };

    if (domItem) {
        domItem.style.transition =
            'opacity 0.18s cubic-bezier(0.4, 0, 1, 1), ' +
            'transform 0.18s cubic-bezier(0.4, 0, 1, 1), ' +
            'max-height 0.25s cubic-bezier(0.4, 0, 1, 1), ' +
            'padding 0.25s cubic-bezier(0.4, 0, 1, 1), ' +
            'margin 0.25s cubic-bezier(0.4, 0, 1, 1)';
        domItem.style.maxHeight = domItem.offsetHeight + 'px';
        domItem.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            domItem.style.opacity = '0';
            domItem.style.transform = 'translateX(12px)';
            domItem.style.maxHeight = '0';
            domItem.style.paddingTop = '0';
            domItem.style.paddingBottom = '0';
            domItem.style.marginBottom = '0';
        });

        setTimeout(() => {
            domItem.remove();
            doRemove();
        }, 260);
    } else {
        doRemove();
        renderCartItems();
    }

    if (itemName) {
        showToast(`Removed <span style="color: var(--md-sys-color-primary)">${escapeHtml(itemName)}</span>`);
    } else {
        showToast('Removed from cart');
    }

    if ('vibrate' in navigator) navigator.vibrate(10);
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
    const mobileBadge = document.getElementById('mobileCartBadge');
    const count = cart.length;

    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }

    if (mobileBadge) {
        mobileBadge.textContent = count;
        if (count > 0) {
            mobileBadge.classList.add('show');
        } else {
            mobileBadge.classList.remove('show');
        }
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
        if (!window._packingInProgress) {
            cartModal.classList.remove('expanded');
        }

        const logPanel = document.getElementById('packLogPanel');
        if (logPanel && !window._packingInProgress) {
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
            openModal();
            if (window._packingInProgress) {
                cartModal.classList.add('expanded');
                logPanel.classList.add('active');
            }
        });
    };

    const closeCart = () => {
        cartModal.classList.remove('active');
        cartModal.classList.remove('expanded');
        cartOverlay.classList.remove('active');
        closeModal();

        const logPanel = document.getElementById('packLogPanel');
        if (logPanel && !window._packingInProgress) {
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

        function findBaseMod(mods) {
            return mods.find(m => {
                if (m.name === item.name) return true;
                if (m.styles && m.styles.length > 1) {
                    return m.styles.some(s =>
                        m.name + ' ' + s.label.replace('Style ', '') === item.name
                    );
                }
                return false;
            });
        }

        if (categoryData?.groups && Array.isArray(categoryData.groups)) {
            const group = categoryData.groups.find(g => g.id === item.groupId);
            if (group) {
                mod = findBaseMod(group.mods);
            }
        } else if (Array.isArray(categoryData)) {
            mod = findBaseMod(categoryData);
        }

        const { preview: resolvedPreview } = resolveItemFiles(item);
        const previewFile = resolvedPreview || '';
        if (previewFile) {
            previewPath = `assets/previews/${item.categoryId}/${previewFile}`;
            isVideo = previewFile.endsWith('.mp4');
        }

        let previewHtml = '';
        if (previewPath) {
            if (isVideo) {
                previewHtml = `<video src="${previewPath}" class="cart-item-image" autoplay muted loop playsinline onerror="this.style.display='none'"></video>`;
            } else {
                previewHtml = `<img src="${previewPath}" alt="${escapeHtml(item.name)}" class="cart-item-image" onerror="this.style.display='none'">`;
            }
        }

        const hasStyles = mod && mod.styles && mod.styles.length > 1;
        const activeStyleIndex = hasStyles
            ? Math.max(0, mod.styles.findIndex(s =>
                mod.name + ' ' + s.label.replace('Style ', '') === item.name
            ))
            : 0;

        const styleSwitcherHtml = hasStyles ? `
            <div class="cart-style-circles">
                ${mod.styles.map((s, i) => `
                    <span class="style-circle ${i === activeStyleIndex ? 'active' : ''}"
                          data-style-index="${i}"
                          style="background:${s.color}"
                          title="${s.label}"></span>
                `).join('')}
            </div>
        ` : '';

        cartItem.innerHTML = `
                ${previewHtml}
                <div class="cart-item-info">
                    <h3 class="cart-item-name">${escapeHtml(item.name)}</h3>
                    <div class="cart-item-meta">
                        <p class="cart-item-category">${escapeHtml(categoryName)}</p>
                        ${styleSwitcherHtml}
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${escapeHtml(item.id)}">
                    <span class="material-symbols-rounded">close</span>
                </button>
        `;

        if (hasStyles) {
            cartItem.querySelectorAll('.style-circle').forEach(circle => {
                circle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = +circle.dataset.styleIndex;
                    saveStyleIndex(mod.name, idx);

                    const newName = mod.name + ' ' + mod.styles[idx].label.replace('Style ', '');
                    const newId = item.groupId
                        ? `${item.categoryId}-${item.groupId}-${newName}`
                        : `${item.categoryId}-${newName}`;

                    const cartIdx = cart.findIndex(i => i.id === item.id);
                    if (cartIdx !== -1) {
                        cart[cartIdx] = {
                            ...cart[cartIdx],
                            id: newId,
                            name: newName,
                            file: mod.styles[idx].file,
                            preview: mod.styles[idx].preview
                        };
                        item.id = newId;
                        item.name = newName;
                        saveCart();
                        updateCartButtons();
                    }

                    const previewEl = cartItem.querySelector('.cart-item-image');
                    if (previewEl) previewEl.src = `assets/previews/${item.categoryId}/${mod.styles[idx].preview}`;

                    const nameEl = cartItem.querySelector('.cart-item-name');
                    if (nameEl) nameEl.textContent = newName;

                    document.querySelectorAll(`.card[data-mod-name="${CSS.escape(mod.name)}"]`).forEach(otherCard => {
                        const otherImg = otherCard.querySelector('.card-media img, .card-media video');
                        if (otherImg) otherImg.src = `assets/previews/${item.categoryId}/${mod.styles[idx].preview}`;

                        const otherCartBtn = otherCard.querySelector('.add-to-cart-btn');
                        if (otherCartBtn) {
                            otherCartBtn.setAttribute('data-mod', JSON.stringify({
                                name: newName,
                                file: mod.styles[idx].file,
                                preview: mod.styles[idx].preview
                            }));
                        }

                        otherCard.querySelectorAll('.style-circle').forEach(c => {
                            c.classList.toggle('active', +c.dataset.styleIndex === idx);
                        });
                    });

                    updateCartButtons();

                    cartItem.querySelectorAll('.style-circle').forEach(c => {
                        c.classList.toggle('active', +c.dataset.styleIndex === idx);
                    });
                });
            });
        }

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

// vpk renaming
function createPakNameAllocator(existingFileNames) {
    let priorityCounter = 2;
    let normalCounter = 10;

    function allocatePriority(originalName) {
        if (priorityCounter <= 9) {
            const candidate = `!pak${String(priorityCounter).padStart(2, '0')}_dir.vpk`;
            priorityCounter++;
            existingFileNames.add(candidate.toLowerCase());
            return candidate;
        }
        return getUniqueFileName(originalName, existingFileNames);
    }

    function allocateNormal() {
        if (normalCounter <= 99) {
            const candidate = `pak${normalCounter}_dir.vpk`;
            normalCounter++;
            existingFileNames.add(candidate.toLowerCase());
            return candidate;
        }
        return getUniqueFileName('pak99_dir.vpk', existingFileNames);
    }

    return { allocatePriority, allocateNormal };
}

function generateWindowsBat(langFolder, customDotaPath) {
    const hasCustomPath = customDotaPath && customDotaPath.length > 0;
    const lines = [
        '@echo off',
        'setlocal enabledelayedexpansion',
        'set "ROOT_DIR=%~dp0"',
        'cd /d "%ROOT_DIR%mods"',
        '',
        'echo Running VPKMerge...',
        'start /wait VPKMerge.exe',
        '',
        'set "DOTA_PATH="',
        '',
        ...(hasCustomPath ? [
            'REM Try user-specified path first',
            'if exist "' + customDotaPath + '\\" (',
            '    set "DOTA_PATH=' + customDotaPath + '"',
            '    echo [OK] Using user path',
            ') else (',
            '    echo [WARN] User path not found, falling back to auto detect...',
            ')',
            '',
        ] : []),
        'if not defined DOTA_PATH (',
        '    for /f "tokens=2*" %%a in (\'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 570" /v "InstallLocation" 2^>nul\') do (',
        '        set "DOTA_PATH=%%b\\game"',
        '    )',
        ')',
        'if not defined DOTA_PATH (',
        '    for /f "tokens=2*" %%a in (\'reg query "HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 570" /v "InstallLocation" 2^>nul\') do (',
        '        set "DOTA_PATH=%%b\\game"',
        '    )',
        ')',
        '',
        'if not defined DOTA_PATH (',
        '    for /f "tokens=2*" %%a in (\'reg query "HKCU\\SOFTWARE\\Valve\\Steam" /v "SteamPath" 2^>nul\') do (',
        '        set "STEAM_REG=%%b"',
        '        set "STEAM_REG=!STEAM_REG:/=\\!"',
        '        if exist "!STEAM_REG!\\steamapps\\common\\dota 2 beta\\game" (',
        '            set "DOTA_PATH=!STEAM_REG!\\steamapps\\common\\dota 2 beta\\game"',
        '        )',
        '    )',
        ')',
        '',
        'if not defined DOTA_PATH (',
        '    for %%d in (C D E F G H I J K L M N O P Q R S T U V W X Y Z) do (',
        '        if not defined DOTA_PATH (',
        '            for %%p in (',
        '                "%%d:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game"',
        '                "%%d:\\Program Files\\Steam\\steamapps\\common\\dota 2 beta\\game"',
        '                "%%d:\\Steam\\steamapps\\common\\dota 2 beta\\game"',
        '                "%%d:\\Games\\Steam\\steamapps\\common\\dota 2 beta\\game"',
        '                "%%d:\\SteamLibrary\\steamapps\\common\\dota 2 beta\\game"',
        '            ) do (',
        '                if exist %%p (',
        '                    set "DOTA_PATH=%%~p"',
        '                )',
        '            )',
        '        )',
        '    )',
        ')',
        '',
        'if not defined DOTA_PATH (',
        '    echo [ERROR] Dota 2 not found. Please move files manually.',
        '    pause',
        '    exit /b 1',
        ')',
        '',
        'echo [OK] Found Dota 2 at: !DOTA_PATH!',
        '',
        'set "LANG_DIR=!DOTA_PATH!\\' + langFolder + '"',
        'if not exist "!LANG_DIR!" (',
        '    mkdir "!LANG_DIR!"',
        '    echo [OK] Created folder: !LANG_DIR!',
        ')',
        '',
        'echo [INFO] Removing old pak10*.vpk from !LANG_DIR!...',
        'for %%f in ("!LANG_DIR!\\pak10*.vpk") do (',
        '    del /f /q "%%f"',
        '    echo [OK] Deleted old %%~nxf',
        ')',
        '',
        'set "VPK_MOVED=0"',
        'for %%f in (pak10*.vpk) do (',
        '    move /y "%%f" "!LANG_DIR!\\"',
        '    echo [OK] Moved %%f to !LANG_DIR!',
        '    set "VPK_MOVED=1"',
        ')',
        'if "!VPK_MOVED!"=="0" (',
        '    echo [WARN] No pak10*.vpk files found in mods folder',
        ')',
        '',
        'if exist "!LANG_DIR!\\maps" (',
        '    echo [INFO] Removing existing maps folder...',
        '    rmdir /s /q "!LANG_DIR!\\maps"',
        ')',
        'if exist "maps" (',
        '    xcopy /e /i /y "maps" "!LANG_DIR!\\maps"',
        '    rmdir /s /q "maps"',
        '    echo [OK] Moved maps to !LANG_DIR!',
        ')',
        '',
        'cd /d "%ROOT_DIR%"',
        'for /d %%f in (*) do (',
        '    echo "%%f" | findstr /i /c:"cursor" /c:"font" >nul 2>&1',
        '    if not errorlevel 1 (',
        '        if exist "%%f\\install.bat" (',
        '            echo [INFO] Running install in "%%f"...',
        '            pushd "%ROOT_DIR%%%f"',
        '            echo. | call install.bat',
        '            popd',
        '        )',
        '    )',
        ')',
        '',
        'echo.',
        'echo [DONE] Installation complete!',
        'pause',
    ];
    return lines.join('\r\n');
}

function generateLinuxSh(langFolder, customDotaPath) {
    const hasCustomPath = customDotaPath && customDotaPath.length > 0;
    const nl = '\n';
    const s = [
        '#!/bin/bash',
        'set -uo pipefail',
        'SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"',
        'MODS_DIR="$SCRIPT_DIR/mods"',
        'cd "$MODS_DIR"',
        '',
        'echo "Making VPKMerge executable..."',
        'chmod +x VPKMerge',
        '',
        'echo "Running VPKMerge..."',
        './VPKMerge || { echo "[ERROR] VPKMerge failed. Aborting."; exit 1; }',
        '',
        'DOTA_PATH=""',
        '',
        ...(hasCustomPath ? [
            'CUSTOM_PATH="' + customDotaPath.replace(/"/g, '\\"') + '"',
            'if [ -d "$CUSTOM_PATH" ]; then',
            '    DOTA_PATH="$CUSTOM_PATH"',
            '    echo "[OK] Using user path: $CUSTOM_PATH"',
            'else',
            '    echo "[WARN] User path not found, falling back to auto detect..."',
            'fi',
            '',
        ] : []),
        'find_in_vdf() {',
        '    local vdf="$1"',
        '    [ -f "$vdf" ] || return',
        '    while IFS= read -r line; do',
        '        val=$(echo "$line" | grep -i \'"path"\' | sed \'s/.*"[Pp]ath"[[:space:]]*"\\(.*\\)"/\\1/\' | sed \'s|\\\\\\\\|/|g\')',
        '        [ -z "$val" ] && continue',
        '        local candidate="$val/steamapps/common/dota 2 beta/game"',
        '        if [ -d "$candidate" ]; then',
        '            echo "$candidate"',
        '            return',
        '        fi',
        '    done < "$vdf"',
        '}',
        '',
        'if [ -z "$DOTA_PATH" ]; then',
        '    for vdf in \\',
        '        "$HOME/.steam/steam/steamapps/libraryfolders.vdf" \\',
        '        "$HOME/.local/share/Steam/steamapps/libraryfolders.vdf" \\',
        '        "$HOME/.steam/root/steamapps/libraryfolders.vdf"',
        '    do',
        '        result=$(find_in_vdf "$vdf")',
        '        if [ -n "$result" ]; then',
        '            DOTA_PATH="$result"',
        '            break',
        '        fi',
        '    done',
        'fi',
        '',
        'if [ -z "$DOTA_PATH" ]; then',
        '    for root in \\',
        '        "$HOME/.steam/steam" \\',
        '        "$HOME/.local/share/Steam" \\',
        '        "$HOME/.steam/root" \\',
        '        "/usr/local/steam" \\',
        '        "/opt/steam" \\',
        '        "$HOME/Steam" \\',
        '        "$HOME/Games/Steam"',
        '    do',
        '        candidate="$root/steamapps/common/dota 2 beta/game"',
        '        if [ -d "$candidate" ]; then',
        '            DOTA_PATH="$candidate"',
        '            break',
        '        fi',
        '    done',
        'fi',
        '',
        'if [ -z "$DOTA_PATH" ]; then',
        '    for root in \\',
        '        "$HOME/.var/app/com.valvesoftware.Steam/.steam/steam" \\',
        '        "$HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam"',
        '    do',
        '        candidate="$root/steamapps/common/dota 2 beta/game"',
        '        if [ -d "$candidate" ]; then',
        '            DOTA_PATH="$candidate"',
        '            break',
        '        fi',
        '    done',
        'fi',
        '',
        'if [ -z "$DOTA_PATH" ]; then',
        '    result=$(find "$HOME" /mnt /media -maxdepth 5 -type d -name "dota 2 beta" 2>/dev/null | head -1)',
        '    if [ -n "$result" ]; then',
        '        DOTA_PATH="$result/game"',
        '    fi',
        'fi',
        '',
        'if [ -z "$DOTA_PATH" ]; then',
        '    echo "[ERROR] Dota 2 not found. Please move files manually."',
        '    exit 1',
        'fi',
        '',
        'echo "[OK] Found Dota 2 at: $DOTA_PATH"',
        '',
        'LANG_DIR="$DOTA_PATH/' + langFolder + '"',
        'if [ ! -d "$LANG_DIR" ]; then',
        '    mkdir -p "$LANG_DIR"',
        '    echo "[OK] Created folder: $LANG_DIR"',
        'fi',
        '',
        'echo "[INFO] Removing old pak10*.vpk from $LANG_DIR..."',
        'for f in "$LANG_DIR"/pak10*.vpk; do',
        '    [ -f "$f" ] || continue',
        '    rm -f "$f"',
        '    echo "[OK] Deleted old $(basename $f)"',
        'done',
        '',
        'VPK_MOVED=0',
        'for f in pak10*.vpk; do',
        '    [ -f "$f" ] || continue',
        '    mv -f "$f" "$LANG_DIR/"',
        '    echo "[OK] Moved $f to $LANG_DIR"',
        '    VPK_MOVED=1',
        'done',
        'if [ "$VPK_MOVED" -eq 0 ]; then',
        '    echo "[WARN] No pak10*.vpk files found in mods folder"',
        'fi',
        '',
        'if [ -d "maps" ]; then',
        '    rm -rf "$LANG_DIR/maps"',
        '    cp -r "maps" "$LANG_DIR/"',
        '    rm -rf "maps"',
        '    echo "[OK] Moved maps to $LANG_DIR"',
        'fi',
        '',
        'cd "$SCRIPT_DIR"',
        'for dir in */; do',
        '    [ -d "$dir" ] || continue',
        '    dirlow=$(echo "$dir" | tr \'[:upper:]\' \'[:lower:]\')',
        '    case "$dirlow" in',
        '        *cursor*)',
        '            CURSOR_DST="$DOTA_PATH/dota/resource/cursor"',
        '            mkdir -p "$CURSOR_DST"',
        '            cp -r "${dir%/}/." "$CURSOR_DST/"',
        '            echo "[OK] Installed cursor from $dir to $CURSOR_DST"',
        '            ;;',
        '        *font*)',
        '            FONTS_DST="$DOTA_PATH/dota/panorama/fonts"',
        '            if [ -d "${dir%/}/assets/custom" ]; then',
        '                mkdir -p "$FONTS_DST"',
        '                rm -f "$FONTS_DST"/*',
        '                cp -r "${dir%/}/assets/custom/." "$FONTS_DST/"',
        '                echo "[OK] Installed font from ${dir}assets/custom/ to $FONTS_DST"',
        '            else',
        '                echo "[WARN] assets/custom/ not found in $dir, skipping font install"',
        '            fi',
        '            ;;',
        '    esac',
        'done',
        '',
        'echo ""',
        'echo "[DONE] Installation complete!"',
    ];
    return s.join(nl);
}

function generateWindowsUninstallBat(langFolder, customDotaPath) {
    const hasCustomPath = customDotaPath && customDotaPath.length > 0;
    const lines = [
        '@echo off',
        'setlocal enabledelayedexpansion',
        '',
        'set "DOTA_PATH="',
        '',
        ...(hasCustomPath ? [
            'REM Try user-specified path first',
            'if exist "' + customDotaPath + '\\" (',
            '    set "DOTA_PATH=' + customDotaPath + '"',
            '    echo [OK] Using user path',
            ') else (',
            '    echo [WARN] User path not found, falling back to auto detect...',
            ')',
            '',
        ] : []),
        'if not defined DOTA_PATH (',
        '    for /f "tokens=2*" %%a in (\'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 570" /v "InstallLocation" 2^>nul\') do (',
        '        set "DOTA_PATH=%%b\\game"',
        '    )',
        ')',
        'if not defined DOTA_PATH (',
        '    for /f "tokens=2*" %%a in (\'reg query "HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 570" /v "InstallLocation" 2^>nul\') do (',
        '        set "DOTA_PATH=%%b\\game"',
        '    )',
        ')',
        '',
        'if not defined DOTA_PATH (',
        '    for /f "tokens=2*" %%a in (\'reg query "HKCU\\SOFTWARE\\Valve\\Steam" /v "SteamPath" 2^>nul\') do (',
        '        set "STEAM_REG=%%b"',
        '        set "STEAM_REG=!STEAM_REG:/=\\!"',
        '        if exist "!STEAM_REG!\\steamapps\\common\\dota 2 beta\\game" (',
        '            set "DOTA_PATH=!STEAM_REG!\\steamapps\\common\\dota 2 beta\\game"',
        '        )',
        '    )',
        ')',
        '',
        'if not defined DOTA_PATH (',
        '    for %%d in (C D E F G H I J K L M N O P Q R S T U V W X Y Z) do (',
        '        if not defined DOTA_PATH (',
        '            for %%p in (',
        '                "%%d:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game"',
        '                "%%d:\\Program Files\\Steam\\steamapps\\common\\dota 2 beta\\game"',
        '                "%%d:\\Steam\\steamapps\\common\\dota 2 beta\\game"',
        '                "%%d:\\Games\\Steam\\steamapps\\common\\dota 2 beta\\game"',
        '                "%%d:\\SteamLibrary\\steamapps\\common\\dota 2 beta\\game"',
        '            ) do (',
        '                if exist %%p (',
        '                    set "DOTA_PATH=%%~p"',
        '                )',
        '            )',
        '        )',
        '    )',
        ')',
        '',
        'if not defined DOTA_PATH (',
        '    echo [ERROR] Dota 2 not found. Please remove files manually.',
        '    pause',
        '    exit /b 1',
        ')',
        '',
        'echo [OK] Found Dota 2 at: !DOTA_PATH!',
        '',
        'set "LANG_DIR=!DOTA_PATH!\\' + langFolder + '"',
        '',
        'echo [INFO] Removing pak10*.vpk from !LANG_DIR!...',
        'set "DELETED=0"',
        'for %%f in ("!LANG_DIR!\\pak10*.vpk") do (',
        '    del /f /q "%%f"',
        '    echo [OK] Deleted %%~nxf',
        '    set "DELETED=1"',
        ')',
        'if "!DELETED!"=="0" (',
        '    echo [WARN] No pak10*.vpk files found in !LANG_DIR!',
        ')',
        '',
        'if exist "!LANG_DIR!\\maps" (',
        '    rmdir /s /q "!LANG_DIR!\\maps"',
        '    echo [OK] Deleted maps folder',
        ')',
        '',
        'echo.',
        'echo [DONE] Mods removed successfully!',
        'pause',
    ];
    return lines.join('\r\n');
}

function generateLinuxUninstallSh(langFolder, customDotaPath) {
    const hasCustomPath = customDotaPath && customDotaPath.length > 0;
    const nl = '\n';
    const s = [
        '#!/bin/bash',
        'set -uo pipefail',
        '',
        'DOTA_PATH=""',
        '',
        ...(hasCustomPath ? [
            'CUSTOM_PATH="' + customDotaPath.replace(/"/g, '\\"') + '"',
            'if [ -d "$CUSTOM_PATH" ]; then',
            '    DOTA_PATH="$CUSTOM_PATH"',
            '    echo "[OK] Using user path: $CUSTOM_PATH"',
            'else',
            '    echo "[WARN] User path not found, falling back to auto detect..."',
            'fi',
            '',
        ] : []),
        'find_in_vdf() {',
        '    local vdf="$1"',
        '    [ -f "$vdf" ] || return',
        '    while IFS= read -r line; do',
        '        val=$(echo "$line" | grep -i \'"path"\' | sed \'s/.*"[Pp]ath"[[:space:]]*"\\(.*\\)"/\\1/\' | sed \'s|\\\\\\\\|/|g\')',
        '        [ -z "$val" ] && continue',
        '        local candidate="$val/steamapps/common/dota 2 beta/game"',
        '        if [ -d "$candidate" ]; then',
        '            echo "$candidate"',
        '            return',
        '        fi',
        '    done < "$vdf"',
        '}',
        '',
        'if [ -z "$DOTA_PATH" ]; then',
        '    for vdf in \\',
        '        "$HOME/.steam/steam/steamapps/libraryfolders.vdf" \\',
        '        "$HOME/.local/share/Steam/steamapps/libraryfolders.vdf" \\',
        '        "$HOME/.steam/root/steamapps/libraryfolders.vdf"',
        '    do',
        '        result=$(find_in_vdf "$vdf")',
        '        if [ -n "$result" ]; then',
        '            DOTA_PATH="$result"',
        '            break',
        '        fi',
        '    done',
        'fi',
        '',
        'if [ -z "$DOTA_PATH" ]; then',
        '    for root in \\',
        '        "$HOME/.steam/steam" \\',
        '        "$HOME/.local/share/Steam" \\',
        '        "$HOME/.steam/root" \\',
        '        "/usr/local/steam" \\',
        '        "/opt/steam" \\',
        '        "$HOME/Steam" \\',
        '        "$HOME/Games/Steam"',
        '    do',
        '        candidate="$root/steamapps/common/dota 2 beta/game"',
        '        if [ -d "$candidate" ]; then',
        '            DOTA_PATH="$candidate"',
        '            break',
        '        fi',
        '    done',
        'fi',
        '',
        'if [ -z "$DOTA_PATH" ]; then',
        '    for root in \\',
        '        "$HOME/.var/app/com.valvesoftware.Steam/.steam/steam" \\',
        '        "$HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam"',
        '    do',
        '        candidate="$root/steamapps/common/dota 2 beta/game"',
        '        if [ -d "$candidate" ]; then',
        '            DOTA_PATH="$candidate"',
        '            break',
        '        fi',
        '    done',
        'fi',
        '',
        'if [ -z "$DOTA_PATH" ]; then',
        '    result=$(find "$HOME" /mnt /media -maxdepth 5 -type d -name "dota 2 beta" 2>/dev/null | head -1)',
        '    if [ -n "$result" ]; then',
        '        DOTA_PATH="$result/game"',
        '    fi',
        'fi',
        '',
        'if [ -z "$DOTA_PATH" ]; then',
        '    echo "[ERROR] Dota 2 not found. Please remove files manually."',
        '    exit 1',
        'fi',
        '',
        'echo "[OK] Found Dota 2 at: $DOTA_PATH"',
        '',
        'LANG_DIR="$DOTA_PATH/' + langFolder + '"',
        '',
        'echo "[INFO] Removing pak10*.vpk from $LANG_DIR..."',
        'DELETED=0',
        'for f in "$LANG_DIR"/pak10*.vpk; do',
        '    [ -f "$f" ] || continue',
        '    rm -f "$f"',
        '    echo "[OK] Deleted $(basename "$f")"',
        '    DELETED=1',
        'done',
        'if [ "$DELETED" -eq 0 ]; then',
        '    echo "[WARN] No pak10*.vpk files found in $LANG_DIR"',
        'fi',
        '',
        'if [ -d "$LANG_DIR/maps" ]; then',
        '    rm -rf "$LANG_DIR/maps"',
        '    echo "[OK] Deleted maps folder"',
        'fi',
        '',
        'echo ""',
        'echo "[DONE] Mods removed successfully!"',
    ];
    return s.join(nl);
}

function diagnoseFetchError(error, filePath) {
    const msg = (error?.message || '').toLowerCase();
    const name = (error?.name || '').toLowerCase();

    if (window.location.protocol === 'file:') {
        return {
            message: 'Page opened as a local file (file://)',
            suggestion: 'Open the site via a normal https:// link, not as a local file'
        };
    }

    if (msg.includes('http 404') || msg.includes('http 403')) {
        return {
            message: 'Mod not found (deleted or moved). Download will continue without this mod',
            suggestion: 'Remove this mod from the cart'
        };
    }

    if (msg === 'mod no longer exists') {
        return {
            message: 'Mod no longer exists (removed or renamed). Download will continue without this mod',
            suggestion: 'Remove this mod from the cart'
        };
    }

    if (name === 'typeerror' && (msg.includes('failed to fetch') || msg.includes('networkerror'))) {
        return {
            message: 'Browser blocked the file download',
            suggestion: 'Disable AdBlock / uBlock / browser extensions, or try Incognito mode (Ctrl+Shift+N)'
        };
    }

    if (msg.includes('timeout') || msg.includes('aborted') || name === 'aborterror') {
        return {
            message: 'File download timed out',
            suggestion: 'Check your internet connection and try again'
        };
    }

    if (msg.includes('jszip') || (filePath === 'pack' && msg.includes('script'))) {
        return {
            message: 'Failed to load JSZip library',
            suggestion: 'Reload the page (F5) and try again. If that doesn\'t help - disable browser extensions'
        };
    }

    if (msg.includes('network') || msg.includes('net::')) {
        return {
            message: 'No internet connection',
            suggestion: 'Check your internet connection and try again'
        };
    }

    if (msg.includes('array buffer allocation failed') ||
        msg.includes('out of memory') ||
        msg.includes('allocation failed')) {
        return {
            message: 'Not enough memory to create the archive',
            suggestion: 'Try reducing the number of mods in the cart'
        };
    }

    return {
        message: error?.message || 'Unknown error',
        suggestion: 'Try reloading the page, disabling VPN, or switching to a different browser'
    };
}

async function fetchWithRetry(url, retries = 3, onProgress = null) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            if (!onProgress) return response;

            const contentLength = response.headers.get('Content-Length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            let loaded = 0;

            const reader = response.body.getReader();
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                onProgress(loaded, total);
            }

            const blob = new Blob(chunks);
            return { ok: true, blob: async () => blob };
        } catch (error) {
            lastError = error;
            if (i < retries - 1) {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
            }
        }
    }
    throw lastError;
}

async function asyncPool(concurrency, iterable, iteratorFn) {
    const ret = [];
    const executing = new Set();
    for (const item of iterable) {
        const p = Promise.resolve().then(() => iteratorFn(item, iterable));
        ret.push(p);
        executing.add(p);
        const clean = () => executing.delete(p);
        p.then(clean).catch(clean);
        if (executing.size >= concurrency) {
            await Promise.race(executing);
        }
    }
    return Promise.all(ret);
}

async function packAndDownload() {
    if (cart.length === 0) return;
    const packBtn = document.getElementById('packBtn');
    const originalContent = packBtn.innerHTML;

    packBtn.disabled = true;
    window._packingInProgress = true;
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
        <m3e-loading-indicator variant="contained" aria-label="Packing progress"></m3e-loading-indicator>
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
    <span style="word-break: break-word;">${highlightedMessage}</span>
    `;

        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    let packSuccess = false;

    let packProgressTarget = 0;
    let packProgressCurrent = 0;
    let packProgressRaf = null;

    function setPackProgress(value) {
        packProgressTarget = value;
        if (packProgressRaf) return;
        function step() {
            packProgressCurrent += (packProgressTarget - packProgressCurrent) * 0.08;
            const bar = document.getElementById('packProgressBar');
            if (bar) bar.value = packProgressCurrent;
            if (Math.abs(packProgressTarget - packProgressCurrent) > 0.1) {
                packProgressRaf = requestAnimationFrame(step);
            } else {
                if (bar) bar.value = packProgressTarget;
                packProgressRaf = null;
            }
        }
        packProgressRaf = requestAnimationFrame(step);
    }

    const RENAME_CATEGORIES = ['trees', 'river', 'shaders', 'herofx', 'ranged-attack', 'hero-items', 'optimization'];

    try {
        addLog('Starting pack creation...', 'start');

        if (typeof zip === 'undefined') {
            throw new Error('zip.js library not loaded');
        }

        addLog(`Creating archive for ${cart.length} mods...`, 'archive');
        statusText.textContent = 'Creating archive...';
        const packProgressBar = document.getElementById('packProgressBar');
        packProgressCurrent = 0; packProgressTarget = 0; setPackProgress(0);

        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const timestamp = `${pad(now.getHours())}.${pad(now.getMinutes())}-${pad(now.getDate())}.${pad(now.getMonth() + 1)}`;
        const archiveName = `d2pfxPack-${timestamp}`;

        const blobWriter = new zip.BlobWriter('application/zip');
        const zipWriter = new zip.ZipWriter(blobWriter, { level: 0 });
        let zipWriterClosed = false;

        const existingFileNames = new Set();
        const modFileNames = {};
        const fileErrors = [];
        let processedCount = 0;
        const pakAllocator = createPakNameAllocator(existingFileNames);

        const addToRoot = async (path, blob) => {
            await zipWriter.add(path, new zip.BlobReader(blob));
        };

        let zipQueuePromise = Promise.resolve();
        const enqueueZip = (fn) => {
            zipQueuePromise = zipQueuePromise.then(fn);
            return zipQueuePromise;
        };

        await asyncPool(8, cart, async (item) => {
            const { file: liveFile } = resolveItemFiles(item);
            const filePath = liveFile ? getFileUrl(item.categoryId, liveFile) : null;
            try {
                if (!liveFile) throw new Error('Mod no longer exists');

                const isExternalUrl = liveFile && liveFile.startsWith('http');
                let progressEntry = null;

                function formatMB(bytes) {
                    return (bytes / (1024 * 1024)).toFixed(0);
                }

                const MIN_SIZE_FOR_PROGRESS = 100 * 1024 * 1024;

                function onProgress(loaded, total) {
                    if (!progressEntry) return;
                    if (total > 0 && total < MIN_SIZE_FOR_PROGRESS) return;
                    const sizeEl = progressEntry.querySelector('.download-size');
                    if (!sizeEl) return;
                    if (total > 0) {
                        sizeEl.textContent = `${formatMB(loaded)}/${formatMB(total)} MB`;
                    } else {
                        sizeEl.textContent = `${formatMB(loaded)} MB`;
                    }
                }

                if (isExternalUrl) {
                    progressEntry = document.createElement('div');
                    progressEntry.className = 'pack-log-entry download';
                    progressEntry.innerHTML = `
                <span class="material-symbols-rounded">download</span>
                <span style="word-break: break-word;">${escapeHtml(item.name)}</span>
                <span class="download-size" style="margin-left: auto; opacity: 0.6; font-size: 0.8em; white-space: nowrap; padding-left: 8px;">connecting...</span>
            `;
                    logContainer.appendChild(progressEntry);
                    logContainer.scrollTop = logContainer.scrollHeight;
                }

                const response = await fetchWithRetry(filePath, 3, isExternalUrl ? onProgress : null);
                const blob = await response.blob();

                if (progressEntry) progressEntry.remove();

                await enqueueZip(async () => {
                    try {
                        if (isZipFile(liveFile)) {
                            const zipReader = new zip.ZipReader(new zip.BlobReader(blob));
                            const entries = await zipReader.getEntries();

                            for (const entry of entries) {
                                if (entry.directory) continue;

                                const entryBlob = await entry.getData(new zip.BlobWriter());
                                const relativePath = entry.filename;

                                if (item.categoryId === 'terrains') {
                                    if (relativePath.includes('maps/') && !relativePath.includes('!guide')) {
                                        const pathParts = relativePath.split('/');
                                        const mapsIndex = pathParts.indexOf('maps');
                                        if (mapsIndex !== -1) {
                                            const mapsPath = pathParts.slice(mapsIndex).join('/');
                                            await addToRoot(`${archiveName}/mods/${mapsPath}`, entryBlob);
                                        }
                                    }
                                } else if (item.categoryId === 'cursors' || item.categoryId === 'fonts') {
                                    await addToRoot(`${archiveName}/${relativePath}`, entryBlob);
                                } else {
                                    let fileName = relativePath.split('/').pop();
                                    if (fileName) {
                                        const isPriority = RENAME_CATEGORIES.includes(item.categoryId);
                                        let uniqueName;
                                        if (fileName.toLowerCase().endsWith('_dir.vpk')) {
                                            if (isPriority) {
                                                uniqueName = pakAllocator.allocatePriority('!' + fileName);
                                            } else {
                                                uniqueName = pakAllocator.allocateNormal();
                                            }
                                        } else {
                                            if (isPriority) fileName = '!' + fileName;
                                            uniqueName = getUniqueFileName(fileName, existingFileNames);
                                        }
                                        await addToRoot(`${archiveName}/mods/${uniqueName}`, entryBlob);
                                        if (!modFileNames[item.name]) modFileNames[item.name] = [];
                                        modFileNames[item.name].push(uniqueName);
                                    }
                                }
                            }
                            await zipReader.close();
                        } else {
                            let fileName = liveFile;
                            const isPriority = RENAME_CATEGORIES.includes(item.categoryId);
                            let uniqueName;
                            if (fileName.toLowerCase().endsWith('_dir.vpk')) {
                                if (isPriority) {
                                    uniqueName = pakAllocator.allocatePriority('!' + fileName);
                                } else {
                                    uniqueName = pakAllocator.allocateNormal();
                                }
                            } else {
                                if (isPriority) fileName = '!' + fileName;
                                uniqueName = getUniqueFileName(fileName, existingFileNames);
                            }
                            await addToRoot(`${archiveName}/mods/${uniqueName}`, blob);
                            if (!modFileNames[item.name]) modFileNames[item.name] = [];
                            modFileNames[item.name].push(uniqueName);
                        }

                        addLog(`Added ${item.name}`, 'success');
                        processedCount++;
                        statusText.textContent = `Processing ${processedCount}/${cart.length} mods...`;
                        const progressBar = document.getElementById('packProgressBar');
                        setPackProgress((processedCount / cart.length) * 100);
                    } catch (zipErr) {
                        console.error(`Failed to add ${item.name} to archive:`, zipErr);
                        addLog(`❌ ${item.name}: failed to write to archive`, 'error');
                        fileErrors.push(item.name);
                    }
                });
            } catch (error) {
                console.error(`Error processing ${item.name}:`, error);
                const reason = diagnoseFetchError(error, filePath);
                enqueueZip(() => {
                    addLog(`❌ ${item.name}: ${reason.message}`, 'error');
                    addLog(reason.suggestion, 'warning');
                    fileErrors.push(item.name);
                });
            }
        });

        await zipQueuePromise;

        if (fileErrors.length > 0) {
            const compressed = await compressAssembly({
                name: 'Recovery Pack',
                items: cart
            });
            const mirrorUrl = `https://d2pfx.netlify.app/?pack=${compressed}`;
            addLog(`Errors found, follow this <a href="${mirrorUrl}" target="_blank" style="color: var(--md-sys-color-primary); text-decoration: underline; cursor: pointer; font-weight: 600;">LINK</a> and try again.`, 'error');
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
                const fileNames = modFileNames[modName];
                const displayName = Array.isArray(fileNames) ? fileNames.join(', ') : (fileNames || '');
                modsListText += `  • ${modName} ➜ ${displayName}\n`;
            });
            modsListText += '\n';
        }

        modsListText += `╔══════════════════════════════════════════╗\n`;
        modsListText += `              TOTAL MODS: ${cart.length}\n`;
        modsListText += `      GENERATED: ${new Date().toLocaleString()}\n`;
        modsListText += `╚══════════════════════════════════════════╝\n`;
        modsListText += `      Thanks for downloading, have fun!`;

        await addToRoot(`${archiveName}/Mods.txt`, new Blob([modsListText], { type: 'text/plain' }));
        addLog('Mods list created', 'success');

        const guideText = `╔══════════════════════════════════════════╗
       Dota2PornFX Installation Guide      
╚══════════════════════════════════════════╝

RU WINDOWS
═══════════
Запустите Auto-Install.bat. Если при использовании возникают проблемы или он не работает, используйте ручной способ ниже.

1. Откройте папку mods
2. Запустите VPKMerge.exe и дождитесь окончания
3. Переместите все файлы pak10_ (pak10_dir.vpk, pak10_000.vpk, pak10_001.vpk, pak10_002.vpk, pak10_003.vpk и тд) в папку с языком игры:
   • Для русского: C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_russian
   • Для английского: C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_123
   • Для англ Minify: C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota_minify
- Если вы выбрали ландшафт, у вас будет папка maps, которую также надо переместить в папку языка игры вместе с pak10_dir.vpk
- Если вы добавили курсор, у вас будет папка "Название Cursor" в ней вы должны запустить Install.bat (если bat не работает, переместите содержимое папки cursor в Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\resource\\cursor)
- Если вы добавили шрифт, у вас будет папка "Название Font" в ней вы должны запустить Install.bat (если bat не работает, прочитайте guide.txt внутри папки)

4. Добавьте в параметры запуска игры:
   • Для русского: -language russian
   • Для английского: -language 123
   • Для англ Minify: -language minify

При использовании VPKMerge могут возникнуть проблемы с отображением некоторых модов или героев
Если вы столкнулись с такой проблемой, пожалуйста, напишите в Discord: https://discord.gg/PBvG8D9MxT
Укажите, какие моды отображаются некорректно, и прикрепите полный список установленных модов из файла Mods.txt

Если у вас происходит краш игры с ошибкой: Failed to read 16 bytes или pak10.vpk corrupt
Не используйте Auto-Install и VPKMerge, выполните ручную установку:
1. Переименуйте каждый повторяющийся .vpk файл в формат pakXX_dir.vpk (Используйте номера от 02 до 99 (pak02_dir.vpk, pak03_dir.vpk, pak10_dir.vpk и т.д.))
2. Файлы, в названии которых есть "!", должны иметь более высокий приоритет (Дайте им меньший номер (например pak02_dir.vpk))
3. Переместите все .vpk файлы в папку языка игры (dota_russian или другую)
Учитывайте лимит: Максимальное число в названии 99, файлы после этого лимита не работают и могут вызывать краш
Если модов больше лимита: Удалите лишние или объедините их отдельно через VPKMerge и добавьте как один файл

Удаление (скрипт Uninstall.bat автоматизирует первый пункт)
1. Удаление модов
   • Удалите все файлы pak10_ (pak10_dir.vpk, pak10_000.vpk, pak10_001.vpk, pak10_002.vpk, pak10_003.vpk и тд) из папки языка игры, которую вы использовали
   • Если использовали ландшафт, удалите папку maps из папки языка игры, которую вы использовали
2. Удаление шрифта
   • Запустите Uninstall.bat из папки шрифта, или вручную удалите папку Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\panorama\\fonts и проверьте целостность файлов игры
3. Удаление курсора
   • Скачайте стандартный курсор с сайта и установите его, или вручную удалите папку Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\resource\\cursor и проверьте целостность файлов игры


EN WINDOWS 
═══════════
Run Auto-Install.bat. If you encounter any issues while using it or if it doesn't work, use the manual method below.

1. Open the mods folder
2. Run VPKMerge.exe and wait until it finishes
3. Create folder dota_123 in C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\
4. Put all pak10_ (pak10_dir.vpk, pak10_000.vpk, pak10_001.vpk, pak10_002.vpk, pak10_003.vpk etc) files in the folder dota_123 (If you are using Minify, put vpk in dota_minify folder)
- If you chosen terrain, you will have a folder "maps" it should also be moved to the language folder together with pak10_dir.vpk
- If you added a cursor, you will have the folder "Name Cursor" in it, you must run Install.bat (if bat does not work, move the contents of the cursor folder to Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\resource\\cursor)
- If you added a font, you will have the folder "Name Font" in it, you must run Install.bat (if bat does not work, read guide.txt inside the folder)
5. Add to launch options: -language 123 (or "-language minify" if you're using it)

When using VPKMerge, some mods or heroes may not display correctly
If you encounter this issue, please contact me on Discord: https://discord.gg/PBvG8D9MxT
Specify which mods are displaying incorrectly and attach the full list of installed mods from the Mods.txt file

If your game crashes with the error: Failed to read 16 bytes or pak10.vpk corrupt
Do not use Auto-Install or VPKMerge, use manual installation:
1. Rename each duplicate .vpk file to the format pakXX_dir.vpk (use numbers from 02 to 99: pak02_dir.vpk, pak03_dir.vpk, pak10_dir.vpk, etc.)
2. Files that contain "!" in their name must have higher priority (assign them a lower number, e.g. pak02_dir.vpk)
3. Move all .vpk files to the game language folder (dota_123 or another)
Keep in mind the limit: maximum number in name is 99, files exceeding this limit will not work and may cause to crash
If you have more mods than the limit: remove the extra ones or merge them separately using VPKMerge and add them as a single file

Uninstall (Uninstall.bat automates the first step)
1. Removing mods
   • Delete all pak10_ files (pak10_dir.vpk, pak10_000.vpk, pak10_001.vpk, pak10_002.vpk, pak10_003.vpk etc) from the game language folder you used
   • If you used a terrain, delete the maps folder from the game language folder you used
2. Removing the font
   • Run Uninstall.bat from the font folder, or manually delete the folder Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\panorama\\fonts and verify the integrity of game files
3. Removing the cursor
   • Download the default cursor from the website and install it, or manually delete the folder Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\resource\\cursor and verify the integrity of game files


RU LINUX
═════════
Запустите Auto-Install.sh (chmod +x Auto-Install.sh ➜ ./Auto-Install.sh) Если при использовании возникают проблемы или он не работает, используйте ручной способ ниже.

1. Откройте папку mods в терминале
2. Сделайте VPKMerge исполняемым: chmod +x VPKMerge
3. Запустите VPKMerge: ./VPKMerge 
4. Переместите все файлы pak10_(pak10_dir.vpk, pak10_000.vpk, pak10_001.vpk, pak10_002.vpk, pak10_003.vpk и тд) в папку с языком игры:
   • Для русского: Steam/steamapps/common/dota 2 beta/game/dota_russian
   • Для английского: Steam/steamapps/common/dota 2 beta/game/dota_123
   • Для англ Minify: Steam/steamapps/common/dota 2 beta/game/dota_minify
- Если вы выбрали ландшафт, у вас будет папка maps, которую также надо переместить в папку языка игры вместе с pak10_dir.vpk
- Если вы добавили курсор, у вас будет папка "Название Cursor", переместите содержимое папки cursor в Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\resource\\cursor
- Если вы добавили шрифт, у вас будет папка "Название Font", прочитайте guide.txt внутри папки

4. Добавьте в параметры запуска игры:
   • Для русского: -language russian
   • Для английского: -language 123
   • Для англ Minify: -language minify

При использовании VPKMerge могут возникнуть проблемы с отображением некоторых модов или героев
Если вы столкнулись с такой проблемой, пожалуйста, напишите в Discord: https://discord.gg/PBvG8D9MxT
Укажите, какие моды отображаются некорректно, и прикрепите полный список установленных модов из файла Mods.txt

Если у вас происходит краш игры с ошибкой: Failed to read 16 bytes или pak10.vpk corrupt
Не используйте Auto-Install и VPKMerge, выполните ручную установку:
1. Переименуйте каждый повторяющийся .vpk файл в формат pakXX_dir.vpk (Используйте номера от 02 до 99 (pak02_dir.vpk, pak03_dir.vpk, pak10_dir.vpk и т.д.))
2. Файлы, в названии которых есть "!", должны иметь более высокий приоритет (Дайте им меньший номер (например pak02_dir.vpk))
3. Переместите все .vpk файлы в папку языка игры (dota_russian или другую)
Учитывайте лимит: Максимальное число в названии 99, файлы после этого лимита не работают и могут вызывать краш
Если модов больше лимита: Удалите лишние или объедините их отдельно через VPKMerge и добавьте как один файл

Удаление (скрипт Uninstall.sh автоматизирует первый пункт)
1. Удаление модов
   • Удалите все файлы pak10_ (pak10_dir.vpk, pak10_000.vpk, pak10_001.vpk, pak10_002.vpk, pak10_003.vpk и тд) из папки языка игры, которую вы использовали
   • Если использовали ландшафт, удалите папку maps из папки языка игры, которую вы использовали
2. Удаление шрифта
   • Запустите Uninstall.sh из папки шрифта, или вручную удалите папку Steam/steamapps/common/dota 2 beta/game/dota/panorama/fonts и проверьте целостность файлов игры
3. Удаление курсора
   • Скачайте стандартный курсор с сайта и установите его, или вручную удалите папку Steam/steamapps/common/dota 2 beta/game/dota/resource/cursor и проверьте целостность файлов игры


EN LINUX
═════════
Run Auto-Install.sh (chmod +x Auto-Install.sh ➜ ./Auto-Install.sh). If you encounter any issues or it doesn't work, use the manual method below.

1. Open the mods folder in terminal
2. Make VPKMerge executable: chmod +x VPKMerge
3. Run VPKMerge: ./VPKMerge
4. Create folder dota_123 in Steam/steamapps/common/dota 2 beta/game/
5. Move all pak10_ (pak10_dir.vpk, pak10_000.vpk, pak10_001.vpk, pak10_002.vpk, pak10_003.vpk etc) files to dota_123 folder (If you are using Minify, put vpk in dota_minify folder)
- If you chosen terrain, you will have a folder "maps" it should also be moved to the language folder together with pak10_dir.vpk
- If you added a cursor, you will have a folder "Name Cursor", move the contents of the cursor folder to Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\resource\\cursor
- If you added a font, you will have a folder "Name Font", read the guide.txt file inside the folder
6. Add to Dota 2 launch options: -language 123 (or "-language minify" if you're using it)

When using VPKMerge, some mods or heroes may not display correctly
If you encounter this issue, please contact me on Discord: https://discord.gg/PBvG8D9MxT
Specify which mods are displaying incorrectly and attach the full list of installed mods from the Mods.txt file

If your game crashes with the error: Failed to read 16 bytes or pak10.vpk corrupt
Do not use Auto-Install or VPKMerge, use manual installation:
1. Rename each duplicate .vpk file to the format pakXX_dir.vpk (use numbers from 02 to 99: pak02_dir.vpk, pak03_dir.vpk, pak10_dir.vpk, etc.)
2. Files that contain "!" in their name must have higher priority (assign them a lower number, e.g. pak02_dir.vpk)
3. Move all .vpk files to the game language folder (dota_123 or another)
Keep in mind the limit: maximum number in name is 99, files exceeding this limit will not work and may cause to crash
If you have more mods than the limit: remove the extra ones or merge them separately using VPKMerge and add them as a single file

Uninstall (Uninstall.sh automates the first step)
1. Removing mods
   • Delete all pak10_ files (pak10_dir.vpk, pak10_000.vpk, pak10_001.vpk, pak10_002.vpk, pak10_003.vpk etc) from the game language folder you used
   • If you used a terrain, delete the maps folder from the game language folder you used
2. Removing the font
   • Run Uninstall.sh from the font folder, or manually delete the folder Steam/steamapps/common/dota 2 beta/game/dota/panorama/fonts and verify the integrity of game files
3. Removing the cursor
   • Download the default cursor from the website and install it, or manually delete the folder Steam/steamapps/common/dota 2 beta/game/dota/resource/cursor and verify the integrity of game files`;

        await addToRoot(`${archiveName}/Guide.txt`, new Blob([guideText], { type: 'text/plain' }));
        addLog('Guide added', 'success');

        const settings = (() => {
            try { return JSON.parse(localStorage.getItem('d2pfx_settings') || '{}'); } catch { return {}; }
        })();
        const selectedOS = settings.os || 'default';
        const selectedLang = (settings.gameLang === 'default' || !settings.gameLang) ? 'english' : settings.gameLang;
        const customDotaPath = (settings.dotaPath || '').trim();
        const langFolderMap = {
            russian: 'dota_russian', english: 'dota_123', minify: 'dota_minify',
            koreana: 'dota_koreana', schinese: 'dota_schinese', tchinese: 'dota_tchinese',
            brazilian: 'dota_brazilian', latam: 'dota_latam', spanish: 'dota_spanish',
            french: 'dota_french', italian: 'dota_italian', german: 'dota_german',
            greek: 'dota_greek', thai: 'dota_thai', japanese: 'dota_japanese',
            portuguese: 'dota_portuguese', polish: 'dota_polish', danish: 'dota_danish',
            dutch: 'dota_dutch', finnish: 'dota_finnish', norwegian: 'dota_norwegian',
            swedish: 'dota_swedish', czech: 'dota_czech', hungarian: 'dota_hungarian',
            romanian: 'dota_romanian', bulgarian: 'dota_bulgarian', turkish: 'dota_turkish',
            vietnamese: 'dota_vietnamese'
        };
        const langFolder = langFolderMap[selectedLang] || 'dota_123';

        addLog('Adding VPKMerge...', 'info');
        if (selectedOS === 'default') {
            try {
                const [exeResponse, linuxResponse] = await Promise.all([
                    fetchWithRetry(getFileUrl('VPKMerge', 'VPKMerge.exe')),
                    fetchWithRetry(getFileUrl('VPKMerge', 'VPKMerge'))
                ]);
                if (exeResponse.ok) {
                    await addToRoot(`${archiveName}/mods/VPKMerge.exe`, await exeResponse.blob());
                }
                if (linuxResponse.ok) {
                    await addToRoot(`${archiveName}/mods/VPKMerge`, await linuxResponse.blob());
                }
                addLog('VPKMerge added', 'success');
            } catch (err) {
                addLog(`VPKMerge not loaded: ${err.message}`, 'warning');
                addLog('⚠️ Installation will continue without VPKMerge - download it separately', 'warning');
            }
        } else if (selectedOS === 'windows') {
            try {
                const exeResponse = await fetchWithRetry(getFileUrl('VPKMerge', 'VPKMerge.exe'));
                await addToRoot(`${archiveName}/mods/VPKMerge.exe`, await exeResponse.blob());
                addLog('VPKMerge.exe added', 'success');
            } catch (err) {
                addLog(`VPKMerge.exe is not loaded: ${err.message}`, 'warning');
                addLog('⚠️ Installation will continue without VPKMerge - download it separately', 'warning');
            }
        } else {
            try {
                const linuxResponse = await fetchWithRetry(getFileUrl('VPKMerge', 'VPKMerge'));
                await addToRoot(`${archiveName}/mods/VPKMerge`, await linuxResponse.blob());
                addLog('VPKMerge (Linux) added', 'success');
            } catch (err) {
                addLog(`VPKMerge not loaded: ${err.message}`, 'warning');
                addLog('⚠️ Installation will continue without VPKMerge - download it separately', 'warning');
            }
        }

        if (selectedOS === 'windows') {
            addLog('Generating install script...', 'info');
            await addToRoot(`${archiveName}/Auto-Install.bat`, new Blob([generateWindowsBat(langFolder, customDotaPath)], { type: 'text/plain' }));
            addLog('Auto-Install.bat added', 'success');
            await addToRoot(`${archiveName}/Uninstall.bat`, new Blob([generateWindowsUninstallBat(langFolder, customDotaPath)], { type: 'text/plain' }));
            addLog('Uninstall.bat added', 'success');
        } else if (selectedOS === 'linux') {
            addLog('Generating install script...', 'info');
            await addToRoot(`${archiveName}/Auto-Install.sh`, new Blob([generateLinuxSh(langFolder, customDotaPath)], { type: 'text/plain' }));
            addLog('Auto-Install.sh added', 'success');
            await addToRoot(`${archiveName}/Uninstall.sh`, new Blob([generateLinuxUninstallSh(langFolder, customDotaPath)], { type: 'text/plain' }));
            addLog('Uninstall.sh added', 'success');
        }

        addLog('Finalizing archive...', 'archive');
        statusText.textContent = 'Finalizing...';

        if (!zipWriterClosed) {
            zipWriterClosed = true;
            await zipWriter.close();
        }

        const zipBlob = await blobWriter.getData();

        addLog('Archive created, starting download...', 'success');
        statusText.textContent = 'Download starting...';

        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = archiveName + '.zip';
        link.click();
        URL.revokeObjectURL(url);

        showToast('Thanks for downloading, have fun!');
        addLog('Pack downloaded successfully!', 'download');

        logHeader.innerHTML = `
            <span class="material-symbols-rounded success">check_circle</span>
            <h3>Completed!</h3>
        `;

        setPackProgress(100);
        packSuccess = true;

    } catch (error) {
        console.error('Pack error:', error);
        if (!zipWriterClosed) {
            zipWriterClosed = true;
            try { await zipWriter.close(); } catch (_) {}
        }
        const reason = diagnoseFetchError(error, 'pack');
        addLog(`❌ ${reason.message}`, 'error');
        addLog(`💡 ${reason.suggestion}`, 'warning');

        try {
            const compressed = await compressAssembly({
                name: 'Recovery Pack',
                items: cart
            });
            const mirrorUrl = `https://d2pfx.netlify.app/?pack=${compressed}`;
            addLog(`If errors persist, follow this <a href="${mirrorUrl}" target="_blank" style="color: var(--md-sys-color-primary); text-decoration: underline; cursor: pointer; font-weight: 600;">link</a> and try again.`, 'error');
        } catch (e) {
        }

        statusText.textContent = 'Failed!';

        logHeader.innerHTML = `
            <span class="material-symbols-rounded error">error</span>
            <h3>Failed!</h3>
        `;

        packSuccess = false;
    } finally {
        window._packingInProgress = false;
        packBtn.disabled = false;
        packBtn.innerHTML = originalContent;

        const cartModalEl = document.getElementById('cartModal');
        if (!cartModalEl.classList.contains('active')) {
            cartModalEl.classList.add('active');
            document.getElementById('cartOverlay').classList.add('active');
            cartModalEl.classList.add('expanded');
            logPanel.classList.add('active');
            openModal();
        }
    }
}

function showReplaceModal(existingItem, newItem) {
    document.querySelector('.replace-modal-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'replace-modal-overlay';

    function getPreviewHtml(item, label) {
        const { preview } = resolveItemFiles(item);
        if (!preview) return `<div class="replace-preview-slot replace-preview-slot--empty"><span class="material-symbols-rounded">hide_image</span><span class="replace-preview-name">${escapeHtml(item.name)}</span></div>`;
        const src = `assets/previews/${item.categoryId}/${preview}`;
        const isVideo = preview.endsWith('.mp4');
        const media = isVideo
            ? `<video src="${src}" class="replace-preview-img" autoplay muted loop playsinline onerror="this.style.display='none'"></video>`
            : `<img src="${src}" alt="${escapeHtml(item.name)}" class="replace-preview-img" onerror="this.style.display='none'">`;
        return `<div class="replace-preview-slot"><span class="replace-preview-label">${escapeHtml(label)}</span>${media}<span class="replace-preview-name">${escapeHtml(item.name)}</span></div>`;
    }

    overlay.innerHTML = `
        <div class="replace-modal">
            <div class="replace-modal-header">
                <h2>Replace Mod?</h2>
            </div>
            <div class="replace-modal-previews">
                ${getPreviewHtml(existingItem, 'Current')}
                <div class="replace-preview-arrow"><span class="material-symbols-rounded">arrow_forward</span></div>
                ${getPreviewHtml(newItem, 'New')}
            </div>
            <div class="replace-modal-actions">
                <button id="replaceCancel" class="cart-clear-btn">
                    <span class="material-symbols-rounded">close</span> Cancel
                </button>
                <button id="replaceConfirm" class="cart-pack-btn">
                    <span class="material-symbols-rounded">sync</span> Replace
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    openModal();

    const closeModalFunc = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
        closeModal();
    };

    document.getElementById('replaceCancel').addEventListener('click', closeModalFunc);
    document.getElementById('replaceConfirm').addEventListener('click', () => {
        removeFromCart(existingItem.id);
        cart.push(newItem);
        saveCart();
        updateCartBadge();
        renderCartItems();
        updateCartButtons();
        showToast('Replaced successfully');
        closeModalFunc();
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

async function compressAssembly(assembly) {
    const json = JSON.stringify({
        name: assembly.name,
        items: assembly.items.map(item => ({
            n: item.name,
            c: item.categoryId,
            g: item.groupId
        }))
    });

    const stream = new CompressionStream('deflate-raw');
    const writer = stream.writable.getWriter();
    writer.write(new TextEncoder().encode(json));
    writer.close();

    const compressed = await new Response(stream.readable).arrayBuffer();
    const bytes = new Uint8Array(compressed);

    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));

    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function decompressAssembly(compressed) {
    try {
        const standard = compressed.replace(/-/g, '+').replace(/_/g, '/');
        const padded = standard + '=='.slice(0, (4 - standard.length % 4) % 4);
        const binary = atob(padded);
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));

        const stream = new DecompressionStream('deflate-raw');
        const writer = stream.writable.getWriter();
        writer.write(bytes);
        writer.close();

        const decompressed = await new Response(stream.readable).arrayBuffer();
        const json = new TextDecoder().decode(decompressed);
        const data = JSON.parse(json);

        const items = data.items.map(item => {
            const categoryId = item.c;
            const groupId = item.g || null;
            return {
                id: groupId ? `${categoryId}-${groupId}-${item.n}` : `${categoryId}-${item.n}`,
                name: item.n,
                categoryId,
                groupId
            };
        });

        return { name: data.name, items };
    } catch (e) {
        try {
            const data = JSON.parse(decodeURIComponent(atob(compressed)));
            const items = data.items.map(item => {
                const categoryId = item.c;
                const groupId = item.g || null;
                return {
                    id: groupId ? `${categoryId}-${groupId}-${item.n}` : `${categoryId}-${item.n}`,
                    name: item.n,
                    categoryId,
                    groupId
                };
            });
            return { name: data.name, items };
        } catch (e2) {
            console.error('Failed to decompress pack:', e2);
            return null;
        }
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

    const compressed = await compressAssembly(assembly);
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

async function loadSharedAssembly() {
    const params = new URLSearchParams(window.location.search);
    const packData = params.get('pack');

    if (!packData) return;

    const assembly = await decompressAssembly(packData);
    if (!assembly) {
        showToast('Invalid pack link');
        return;
    }

    if (cart.length > 0 && savedAssemblies.length < MAX_ASSEMBLIES) {
        const recovery = {
            id: Date.now().toString(),
            name: 'Recovery Pack',
            items: cart.map(item => ({ ...item })),
            date: new Date().toISOString()
        };
        savedAssemblies.push(recovery);
        saveAssemblies();
        showToast('Previous cart saved as <span style="color: var(--md-sys-color-shit); font-weight: bold;">Recovery Pack</span>');
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

function importModsTxt(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split('\n');

        // reverse mapping
        const translationReverse = {};
        categories.forEach(cat => {
            const translated = translations[cat.key];
            if (translated) translationReverse[translated.toLowerCase()] = cat.id;
        });

        const allMods = [];
        Object.entries(modsData).forEach(([categoryId, data]) => {
            if (Array.isArray(data)) {
                data.forEach(mod => {
                    if (mod.styles) {
                        mod.styles.forEach(s => {
                            allMods.push({ name: mod.name + ' ' + s.label.replace('Style ', ''), categoryId, groupId: null, preview: s.preview, file: s.file });
                        });
                    } else {
                        allMods.push({ name: mod.name, categoryId, groupId: null, preview: mod.preview, file: mod.file });
                    }
                });
            } else if (data?.groups) {
                data.groups.forEach(group => {
                    group.mods.forEach(mod => {
                        if (mod.styles) {
                            mod.styles.forEach(s => {
                                allMods.push({ name: mod.name + ' ' + s.label.replace('Style ', ''), categoryId, groupId: group.id, preview: s.preview, file: s.file });
                            });
                        } else {
                            allMods.push({ name: mod.name, categoryId, groupId: group.id, preview: mod.preview, file: mod.file });
                        }
                    });
                });
            }
        });

        let currentCategoryId = null;
        let imported = 0;
        const notFound = [];

        cart = [];

        lines.forEach(line => {
            const catMatch = line.match(/^([A-Za-z][^:•╔╚═\n]+):\s*$/);
            if (catMatch) {
                const catName = catMatch[1].trim().toLowerCase();
                currentCategoryId = translationReverse[catName] || null;
                return;
            }

            const modMatch = line.match(/^\s*•\s*(.+?)\s*➜/);
            if (modMatch && currentCategoryId) {
                const modName = modMatch[1].trim();
                const found = allMods.find(m =>
                    m.name === modName && m.categoryId === currentCategoryId
                );
                if (found) {
                    const id = found.groupId
                        ? `${found.categoryId}-${found.groupId}-${found.name}`
                        : `${found.categoryId}-${found.name}`;

                    if (!cart.find(c => c.id === id)) {
                        cart.push({
                            id,
                            name: found.name,
                            file: found.file || '',
                            categoryId: found.categoryId,
                            groupId: found.groupId,
                            preview: found.preview || ''
                        });
                        imported++;
                    }
                } else {
                    notFound.push(`${modName} (${currentCategoryId})`);
                }
            }
        });

        saveCart();
        updateCartBadge();
        renderCartItems();
        updateCartButtons();

        let msg = `Imported <b>${imported}</b> mods from <span style="color: var(--md-sys-color-primary); font-weight: 600;">Mods.txt</span>`;
        if (notFound.length > 0) {
            console.warn('Mods not found:', notFound);
            msg += `, <b>${notFound.length}</b> not found`;
        }
        showToast(msg);
        vibrate(20);
    };
    reader.readAsText(file);
}