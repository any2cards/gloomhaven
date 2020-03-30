function save_options(){
  var GCV-Key = document.getElementById('GCV-Key').value;

  chrome.storage.sync.set({
    'GCV-Key': GCV-Key
  };
}

function restore_options(){

  chrome.storage.sync.get({
    'GCV-Key': ''
  },
  function(items){
    document.getElementById('GCV-Key').value = items.GCV-Key;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);