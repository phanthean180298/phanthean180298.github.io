import {
  createBatch,
  createGameLoop,
  createStage,
  createViewport,
  createWhiteTexture,
  loadFont,
  Vector2
} from "gdxjs";
import GameState from "./GameState";
import { BaseObject } from "./ui/baseObject";

const WORLD_WIDTH = 600;
const WORLD_HEIGHT = 1000;
const INVENTORY_SLOT = 6;

const ingredientSize = new Vector2(100, 100);
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

  let promise = loadFont(gl, "./assets/book-bold.fnt");
  promise.then(font => {
    console.log(font);
  });

  // Slot
  let inventorySlots: BaseObject[] = [];
  for(let i = 0; i < INVENTORY_SLOT; i++)
  {
    let slot = new BaseObject(gl);
    slot.setSize(inventorySlotSize);
    slot.setPosition(new Vector2(35 + i * (inventorySlotSize.x + 10), 500));
    inventorySlots.push(slot);
  }

  createGameLoop((delta: any) => {
    gameState.process(delta);
    batch.setProjection(camera.combined);
    batch.begin();
    
    // blacl panel
    batch.setColor(0, 0, 0, 1);
    batch.draw(whiteTexture, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    batch.setColor(1,1,1,1);
    
    // draw objs
    for(let i = 0; i < inventorySlots.length; i++)
    {
      inventorySlots[i].draw(batch);
    }

    batch.end();
  });
};

init();
