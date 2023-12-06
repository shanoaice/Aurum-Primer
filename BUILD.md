# Build Instructions

## Prerequisites

Please refer to Tauri's [Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) page. You can check whether it is met by running `yarn tauri info` in the root directory of this project, after you have bootstrapped dependencies (as in the [Frontend](#frontend) section).

## Frontend

The frontend uses Vite as a build framework. Make sure you have Node.js LTS or Latest installed and have enabled [corepack](https://nodejs.org/api/corepack.html), then run:

```bash
yarn install
```

to prepare the dependencies. Since the project uses Tauri, normally you shouldn't need to build the frontend independently, but if you need to `yarn build` will suffice. 

Due to compatibility issues with JetBrains IDE, this project does not use Yarn PnP, thus Editor SDK is not needed.

## Backend

The backend is powered by Tauri and Rust. Since some part of the code uses experimental features (`ip-bits`), thus you will need a nightly version of the Rust Toolchain. We recommend using `rustup` to manage the toolchain:

```bash
rustup toolchain update nightly
```

The `rust-toolchain.toml` file under `src-tauri` will get you covered for the nightly override.

```bash
yarn tauri dev # to kick up a dev application with hot-reload
yarn tauri build # to build the whole application
```

Note that Tauri does not support cross-comiling at this moment.
