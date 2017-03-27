# Web Reload

Web Reload is a runtime browser extension for browsers which monitors active
resources on a web page and reloads them as they change.

It's available as web extensions for browsers that has support for it, the
extension enables injection of the runtime script with the click of a toggle
button but the script will also work on all modern browsers as a standalone
script which can be injected manually or by an external integration like a
development proxy server.

By default it will attempt to connect to a reload socket server on port 35729,
falling back to a polling mode when no server is available so it will work
reasonably well as a default with zero configuration.

It searches through all the elements in the document, and will look for
matching urls in `href`, `src`, `srcset` and `style` when a resource change is
detected.

## Documentation

See the [website](http://webreload.pw) for more user information.

## License

Web Reload is available under the MIT license.
