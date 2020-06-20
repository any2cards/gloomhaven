const files = [
  'attack-modifiers.js',
  'battle-goals.js',
  'character-ability-cards.js',
  'character-ability-cards-revised.js',
  'character-mats.js',
  'character-perks.js',
  'events.js',
  'events-revised.js',
  'items.js',
  'map-tiles.js',
  'monster-ability-cards.js',
  'monster-stat-cards.js',
  'personal-goals.js',
  'player-aid-cards.js',
  'random-dungeons.js',
  'random-scenarios.js',
  'summons.js',
  'world-map.js',
]

//  'overlay-tokens.js',


const repoBaseUrl = 'https://raw.githubusercontent.com/any2cards/gloomhaven/master';
const imgUrl = `${repoBaseUrl}/images/`;
const dataUrl = `${repoBaseUrl}/data/`;
const iconUrl = chrome.extension.getURL('icon-32.png');
const ignoredNodes = ['TEXTAREA', 'INPUT'];

const xwcRed = '#e81e25';
const offset = 5;
const cardWidth = 600;
const cardHeight = 600;
const imagePadding = 4;
let amountOfMatches = 1;
const classname = '__xwc-container';

// Put longer names first, so "Crippling Curse" matches before "Crippling"
const sortData = (a, b) => (a.length > b.length ? -1 : 1);

const escapeRegExp = string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

const tooltip = document.createElement('div');

const hideTooltip = () => {
  tooltip.classList.add('__xwc-tooltip-hidden');
};
const showTooltip = () => {
  tooltip.classList.remove('__xwc-tooltip-hidden');
};
const hide = el => {
  el.classList.add('__xwc-hidden');
};
const show = el => {
  el.classList.remove('__xwc-hidden');
};

const fetchDataFile = fileName =>
  {
    return fetch(dataUrl + fileName, { mode: 'cors' })
    .then(res => res.json());
  };

