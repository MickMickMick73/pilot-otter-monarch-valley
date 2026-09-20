import { createFileRoute } from "@tanstack/react-router";
import { DungeonGame } from "@/components/dungeon-game";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DungeonGame />;
}