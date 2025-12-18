# CLAUDE.md

## Project Overview
Personal recommendations/favorites website built with Astro, Tailwind CSS, and DaisyUI.

## Tech Stack
- **Framework**: Astro 5 (static output)
- **Styling**: Tailwind CSS 4 + DaisyUI 5
- **Language**: TypeScript
- **Deployment**: GitHub Pages at `/byw-mit`

## Commands
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run refresh-data  # Refresh JSON data files
```

## Project Structure
```
src/
├── data/          # JSON data files (products, stores, singers, etc.)
├── layouts/       # Layout components (Layout.astro)
├── pages/         # Route pages (index, passport, category pages)
├── styles/        # Global CSS
└── types.ts       # TypeScript interfaces
```

## Data Types
All types defined in `src/types.ts`:
- `Product`, `Store`, `Singer`, `Actor`, `Artist`, `MiscCreator`
- Common fields: `name`, `notes?`, `is_recommender?`

## Guidelines
- Keep pages simple and data-driven
- Add new categories by creating JSON in `src/data/` and page in `src/pages/`
- Use existing TypeScript interfaces when adding data
