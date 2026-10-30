import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [{ title: "Messages — Tile Marketplace" }],
    links: [
      {
        rel: "icon",
        href: "/tile-marketplace-logo.jpeg",
      },
    ],
  }),
  component: () => <Outlet />,
});
