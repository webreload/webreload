reload = function reload(path) {
  var url = reload.resolve(path);
  if (location.href == url) {
    return location.reload();
  }

  var elements = document.querySelectorAll(reload.selector);
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    if (element.hasAttribute('href')) {
      var href = element.getAttribute('href');
      if (url == reload.resolve(href)) {
        element.setAttribute(
          'href',
          reload.refresh(element.getAttribute('href'))
        );
      }
    }

    if (element.hasAttribute('src')) {
      var src = element.getAttribute('src');
      if (url == reload.resolve(src)) {
        element.setAttribute(
          'src',
          reload.refresh(element.getAttribute('src'))
        );
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

reload.selector = [
  '*[src]',
  '*[srcset]',
  '*[style*=url]',
  '*[href]',
  'style',
].join(', ');

reload.resolve = (function() {
  var element = document.createElement('a');

  return function resolve(path) {
    return (element.href = path.replace(/[&?]reload=[0-9]+/, ''));
  };
}());

reload.refresh = function refresh(url) {
  if (/reload/.test(url)) {
    return url.replace(/reload=[0-9]+/, 'reload=' + Date.now());
  }

  return url + (url.indexOf('?') == -1 ? '?' : '&') + 'reload=' + Date.now();
};

reload.check = (function() {
  var previous = {};
  var current = {};
  var names = [
    'Etag',
    'Content-Length',
    'Content-Type',
    'Last-Modified'
  ];

  return function check(callback) {
    var urls = [
      location.href
    ];

    var elements = document.querySelectorAll(reload.selector);
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

      if (current[url]) {
        continue;
      }

      current[url] = (function(url) {
        var request = new XMLHttpRequest();
        request.open('HEAD', url);
        request.onload = function() {
          if (previous[url]) {
            var cache = previous[url];
            for (var i = 0; i < names.length; i++) {
              var a = cache.getResponseHeader(names[i]);
              var b = request.getResponseHeader(names[i]);

              if (a != b) {
                callback(url);
                break;
              }
            }
          }

          delete current[url];
          previous[url] = request;
        };

        request.onerror = function() {
          delete current[url];
        };

        request.send(null);
      }(url));
    }
  };
}());

(function(url) {
  var socket = new WebSocket(url);
  reload.onopen = function open() {
    reload.socket = socket;
  };

  socket.onmessage = function message(event) {
    var message = JSON.parse(event.data);
    if (message.command == 'reload') {
      reload(message.path);
    }
  };

  socket.onerror = function error(event) {
    reload.interval = setInterval(function() {
      reload.check(reload);
    }, 1000);
  };
}(location.protocol == 'https:' ? 'wss:' : 'ws:' + '//' + location.hostname + ':' + 35729));
