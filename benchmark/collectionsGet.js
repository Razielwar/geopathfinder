const Benchmark = require('benchmark');

const LENGTHS = [100, 10000, 1000000];
const NB_GET = 100;

for (length of LENGTHS) {
  const obj = {};
  for (let i = 0; i < length; i++) {
    obj[String(i)] = i;
  }

  const myMap = new Map();
  for (let i = 0; i < length; i++) {
    myMap.set(i, i);
  }

  const myArray = [];
  for (let i = 0; i < length; i++) {
    myArray[i] = i;
  }

  const mySet = new Set();
  for (let i = 0; i < length; i++) {
    mySet.add(i);
  }

  console.log('Collections get with length', length);
  const suite = new Benchmark.Suite();

  suite
    .add('get int in obj', function () {
      let result = 0;
      for (let i = 0; i < NB_GET; i++) {
        result = obj[String(i)];
      }
    })
    .add('get int in map', function () {
      let result = 0;
      for (let i = 0; i < NB_GET; i++) {
        result = myMap.get(i);
      }
    })
    .add('get int in array', function () {
      let result = 0;
      for (let i = 0; i < NB_GET; i++) {
        result = myArray[i];
      }
    })
    .add('get int in set', function () {
      let result = false;
      for (let i = 0; i < NB_GET; i++) {
        result = mySet.has(i);
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
