import { toolFormulaHelper } from "./util/formulaHelpers";

const tools = ["chop", "stove"];
const items = ["beef", "potato"];
const discsAmount = 3;
const inventoriesAmount = 4;

interface Tool {
  itemCode: String;
  code: String;
  remainingActiveTime: Number;
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

  grant = (code: string) => {};

  process = (delta: number) => {
    this.tools = this.tools.map((tool) => {
      if (tool.remainingActiveTime < delta) {
        tool.remainingActiveTime = 0;
        grant;
      }
      return tool;
    });
  };

  use = (toolCode: string, itemCode: string) => {
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
  };
}
export default GameState;
