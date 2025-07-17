/**
 * Copy of the mourner flatqueue version 2.0.3 available
 * https://github.com/mourner/flatqueue
 * As it was compiled in ES Module and we were not able to import it easily in NodeJs
 */
export class FlatQueue<T = number> {
  /**
   * Number of items in the queue.
   */
  public length: number;
  private readonly ids: T[];
  private readonly values: number[];

  constructor() {
    this.ids = [];
    this.values = [];
    this.length = 0;
  }

  /**
   * Removes all items from the queue.
   */
  clear() {
    this.length = 0;
  }

  /**
   * Adds `item` to the queue with the specified `priority`.
   *
   * `priority` must be a number. Items are sorted and returned from low to
   * high priority. Multiple items with the same priority value can be added
   * to the queue, but there is no guaranteed order between these items.
   */
  push(id: T, value: number) {
    let pos = this.length++;

    while (pos > 0) {
      // eslint-disable-next-line no-bitwise
      const parent = (pos - 1) >> 1;
      const parentValue = this.values[parent]!;
      if (value >= parentValue) break;
      this.ids[pos] = this.ids[parent]!;
      this.values[pos] = parentValue;
      pos = parent;
    }

    this.ids[pos] = id;
    this.values[pos] = value;
  }

  /**
   * Removes and returns the item from the head of this queue, which is one of
   * the items with the lowest priority. If this queue is empty, returns
   * `undefined`.
   */
  pop(): T | undefined {
    if (this.length === 0) return undefined;

    const top = this.ids[0];
    this.length--;

    if (this.length > 0) {
      // eslint-disable-next-line no-multi-assign
      const id = (this.ids[0] = this.ids[this.length]!);
      // eslint-disable-next-line no-multi-assign
      const value = (this.values[0] = this.values[this.length]!);
      // eslint-disable-next-line no-bitwise
      const halfLength = this.length >> 1;
      let pos = 0;

      while (pos < halfLength) {
        // eslint-disable-next-line no-bitwise
        let left = (pos << 1) + 1;
        const right = left + 1;
        let bestIndex = this.ids[left]!;
        let bestValue = this.values[left]!;
        const rightValue = this.values[right]!;

        if (right < this.length && rightValue < bestValue) {
          left = right;
          bestIndex = this.ids[right]!;
          bestValue = rightValue;
        }
        if (bestValue >= value) break;

        this.ids[pos] = bestIndex;
        this.values[pos] = bestValue;
        pos = left;
      }

      this.ids[pos] = id;
      this.values[pos] = value;
    }

    return top;
  }

  /**
   * Returns the item from the head of this queue without removing it. If this
   * queue is empty, returns `undefined`.
   */
  peek(): T | undefined {
    if (this.length === 0) return undefined;
    return this.ids[0];
  }

  /**
   * Returns the priority value of the item at the head of this queue without
   * removing it. If this queue is empty, returns `undefined`.
   */
  peekValue(): number | undefined {
    if (this.length === 0) return undefined;
    return this.values[0];
  }

  /**
   * Shrinks the internal arrays to `this.length`.
   *
   * `pop()` and `clear()` calls don't free memory automatically to avoid
   * unnecessary resize operations. This also means that items that have been
   * added to the queue can't be garbage collected until a new item is pushed
   * in their place, or this method is called.
   */
  shrink() {
    // eslint-disable-next-line no-multi-assign
    this.ids.length = this.values.length = this.length;
  }
}
