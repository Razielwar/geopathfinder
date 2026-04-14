import { describe, expect, it } from '@jest/globals';
import { FlatQueue } from './FlatQueue';

const data: number[] = [];
for (let i = 0; i < 100; i++) {
  data.push(Math.floor(100 * Math.random()));
}

const sorted = data.slice().sort((a, b) => a - b);

describe('flatqueue error', () => {
  it('maintains a priority queue', () => {
    const queue = new FlatQueue();
    for (let i = 0; i < data.length; i++) queue.push(i, data[i]!);

    expect(queue.peekValue()).toEqual(sorted[0]);
    expect(data[queue.peek()!]).toEqual(sorted[0]);

    const result = [];
    while (queue.length) result.push(data[queue.pop()!]);

    expect(result).toEqual(sorted);
  });

  it('handles edge cases with few elements', () => {
    const queue = new FlatQueue();

    queue.push(0, 2);
    queue.push(1, 1);
    queue.pop();
    queue.pop();
    queue.pop();
    queue.push(2, 2);
    queue.push(3, 1);
    expect(queue.pop()).toEqual(3);
    expect(queue.pop()).toEqual(2);
    expect(queue.pop()).toEqual(undefined);
    expect(queue.peek()).toEqual(undefined);
    expect(queue.peekValue()).toEqual(undefined);
  });

  it('shrinks internal arrays when calling shrink', () => {
    const queue = new FlatQueue();

    for (let i = 0; i < 10; i++) queue.push(i, i);

    while (queue.length) queue.pop();

    // @ts-expect-error access private members
    expect(queue._ids.length).toEqual(10);
    // @ts-expect-error access private members
    expect(queue._values.length).toEqual(10);

    queue.shrink();

    // @ts-expect-error access private members
    expect(queue._ids.length).toEqual(0);
    // @ts-expect-error access private members
    expect(queue._values.length).toEqual(0);
  });

  it('clear reset length to 0', () => {
    const queue = new FlatQueue();

    for (let i = 0; i < 10; i++) queue.push(i, i);

    expect(queue.length).toEqual(10);

    queue.clear();

    expect(queue.length).toEqual(0);
  });
});
