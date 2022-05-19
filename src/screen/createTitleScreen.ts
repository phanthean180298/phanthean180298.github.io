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
import { itemFormulaHelper, toolFormulaHelper } from "../util/formulaHelpers";

const createTitleScreen = async (
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
      textRenderer.draw(batch, "Cooking", 0, Dimension.WORLD_HEIGHT / 4, 80);
      batch.setColor(0.3, 0.3, 0.3, 1);
      batch.draw(
        whiteTexture,
        Dimension.WORLD_WIDTH / 2 - 100,
        Dimension.WORLD_HEIGHT / 4 + 200,
        200,
        100
      );
      textRenderer.draw(
        batch,
        "Start",
        0,
        Dimension.WORLD_HEIGHT / 4 + 210,
        50
      );
      batch.end();
    },
    dispose() {
      inputHandler.cleanup();
    },
    init() {
      inputHandler.addEventListener("touchEnd", async () => {
        if (
          pointInRect(
            inputHandler.getTouchedWorldCoord(),
            Dimension.WORLD_WIDTH / 2 - 100,
            Dimension.WORLD_HEIGHT / 4 + 200,
            200,
            100
          )
        ) {
          await toolFormulaHelper.loadFormula();
          await itemFormulaHelper.loadFormula();
          game.setScreen(await createMenuScreen(game, viewport));
        }
      });
    },
  };
};

export default createTitleScreen;
