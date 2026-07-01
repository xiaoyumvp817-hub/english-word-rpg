// === DOM UI Helpers ===
// Reusable functions for creating and manipulating DOM elements.

/**
 * Create an HTML element with attributes, classes, and children.
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key === 'htmlContent') {
      el.innerHTML = value;
    } else {
      el.setAttribute(key, value);
    }
  }

  if (typeof children === 'string') {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    for (const child of children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    }
  }

  return el;
}

/**
 * Create a progress bar element.
 * @param {number} current - Current value
 * @param {number} max - Maximum value
 * @param {string} type - 'hp', 'mp', or 'xp'
 * @param {boolean} showLabel - Whether to show text label
 */
export function createProgressBar(current, max, type = 'hp', showLabel = true) {
  const percent = max > 0 ? Math.round((current / max) * 100) : 0;
  const container = createElement('div', { className: 'progress-bar' });

  const fill = createElement('div', {
    className: `progress-bar-fill ${type}`,
    style: { width: `${percent}%` }
  });

  container.appendChild(fill);

  if (showLabel) {
    const label = createElement('div', {
      className: 'progress-bar-label'
    }, `${current}/${max}`);
    container.appendChild(label);
  }

  return container;
}

/**
 * Create a button element with standard styling.
 */
export function createButton(text, options = {}) {
  const {
    variant = '',        // 'primary', 'success', 'gold'
    size = '',           // 'sm', 'lg'
    block = false,
    disabled = false,
    onClick = null,
    ...attrs
  } = options;

  let className = 'btn';
  if (variant) className += ` btn-${variant}`;
  if (size) className += ` btn-${size}`;
  if (block) className += ' btn-block';

  const button = createElement('button', {
    className,
    disabled,
    ...attrs
  }, text);

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return button;
}

/**
 * Create a stat display row.
 */
export function createStatRow(icon, label, value, bonus = null) {
  const row = createElement('div', { className: 'stat-row' });

  const iconEl = createElement('span', { className: 'stat-icon' }, icon);
  const labelEl = createElement('span', { className: 'stat-label' }, label);
  const valueEl = createElement('span', { className: 'stat-value' }, String(value));

  row.appendChild(iconEl);
  row.appendChild(labelEl);
  row.appendChild(valueEl);

  if (bonus) {
    const bonusEl = createElement('span', { className: 'stat-bonus' }, `(${bonus})`);
    row.appendChild(bonusEl);
  }

  return row;
}

/**
 * Create a gold display.
 */
export function createGoldDisplay(amount) {
  return createElement('span', { className: 'gold-display' }, `💰 ${amount}`);
}

/**
 * Create a panel container.
 */
export function createPanel(children = [], className = '') {
  return createElement('div', { className: `panel ${className}`.trim() }, children);
}

/**
 * Create a screen title.
 */
export function createScreenTitle(title, subtitle = '') {
  const container = createElement('div', {});

  const h1 = createElement('h1', { className: 'screen-title' }, title);
  container.appendChild(h1);

  if (subtitle) {
    const p = createElement('p', { className: 'screen-subtitle' }, subtitle);
    container.appendChild(p);
  }

  return container;
}

/**
 * Create a floating damage number (for battle animations).
 */
export function createFloatingText(text, x, y, className = '') {
  const el = createElement('div', {
    className: `floating-text ${className}`,
    style: {
      left: `${x}px`,
      top: `${y}px`,
      position: 'absolute',
      pointerEvents: 'none'
    }
  }, text);

  // Remove after animation
  el.addEventListener('animationend', () => {
    if (el.parentNode) el.parentNode.removeChild(el);
  });

  return el;
}

/**
 * Show a temporary toast notification.
 */
export function showToast(message, type = 'info', duration = 2000) {
  const layer = document.getElementById('notification-layer');
  if (!layer) return;

  const toast = createElement('div', {
    className: `toast toast-${type}`
  }, message);

  layer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

/**
 * Clear all children from an element.
 */
export function clearElement(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * Get the screen container element.
 */
export function getScreenContainer() {
  return document.getElementById('screen-container');
}

/**
 * Set the inner HTML of the screen container.
 */
export function renderToScreen(htmlString) {
  const container = getScreenContainer();
  if (container) {
    container.innerHTML = htmlString;
  }
}

/**
 * Create a rarity badge.
 */
export function createRarityBadge(rarity) {
  const labels = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  };
  return createElement('span', {
    className: `badge badge-${rarity}`
  }, labels[rarity] || rarity);
}
