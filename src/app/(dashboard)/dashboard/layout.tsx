"use client";

export default function UserDashboardContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Removed the Card and CardContent wrapper from here
  // to prevent nesting cards and allow pages full control.
  return <>{children}</>;
}
