import { Vector2, createWhiteTexture, SpriteBatch } from "gdxjs";
import { Actor } from "./actor";

export class BaseObject extends Actor {
  protected bgTexture = null;

  constructor(private glContext: WebGLRenderingContext) {
    super();

    this.bgTexture = createWhiteTexture(glContext);
  }

  draw(batch: SpriteBatch) {
    if (this.bgTexture) {
      batch.draw(
        this.bgTexture,
        this.position.x,
        this.position.y,
        this.size.x,
        this.size.x
      );
    }
  }
}
