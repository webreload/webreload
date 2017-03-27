reload = function reload(selector, path) {
  var url = reload.resolve(path);
  if (location.href == url) {
    return location.reload();
  }

  if (selector == null) {
    selector = [
      '*[src]',
      '*[srcset]',
      '*[style*=url]',
      '*[href]',
      'style',
    ].join(', ');
  }

  var elements = document.querySelectorAll(selector);
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];

    if (element.hasAttribute('href')) {
      var href = element.getAttribute('href');
      if (reload.resolve(href) == url) {
        element.setAttribute('href', reload.refresh(href));
      }
    }

    if (element.hasAttribute('src')) {
      var src = element.getAttribute('src');
      if (reload.resolve(src) == url) {
        if (element.tagName == 'SCRIPT') {
          return location.reload();
        }

        element.setAttribute('src', reload.refresh(src));
      }
    }

    if (element.hasAttribute('srcset')) {
      var srcset = element.getAttribute('srcset');
      var regexp = /([^ ]+)([^,]*,?)/g;
      var result = srcset.replace(regexp, function($0, $1, $2) {
        if (reload.resolve($1).indexOf(url) > -1) {
          return reload.refresh($1) + $2;
        }

        return $0;
      });

      if (result != srcset) {
        element.setAttribute('srcset', result);
      }
    }

    if (element.hasAttribute('style')) {
      var style = element.getAttribute('style');
      var regexp = /(url\((['"]?))([^\2)]*)(\2\))/g;
      var result = style.replace(regexp, function($0, $1, $2, $3, $4) {
        if (reload.resolve($3).indexOf(url) > -1) {
          return $1 + reload.refresh($3) + $4;
        }

        return $0;
      });

      if (result != style) {
        element.setAttribute('style', result);        
      }
    }
  }
};

reload.refresh = function(url) {
  if (/reload/.test(url)) {
    return url.replace(/([?&]reload=)0-9]+/, '$1' + Date.now());
  }

  return url + (/\?/.test(url) ? '&' : '?' ) + 'reload=' + Date.now();
};

reload.resolve = function resolve(path) {
  resolve.element.href = path.replace(/[?&]reload=[0-9]+/, '');
  return resolve.element.href;
};

reload.resolve.element = document.createElement('a');

reload.check = function check(selector, callback) {
  var urls = [
    location.href
  ];

  if (selector == null) {
    selector = [
      '*[src]',
      '*[srcset]',
      '*[style*=url]',
      '*[href]',
      'style',
    ].join(', ');
  }

  var elements = document.querySelectorAll(selector);
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];

    if (element.hasAttribute('href')) {
      var href = reload.resolve(element.getAttribute('href'));
      if (urls.indexOf(href) == -1) {
        urls.push(href);
      }
    }

    if (element.hasAttribute('src')) {
      var href = reload.resolve(element.getAttribute('src'));
      if (urls.indexOf(href) == -1) {
        urls.push(href);
      }
    }

    if (element.hasAttribute('srcset')) {
      var srcset = element.getAttribute('srcset');
      var regexp = /([^ ]+)([^,]*,?)/g;

      var match = null;
      while (match = regexp.exec(srcset)) {
        var src = reload.resolve(match[1]);
        if (urls.indexOf(src) == -1) {
          urls.push(src);
        }
      }
    }

    if (element.hasAttribute('style')) {
      var style = element.getAttribute('style');
      var regexp = /(url\((['"]?))([^\2)]*)(\2\))/g;

      var match = null;
      while (match = regexp.exec(style)) {
        var src = reload.resolve(match[3]);
        if (urls.indexOf(src) == -1) {
          urls.push(src);
        }
      }
    }
  }

  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    if (url.indexOf(location.hostname) == -1) {
      continue;
    }

    if (check.current[url]) {
      continue;
    }

    check.current[url] = (function(url, previous) {
      var current = new XMLHttpRequest();
      current.open('HEAD', url);
      current.onload = function() {
        if (previous) {
          for (var i = 0; i < check.headers.length; i++) {
            var header = check.headers[i];

            var previousValue = previous.getResponseHeader(header);
            var currentValue = current.getResponseHeader(header);

            if (previousValue != currentValue) {
              callback(url);
              break;
            }
          }
        }

        check.previous[url] = current;
        check.current[url] = null;
      };

      current.onerror = function() {
        check.current[url] = null;
      };

      current.send(null);

      return current;
    }(url, check.previous[url]));
  }
};

reload.check.current = {};
reload.check.previous = {};
reload.check.headers = [
  'Content-Length',
  'Content-Type',
  'Etag',
  'Last-Modified'
];

console.debug('Connecting to reload server...');
setTimeout(function(script) {
  if (script == null) {
    script = document.querySelector('script[src*="webreload.js"]');
  }

  var url = 'wss://' + location.hostname + ':' + 35729;
  if (location.protocol == 'http:') {
    url = 'ws://' + location.hostname + ':' + 35729;
  }

  var socket = new WebSocket(url);
  socket.onopen = function() {
    console.debug('Connected to reload server at ' + url + '.');
  };

  socket.onclose = function() {
    if (socket) {
      console.debug('Disconnected from reload server.');
    }
  };

  socket.onmessage = function(event) {
    if (script.isConnected) {
      var message = JSON.parse(event.data);
      if (message.command == 'reload') {
        console.debug('Reloading', message.path);
        reload(null, message.path);
      }
    }
  };

  socket.onerror = function() {
    console.debug('Reload server not available, falling back to polling mode');
    socket = null;
  };

  setTimeout(function callback(script) {
    if (script.isConnected) {
      if (socket == null) {
        reload.check(null, function(path) {
          console.debug('Reloading', path);
          reload(null, path);
        });
      }

      return setTimeout(callback, 1000, script);
    } 

    if (socket) {
      socket.close();
      socket = null;
    }

    for (var key in reload.check.current) {
      delete reload.check.previous[key];
    }

    for (var key in reload.check.current) {
      delete reload.check.current[key];
    }
  }, 1000, script);
}, 0, document.currentScript);
