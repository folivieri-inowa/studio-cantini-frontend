# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application built on the Minimal UI Kit v5.6.0 (Material-UI dashboard template). It's an Italian accounting/business management system with features for transaction management (Prima Nota), document archiving, category/subject/owner management, and machine learning-based classification.

- **Framework**: Next.js 15.2.3 with App Router, React 19
- **UI Library**: Material-UI v6 with Emotion styling
- **Language**: JavaScript (JSX)
- **Package Manager**: Yarn (preferred) or npm

## Common Commands

```bash
# Development (runs on port 3032 with Turbopack)
yarn dev

# Production build
yarn build

# Linting and formatting
yarn lint          # Check ESLint
yarn lint:fix      # Fix ESLint issues
yarn prettier      # Format with Prettier

# Clean restart
yarn re:start      # rm all + install + dev
yarn re:build      # rm all + install + build

# Run both frontend and backend (backend in separate folder)
yarn start:all
```

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (proxied to backend)
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard routes
│   └── layout.js          # Root layout with providers
├── api/                   # SWR data fetching hooks (one file per domain)
├── auth/                  # JWT authentication (context, guards, hooks)
├── components/            # Reusable UI components
│   ├── hook-form/         # React Hook Form components
│   ├── table/             # Data table components
│   └── animate/           # Framer Motion animations
├── sections/              # Feature modules (page-specific components)
│   ├── prima-nota/        # Transaction management
│   ├── archive/           # Document archive
│   ├── category/          # Category management
│   ├── owner/             # Owner management
│   ├── subject/           # Subject management
│   ├── scadenziario/      # Schedule/deadline tracking
│   └── machine-learning/  # ML classification rules
├── layouts/               # Page layouts (dashboard, auth, etc.)
├── routes/paths.js        # Centralized route definitions
├── theme/                 # MUI theme configuration
└── utils/axios.js         # Axios instance with endpoints
```

### Key Patterns

**Provider Stack** (in `app/layout.js`):
```jsx
<AuthProvider>           // JWT auth context
  <LocalizationProvider> // i18n
    <SettingsProvider>   // Theme settings (db, year, owner)
      <ThemeProvider>    // MUI theme
        <SnackbarProvider>
          {children}
        </SnackbarProvider>
      </ThemeProvider>
    </SettingsProvider>
  </LocalizationProvider>
</AuthProvider>
```

**API Architecture**: Next.js rewrites in `next.config.js` proxy `/api/*` requests to the backend service (`NEXT_PUBLIC_HOST_BACKEND`). The `src/api/` directory contains SWR hooks for data fetching.

**Route Guards**: `AuthGuard` in `src/auth/guard/` wraps all dashboard routes to enforce authentication.

**Multi-tenancy**: The app supports multi-database selection via the `db` parameter in login and settings context.

## Code Style

- **ESLint**: Airbnb config with custom rules (see `.eslintrc`)
- **Import sorting**: Uses `perfectionist` plugin with custom groups (MUI, routes, hooks, utils, components, sections)
- **Prettier**: 100 char width, single quotes, trailing commas (es5)
- **Path alias**: `src/` maps to `./src` for imports

## Key Files

- `src/config-global.js` - API URLs and auth configuration
- `src/routes/paths.js` - All route paths defined here
- `src/utils/axios.js` - Axios instance and API endpoints
- `src/auth/context/jwt/` - JWT authentication implementation
- `next.config.js` - API proxy rewrites and webpack config

## Environment Variables

- `NEXT_PUBLIC_HOST_API` - Frontend URL
- `NEXT_PUBLIC_HOST_BACKEND` - Backend API URL
- `NEXT_PUBLIC_ASSETS_API` - Assets/CDN URL
