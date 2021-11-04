var expansion_conversion = {
	"bg": "Gloomhaven",
  "fc": "Forgotten Circles",
  "fh": "Frosthaven",
  "jl": "Jaws Of The Lion",
  "cs": "Crimson Scales",
};

const getExpFromInputId = (input_id) => {
  let idx = input_id.indexOf("-");
  if (idx >= 0) {
    shortExp = input_id.substring(0, input_id.indexOf("-"));
    return expansion_conversion[shortExp];
  }
  return null
}

const getTypeFromInputId = (input_id) => {
  let idx = input_id.indexOf("-");
  if (idx >= 0) {
    return input_id.substring(input_id.indexOf("-")+1);
  }
  return null
}

function sendExpansionData(expansion_card_type) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
      chrome.runtime.sendMessage({tab_id: tabs[0].id,
                                  method: 'expansions_data',
                                  expansions: expansion_card_type}, response => {
        if (response) {
          resolve(response);
        } else {
          reject(response);
        }
      });
    });
  });
}

async function sendToBackground(expansion_card_type) {
  response = await sendExpansionData(expansion_card_type).then(function(foo) {
    return foo;
  }).catch(function(bar) {
    return bar;
  });
}

async function getAndSendInputs() {
  // retrieve <inputs> into map
  let inputArr = {};
  Array.from(document.getElementsByTagName("input")).forEach(input => {
    inputArr[input.id] = input.checked;
  });

  // create expansion_card_type map
  let expansion_card_type = {};
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
  // send to background.js
  sendToBackground(expansion_card_type);
  return inputArr;
}

const inputChange = async (evt) => {
  // check/uncheck children checkboxes
  var parent = evt.target.parentElement;
  while (parent.nodeName != "DIV") {
    parent = parent.parentElement;
  }
  Array.from(parent.getElementsByTagName("input")).forEach(input => {
    if (input != evt.target) {
      input.checked = evt.target.checked;
    }
  });

  // uncheck parent checkboxes
  if (!evt.target.checked) {
    var parent = evt.target.parentElement;
    while (parent != null) {
      parent.getElementsByTagName("input")[0].checked = evt.target.checked;
      parent = parent.parentElement;
      while (parent != null && parent.nodeName != "DIV") {
        parent = parent.parentElement;
      }
    }
  }

  // check parent checkboxes
  if (evt.target.checked) {
    var target = evt.target;
    while (true) {
      var parent = target.parentElement;
      while (parent != null && parent.nodeName != "DIV") {
        parent = parent.parentElement;
      }
      parent = parent.parentElement;
      let allChecked = true;
      let inputs = Array.from(parent.getElementsByTagName("input"));
      let topInput = inputs.shift();
      inputs.forEach(input => {
        if (!input.checked) {
          allChecked = false;
        }
      });
      if (!allChecked) {
        break;
      }
      topInput.checked = true;
      target = topInput;
      if (topInput.id == "gh") {
        break;
      }
    }
  }

  inputArr = await getAndSendInputs();

  // save map into storage
  chrome.storage.sync.set({inputArr: inputArr});
};

document.body.onload = function() {
  var inputArr = {};
  chrome.storage.sync.get(['inputArr'], function(item) {
    inputArr = item.inputArr;
    Array.from(document.getElementsByTagName("input")).forEach(input => {
      input.addEventListener("change", inputChange);
      if (inputArr != undefined && input.id in inputArr) {
        document.getElementById(input.id).checked = inputArr[input.id];
      } else {
        document.getElementById(input.id).checked = true;
      }
    });
  });
}
