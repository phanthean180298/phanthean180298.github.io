import { data, dataHelper } from "./dataHelper";

const TOOL_FORMULA_DATA = `beef * 1 + chop * 1.5 = groundedBeef
beef + stove * 2 = searedBeef
groundedBeef + stove * 2 = meatball
potato + chop * 1.5 = slicedPotato
potato + stove * 2 = bakedPotato
slicedPotato + stove * 2 = potatoChip
bakedPotato + chop * 1.5 = mashedPotato`;

const ITEM_FORMULA_DATA = `searedBeef + mashedPotato = steak
lettuce + mashedPotato = salad
potato + beef = curry`;

const inputArray: string[] = [];
const checkFormulaFulfill = (input: string[], required: string[]): boolean => {
  if (input.length !== required.length) return false;
  inputArray.length = 0;
  for (let code of input) {
    inputArray.push(code);
  }

  for (let code of required) {
    const index = inputArray.indexOf(code);
    if (index === -1) return false;
    inputArray.splice(index, 1);
  }

  return true;
};

interface ToolFormula {
  itemCode: string;
  toolCode: string;
  itemAmount: number;
  requireTime: number;
  outputItemCodes: string[];
}

interface ItemFormula {
  itemCodes: string[];
  outputItemCode: string;
}

class ToolFormulaHelper {
  formulas: ToolFormula[] = [];

  constructor() {
    const formulaLines = TOOL_FORMULA_DATA.replaceAll(" ", "").split("\n");
    for (const line of formulaLines) {
      const sides = line.split("=");
      if (sides.length < 2) continue;

      const parts = sides[0].split("+");
      if (parts.length < 2) continue;

      const ingredientFragments = parts[0].split("*");
      const itemCode = ingredientFragments[0] as string;
      const itemAmount: number =
        ingredientFragments.length > 1 ? parseInt(ingredientFragments[1]) : 1;

      const toolFragments = parts[1].split("*");
      if (toolFragments.length < 2) continue;

      const toolCode = toolFragments[0];
      const requireTime = parseFloat(toolFragments[1]);

      const outputItemCodes = sides[1].split("+");

      this.formulas.push({
        itemCode,
        itemAmount,
        outputItemCodes,
        requireTime,
        toolCode,
      });
    }
  }

  async loadFormula() {
    const data = await dataHelper.getTxt("data/formula/tools.txt", null);
    if (!data) {
      return;
    }
    const formulaLines = data.replaceAll(" ", "").split("\n");
    this.formulas.length = 0;

    for (const line of formulaLines) {
      const sides = line.split("=");
      if (sides.length < 2) continue;

      const parts = sides[0].split("+");
      if (parts.length < 2) continue;

      const ingredientFragments = parts[0].split("*");
      const itemCode = ingredientFragments[0] as string;
      const itemAmount: number =
        ingredientFragments.length > 1 ? parseInt(ingredientFragments[1]) : 1;

      const toolFragments = parts[1].split("*");
      if (toolFragments.length < 2) continue;

      const toolCode = toolFragments[0];
      const requireTime = parseFloat(toolFragments[1]);

      const outputItemCodes = sides[1].split("+");

      this.formulas.push({
        itemCode,
        itemAmount,
        outputItemCodes,
        requireTime,
        toolCode,
      });
    }
  }

  search(itemCode: string, toolCode: string) {
    return this.formulas.find(
      (toolFormula) =>
        toolFormula.toolCode === toolCode && toolFormula.itemCode === itemCode
    );
  }
}

class ItemFormulaHelper {
  itemFormulas: ItemFormula[] = [];

  constructor() {
    const itemFormulaLines = ITEM_FORMULA_DATA.replaceAll(" ", "").split("\n");
    for (const line of itemFormulaLines) {
      const sides = line.split("=");
      if (sides.length < 2) continue;
      const outputItemCode = sides[1];
      const itemCodes = sides[0].split("+");
      if (itemCodes.length < 2) continue;
      this.itemFormulas.push({
        itemCodes,
        outputItemCode,
      });
    }
  }

  async loadFormula() {
    const data = await dataHelper.getTxt("data/formula/items.txt", null);
    if (!data) {
      return;
    }
    this.itemFormulas.length = 0;
    const itemFormulaLines = data.replaceAll(" ", "").split("\n");
    for (const line of itemFormulaLines) {
      const sides = line.split("=");
      if (sides.length < 2) continue;
      const outputItemCode = sides[1];
      const itemCodes = sides[0].split("+");
      if (itemCodes.length < 2) continue;
      this.itemFormulas.push({
        itemCodes,
        outputItemCode,
      });
      console.log("222", this.itemFormulas);
    }
  }

  search(...itemCodes: string[]) {
    for (const formula of this.itemFormulas) {
      if (checkFormulaFulfill(itemCodes, formula.itemCodes)) return formula;
    }
    return null;
  }

  searchAvailableFormula(...itemCodes: string[]) {
    for (const formula of this.itemFormulas) {
      if (itemCodes.every((val) => formula.itemCodes.includes(val)))
        return true;
    }
    return false;
  }
}

export const toolFormulaHelper = new ToolFormulaHelper();
export const itemFormulaHelper = new ItemFormulaHelper();
