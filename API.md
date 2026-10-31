# API and Validation Documentation

## Architecture
The application uses **Zod** for strongly-typed, centralized validation of all inputs before they reach the repository or database layer.

**Data Flow:**
```
Client/UI → Server Action → Zod validation → Repository → Prisma → PostgreSQL
```

## Validation Schemas
Validation schemas are located in `src/lib/validation/` and are organized by domain.

### Available Domains:
- **Exams** (`examSchemas.ts`): `createExamSchema`, `updateExamSchema`
- **Syllabus** (`syllabusSchemas.ts`): `createSubjectSchema`, `createTopicSchema`, `reorderTopicSchema`, etc.
- **Documents** (`documentSchemas.ts`): `createDocumentSchema`, `updateDocumentSchema`
- **Study** (`studySchemas.ts`): `createStudyTaskSchema`, `startStudySessionSchema`, etc.
- **Practice** (`practiceSchemas.ts`): `createPracticeQuestionSchema`, `submitPracticeAnswerSchema`, etc.
- **Notes** (`noteSchemas.ts`): `createNoteSchema`, `updateNoteSchema`, etc.
- **Calendar** (`calendarSchemas.ts`): `createCalendarEventSchema`, `updateCalendarEventSchema`, etc.
- **AI** (`aiSchemas.ts`): `createConversationSchema`, `sendMessageSchema`
- **Settings** (`settingsSchemas.ts`): `updateSettingsSchema`

### Key Validation Rules
- **IDs**: Standardized using `cuidSchema` which validates CUID formats.
- **Dates**: Validated to ensure logical ordering (e.g., `applicationEndDate >= applicationStartDate`, `endAt >= startAt`). Dates are converted and parsed correctly using `z.coerce.date()`.
- **Strings**: Enforce `.trim()` to prevent whitespace-only bypasses. Configured with reasonable `.min()` and `.max()` length constraints.
- **Enums**: Mapped to native Prisma enums via `z.nativeEnum()` to ensure strict correspondence with the database (e.g., `ExamStatus`, `Difficulty`).
- **Practice Consistency**: When defining a practice question, `correctAnswer` must exactly match one of the provided `options`.

## Error Formatting
Zod errors should not be exposed directly to the user. Instead, they are formatted into a standard `ActionResponse` format using the helper function provided in `common.ts`.

```typescript
export type ActionResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

**Example Validation Failure Response:**
```json
{
  "success": false,
  "error": "Validation failed",
  "fieldErrors": {
    "name": ["Exam name is required"]
  }
}
```

## Type Inference
Zod schemas act as the source of truth for input types. Use `z.infer<typeof schemaName>` to derive input types for Server Actions and Repositories rather than duplicating TypeScript interfaces.

Example:
```typescript
import { z } from 'zod';
import { createExamSchema } from '@/lib/validation';

export type CreateExamInput = z.infer<typeof createExamSchema>;
```
