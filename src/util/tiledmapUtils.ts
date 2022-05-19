import { Vector2 } from "gdxjs";
import { dataHelper } from "./dataHelper";

export const loadMap = async (jsonFile: string) => {
  const data = dataHelper.getJson(`data/maps/${jsonFile}.json`, null);
  if (!!data) {
    return data;
  }
  const mapData = await fetch(jsonFile).then((res) => res.json());
  return mapData;
};

export const loadInventory = (layerData: any): number => {
  if (layerData.objects.length === 0) return 0;
  for (const element of layerData.properties) {
    if (element.name === "slot") {
      return element.value;
    }
  }
  return 0;
};

export const loadOrder = (layerData: any): string[] => {
  let returnList: string[] = [];
  if (layerData.properties.length === 0) return returnList;
  for (const property of layerData.properties) {
    if (property.name === "order_list") {
      const value = property.value.trim().replaceAll(" ", "");
      return value.split(/[,.]/);
    }
  }
  return returnList;
};

export interface ToolData {
  pos: Vector2;
  size: Vector2;
  type: string;
}
export const loadTool = (layerData: any): ToolData[] => {
  if (layerData.objects.length === 0) return [];
  let returnList: ToolData[] = [];
  for (const obj of layerData.objects) {
    returnList.push({
      pos: new Vector2(obj.x, obj.y),
      size: new Vector2(obj.width, obj.height),
      type: obj.type,
    });
  }
  return returnList;
};

export const loadPlate = (layerData: any): number => {
  return loadInventory(layerData);
};
