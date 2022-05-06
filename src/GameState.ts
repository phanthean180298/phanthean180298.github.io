import { toolFormulaHelper } from "./util/formulaHelpers";

const tools = ["chop", "stove"];
const items = ["beef", "potato"];
const discsAmount = 3;
const inventoriesAmount = 4;

interface Tool {
  itemCode: string;
  code: string;
  remainingActiveTime: number;
}

class GameState {
  tools: Tool[] = [];

  inventories: { code: String; amount: Number }[] = [];

  discs: String[] = [];

  constructor() {
    this.tools = tools.map((tool) => ({
      itemCode: "",
      code: tool,
      remainingActiveTime: 0,
    }));
  }

  grant(code: string) {
    if (!this.inventories.find((i) => i.code === code)) {
      this.inventories.push({ code, amount: 1 });
    }
  }

  process(delta: number) {
    this.tools = this.tools.map((tool) => {
      if (tool.remainingActiveTime < delta) {
        tool.remainingActiveTime = 0;
        tool.itemCode = "";
        const formula = toolFormulaHelper.search(tool.itemCode, tool.code);
        if (!!formula) {
          formula.outputItemCodes.map((code) => this.grant(code));
        }
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
    this.tools = [
      ...this.tools,
      {
        ...tool,
        itemCode: itemCode,
        remainingActiveTime: formula.requireTime,
      },
    ];
  }
}
export default GameState;
