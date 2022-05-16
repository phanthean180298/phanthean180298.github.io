import { getFs } from "./fsUtil";
import * as path from "path-browserify";

const ensureDir = async (fs: any, url: string) => {
  const dirname: string = path.dirname(url);

  if (await fs.exists(dirname)) {
    return true;
  }
  ensureDir(fs, dirname);
  await fs.mkdir(dirname);
};

class DataHelper {
  async clear(url: string) {
    const fs = await getFs();
    await fs.unlink(url);
  }
  async getTxt(url: string): Promise<string | null> {
    if (process.env.NODE_ENV === "production") {
      return fetch(url).then((res) => res.text());
    }
    const fs = await getFs();
    const exists = await fs.exists(url);
    if (exists) {
      return await fs.readFile(url).then((data: any) => data.toString());
    }
    const data = await fetch(url).then((res) => res.text());
    await ensureDir(fs, url);

    await fs.writeFile(url, data);
    return data;
  }
}

export const dataHelper = new DataHelper();
