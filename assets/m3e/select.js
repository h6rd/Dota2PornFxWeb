const MARGIN = 8;
const MIN_MENU_HEIGHT = 180;

function enhanceSelect(select) {
  if (select.dataset.md3Enhanced) return;
  select.dataset.md3Enhanced = 'true';

  const wrapper = document.createElement('div');
  wrapper.className = 'md3-select';

  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);
  select.classList.add('md3-select-native');
  select.setAttribute('tabindex', '-1');
  select.setAttribute('aria-hidden', 'true');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'md3-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  if (select.id) trigger.setAttribute('id', select.id + 'Trigger');

  const triggerText = document.createElement('span');
  triggerText.className = 'md3-select-trigger-text';

  const chevron = document.createElement('span');
  chevron.className = 'md3-select-chevron material-symbols-rounded';
  chevron.textContent = 'expand_more';
  chevron.setAttribute('aria-hidden', 'true');

  trigger.appendChild(triggerText);
  trigger.appendChild(chevron);
  wrapper.appendChild(trigger);

  const menu = document.createElement('div');
  menu.className = 'md3-select-menu';
  menu.setAttribute('role', 'listbox');

  const list = document.createElement('ul');
  list.className = 'md3-select-menu-list';
  menu.appendChild(list);

  const items = [];
  Array.from(select.options).forEach((option) => {
    const li = document.createElement('li');
    li.className = 'md3-select-menu-item';
    li.setAttribute('role', 'option');
    li.dataset.value = option.value;

    const label = document.createElement('span');
    label.className = 'md3-select-menu-label';
    label.textContent = option.textContent;

    const check = document.createElement('span');
    check.className = 'md3-select-menu-check material-symbols-rounded';
    check.textContent = 'check';
    check.setAttribute('aria-hidden', 'true');

    li.appendChild(label);
    li.appendChild(check);
    list.appendChild(li);
    items.push({ el: li, option });

    li.addEventListener('click', () => {
      selectValue(option.value);
      close();
      trigger.focus();
    });
  });

  list.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    list.scrollTop += e.deltaY;
  }, { passive: false });

  let touchStartY = 0;
  let touchStartScroll = 0;
  list.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartScroll = list.scrollTop;
  }, { passive: true });
  list.addEventListener('touchmove', (e) => {
    e.stopPropagation();
    list.scrollTop = touchStartScroll + (touchStartY - e.touches[0].clientY);
  }, { passive: true });

  document.body.appendChild(menu);

  let isOpen = false;
  let focusedIndex = -1;

  function syncTriggerText() {
    const selected = select.options[select.selectedIndex];
    triggerText.textContent = selected ? selected.textContent : '';
  }

  function syncSelectedItem() {
    items.forEach(({ el, option }) => {
      el.classList.toggle('selected', option.value === select.value);
    });
  }

  function selectValue(value) {
    if (select.value !== value) {
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.dispatchEvent(new Event('input', { bubbles: true }));
    }
    syncTriggerText();
    syncSelectedItem();
  }

  function position() {
    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;

    const openAbove = spaceBelow < MIN_MENU_HEIGHT && spaceAbove > spaceBelow;

    const availableSpace = Math.max(openAbove ? spaceAbove : spaceBelow, 100);
    const maxHeight = Math.min(availableSpace, 360);

    menu.style.width = rect.width + 'px';
    menu.style.maxHeight = maxHeight + 'px';
    menu.style.left = rect.left + 'px';

    menu.classList.toggle('above', openAbove);

    if (openAbove) {
      menu.style.top = 'auto';
      menu.style.bottom = (viewportHeight - rect.top + MARGIN) + 'px';
    } else {
      menu.style.bottom = 'auto';
      menu.style.top = (rect.bottom + MARGIN) + 'px';
    }
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    wrapper.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    position();
    requestAnimationFrame(() => menu.classList.add('open'));

    focusedIndex = items.findIndex((i) => i.option.value === select.value);
    setFocusedIndex(focusedIndex >= 0 ? focusedIndex : 0);

    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    document.addEventListener('mousedown', onDocMouseDown, true);
    document.addEventListener('keydown', onKeyDown, true);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    wrapper.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');

    window.removeEventListener('resize', position);
    window.removeEventListener('scroll', position, true);
    document.removeEventListener('mousedown', onDocMouseDown, true);
    document.removeEventListener('keydown', onKeyDown, true);
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function setFocusedIndex(idx) {
    if (idx < 0 || idx >= items.length) return;
    items.forEach((i) => i.el.classList.remove('focused'));
    focusedIndex = idx;
    const item = items[focusedIndex];
    item.el.classList.add('focused');
    item.el.scrollIntoView({ block: 'nearest' });
  }

  function onDocMouseDown(e) {
    if (!wrapper.contains(e.target) && !menu.contains(e.target)) {
      close();
    }
  }

  let typeahead = '';
  let typeaheadTimer = null;

  function onKeyDown(e) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        trigger.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(Math.min(focusedIndex + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(Math.max(focusedIndex - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          selectValue(items[focusedIndex].option.value);
          close();
          trigger.focus();
        }
        break;
      default:
        if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
          typeahead += e.key.toLowerCase();
          clearTimeout(typeaheadTimer);
          typeaheadTimer = setTimeout(() => (typeahead = ''), 500);
          const match = items.findIndex((i) =>
            i.option.textContent.toLowerCase().startsWith(typeahead)
          );
          if (match >= 0) setFocusedIndex(match);
        }
    }
  }

  trigger.addEventListener('click', toggle);

  select.addEventListener('change', () => {
    syncTriggerText();
    syncSelectedItem();
  });

  syncTriggerText();
  syncSelectedItem();
}

function init() {
  document.querySelectorAll('select.settings-select').forEach(enhanceSelect);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.MD3Select = { enhance: enhanceSelect, enhanceAll: init };