export interface Level {
  id: string;
  name: string;
  minTime: number;
  receiveStarTime: number;
}

class LevelHelpers {
  levels: Level[] = [];
  constructor() {
    this.levels = [
      { id: "1", name: "Vong 1", minTime: 0, receiveStarTime: 600 },
      { id: "2", name: "Vong 2", minTime: 0, receiveStarTime: 600 },
      { id: "3", name: "Vong 3", minTime: 0, receiveStarTime: 600 },
      { id: "4", name: "Vong 4", minTime: 0, receiveStarTime: 600 },
      { id: "5", name: "Vong 5", minTime: 0, receiveStarTime: 600 },
    ];
  }
  setLevel(levelIndex: string, totalTime: number) {
    const level = this.levels.find((l) => l.id === levelIndex);
    if (!level) {
      return;
    }
    if (level.minTime === 0 || totalTime < level.minTime) {
      level.minTime = totalTime;
    }
    this.levels = this.levels.map((l) => {
      if (l.id === level.id) {
        return level;
      }
      return l;
    });
  }
}

export default new LevelHelpers();
