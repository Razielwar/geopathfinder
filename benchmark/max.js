const Benchmark = require('benchmark');

const LENGTH = 100;
const intArray = [];
for (let i = 0; i <= LENGTH; i++) {
  intArray[i] = Math.floor(Math.random() * LENGTH);
}

const max = (a, b) => (a < b ? b : a);

console.log('Max benchmark');
const suite = new Benchmark.Suite();

suite
  .add('Math.max', function () {
    let result = 0;
    for (let i = 0; i < LENGTH; i++) {
      result = Math.max(intArray[i], intArray[i + 1]);
    }
  })
  .add('homemade max', function () {
    let result = 0;
    for (let i = 0; i < LENGTH; i++) {
      result = max(intArray[i], intArray[i + 1]);
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
