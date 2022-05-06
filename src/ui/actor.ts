import { Vector2, SpriteBatch } from "gdxjs";

export class Actor {
  protected position: Vector2 = new Vector2(0, 0);
  protected size: Vector2 = new Vector2(0, 0);

  public setPosition(pos: Vector2) {
    this.position.set(pos.x, pos.y);
  }

  public setSize(size: Vector2) {
    this.size.set(size.x, size.y);
  }

  draw(batch: SpriteBatch) {}
}
