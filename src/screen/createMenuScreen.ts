import { pointInRect } from "./../util/pointInRect";
import {
  AlignMode,
  createBatch,
  createViewportAwareInputHandler,
  createWhiteTexture,
  Game,
  loadFont,
  Screen,
  Viewport,
} from "gdxjs";
import Dimension from "../constant/constant";
import createGameScreen from "./createGameScreen";

const levels = [
  { id: 1, name: "Vong 1", minTime: 0, receiveStarTime: 600 },
  { id: 1, name: "Vong 2", minTime: 0, receiveStarTime: 600 },
  { id: 1, name: "Vong 3", minTime: 0, receiveStarTime: 600 },
  { id: 1, name: "Vong 4", minTime: 0, receiveStarTime: 600 },
  { id: 1, name: "Vong 5", minTime: 0, receiveStarTime: 600 },
];

const createMenuScreen = async (
  game: Game<void>,
  viewport: Viewport
): Promise<Screen<void>> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  const whiteTexture = createWhiteTexture(gl);

  const font = await loadFont(gl, "assets/book-bold.fnt");
  const textRenderer = font.createRenderer(Dimension.WORLD_WIDTH);
  textRenderer.setAlignMode(AlignMode.center);
  const inputHandler = createViewportAwareInputHandler(
    viewport.getCanvas(),
    viewport
  );
  const batch = createBatch(gl);
  const levelBtnPositions: { x: number; y: number }[] = [];

  for (let i = 0; i < levels.length; i++) {
    levelBtnPositions.push({
      x: i > 0 ? 100 + (i % 3) * 150 : 100,
      y: 250 + Math.floor(i / 3) * 140,
    });
  }

  inputHandler.addEventListener("touchEnd", async () => {
    for (let i = 0; i < levels.length; i++) {
      if (
        pointInRect(
          inputHandler.getTouchedWorldCoord(),
          levelBtnPositions[i].x,
          levelBtnPositions[i].y,
          120,
          120
        )
      ) {
        game.setScreen(await createGameScreen(game, viewport, i));
      }
    }
  });

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

      textRenderer.draw(batch, "Level", 0, Dimension.WORLD_HEIGHT / 10, 80);
      batch.setColor(0.3, 0.3, 0.3, 1);

      for (let i = 0; i < levels.length; i++) {
        batch.draw(
          whiteTexture,
          levelBtnPositions[i].x,
          levelBtnPositions[i].y,
          120,
          120
        );
        textRenderer.draw(
          batch,
          levels[i].name,
          (i > 0 ? 100 + (i % 3) * 150 : 100) - Dimension.WORLD_WIDTH / 2 + 50,
          250 + Math.floor(i / 3) * 140,
          20
        );
        textRenderer.draw(
          batch,
          `Time: ${levels[i].minTime}s`,
          (i > 0 ? 100 + (i % 3) * 150 : 100) - Dimension.WORLD_WIDTH / 2 + 50,
          280 + Math.floor(i / 3) * 140,
          20
        );
        textRenderer.draw(
          batch,
          `Stars: ${
            levels[i].minTime > 0
              ? Math.floor(
                  (600 - levels[i].minTime) / (levels[i].receiveStarTime / 3)
                )
              : 0
          }`,
          (i > 0 ? 100 + (i % 3) * 150 : 100) - Dimension.WORLD_WIDTH / 2 + 50,
          320 + Math.floor(i / 3) * 140,
          20
        );
      }

      batch.end();
    },
    dispose() {},
    init() {},
  };
};

export default createMenuScreen;
