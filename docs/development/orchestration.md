# Development Orchestration

## Development commands

- `pnpm run dev`
- `pnpm run dev:clean`

## Ports

- `3000` → `apps/web`
- `3002` → desktop renderer

## Architecture

```text
root
└── turbo
    └── apps/desktop
        ├── electron
        └── renderer
```

## Important notes

- The renderer is intentionally excluded from root builds via `--filter=!renderer`.
- Electron derives `RENDERER_PORT` from the environment dynamically.
- Graceful cleanup scripts live in `/scripts`.
- Do not add `taskkill` commands directly to dev scripts.
- Do not rename the renderer's standard `dev` script to preserve package semantics.
