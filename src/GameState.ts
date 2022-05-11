import { Vector2 } from "gdxjs";
import eventEmitter from "./util/eventEmitter";
import { itemFormulaHelper, toolFormulaHelper } from "./util/formulaHelpers";
import { ToolData } from "./util/tiledmapUtils";

const tools = ["chop", "stove"];
const inventorieTypes = ["potato", "beef", "lettuce"];

export const GRID_ROW = 5;
export const GRID_COL = 5;
export const TOTAL_GEM_COLOR = 4;
export const DROP_ANIMATION_TIME = 0.2;

interface Tool {
  itemCode: string;
  code: string;
  remainingActiveTime: number;
}

export interface Cell {
  color: number;
}

export const initialMapData = {
  orders: [],
  inventorySlotAmount: 0,
  tools: [],
  plateSlotAmount: 0,
};

export interface MapData {
  orders: string[];
  inventorySlotAmount: number;
  tools: ToolData[];
  plateSlotAmount: number;
}
class GameState {
  tools: Tool[] = [];
  screen: string = "Title";
  cells: Cell[] = [];
  random: any;
  isProcessing = false;

  inventories: { code: string; amount: number }[] = [];

  plates: string[][] = [];

  currentOrders: string[] = [];

  totalTime: number = 0;

  mapData: MapData = {
    orders: [],
    inventorySlotAmount: 0,
    tools: [],
    plateSlotAmount: 0,
  };

  constructor() {
    this.tools = tools.map((tool) => ({
      itemCode: "",
      code: tool,
      remainingActiveTime: 0,
    }));
    this.plates = [];
    this.inventories = [
      { code: "beef", amount: 1 },
      { code: "potato", amount: 2 },
    ];

    this.initBoard();
  }

  initBoard() {
    for (let x = 0; x < GRID_COL; x++) {
      for (let y = 0; y < GRID_ROW; y++) {
        this.cells[y * GRID_COL + x] = this.getRandomGem();
      }
    }
  }

  getCell = (x: number, y: number): Cell => {
    return this.cells[y * GRID_COL + x];
  };

  getCol = (x: number) => {
    const colData: Cell[] = [];
    colData.length = 0;
    for (let i = 0; i < GRID_ROW; i++) {
      colData.push(this.getCell(x, i));
    }
    return colData;
  };

  setRandomGem = (x: number, y: number) => {
    this.setState(x, y, this.getRandomGem());
  };

  shuffleBoard = () => {
    for (let i = this.cells.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [this.cells[i], this.cells[j]] = [this.cells[j], this.cells[i]];
    }
  };

  randomInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min));
  }

  getRandomGem() {
    return {
      color: this.randomInt(0, TOTAL_GEM_COLOR),
    };
  }

  setState = (x: number, y: number, data: Cell) => {
    const cell = this.getCell(x, y);
    this.setCellState(cell, data);
  };

  setCellState = (target: Cell, data: Cell) => {
    target.color = data.color;
  };

  setMapData = (mapData: MapData) => {
    this.mapData = mapData;
    this.currentOrders = mapData.orders;
    for (let i = 0; i < this.mapData.plateSlotAmount; i++) {
      this.plates.push([]);
    }
  };

  async processPath(path: Vector2[]) {
    if (this.isProcessing || !this.isValidPath(this, path)) {
      return false;
    }

    this.isProcessing = true;
    const _cell = this.getCell(path[0].x, path[0].y);
    if (_cell.color < 3) {
      this.grant(inventorieTypes[_cell.color], path.length);
      this.totalTime += 5;
    }

    for (const node of path) {
      const cell = this.getCell(node.x, node.y);
      cell.color = -1;
    }

    await this.fill();
    this.isProcessing = false;
  }

  fill = async () => {
    const dropAmounts: number[] = [];
    // let fillHappened = false;

    // cells filling
    for (let x = 0; x < GRID_COL; x++) {
      dropAmounts.length = 0;
      for (let i = 0; i < GRID_ROW; i++) {
        dropAmounts[i] = 0;
      }
      const colData = this.getCol(x);
      let toFill = 0;
      for (let i = colData.length - 1; i >= 0; i--) {
        if (colData[i].color < 0) {
          toFill++;
          for (let y = i - 1; y >= 0; y--) {
            dropAmounts[y]++;
          }
        }
      }
      for (let y = colData.length - 1; y >= 0; y--) {
        if (colData[y].color < 0) {
          continue;
        }
        const dropAmount = dropAmounts[y];
        if (dropAmount > 0) {
          const newY = y + dropAmount;
          const oldCell = this.getCell(x, y);

          this.setState(x, newY, oldCell);
          this.setState(x, y, {
            color: -1,
          });
        }
      }
      // if (toFill > 0) fillHappened = true;
      for (let y = 0; y < toFill; y++) {
        this.setRandomGem(x, y);
      }
    }
  };

  isValidPath = (gameState: GameState, path: Vector2[]) => {
    if (path.length < 3) return false;

    let lastNode!: Vector2;
    for (let i = 0; i < path.length; i++) {
      const node = path[i];

      // check valid cell
      if (node.x < 0 || node.x >= GRID_COL || node.y < 0 || node.y >= GRID_ROW)
        return false;

      // Check same color
      if (lastNode) {
        if (
          gameState.getCell(lastNode.x, lastNode.y).color !==
          gameState.getCell(node.x, node.y).color
        ) {
          return false;
        }

        if (!this.areAdjacentCells(node, lastNode)) {
          return false;
        }
      } else {
        lastNode = new Vector2(0, 0);
      }
      lastNode.set(node.x, node.y);
    }

    return true;
  };

  areAdjacentCells = (cell1: Vector2, cell2: Vector2) => {
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        const x = cell1.x + j;
        const y = cell1.y + i;
        if (
          x < 0 ||
          x > GRID_COL - 1 ||
          y < 0 ||
          y > GRID_ROW - 1 ||
          x !== cell2.x ||
          y !== cell2.y
        ) {
          continue;
        }
        return true;
      }
    }

    return false;
  };

  reset() {
    this.inventories = [];
    this.tools = tools.map((tool) => ({
      itemCode: "",
      code: tool,
      remainingActiveTime: 0,
    }));
    this.plates = [];

    this.shuffleBoard();
  }

  ungrant(itemCode: string) {
    if (!this.inventories.find((i) => i.code === itemCode)) {
      return false;
    }
    this.inventories = this.inventories.map((i) => {
      if (i.code === itemCode) {
        i.amount--;
      }
      return i;
    });
    this.inventories = this.inventories.filter((i) => i.amount > 0);
    return true;
  }

  grant(code: string, amount?: number) {
    if (!this.inventories.find((i) => i.code === code)) {
      if (this.inventories.length >= this.mapData.inventorySlotAmount) {
        return;
      }
      amount
        ? this.inventories.push({ code, amount })
        : this.inventories.push({ code, amount: 1 });
    } else {
      this.inventories = this.inventories.map((i) => {
        if (i.code === code) {
          amount ? (i.amount += amount) : i.amount++;
        }
        return i;
      });
    }
  }

  clearPlate(plateIndex: number) {
    if (this.plates[plateIndex].length === 0) return;
    for (const item of this.plates[plateIndex]) {
      if (this.currentOrders.includes(item)) {
        this.currentOrders = this.currentOrders.filter(
          (order) => order !== item
        );
        if (this.currentOrders.length === 0) {
          eventEmitter.emit("endGame");
        }
      } else {
        this.grant(item);
      }
    }
    this.plates[plateIndex].length = 0;
  }

  putOnPlate(itemCode: string, plateIndex: number) {
    const availableItem = this.ungrant(itemCode);
    if (!availableItem) {
      return;
    }
    this.plates[plateIndex].push(itemCode);

    let formula = itemFormulaHelper.search(...this.plates[plateIndex]);

    if (formula) {
      this.plates[plateIndex] = [formula.outputItemCode];
    }
  }

  process(delta: number) {
    this.totalTime += delta;
    this.tools = this.tools.map((tool) => {
      if (tool.remainingActiveTime === 0) return tool;

      if (tool.remainingActiveTime - delta <= 0) {
        tool.remainingActiveTime = 0;

        const formula = toolFormulaHelper.search(tool.itemCode, tool.code);
        if (!!formula) {
          formula.outputItemCodes.map((code) => this.grant(code));
        }
        tool.itemCode = "";
      } else {
        tool.remainingActiveTime = parseFloat(
          (tool.remainingActiveTime - delta).toFixed(2)
        );
      }
      return tool;
    });
  }

  use(toolCode: string, itemCode: string) {
    const tool: Tool | null =
      this.tools.find((tool) => tool.code === toolCode) || null;
    if (!tool || tool.remainingActiveTime !== 0) return;

    const formula = toolFormulaHelper.search(itemCode, toolCode);
    if (!formula) return;

    // push from inventories to tool
    const itemAvaiable = this.ungrant(itemCode);
    if (!itemAvaiable) {
      return;
    }

    this.tools = this.tools.map((t) => {
      if (t.code === tool.code) {
        return {
          ...tool,
          itemCode: itemCode,
          remainingActiveTime: formula.requireTime,
        };
      }
      return t;
    });
  }
}
export default GameState;
