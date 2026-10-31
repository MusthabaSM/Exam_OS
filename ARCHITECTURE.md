# Exam OS Architecture

## Current State: Prototype Phase
Exam OS is currently a Next.js App Router prototype focusing entirely on the UI/UX layer. It uses local/demo data to simulate interactions.

### 1. Core Stack
*   **Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS v4, utilizing CSS variable tokens (Royal Blue `#4A78E0`, Soft White `#F4F6FA`, Steel Gray `#5A6473`).
*   **UI Components**: Shadcn UI, Radix UI, Lucide Icons, Framer Motion/AnimeJS for micro-interactions.
*   **Editor**: Tiptap for rich-text study notes.
*   **Data Persistence**: `localStorage` wrapping via `src/lib/storage.ts` for primitive mock data persistence.

### 2. File Structure
*   `src/app/` - Next.js App Router routes covering global features (`/dashboard`, `/study-plan`, `/calendar`) and specific exam workspaces (`/exams/[examId]/*`).
*   `src/components/` - Highly modularized React components split by feature (`dashboard`, `exams`, `layout`, `progress`, etc.).
*   `src/lib/storage.ts` - Temporary mock data repository.
*   `DESIGN.md` - Source of truth for visual UI standards.

### 3. Target State
The next phases will transition the architecture to a production-grade stack including:
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Data Access**: Centralized repository layer (`src/lib/repositories/`)
*   **API**: Next.js Server Actions and Route Handlers
*   **Document Pipeline**: Document upload, parsing, and structured chunking (preparation for future RAG).

*This document will be updated as the backend architecture matures.*
