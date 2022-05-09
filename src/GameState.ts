import { itemFormulaHelper, toolFormulaHelper } from "./util/formulaHelpers";

const tools = ["chop", "stove"];
const inventorieTypes = ["stove", "beef"];

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
