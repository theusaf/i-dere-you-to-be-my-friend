import { createContext } from "react";
import { GameManager } from "../../engine/game_manager";

export const GameManagerContext = createContext<GameManager | null>(null);
