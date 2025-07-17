const Benchmark = require('benchmark');

const LENGTHS = [100, 10000, 1000000];

for (length of LENGTHS) {
  console.log('Collections Add with length', length);
  const suite = new Benchmark.Suite();

  suite
    .add('add int in obj', function () {
      const obj = {};
      for (let i = 0; i < length; i++) {
        obj[String(i)] = i;
      }
    })
    .add('add int in map', function () {
      const myMap = new Map();
      for (let i = 0; i < length; i++) {
        myMap.set(i, i);
      }
    })
    .add('add int in array', function () {
      const myArray = [];
      for (let i = 0; i < length; i++) {
        myArray[i] = true;
      }
    })
    .add('add int in set', function () {
      const mySet = new Set();
      for (let i = 0; i < length; i++) {
        mySet.add(i);
      }
    })
    // add listeners
    .on('cycle', function (event) {
      console.log(String(event.target));
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
      console.log();
    })
    // run async
    .run({ async: false });
}
