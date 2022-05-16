import {
  AlignMode,
  createWhiteTexture,
  createViewportAwareInputHandler,
  loadFont,
  Vector2,
  drawLine,
  Game,
  Screen,
  Viewport,
  createBatch,
} from "gdxjs";
import Dimension from "../constant/constant";
import GameState, {
  Cell,
  currenciesTypes,
  GRID_COL,
  GRID_ROW,
  initialMapData,
  inventorieTypes,
  MapData,
} from "../GameState";
import eventEmitter from "../util/eventEmitter";
import levelHelpers from "../util/levelHelpers";
import {
  loadInventory,
  loadMap,
  loadOrder,
  loadPlate,
  loadTool,
} from "../util/tiledmapUtils";
import createMenuScreen from "./createMenuScreen";

const WORLD_WIDTH = 600;
const WORLD_HEIGHT = 1000;

const toolSize = new Vector2(120, 120);
const gemColor = [
  { r: 1, g: 0, b: 0, a: 1 },
  { r: 0, g: 1, b: 0, a: 1 },
  { r: 0.98, g: 0.73, b: 0, a: 1 },
  { r: 0, g: 0, b: 1, a: 1 },
];

const createGameScreen = async (
  game: Game<void>,
  viewport: Viewport,
  mapIndex: string
): Promise<Screen<void>> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  const whiteTexture = createWhiteTexture(gl);
  const gameState = new GameState();
  const canvas = viewport.getCanvas();
  const batch = createBatch(gl);

  const font = await loadFont(gl, "assets/book-bold.fnt");
  const textRenderer = font.createRenderer(WORLD_WIDTH);
  textRenderer.setAlignMode(AlignMode.center);

  const inputHandler = createViewportAwareInputHandler(canvas, viewport);

  const mapData = await loadMap(`./assets/maps/${mapIndex}.json`);

  let isVictoryModalShow = false;

  eventEmitter.addListener("endGame", async () => {
    isVictoryModalShow = true;
    levelHelpers.setLevel(mapIndex, parseFloat(gameState.totalTime.toFixed(2)));
    gameState.pauseGame();
  });

  const _mapData: MapData = initialMapData;
  for (const layer of mapData.layers) {
    switch (layer.name) {
      case "inventory":
        _mapData.inventorySlotAmount = loadInventory(layer);
        break;
      case "order":
        _mapData.orders = loadOrder(layer);
        break;
      case "tool":
        _mapData.tools = loadTool(layer);
        break;
      case "plate":
        _mapData.plateSlotAmount = loadPlate(layer);
        break;
      default:
        break;
    }
  }
  gameState.setMapData(_mapData);

  // Init second half
  const cellWidth = Dimension.BOARD_WIDTH / GRID_COL;
  const cellHeight = cellWidth / Dimension.CELL_RATIO;
  const boardOffset = new Vector2(
    25,
    (Dimension.WORLD_HEIGHT * 3) / 4 - (cellHeight * GRID_ROW) / 2
  );

  // center
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
    if (dist > cellHeight * 0.5) {
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

  const drawGem = (x: number, y: number, cell: Cell, scale = 1) => {
    const position = new Vector2(
      boardOffset.x + x * cellWidth,
      boardOffset.y + y * cellHeight
    );

    const width = cellWidth * 0.5;
    const height = width;

    let highlighted = false;
    if (highlightCells.length > 0) {
      highlighted = isHighlighted(x, y);
    }

    batch.setColor(
      gemColor[cell.color].r,
      gemColor[cell.color].g,
      gemColor[cell.color].b,
      gemColor[cell.color].a
    );
    batch.draw(
      whiteTexture,
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
    batch.setColor(1, 1, 1, 1);
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

  let currenciesPosition: { x: number; y: number }[] = [];
  if (currenciesTypes.length > 0) {
    for (let i = 0; i < currenciesTypes.length; i++) {
      currenciesPosition.push({
        x: 30 + 60 * i,
        y: Dimension.WORLD_HEIGHT / 2 - 20,
      });
    }
  }

  let commodityPosition: { x: number; y: number }[] = [];
  if (inventorieTypes.length > 0) {
    for (let i = 0; i < inventorieTypes.length; i++) {
      commodityPosition.push({
        x: WORLD_WIDTH / 2 + 50 + 60 * i,
        y: Dimension.WORLD_HEIGHT / 2 - 20,
      });
    }
  }

  let currentItem: string | null = null;
  const draggingPosition = new Vector2(0, 0);

  let inventoriesPosition: { x: number; y: number; index: number }[] = [];
  let inventorySize = 60;
  if (gameState.mapData?.inventorySlotAmount > 0) {
    inventorySize =
      (Dimension.WORLD_WIDTH -
        100 -
        30 * (gameState.mapData.inventorySlotAmount - 1)) /
      gameState.mapData.inventorySlotAmount;
    for (let i = 0; i < gameState.mapData.inventorySlotAmount; i++) {
      inventoriesPosition.push({
        x: 50 + (inventorySize + 30) * i,
        y: 120,
        index: i,
      });
    }
  }

  let ordersPosition: { x: number; y: number }[] = [];
  let orderSize = 60;
  if (gameState.currentOrders.length > 0) {
    orderSize =
      (Dimension.WORLD_WIDTH -
        100 -
        30 * (gameState.currentOrders.length - 1)) /
      gameState.currentOrders.length;
    for (let i = 0; i < gameState.currentOrders.length; i++) {
      ordersPosition.push({ x: 50 + (orderSize + 30) * i, y: 40 });
    }
  }

  let toolsPosition: {
    x: number;
    y: number;
    index: number;
    size: Vector2;
  }[] = [];
  for (let i = 0; i < gameState.mapData.tools.length; i++) {
    toolsPosition.push({
      x: gameState.mapData.tools[i].pos.x,
      y: gameState.mapData.tools[i].pos.y,
      index: i,
      size: gameState.mapData.tools[i].size,
    });
  }

  let platesPosition: { x: number; y: number; index: number }[] = [];
  let plateSize = 80;
  if (gameState.mapData?.plateSlotAmount > 0) {
    plateSize =
      (Dimension.WORLD_WIDTH -
        100 -
        30 * (gameState.mapData?.plateSlotAmount - 1)) /
      gameState.mapData?.plateSlotAmount;

    for (let i = 0; i < gameState.mapData?.plateSlotAmount; i++) {
      platesPosition.push({
        x: 50 + (plateSize + 30) * i,
        y: WORLD_HEIGHT / 2 - 100,
        index: i,
      });
    }
  }

  const pointInRect = (
    position: { x: number; y: number },
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    return (
      position.x > x &&
      position.x < x + width &&
      position.y > y &&
      position.y < y + height
    );
  };

  const getItemAt = (x: number, y: number): string | null => {
    for (const position of inventoriesPosition) {
      if (pointInRect({ x, y }, position.x, position.y, 80, 80)) {
        return gameState.inventories[position.index]?.code || null;
      }
    }
    return null;
  };

  const getToolAt = (x: number, y: number): string | null => {
    let index = -1;
    for (const position of toolsPosition) {
      if (
        pointInRect({ x, y }, position.x, position.y, toolSize.x, toolSize.y)
      ) {
        index = position.index;
      }
    }
    return gameState.tools[index]?.code || null;
  };

  const getPlateAt = (x: number, y: number): number | null => {
    for (const position of platesPosition) {
      if (pointInRect({ x, y }, position.x, position.y, 120, 120)) {
        return position.index;
      }
    }
    return null;
  };

  inputHandler.addEventListener("touchStart", () => {
    if (isVictoryModalShow) {
      return;
    }
    const touched = inputHandler.getTouchedWorldCoord();
    draggingPosition.setVector(inputHandler.getTouchedWorldCoord());
    currentItem = getItemAt(touched.x, touched.y);
  });

  inputHandler.addEventListener("touchMove", () => {
    if (isVictoryModalShow) {
      return;
    }

    if (currentItem !== null) {
      draggingPosition.setVector(inputHandler.getTouchedWorldCoord());
    }
  });

  const getCommodityAt = (x: number, y: number): number | null => {
    for (let i = 0; i < commodityPosition.length; i++) {
      if (
        pointInRect(
          { x, y },
          commodityPosition[i].x,
          commodityPosition[i].y,
          40,
          40
        )
      ) {
        return i;
      }
    }
    return null;
  };

  inputHandler.addEventListener("touchEnd", async () => {
    if (isVictoryModalShow) {
      if (pointInRect(inputHandler.getTouchedWorldCoord(), 50, 50, 100, 50)) {
        game.setScreen(await createMenuScreen(game, viewport));
      }
      return;
    }

    if (currentItem !== null) {
      const { x, y } = inputHandler.getTouchedWorldCoord();
      let toolId = getToolAt(x, y);
      if (toolId) {
        gameState.use(toolId, currentItem);
      } else {
        let plateId = getPlateAt(x, y);
        if (plateId != null) {
          gameState.putOnPlate(currentItem, plateId);
        } else currentItem = null;
      }
      currentItem = null;
    } else {
      const { x, y } = inputHandler.getTouchedWorldCoord();
      let plateId = getPlateAt(x, y);
      if (plateId != null) {
        gameState.clearPlate(plateId);
      }
      let commodityId = getCommodityAt(x, y);
      if (commodityId != null) {
        console.log(commodityId);
        gameState.buy(inventorieTypes[commodityId]);
      }
    }
  });

  return {
    dispose() {
      inputHandler.cleanup();
      eventEmitter.removeListener("endGame", () => {});
    },
    update(delta) {
      gameState.process(delta);
      batch.setProjection(camera.combined);
      batch.begin();

      // black panel
      batch.setColor(0.26, 0.53, 0.96, 1);
      batch.draw(whiteTexture, 0, 0, WORLD_WIDTH, WORLD_HEIGHT / 2);
      batch.setColor(0.3, 0.3, 0.3, 1);
      batch.draw(
        whiteTexture,
        0,
        WORLD_HEIGHT / 2,
        WORLD_WIDTH,
        WORLD_HEIGHT / 2
      );
      batch.setColor(1, 1, 1, 1);

      // draw orders
      batch.setColor(0.3, 0.3, 0.3, 1);

      textRenderer.draw(batch, "Orders", 0, 5, 20);
      for (let i = 0; i < gameState.currentOrders.length; i++) {
        batch.draw(
          whiteTexture,
          ordersPosition[i].x,
          ordersPosition[i].y,
          orderSize,
          50
        );
        textRenderer.draw(
          batch,
          gameState.currentOrders[i],
          ordersPosition[i].x - Dimension.WORLD_WIDTH / 2 + orderSize / 2,
          ordersPosition[i].y,
          15
        );
      }

      // draw slots
      batch.setColor(0.3, 0.3, 0.3, 1);
      for (let i = 0; i < inventoriesPosition.length; i++) {
        batch.draw(
          whiteTexture,
          inventoriesPosition[i].x,
          inventoriesPosition[i].y,
          inventorySize,
          50
        );
      }

      // draw inventories
      batch.setColor(0, 0, 0, 1);
      for (let i = 0; i < gameState.inventories.length; i++) {
        textRenderer.draw(
          batch,
          gameState.inventories[i].code,
          inventoriesPosition[i].x -
            Dimension.WORLD_WIDTH / 2 +
            inventorySize / 2,
          inventoriesPosition[i].y,
          15
        );
        textRenderer.draw(
          batch,
          `x${gameState.inventories[i].amount}`,
          inventoriesPosition[i].x -
            Dimension.WORLD_WIDTH / 2 +
            inventorySize / 2,
          inventoriesPosition[i].y + 30,
          15
        );
      }

      //draw plates
      batch.setColor(0.3, 0.3, 0.3, 1);
      for (let i = 0; i < platesPosition.length; i++) {
        batch.draw(
          whiteTexture,
          platesPosition[i].x,
          platesPosition[i].y,
          plateSize,
          50
        );
      }

      //draw inventory in plate
      for (let i = 0; i < gameState.plates.length; i++) {
        for (let y = 0; y < gameState.plates[i].length; y++) {
          textRenderer.draw(
            batch,
            gameState.plates[i][y],
            platesPosition[i].x - Dimension.WORLD_WIDTH / 2 + plateSize / 2,
            platesPosition[i].y + y * 15,
            15
          );
        }
      }

      batch.setColor(0.2, 0.2, 0.2, 1);
      // draw tools
      for (let i = 0; i < gameState.mapData.tools.length; i++) {
        batch.draw(
          whiteTexture,
          toolsPosition[i].x,
          toolsPosition[i].y,
          toolsPosition[i].size.x,
          toolsPosition[i].size.y
        );

        textRenderer.draw(
          batch,
          gameState.tools[i].code,
          toolsPosition[i].x -
            Dimension.WORLD_WIDTH / 2 +
            toolsPosition[i].size.x / 2,
          toolsPosition[i].y - 50,
          30
        );

        textRenderer.draw(
          batch,
          gameState.tools[i].itemCode.toString(),
          toolsPosition[i].x -
            Dimension.WORLD_WIDTH / 2 +
            +toolsPosition[i].size.x / 2,
          toolsPosition[i].y + toolsPosition[i].size.y / 3,
          30
        );

        textRenderer.draw(
          batch,
          gameState.tools[i].remainingActiveTime.toString(),
          toolsPosition[i].x -
            Dimension.WORLD_WIDTH / 2 +
            +toolsPosition[i].size.x / 2,
          toolsPosition[i].y + toolsPosition[i].size.y,
          30
        );
      }

      currentItem &&
        textRenderer.draw(
          batch,
          currentItem,
          draggingPosition.x - WORLD_WIDTH / 2,
          draggingPosition.y
        );

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

      if (isVictoryModalShow) {
        batch.setColor(0, 0, 0, 0.5);
        batch.draw(whiteTexture, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        batch.setColor(0.3, 0.3, 0.3, 1);
        batch.draw(whiteTexture, 50, 50, 100, 50);

        textRenderer.draw(
          batch,
          "Back",
          -Dimension.WORLD_WIDTH / 2 + 100,
          50,
          30
        );

        textRenderer.draw(batch, "Victory", 0, Dimension.WORLD_HEIGHT / 4, 80);

        textRenderer.draw(
          batch,
          `Total Time: ${gameState.totalTime.toFixed(2).toString()}`,
          0,
          Dimension.WORLD_HEIGHT / 4 + 100,
          30
        );
      } else {
        // draw totalTime
        batch.setColor(0, 0, 0, 1);

        batch.draw(
          whiteTexture,
          Dimension.WORLD_WIDTH / 2 - 40,
          Dimension.WORLD_HEIGHT / 2 - 20,
          80,
          40
        );
        textRenderer.draw(
          batch,
          gameState.totalTime.toFixed(2).toString(),
          0,
          Dimension.WORLD_HEIGHT / 2 - 20
        );
      }

      for (let i = 0; i < commodityPosition.length; i++) {
        batch.setColor(0, 0, 0, 1);
        batch.draw(
          whiteTexture,
          commodityPosition[i].x,
          commodityPosition[i].y,
          40,
          40
        );
        textRenderer.draw(
          batch,
          inventorieTypes[i],
          commodityPosition[i].x - WORLD_WIDTH / 2 + 20,
          commodityPosition[i].y,
          20
        );
      }

      for (let i = 0; i < currenciesTypes.length; i++) {
        batch.setColor(gemColor[i].r, gemColor[i].g, gemColor[i].b, 1);
        batch.draw(
          whiteTexture,
          currenciesPosition[i].x,
          currenciesPosition[i].y,
          40,
          40
        );
        textRenderer.draw(
          batch,
          gameState.currencies[i].amount.toString(),
          currenciesPosition[i].x - WORLD_WIDTH / 2 + 20,
          currenciesPosition[i].y,
          20
        );
      }

      batch.end();
    },
    init() {
      //Init first half
    },
  };
};

export default createGameScreen;
