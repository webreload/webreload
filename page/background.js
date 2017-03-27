if (typeof browser == 'undefined') {
  var browser = chrome;
}

var state = {};

browser.tabs.onActivated.addListener(function(info) {
  browser.tabs.get(info.tabId, function(tab) {
    if (/^(http|https)/.test(tab.url)) {
      browser.browserAction.enable(tab.id);
      browser.tabs.executeScript(tab.id, {
        code: [
          'var script = document.querySelector(\'[src*="webreload.js"]\');',
          'script != null',
        ].join('\n'),
      }, function(results) {
        if (results) {
          browser.browserAction.setTitle({
            tabId: tab.id,
            title: (results[0] ? 'Disable' : 'Enable') + ' automatic reloading',
          });

          browser.browserAction.setIcon({
            tabId: tab.id,
            path: '../image/icon-' + (results[0] ? 'disable' : 'enable') + '.png',
          });
        }
      });
    } else {
      browser.browserAction.disable(tab.id);
    }
  });
});

browser.tabs.onUpdated.addListener(function(tabId, info) {
  if (info.url) {
    if (/^(http|https)/.test(info.url)) {
      chrome.browserAction.enable(tabId);
    } else {
      chrome.browserAction.disable(tabId);
    }
  }

  browser.tabs.executeScript(tabId, {
    code: [
      'if (' + (tabId in state) + ') {',
      '  var script = document.querySelector(\'[src*="webreload.js"]\');',
      '  if (script == null) {',
      '    script = document.createElement(\'script\');',
      '    script.src = \'' + state[tabId] + '\';',
      '    document.head.appendChild(script);',
      '  }',
      '}',
      'script != null;',
    ].join('\n'),
  }, function(results) {
    if (results) {
      browser.browserAction.setTitle({
        tabId: tabId,
        title: (results[0] ? 'Disable' : 'Enable') + ' automatic reloading',
      });

      browser.browserAction.setIcon({
        tabId: tabId,
        path: '../image/icon-' + (results[0] ? 'disable' : 'enable') + '.png',
      });
    }
  });
});

browser.tabs.onReplaced.addListener(function(tabId) {
  if (state[tabId]) {
    delete state[tabId];
  }
});

browser.tabs.onRemoved.addListener(function(tabId) {
  if (state[tabId]) {
    delete state[tabId];
  }
});

browser.browserAction.onClicked.addListener(function (tab) {
  var url = browser.extension.getURL('lib/webreload.js');
  browser.tabs.executeScript(tab.id, {
    code: [
      'var script = document.querySelector(\'[src*="webreload.js"]\');',
      'if (script) {',
      '  script.parentElement.removeChild(script);',
      '} else {',
      '  script = document.createElement(\'script\');',
      '  script.src = \'' + url + '\';',
      '  document.head.appendChild(script);',
      '}',
      'script.isConnected ? script.src : null;',
    ].join('\n'),
  }, function(results) {
    if (results) {
      browser.browserAction.setTitle({
        tabId: tab.id,
        title: (results[0] ? 'Disable' : 'Enable') + ' automatic reloading',
      });

      browser.browserAction.setIcon({
        tabId: tab.id,
        path: '../image/icon-' + (results[0] ? 'disable' : 'enable') + '.png',
      });

      if (results[0]) {
        state[tab.id] = results[0];
      } else {
        delete state[tab.id];
      }
    }
  });
});
