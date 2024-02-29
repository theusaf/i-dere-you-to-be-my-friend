# Pixi.js "Engine" Template

This template is for a simple React application using pixi.js as the rendering engine. This allows for use of React components for UI and pixi.js for graphics and other features.

It also comes with a backend using Express.js and Gluon to host the web application without needing to bundle a Chromium browser in exports. This also enables the application to access things like filesystems and other native features.

Included are build scripts that will package the application into a zip with executable code. This does bundle nodejs and uses `pkg` to create executables, so it may be a bit heavy.

- Currently only builds for Windows (x64 and arm64)

## Where to start

For backend tasks, see the `backend` directory. Code there can access anything that Nodejs can use.

For frontend tasks, the `src` folder contains React code.
