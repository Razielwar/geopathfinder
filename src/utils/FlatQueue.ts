/**
 * Copy of the mourner flatqueue version 2.0.3 available
 * https://github.com/mourner/flatqueue
 * As it was compiled in ES Module and we were not able to import it easily in NodeJs
 */
export class FlatQueue<T = number> {
  /**
   * Number of items in the queue.
   */
  private _length: number;
  private readonly _ids: T[];
  private readonly _values: number[];

  public constructor() {
    this._ids = [];
    this._values = [];
    this._length = 0;
  }

  public get length() {
    return this._length;
  }

  /**
   * Removes all items from the queue.
   */
  public clear() {
    this._length = 0;
  }

  /**
   * Adds `item` to the queue with the specified `priority`.
   *
   * `priority` must be a number. Items are sorted and returned from low to
   * high priority. Multiple items with the same priority value can be added
   * to the queue, but there is no guaranteed order between these items.
   */
  public push(id: T, value: number) {
    let pos = this._length++;

    while (pos > 0) {
      const parent = (pos - 1) >> 1;
      const parentValue = this._values[parent]!;
      if (value >= parentValue) break;
      this._ids[pos] = this._ids[parent]!;
      this._values[pos] = parentValue;
      pos = parent;
    }

    this._ids[pos] = id;
    this._values[pos] = value;
  }

  /**
   * Removes and returns the item from the head of this queue, which is one of
   * the items with the lowest priority. If this queue is empty, returns
   * `undefined`.
   */
  public pop(): T | undefined {
    if (this._length === 0) return undefined;

    const top = this._ids[0];
    this._length--;

    if (this._length > 0) {
      const id = (this._ids[0] = this._ids[this._length]!);

      const value = (this._values[0] = this._values[this._length]!);

      const halfLength = this._length >> 1;
      let pos = 0;

      while (pos < halfLength) {
        let left = (pos << 1) + 1;
        const right = left + 1;
        let bestIndex = this._ids[left]!;
        let bestValue = this._values[left]!;
        const rightValue = this._values[right]!;

        if (right < this._length && rightValue < bestValue) {
          left = right;
          bestIndex = this._ids[right]!;
          bestValue = rightValue;
        }
        if (bestValue >= value) break;

        this._ids[pos] = bestIndex;
        this._values[pos] = bestValue;
        pos = left;
      }

      this._ids[pos] = id;
      this._values[pos] = value;
    }

    return top;
  }

  /**
   * Returns the item from the head of this queue without removing it. If this
   * queue is empty, returns `undefined`.
   */
  public peek(): T | undefined {
    if (this._length === 0) return undefined;
    return this._ids[0];
  }

  /**
   * Returns the priority value of the item at the head of this queue without
   * removing it. If this queue is empty, returns `undefined`.
   */
  public peekValue(): number | undefined {
    if (this._length === 0) return undefined;
    return this._values[0];
  }

  /**
   * Shrinks the internal arrays to `this.length`.
   *
   * `pop()` and `clear()` calls don't free memory automatically to avoid
   * unnecessary resize operations. This also means that items that have been
   * added to the queue can't be garbage collected until a new item is pushed
   * in their place, or this method is called.
   */
  public shrink() {
    this._ids.length = this._values.length = this._length;
  }
}
