import {
  createBatch,
  createGameLoop,
  createStage,
  createViewport,
  createWhiteTexture,
} from "gdxjs";
import { itemFormulaHelper, toolFormulaHelper } from "./util/formulaHelpers";

const WORLD_WIDTH = 600;
const WORLD_HEIGHT = 1000;

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();
  const viewport = createViewport(canvas, WORLD_WIDTH, WORLD_HEIGHT);

  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  const whiteTexture = createWhiteTexture(gl);

  const batch = createBatch(gl);

  console.log(toolFormulaHelper.search("beef", "chop"));
  console.log(toolFormulaHelper.search("beef", "stove"));

  // const gameState = new GameManager();

  createGameLoop((delta: any) => {
    // gameState.process(delta);
    batch.setProjection(camera.combined);
    batch.begin();
    batch.setColor(0, 0, 0, 1);
    batch.draw(whiteTexture, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    batch.end();
  });
};

init();
