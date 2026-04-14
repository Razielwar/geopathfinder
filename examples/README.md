# GeoPathFinder Examples

This directory contains examples to verify that the deployment of `geopathfinder` to both CommonJS (CJS) and ES Modules (ESM) works correctly.

## CJS Example (Node.js)

This example demonstrates the usage of `geopathfinder` in a Node.js environment using CommonJS modules.

### How to run

1.  Build and pack the main `geopathfinder` project from the root directory:
    ```bash
    yarn build
    npm pack
    ```
    This will create a `.tgz` package file in the root directory.

2.  In the `examples` directory, install the dependencies. This will install the local `geopathfinder` package.
    ```bash
    yarn
    ```

3.  Run the example:
    ```bash
    yarn start
    ```
    This will execute the `node-example.js` script, and you should see the output in your console.

## ESM Example (Browser)

This example demonstrates the usage of `geopathfinder` in a browser environment using ES Modules.

### How to run

1.  Build the example to create a bundle for the browser:
    ```bash
    yarn build
    ```
    This will generate a `bundle.js` file.

2.  Open the `browser-example.html` file in your web browser.

3.  Open the browser's developer console to see the output from the `browser-example.js` script.