const processData = data => {
  return data.reduce((a, c) => {
    if (c.image) {
      const keys = [`${c.name} (${c.points})`, c.name];

      if (c.name.indexOf('"') > -1) {
        keys.push(c.name.replace(/"/g, ''));
      }

      keys.forEach(k => {
        const key = k.toLowerCase();
        a[key] = a[key] || [];
        a[key].push(c);
      });
    }
    return a;
  }, {});
};

const fetchAllData = async () =>
  Promise.all(files.map(file => fetchDataFile(file)))
    .then(values => [].concat.apply([], values))
    .then(processData);

const getDataAndAddTooltips = async () => {
  const data = await fetchAllData();
  cardsData = data;
  const regExp = new RegExp(generateRegExpString(data), 'ig');
  getTextNodes((parent, node) => replaceMatchesInNode(node, regExp));
  createTooltip();
};
getDataAndAddTooltips();

let cardsData = {};
let allMatches = {};

let tooltipImgContainer;

const tooltipLoader = document.createElement('div');
tooltipLoader.classList.add('__xwc-loading-cube-grid');
hide(tooltipLoader);
tooltipLoader.innerHTML = `
  <div class="__xwc-loading-cube __xwc-loading-cube1"></div>
  <div class="__xwc-loading-cube __xwc-loading-cube2"></div>
  <div class="__xwc-loading-cube __xwc-loading-cube3"></div>
  <div class="__xwc-loading-cube __xwc-loading-cube4"></div>
  <div class="__xwc-loading-cube __xwc-loading-cube5"></div>
  <div class="__xwc-loading-cube __xwc-loading-cube6"></div>
  <div class="__xwc-loading-cube __xwc-loading-cube7"></div>
  <div class="__xwc-loading-cube __xwc-loading-cube8"></div>
  <div class="__xwc-loading-cube __xwc-loading-cube9"></div>
`;

const createTooltip = () => {
  tooltip.classList.add('__xwc-tooltip');
  hideTooltip();

  tooltip.appendChild(tooltipLoader);

  tooltipImgContainer = document.createElement('div');
  tooltipImgContainer.classList.add('__xwc-image-container');

  const tooltipLine = document.createElement('span');
  tooltipLine.innerHTML = `
        <p class="__xwc-powered-by">
            <img src="${iconUrl}" />
            Powered by Gloomhaven Card Viewer
        </p>
    `;

  tooltip.appendChild(tooltipImgContainer);
  tooltip.appendChild(tooltipLine);

  document.body.appendChild(tooltip);
};

const getTextNodes = fn => {
  const elements = Array.from(document.getElementsByTagName('*'));
  elements.forEach(e => {
    if (ignoredNodes.indexOf(e.nodeName) === -1) {
      Array.from(e.childNodes).forEach(c => {
        if (c.nodeType === Node.TEXT_NODE) {
          fn(e, c);
        }
      });
    }
  });
};

const replaceMatchesInNode = (node, regExp) => {
  let matches;

  while ((matches = regExp.exec(node.nodeValue)) !== null) {
    const match = matches[0];
    const lastIndex = regExp.lastIndex;

    const container = document.createElement('span');
    container.classList.add(classname);
    container.appendChild(document.createTextNode(match));

    const after = node.splitText(lastIndex - match.length);
    after.nodeValue = after.nodeValue.substring(match.length);
    node.parentNode.insertBefore(container, after);

    // Set up for next iteration
    node = after;
    regExp.lastIndex = 0;
  }
};

const throttle = (fn, threshhold = 250) => {
  let last;
  let deferTimer;

  return (...args) => {
    const context = this;
    const now = Date.now();

    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function() {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
};

const moveTooltip = e => {
  const windowRightBound = window.scrollX + window.innerWidth;
  let x = window.scrollX + e.clientX + offset;
  let y = window.scrollY + e.clientY + offset;
  const right = x + amountOfMatches * (cardWidth + imagePadding) + 20;

  if (right > windowRightBound) {
    x = 0;
  }

  if (x < 0) {
    x = 0;
  }

  if (y + cardHeight > window.scrollY + window.innerHeight) {
    y = y - (y + cardHeight - (window.scrollY + window.innerHeight)) - 20;
  }

  if (y < 0) {
    y = 0;
  }

  tooltip.style.top = y + 'px';
  tooltip.style.left = x + 'px';
};

const generateRegExpString = data => {
  const start = '(?=^|\\s|\\b)(';
  const end = ')(?=s?(\\s|\\b|$))';
  const delimiter = '----';
  const r =
    start +
    escapeRegExp(
      Object.keys(data)
        .sort(sortData)
        .join(delimiter),
    ).replace(new RegExp(delimiter, 'g'), '|') +
    end;
  return r;
};

// Listeners for tooltip behaviour
document.body.addEventListener(
  'mouseover',
  e => {
    const target = e.target;
    if (target && target != document && target.matches('.' + classname)) {
      const match = target.textContent;

      // Set to 1 because we'll have at least 1 match, so it gets taken into account when
      // positioning the tooltip -- see moveTooltip()
      amountOfMatches = 1;

      show(tooltipLoader);
      tooltipImgContainer.innerHTML = '';

      // Update tooltip position
      moveTooltip(e);

      // Update tooltip image source
      let promises = [];
      let images = [];
      cardsData[match.toLowerCase()].forEach(c => {
        const promise = new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = reject;
          image.src = imgUrl + c.image;
          hide(image);

          images.push(image);
          tooltipImgContainer.appendChild(image);
        });

        promises.push(promise);
      });

      // Reveal tooltip if CTRL key is pressed while hovering over card name!
      if (e.ctrlKey) {
        showTooltip();
      }

      // When all images are loaded; Hide loader and show images
      Promise.all(promises).then(() => {
        amountOfMatches = images.length;

        images.forEach(image => {
          // image.height = 'auto';
          // image.width = 'auto';
          show(image);
        });
        hide(tooltipLoader);
      });
    }
  },
  false,
);

document.body.addEventListener(
  'mouseleave',
  e => {
    const target = e.target;
    if (target && target != document && target.matches('.' + classname)) {
      // Hide tooltip
      hideTooltip();
    }
  },
  true,
);

document.body.addEventListener(
  'mousemove',
  throttle(e => {
    const target = e.target;
    if (target && target != document && target.matches('.' + classname)) {
      // Move tooltip
      if (!tooltip.classList.contains('__xwc-tooltip-hidden')) {
        moveTooltip(e);
      }
    }
  }, 200),
  true,
);
