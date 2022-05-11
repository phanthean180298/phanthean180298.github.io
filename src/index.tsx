import {
  createBatch,
  createGameLoop,
  createStage,
  createViewport,
  Game,
} from "gdxjs";
import GameState from "./GameState";
import createGameScreen from "./screen/createGameScreen";
import createTitleScreen from "./screen/createTitleScreen";

const WORLD_WIDTH = 600;
const WORLD_HEIGHT = 1000;


const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();
  const viewport = createViewport(canvas, WORLD_WIDTH, WORLD_HEIGHT);
  const gl = viewport.getContext();
  const camera = viewport.getCamera();

  const batch = createBatch(gl);

  const game = new Game<void>();

  game.setScreen(await createGameScreen(game, viewport, 0));

  createGameLoop((delta: any) => {
    game.update(delta);
    batch.setProjection(camera.combined);
    batch.begin();
    batch.end();
  });
};

init();
