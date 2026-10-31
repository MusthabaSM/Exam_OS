import React from "react";
import CalendarClient from "./CalendarClient";
import { getCalendarEventsAction } from "@/actions/calendarActions";

export default async function CalendarPage() {
  const d = new Date();
  // start of month - 7 days
  const startDate = new Date(d.getFullYear(), d.getMonth(), -7);
  // end of month + 7 days
  const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 7);
  
  const res = await getCalendarEventsAction(startDate.toISOString(), endDate.toISOString());
  const initialEvents = res.success ? res.data : [];

  return <CalendarClient initialEvents={initialEvents as any} />;
}
