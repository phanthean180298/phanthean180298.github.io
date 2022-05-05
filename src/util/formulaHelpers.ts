import _ from "lodash";

const TOOL_FORMULA_DATA = `beef * 1 + chop * 1.5 = groundedBeef
beef + stove * 2 = searedBeef
groundedBeef + stove * 2 = meatball
potato + chop * 1.5 = slicedPotato
potato + stove * 2 = bakedPotato
slicedPotato + stove * 2 = potatoChip
bakedPotato + chop * 1.5 = mashedPotato`;

const ITEM_FORMULA_DATA = `searedBeef + mashedPotato = steak
lettuce + mashedPotato = salad`;

interface ToolFormula {
  itemCode: String;
  toolCode: String;
  itemAmount: Number;
  requireTime: Number;
  outputItemCodes: String[];
}

interface ItemFormula {
  itemCodes: String[];
  outputItemCode: String;
}

class ToolFormulaHelper {
  formulas: ToolFormula[] = [];

  constructor() {
    const formulaData = TOOL_FORMULA_DATA.replaceAll(" ", "");
    const formulaLines = formulaData.split("\n");
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
    const itemFormulaData = ITEM_FORMULA_DATA.replaceAll(" ", "");
    const itemFormulaLines = itemFormulaData.split("\n");
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

  search(...itemCodes: string[]) {
    for (const formula of this.itemFormulas) {
      if (_.isEmpty(_.xor(itemCodes, formula.itemCodes))) return formula;
    }
    return null;
  }
}

export const toolFormulaHelper = new ToolFormulaHelper();
export const itemFormulaHelper = new ItemFormulaHelper();
