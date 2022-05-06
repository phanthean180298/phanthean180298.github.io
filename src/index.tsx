import {
  AlignMode,
  createBatch,
  createGameLoop,
  createStage,
  createViewport,
  createWhiteTexture,
  createViewportAwareInputHandler,
  loadFont,
  Vector2
} from "gdxjs";
import GameState from "./GameState";

const WORLD_WIDTH = 600;
const WORLD_HEIGHT = 1000;

const plateSize = new Vector2(120, 120);
const toolSize = new Vector2(200, 200);
const inventorySlotSize = new Vector2(80, 80);

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();
  const viewport = createViewport(canvas, WORLD_WIDTH, WORLD_HEIGHT);

  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  const whiteTexture = createWhiteTexture(gl);

  const batch = createBatch(gl);
  const gameState = new GameState();

  const font = await loadFont(gl, "assets/book-bold.fnt");
  const textRenderer = font.createRenderer(WORLD_WIDTH)
  textRenderer.setAlignMode(AlignMode.center)

  let currentItem: string | null = null;
  const draggingPosition = new Vector2(0, 0);

  let inventoriesPosition: { x: number, y: number, index: number }[] = [];
  for (let i = 0; i < 6; i++) {
    inventoriesPosition.push({ x: 10 + i * 100, y: 100, index: i })
  }

  let toolsPosition: { x: number, y: number, index: number }[] = [];
  for (let i = 0; i < 2; i++) {
    toolsPosition.push({ x: 75 + i * (toolSize.x + 50), y: WORLD_HEIGHT / 2, index: i })
  }


  let platesPosition: { x: number, y: number, index: number }[] = [];
  for (let i = 0; i < 3; i++) {
    platesPosition.push({ x: 80 + i * 160, y: WORLD_HEIGHT - plateSize.y - 50, index: i })
  }

  const pointInRect = (position: { x: number, y: number }, x: number, y: number, width: number, height: number) => {
    return position.x > x && position.x < x + width && position.y > y && position.y < y + height
  }

  const getItemAt = (x: number, y: number): string | null => {
    let index = -1;
    for (const position of inventoriesPosition) {
      if (pointInRect({ x, y }, position.x, position.y, 80, 80)) { index = position.index }
    }
    return gameState.inventories[index]?.code
  }

  const getToolAt = (x: number, y: number): string | null => {
    let index = -1;
    for (const position of toolsPosition) {
      if (pointInRect({ x, y }, position.x, position.y, 200, 200)) { index = position.index }
    }
    return gameState.tools[index]?.code || null
  }

  const getPlateAt = (x: number, y: number): number | null => {
    let index = -1;
    for (const position of platesPosition) {
      if (pointInRect({ x, y }, position.x, position.y, 120, 120)) { index = position.index }
    }

    return index || null
  }


  const inputHandler = createViewportAwareInputHandler(canvas, viewport);
  inputHandler.addEventListener('touchStart', () => {
    const touched = inputHandler.getTouchedWorldCoord();
    draggingPosition.setVector(inputHandler.getTouchedWorldCoord());
    currentItem = getItemAt(touched.x, touched.y);
  });

  inputHandler.addEventListener('touchMove', () => {
    if (currentItem !== null) {
      draggingPosition.setVector(inputHandler.getTouchedWorldCoord());
    }
  });

  inputHandler.addEventListener('touchEnd', () => {
    if (currentItem !== null) {
      const { x, y } = inputHandler.getTouchedWorldCoord();
      let toolId = getToolAt(x, y);
      if (toolId) {
        gameState.use(toolId, currentItem);
      } else {
        let plateId = getPlateAt(x, y);
        console.log(plateId)
        if (plateId != null) {
          gameState.putOnPlate(currentItem, plateId)
        }
      }

      currentItem = null;
    }
  });



  createGameLoop((delta: any) => {
    gameState.process(delta);
    batch.setProjection(camera.combined);
    batch.begin();

    // black panel
    batch.setColor(0.26, 0.53, 0.96, 1);
    batch.draw(whiteTexture, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    batch.setColor(0, 0, 0, 1);

    // draw slots
    batch.setColor(0.3, 0.3, 0.3, 1);
    for (let i = 0; i < 6; i++) {
      batch.draw(whiteTexture, 10 + i * 100, 100, inventorySlotSize.x, inventorySlotSize.y);
    }

    //draw inventories
    batch.setColor(0, 0, 0, 1);
    for (let i = 0; i < gameState.inventories.length; i++) {
      textRenderer.draw(batch, gameState.inventories[i].code, i * 110 - WORLD_WIDTH / 2 + 40, 100, 20);
      textRenderer.draw(batch, `x${gameState.inventories[i].amount}`, i * 110 - WORLD_WIDTH / 2 + 40, 130, 20);
    }

    //draw plates
    batch.setColor(0.3, 0.3, 0.3, 1);
    for (let i = 0; i < 3; i++) {
      batch.draw(whiteTexture, 80 + i * 160, WORLD_HEIGHT - plateSize.y - 50, plateSize.x, plateSize.y);
    }

    //draw inventory in plate
    for (let i = 0; i < gameState.plates.length; i++) {
      for (let y = 0; y < gameState.plates[i].length; y++) {
        textRenderer.draw(batch, gameState.plates[i][y], i * 160 - WORLD_WIDTH / 2 + 140, WORLD_HEIGHT - plateSize.y - 50 + y * 30, 20);
      }
    }


    batch.setColor(0.2, 0.2, 0.2, 1);
    // draw tools
    for (let i = 0; i < gameState.tools.length; i++) {
      batch.draw(whiteTexture, 75 + i * (toolSize.x + 50), WORLD_HEIGHT / 2, toolSize.x, toolSize.y);
      textRenderer.draw(batch, gameState.tools[i].code, i * (toolSize.x + 50) - 120, WORLD_HEIGHT / 2 - 80);
      textRenderer.draw(batch, gameState.tools[i].remainingActiveTime.toString(), i * (toolSize.x + 50) - 120, WORLD_HEIGHT / 2 + 200)
    }

    currentItem && textRenderer.draw(batch, currentItem, draggingPosition.x - WORLD_WIDTH / 2, draggingPosition.y)

    batch.end();
  });
};

init();
