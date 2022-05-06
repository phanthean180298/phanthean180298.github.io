import { itemFormulaHelper, toolFormulaHelper } from "./util/formulaHelpers";

const tools = ["chop", "stove"];
const items = ["beef", "potato"];

interface Tool {
  itemCode: string;
  code: string;
  remainingActiveTime: number;
}

class GameState {
  tools: Tool[] = [];

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
  }

  reset() {
    this.inventories = [];
    this.tools = tools.map((tool) => ({
      itemCode: "",
      code: tool,
      remainingActiveTime: 0,
    }));
    this.plates = [];
  }

  ungrant(itemCode: string) {
    this.inventories = this.inventories.map((i) => {
      if (i.code === itemCode) {
        i.amount--;
      }
      return i;
    });
    this.inventories = this.inventories.filter((i) => i.amount > 0);
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

  putOnPlate(itemCode: string, plateIndex: number) {
    const _items = [...this.plates[plateIndex], itemCode];
    const formula = itemFormulaHelper.search(..._items);
    if (!formula) {
      // if don't have any formula, return
      if (!itemFormulaHelper.searchAvailableFormula(..._items)) {
        return;
      } else {
        // put on plate
        this.ungrant(itemCode);
        this.plates[plateIndex].push(itemCode);
      }
    } else {
      // put on plate, process to new inventory, and return to inventories
      this.plates[plateIndex].length = 0;
      this.grant(formula.outputItemCode);
      this.ungrant(itemCode);
    }
  }

  process(delta: number) {
    this.tools = this.tools.map((tool) => {
      if (tool.remainingActiveTime === 0) return tool;

      if (tool.remainingActiveTime - delta <= 0) {
        tool.remainingActiveTime = 0;
        const formula = toolFormulaHelper.search(tool.itemCode, tool.code);
        console.log(formula);
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
    this.ungrant(itemCode);
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
