import { itemFormulaHelper, toolFormulaHelper } from "./util/formulaHelpers";

const tools = ["chop", "stove"];
const inventorieTypes = ["stove", "beef"];

export const GRID_ROW = 5;
export const GRID_COL = 5;
export const TOTAL_GEM_COLOR = 4;

interface Tool {
  itemCode: string;
  code: string;
  remainingActiveTime: number;
}

export interface Cell {
  color: number;
}

class GameState {
  tools: Tool[] = [];

  cells: Cell[] = [];
  random: any;

  inventories: { code: string; amount: number }[] = [];
  plates: string[][] = [];

  constructor() {
    this.tools = tools.map((tool) => ({
      itemCode: "",
      code: tool,
      remainingActiveTime: 0,
    }));
    this.plates = [[], [], []];
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

  setRandomGem = (x: number, y: number) => {
    const cell = this.getCell(x, y);
    const newCell = this.getRandomGem();
    cell.color = newCell.color;
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

  grant(code: string) {
    if (!this.inventories.find((i) => i.code === code)) {
      this.inventories.push({ code, amount: 1 });
    } else {
      this.inventories = this.inventories.map((i) => {
        if (i.code === code) {
          i.amount++;
        }
        return i;
      });
    }
  }

  clearPlate(plateIndex: number) {
    if (this.plates[plateIndex].length === 0) return;
    for (const item of this.plates[plateIndex]) {
      this.grant(item);
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
