import { describe, it, expect } from 'vitest';
import { parseScheduleText } from '@/lib/task-import/task-parser';

describe('task-parser', () => {
  it('should extract tasks mapped to dates', () => {
    const text = `
    25 August 2026
    General Science
    Study Indian Polity
    Practice 50 Questions

    26 August 2026
    Geography
    Study Environment
    `;

    const tasks = parseScheduleText(text);
    
    expect(tasks).toHaveLength(5);
    expect(tasks[0].date.getFullYear()).toBe(2026);
    expect(tasks[0].date.getMonth()).toBe(7); // August
    expect(tasks[0].date.getDate()).toBe(25);
    expect(tasks[0].title).toBe('General Science');
    expect(tasks[2].title).toBe('Practice 50 Questions');
    
    expect(tasks[3].date.getFullYear()).toBe(2026);
    expect(tasks[3].date.getMonth()).toBe(7);
    expect(tasks[3].date.getDate()).toBe(26);
    expect(tasks[3].title).toBe('Geography');
  });

  it('should support DD/MM/YYYY format', () => {
    const text = `
    12/09/2026
    Task A
    12-10-2026
    Task B
    `;

    const tasks = parseScheduleText(text);
    expect(tasks).toHaveLength(2);
    // Note: DD/MM/YYYY where 12 is Day, 09 is month => Sep 12
    expect(tasks[0].date.getFullYear()).toBe(2026);
    expect(tasks[0].date.getMonth()).toBe(8); // September
    expect(tasks[0].date.getDate()).toBe(12);
    expect(tasks[0].title).toBe('Task A');
    
    expect(tasks[1].date.getFullYear()).toBe(2026);
    expect(tasks[1].date.getMonth()).toBe(9); // October
    expect(tasks[1].date.getDate()).toBe(12);
    expect(tasks[1].title).toBe('Task B');
  });

  it('should support Month DD, YYYY format', () => {
    const text = `
    September 12, 2026
    Task X
    `;
    const tasks = parseScheduleText(text);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].date.getFullYear()).toBe(2026);
    expect(tasks[0].date.getMonth()).toBe(8); // September
    expect(tasks[0].date.getDate()).toBe(12);
  });
  
  it('should ignore page headers and decorative text', () => {
    const text = `
    Page 1 of 5
    25 August 2026
    Task A
    Schedule
    Timetable
    Task B
    `;
    const tasks = parseScheduleText(text);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe('Task A');
    expect(tasks[1].title).toBe('Task B');
  });
});
