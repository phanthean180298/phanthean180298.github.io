import {
  AlignMode,
  createGameLoop,
  createStage,
  createWhiteTexture,
  createViewportAwareInputHandler,
  loadFont,
  Vector2,
  drawLine,
  Game,
  Screen,
  SpriteBatch,
  Viewport,
} from "gdxjs";
import Dimension from "../constant/constant";
import GameState, { Cell, GRID_COL, GRID_ROW } from "../GameState";
import {
  loadInventory,
  loadMap,
  loadOrder,
  loadPlate,
  loadTool,
} from "../util/tiledmapUtils";

const WORLD_WIDTH = 600;
const WORLD_HEIGHT = 1000;

const plateSize = new Vector2(80, 80);
const toolSize = new Vector2(120, 120);
const inventorySlotSize = new Vector2(60, 60);
const gemColor = [
  { r: 1, g: 0, b: 0, a: 1 },
  { r: 0, g: 1, b: 0, a: 1 },
  { r: 0, g: 0, b: 1, a: 1 },
  { r: 0.98, g: 0.73, b: 0, a: 1 },
];

const createGameScreen = async (
  batch: SpriteBatch,
  game: Game<void>,
  viewport: Viewport
): Promise<Screen<void>> => {
  const stage = createStage();
  const canvas = stage.getCanvas();

  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  const whiteTexture = createWhiteTexture(gl);
  const gameState = new GameState();

  const font = await loadFont(gl, "assets/book-bold.fnt");
  const textRenderer = font.createRenderer(WORLD_WIDTH);
  textRenderer.setAlignMode(AlignMode.center);

  const inputHandler = createViewportAwareInputHandler(canvas, viewport);

  const mapData = await loadMap("./assets/maps/1.json");
  return {
    dispose() {
      inputHandler.cleanup();
    },
    init() {
      //Init first half
      for (const layer of mapData.layers) {
        switch (layer.name) {
          case "inventory":
            const inventorySlot = loadInventory(layer);
            break;
          case "order":
            const orderList = loadOrder(layer);
            break;
          case "tool":
            const toolList = loadTool(layer);
            break;
          case "plate":
            const plateSlot = loadPlate(layer);
            break;
          default:
            break;
        }
      }

      // Init second half
      const cellWidth = Dimension.BOARD_WIDTH / GRID_COL;
      const cellHeight = cellWidth / Dimension.CELL_RATIO;
      const boardOffset = new Vector2(
        25,
        (Dimension.WORLD_HEIGHT * 3) / 4 - (cellHeight * GRID_ROW) / 2
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

      let currentItem: string | null = null;
      const draggingPosition = new Vector2(0, 0);

      let inventoriesPosition: { x: number; y: number; index: number }[] = [];
      for (let i = 0; i < 6; i++) {
        inventoriesPosition.push({ x: 10 + i * 100, y: 50, index: i });
      }

      let toolsPosition: { x: number; y: number; index: number }[] = [];
      for (let i = 0; i < 2; i++) {
        toolsPosition.push({
          x: 160 + i * (toolSize.x + 50),
          y: WORLD_HEIGHT / 4 - 50,
          index: i,
        });
      }

      let platesPosition: { x: number; y: number; index: number }[] = [];
      for (let i = 0; i < 3; i++) {
        platesPosition.push({
          x: 80 + i * 160,
          y: (WORLD_HEIGHT - plateSize.y) / 2 - 100,
          index: i,
        });
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
            pointInRect(
              { x, y },
              position.x,
              position.y,
              toolSize.x,
              toolSize.y
            )
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
        const touched = inputHandler.getTouchedWorldCoord();
        draggingPosition.setVector(inputHandler.getTouchedWorldCoord());
        currentItem = getItemAt(touched.x, touched.y);
      });

      inputHandler.addEventListener("touchMove", () => {
        if (currentItem !== null) {
          draggingPosition.setVector(inputHandler.getTouchedWorldCoord());
        }
      });

      inputHandler.addEventListener("touchEnd", () => {
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
        }
      });

      createGameLoop((delta: any) => {
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

        // draw slots
        batch.setColor(0.3, 0.3, 0.3, 1);
        for (let i = 0; i < inventoriesPosition.length; i++) {
          batch.draw(
            whiteTexture,
            inventoriesPosition[i].x,
            inventoriesPosition[i].y,
            inventorySlotSize.x,
            inventorySlotSize.y
          );
        }

        // draw inventories
        batch.setColor(0, 0, 0, 1);
        for (let i = 0; i < gameState.inventories.length; i++) {
          textRenderer.draw(
            batch,
            gameState.inventories[i].code,
            i * 100 - WORLD_WIDTH / 2 + 40,
            50,
            15
          );
          textRenderer.draw(
            batch,
            `x${gameState.inventories[i].amount}`,
            i * 100 - WORLD_WIDTH / 2 + 40,
            80,
            20
          );
        }

        //draw plates
        batch.setColor(0.3, 0.3, 0.3, 1);
        for (let i = 0; i < 3; i++) {
          batch.draw(
            whiteTexture,
            80 + i * 160,
            (WORLD_HEIGHT - plateSize.y) / 2 - 100,
            plateSize.x,
            plateSize.y
          );
        }

        //draw inventory in plate
        for (let i = 0; i < gameState.plates.length; i++) {
          for (let y = 0; y < gameState.plates[i].length; y++) {
            textRenderer.draw(
              batch,
              gameState.plates[i][y],
              i * 160 - WORLD_WIDTH / 2 + 120,
              (WORLD_HEIGHT - plateSize.y) / 2 - 100 + y * 30,
              20
            );
          }
        }

        batch.setColor(0.2, 0.2, 0.2, 1);
        // draw tools
        for (let i = 0; i < gameState.tools.length; i++) {
          batch.draw(
            whiteTexture,
            toolsPosition[i].x,
            toolsPosition[i].y,
            toolSize.x,
            toolSize.y
          );

          textRenderer.draw(
            batch,
            gameState.tools[i].code,
            i * (toolSize.x + 50) - 80,
            WORLD_HEIGHT / 4 - 100
          );

          textRenderer.draw(
            batch,
            gameState.tools[i].itemCode.toString(),
            i * (toolSize.x + 50) - 80,
            WORLD_HEIGHT / 4 - 20
          );

          textRenderer.draw(
            batch,
            gameState.tools[i].remainingActiveTime.toString(),
            i * (toolSize.x + 50) - 80,
            WORLD_HEIGHT / 4 + 60
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

        batch.end();
      });
    },
  };
};

export default createGameScreen;
