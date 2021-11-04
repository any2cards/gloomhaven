var files = [
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
	'overlay-tokens.js',
	'personal-quests.js',
	'player-aid-cards.js',
	'random-dungeons.js',
	'random-scenarios.js',
	'summons.js',
	'world-map.js',
];

var expansion_conversion = {
	"bg": "Gloomhaven",
  "fc": "Forgotten Circles",
  "fh": "Frosthaven",
  "jl": "Jaws Of The Lion",
  "cs": "Crimson Scales",
};

var expansion_card_type = {}

const repoBaseUrl = 'https://raw.githubusercontent.com/any2cards/gloomhaven/master';
const imgUrl = `${repoBaseUrl}/images/`;
const dataUrl = `${repoBaseUrl}/data/`;
var iconUrl = ``;
if (chrome.extension != undefined) {
  iconUrl = chrome.extension.getURL('icon-32.png');
} else {
  iconUrl = 'icon-32.png';
}
const ignoredNodes = ['TEXTAREA', 'INPUT'];

const xwcRed = '#e81e25';
const offset = 5;
const imagePadding = 4;
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

const filterData = data => {
  let filtered = data;
  for (let key of Object.keys(filtered)) {
    var i = filtered[key].length
    while (i--) {
      let value = filtered[key][i];
      let expansion = value["expansion"];
      let image = value["image"];
      let card_type = image.substring(0, image.indexOf("/"));
      if (expansion in expansion_card_type) {
        if (card_type in expansion_card_type[expansion]) {
          if (expansion_card_type[expansion][card_type]) {
            continue;
          }
        }
      }
      filtered[key].splice(i, 1);
    }
    if (filtered[key].length == 0) {
      delete filtered[key];
    }
  }
  return filtered;
}

const deleteSpanNodes = () => {
  while (true) {
    const elements = Array.from(document.querySelectorAll("span." + classname));
    elements.forEach(e => {
      if (e.classList.length == 1 && e.classList[0] == classname) {
        if (e.parentNode != null) {
          let text = e.textContent || e.innerText || e.innerHTML || "";
          e.parentNode.innerHTML = text;
        }
      }
    });
    if (elements.length == 0) {
      break;
    }
  }
};

async function getData() {
  const data = await fetchAllData();
  cardsData = filterData(data);
  deleteSpanNodes();
  if (Object.keys(data).length > 0) {
    const regExp = new RegExp(generateRegExpString(data), 'ig');
    getTextNodes((parent, node) => replaceMatchesInNode(node, regExp));
  }
}

let stopInterval;

const getExpFromInputId = (input_id) => {
  let idx = input_id.indexOf("-");
  if (idx >= 0) {
    shortExp = input_id.substring(0, input_id.indexOf("-"));
    return expansion_conversion[shortExp];
  }
  return null;
}

const getTypeFromInputId = (input_id) => {
  let idx = input_id.indexOf("-");
  if (idx >= 0) {
    return input_id.substring(input_id.indexOf("-")+1);
  }
  return null;
}

async function loadFromStorage() {
  var inputArr = {};
  chrome.storage.sync.get(['inputArr'], async function(item) {
    inputArr = item.inputArr;
    for (const [input_id, checked] of Object.entries(inputArr)) {
      let exp = getExpFromInputId(input_id);
      let type = getTypeFromInputId(input_id);
      if (exp == null || type == null) {
        continue;
      }
      if (expansion_card_type[exp] == null) {
        expansion_card_type[exp] = {};
      }
      expansion_card_type[exp][type] = checked;
    }
    await getData();
  });
}

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

var images = [];

const moveTooltip = (e) => {
  const windowRightBound = window.scrollX + window.innerWidth;
  let x = window.scrollX + e.clientX + offset;
  let y = window.scrollY + e.clientY + offset;
  var right = x + 20;
  var cardHeight = 0;
  for (let image of images) {
    right += image.width + imagePadding;
    if (image.height > cardHeight) {
      cardHeight = image.height;
    }
  }

  if (right > windowRightBound) {
    x = 0;
  }   
  if (x < 0) {
    x = 0;
  }

  var poweredby = 50;
  if (y + cardHeight + poweredby > window.scrollY + window.innerHeight) {
    y = y - (y + cardHeight + poweredby - (window.scrollY + window.innerHeight)) - 20;
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

// Show the tooltip after entering the highlighted area
document.body.addEventListener(
  'mouseover',

  e => {
    const target = e.target;
    if (target && target != document && target.matches('.' + classname)) {
      const match = target.textContent;

      // Set to 1 because we'll have at least 1 match, so it gets taken into account when
      // positioning the tooltip -- see moveTooltip()

      show(tooltipLoader);
      tooltipImgContainer.innerHTML = '';
      
      // Update tooltip position
      moveTooltip(e);

      // Update tooltip image source
      let promises = [];
      images = [];

      if (cardsData[match.toLowerCase()] == undefined) {
        return;
      }

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

      // When all images are loaded; Hide loader and show images
      Promise.all(promises).then(() => {
        images.forEach(image => {
          // image.height = 'auto';
          // image.width = 'auto';
          show(image);
        });
        hide(tooltipLoader);
        // Update tooltip position
        moveTooltip(e);
      });

      // Reveal tooltip if CTRL key is pressed while hovering over card name!
      if (e.ctrlKey) {
	      showTooltip();
			}
    }
  },
  false,
);

// Hide the tooltip after leaving the highlighted area
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

// Every 200ms update the tooltip position
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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.method == 'expansions_data') {
    expansion_card_type = request.expansions;
    sendResponse({ complete: true, from: "content" });
    getData();
  } else {
    sendResponse({ complete: false, from: "content" });
  } 
});

document.body.onload = function() {
  loadFromStorage();
  createTooltip();
}
