import { getFs } from "./fsUtil";
import * as path from "path-browserify";

export const data: any = {
  formula: ["items.txt", "tools.txt"],
  maps: ["1.json", "2.json", "3.json", "4.json", "5.json"],
};

const ensureDir = async (fs: any, url: string) => {
  const dirname: string = path.dirname(url);

  if (await fs.exists(dirname)) {
    return true;
  }
  ensureDir(fs, dirname);
  await fs.mkdir(dirname);
};

interface File {
  key: string;
  name: string;
  level: number;
  parent: string;
  data: any;
  url: string;
}

class DataHelper {
  data: File[] = [];
  async getData() {
    const fs = await getFs();

    const _folderTree: File[] = [];
    const exists = await fs.exists("data");
    if (!exists) {
      fs.mkdir("data");
      fs.mkdir("data/maps");
      fs.mkdir("data/formula");
    }
    const dataChildren = await fs.readdir("data");
    if (!dataChildren || !dataChildren.length) {
      return;
    }
    for (const child of dataChildren) {
      _folderTree.push({
        name: child,
        level: 1,
        parent: "data",
        data: "",
        key: child,
        url: `data/${child}`,
      });
      for (const ele of data[child]) {
        if (ele.endsWith(".txt")) {
          const data = await this.getTxt(`data/${child}/${ele}`, fs);
          if (data) {
            _folderTree.push({
              name: ele,
              level: 2,
              parent: child,
              data,
              key: ele,
              url: `data/${child}/${ele}`,
            });
          }
        } else if (ele.endsWith(".json")) {
          const data = await this.getJson(`data/${child}/${ele}`, fs);
          if (data) {
            _folderTree.push({
              name: ele,
              level: 2,
              parent: child,
              data: JSON.stringify(data, null, 2),
              key: ele,
              url: `data/${child}/${ele}`,
            });
          }
        }
      }
    }
    this.data = _folderTree;
    console.log(_folderTree, dataChildren);
    return _folderTree;
  }

  async clear(url: string) {
    const fs = await getFs();
    await fs.unlink(url);
  }

  async getTxt(url: string, fsParam: any): Promise<string | null> {
    let fs = fsParam;
    if (!fs) {
      fs = await getFs();
    }
    if (process.env.NODE_ENV === "production") {
      return fetch(url).then((res) => res.text());
    }
    // const fs = await getFs();
    const exists = await fs.exists(url);
    if (exists) {
      return await fs.readFile(url).then((data: any) => data.toString());
    }
    const data = await fetch(url).then((res) => res.text());
    await ensureDir(fs, url);

    await fs.writeFile(url, data);
    return data;
  }

  async getJson(url: string, fsParam: any): Promise<string | null> {
    let fs = fsParam;
    if (!fs) {
      fs = await getFs();
    }

    if (process.env.NODE_ENV === "production") {
      return fetch(url).then((res) => res.json());
    }
    const exists = await fs.exists(url);
    if (exists) {
      return await fs
        .readFile(url)
        .then((data: any) => JSON.parse(data.toString()));
    }
    const res = await fetch(url);
    const _data = await res.json();
    await ensureDir(fs, url);

    await fs.writeFile(url, JSON.stringify(_data));
    return _data;
  }

  async saveFile(url: string, content: any): Promise<any> {
    const fs = await getFs();
    await fs.writeFile(url, content);
  }
}

export const dataHelper = new DataHelper();
