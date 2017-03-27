# Web Reload

Web Reload is a browser extension and runtime script for browsers which
monitors active resources on a web page and reloads them as they change.

It's available as web extensions for browsers that support the web extension
API, the extension enables injection of the runtime script with the click of a
toggle button.

The runtime script however will work on all modern browsers as a standalone
script which can be injected via a bookmarklet, manually included into the page
or injected by an external integration like a development proxy server.

Whenever a change is detected it searches through all the elements in the
document, and will look for matching urls in `href`, `src`, `srcset` and
`style` and force a refresh with a cache busting url.

By default the script will attempt to connect to a reload socket server on port
35729, falling back to a polling mode if no server is available, meaning that
it will work out of the box with zero configuration or additional setup than
the inclusion of the script, but using a reload server is recommended if there
is a lot of resources on the web page as polling performance is dependent on
how many unique resources are on a web page.

Reload servers and integrations are expected to accept web socket connections
on port 35729 and send reload commands in the following JSON format:

```json
{
  "command": "reload",
  "path": "<relative_url | absolute_url>",
}
```

This is the same as what Live Reload uses in its own protocol, meaning Live
Reload servers should also work with Web Reload, however Web Reload
integrations should be preferred over Live Reload integrations as they include
the Web Reload script instead of Live Reload.

## Documentation

See the [website](http://webreload.pw) for more information.

## License

Web Reload is available under the [MIT license](LICENSE.md).
