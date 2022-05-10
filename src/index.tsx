import {
  createAnimation,
  createBatch,
  createGameLoop,
  createStage,
  createViewport,
  createWhiteTexture,
  TextureAtlas,
  TextureRegion,
  Animation,
  Vector2,
  PlayMode,
  createViewportAwareInputHandler,
  drawLine,
} from "gdxjs";
import Dimension from "./constant/constant";
import AssetManager from "./util/AssetManager";
import GameState, { Cell } from "./GameState";
import { GRID_COL, GRID_ROW } from "./GameState";

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();
  const viewport = createViewport(
    canvas,
    Dimension.WORLD_WIDTH,
    Dimension.WORLD_HEIGHT
  );

  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  const whiteTexture = createWhiteTexture(gl);
  const batch = createBatch(gl);
  const gameState = new GameState();

  const assetManager = new AssetManager(gl);
  assetManager.loadAtlas("./assets/new_misc.atlas", "gems_atlas");
  await assetManager.finishLoading();

  const inputHandler = createViewportAwareInputHandler(canvas, viewport);

  // Init gem
  let gemRegions!: TextureRegion[];
  const gemAnimations: { [key: string]: Animation } = {};

  const gemsAtlas = assetManager.getAtlas("gems_atlas") as TextureAtlas;
  for (let i = 0; i <= 3; i++) {
    gemRegions = gemsAtlas.findRegions(`gem_${i}`);
    const animation = createAnimation(1 / gemRegions.length, gemRegions);
    gemAnimations[`gem_${i}`] = animation;
  }

  const cellWidth = Dimension.BOARD_WIDTH / GRID_COL;
  const cellHeight = cellWidth / Dimension.CELL_RATIO;
  const hitBoxSize = cellHeight * 1.3;
  const boardOffset = new Vector2(
    25,
    Dimension.WORLD_HEIGHT / 2 - (cellHeight * GRID_ROW) / 2
  ); // center

  const getCellPosition = (x: number, y: number): Vector2 => {
    return new Vector2(
      boardOffset.x + x * cellWidth,
      boardOffset.y + y * cellHeight
    );
  };

  const getCellXyByCoord = (x: number, y: number): Vector2 | null => {
    if (x < 0 || y < 0) {
      return null;
    }

    if (x > Dimension.BOARD_WIDTH || y > Dimension.BOARD_HEIGHT) {
      return null;
    }

    const cellXy: Vector2 = new Vector2(0, 0);
    cellXy.x = Math.floor(x / cellWidth);
    cellXy.y = Math.floor(y / cellHeight);

    const center = getCellPosition(cellXy.x, cellXy.y)
      .sub(boardOffset.x, boardOffset.y)
      .add(cellWidth / 2, cellHeight / 2);
    const dist = Math.max(Math.abs(x - center.x), Math.abs(y - center.y));
    if (dist > hitBoxSize * 0.5) {
      return null;
    }

    return cellXy;
  };

  let selectedPath: Vector2[] = [];
  const getPointIndex = (x: number, y: number) => {
    for (let i = 0; i < selectedPath.length; i++) {
      const point = selectedPath[i];
      if (point.x === x && point.y === y) return i;
    }
    return -1;
  };

  let dragging = false;
  let currentColor = -1;
  let highlightCells: Vector2[] = [];

  const processPath = (path: Vector2[]) => {
    gameState.processPath(path).then(async () => {});
  };

  const updateDragging = (delta: any) => {
    if (inputHandler.isTouched()) {
      dragging = true;
      const touchPoint = inputHandler.getTouchedWorldCoord();
      const xy = getCellXyByCoord(
        touchPoint.x - boardOffset.x,
        touchPoint.y - boardOffset.y
      );
      if (xy !== null) {
        const cell = gameState.getCell(xy.x, xy.y);
        if (cell === undefined) return;
        if (currentColor !== -1 && cell.color !== currentColor) return;

        const index = getPointIndex(xy.x, xy.y);
        let dirty = false;

        if (index === -1) {
          const lastPoint = selectedPath[selectedPath.length - 1];
          let shouldAdd = false;
          if (!lastPoint) {
            shouldAdd = true;
          } else {
            shouldAdd =
              Math.max(
                Math.abs(xy.x - lastPoint.x),
                Math.abs(xy.y - lastPoint.y)
              ) <= 1;
          }
          if (shouldAdd) {
            selectedPath.push(xy);
            dirty = true;
          }
          if (selectedPath.length === 1) {
            currentColor = cell.color;
          }
        } else if (index === selectedPath.length - 2) {
          selectedPath.pop();
          dirty = true;
        }
        if (dirty) {
          highlightCells.length = 0;
          for (let i = 0; i < selectedPath.length; i++) {
            highlightCells.push(selectedPath[i]);
          }
        }
      }
    } else if (dragging && !gameState.isProcessing) {
      processPath(selectedPath);

      selectedPath.length = 0;
      dragging = false;
      currentColor = -1;
      highlightCells.length = 0;
    }
  };

  const isHighlighted = (x: number, y: number): boolean => {
    if (highlightCells.length > 0) {
      return (
        highlightCells.find((xy) => xy.x === x && xy.y === y) !== undefined
      );
    }
    return false;
  };

  const drawGem = (x: number, y: number, cell: Cell, scale = 0.9) => {
    const position = new Vector2(
      boardOffset.x + x * cellWidth,
      boardOffset.y + y * cellHeight
    );
    const region = gemAnimations[`gem_${cell.color}`].getKeyFrame(
      0,
      PlayMode.LOOP
    );
    const width = cellWidth * 1.7;
    const height =
      ((region as any).originalHeight * width) / (region as any).originalWidth;

    let highlighted = false;
    if (highlightCells.length > 0) {
      highlighted = isHighlighted(x, y);
    }

    region.draw(
      batch,
      position.x + cellWidth / 2 - width / 2,
      position.y + cellHeight / 2 - height / 2,
      width,
      height,
      width / 2,
      height / 2,
      0,
      scale * (highlighted ? 1.1 : 1),
      scale * (highlighted ? 1.1 : 1)
    );
  };

  const getCellCenter = (x: number, y: number): Vector2 => {
    return getCellPosition(x, y).add(cellWidth / 2, cellHeight / 2);
  };

  const drawPath = (path: Vector2[]) => {
    for (let index = 0; index < path.length; index++) {
      if (path[index + 1]) {
        const currentNode = path[index];
        const nextNode = path[index + 1];
        let { x: x1, y: y1 } = getCellCenter(currentNode.x, currentNode.y);
        let { x: x2, y: y2 } = getCellCenter(nextNode.x, nextNode.y);
        if (x2 > x1) {
          y1 -= 0.25;
          y2 -= 0.25;
        } else if (x1 > x2) {
          y1 -= 0.75;
          y2 -= 0.75;
        }
        if (y2 > y1) {
          x1 -= 0.25;
          x2 -= 0.25;
        } else if (y1 > y2) {
          x1 += 0.25;
          x2 += 0.25;
        }
        drawLine(batch, whiteTexture, x1, y1, x2, y2, 10);
      } else {
        break;
      }
    }
  };

  createGameLoop((delta: any) => {
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
    batch.setColor(0, 0, 0, 1);

    updateDragging(delta);
    drawPath(selectedPath);

    for (let x = 0; x < GRID_COL; x++) {
      for (let y = 0; y < GRID_ROW; y++) {
        batch.setColor(1, 1, 1, 1);

        const cell = gameState.getCell(x, y);
        if (cell.color >= 0) {
          drawGem(x, y, cell);
        }
      }
    }

    batch.end();
  });
};

init();
