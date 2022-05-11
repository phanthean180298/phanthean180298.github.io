import { Game, Screen, SpriteBatch, Viewport } from "gdxjs";
import GameState from "../GameState";

const createTitleScreen = (
  batch: SpriteBatch,
  game: Game<void>,
  viewport: Viewport
): Screen<void> => {
  return {
    update(delta) {},
    dispose() {},
    init() {},
  };
};

export default createTitleScreen;
