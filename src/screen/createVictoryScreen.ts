import { pointInRect } from "./../util/pointInRect";
import {
  AlignMode,
  createBatch,
  createGameLoop,
  createViewportAwareInputHandler,
  createWhiteTexture,
  Game,
  loadFont,
  Screen,
  Viewport,
} from "gdxjs";
import Dimension from "../constant/constant";
import createMenuScreen from "./createMenuScreen";

const createVictoryScreen = async (
  game: Game<void>,
  viewport: Viewport
): Promise<Screen<void>> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  const whiteTexture = createWhiteTexture(gl);
  const batch = createBatch(gl);

  const font = await loadFont(gl, "assets/book-bold.fnt");
  const textRenderer = font.createRenderer(Dimension.WORLD_WIDTH);
  textRenderer.setAlignMode(AlignMode.center);
  const inputHandler = createViewportAwareInputHandler(
    viewport.getCanvas(),
    viewport
  );
  return {
    update(delta) {
      batch.setProjection(camera.combined);
      batch.begin();
      // black panel
      batch.setColor(0.26, 0.53, 0.96, 1);
      batch.draw(
        whiteTexture,
        0,
        0,
        Dimension.WORLD_WIDTH,
        Dimension.WORLD_HEIGHT
      );

      batch.end();
    },
    dispose() {
      inputHandler.cleanup();
    },
    init() {},
  };
};

export default createVictoryScreen;
