# Development Workflow

First,

    $ npm install

In another Terminal tab:

    $ python -m SimpleHTTPServer

(Or if you prefer, `python3 -m http.server`.)

Thereafter, whenever you change anything:

    $ npm run build

(Arguments may be passed to Webpack after the separator `--`,
 e.g. `npm run build -- --optimize-minimize`.)

To add dependencies,

    $ npm install <package name> --save

# Deployment

CircleCI deploys to the http://grapher.mathpix.com S3 bucket automatically
whenever a new commit is pushed to `master`, but you can manually deploy
your local `index.html`/`bundle.js`/`assets/` with:

    $ npm run deploy
