import React from "react";
import SettingsClient from "./SettingsClient";
import { requireCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  return (
    <SettingsClient userEmail={user.email} userName={user.name || ''} />
  );
}
