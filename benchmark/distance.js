const Benchmark = require('benchmark');
const turf = require('@turf/turf');
const { NodePoint } = require('./../dist/cjs/model/NodePoint');
const { haversineDistance } = require('./../dist/cjs/utils/geometryUtils');

const LENGTH = 30;

const nodePointTuples = [];
const turfPointTuples = [];
for (let i = 0; i < LENGTH; i++) {
  const p1 = new NodePoint([-i, -LENGTH - i], 0);
  const p2 = new NodePoint([i, LENGTH - i], 0);
  nodePointTuples.push([p1, p2]);

  const t1 = turf.point([-i, -LENGTH - i]);
  const t2 = turf.point([i, LENGTH - i]);
  turfPointTuples.push([t1, t2]);
}

console.log('Distance benchmark');
const suite = new Benchmark.Suite();

suite
  .add('turf compute distance', function () {
    let result = 0;
    for (let i = 0; i < LENGTH; i++) {
      result = turf.distance(turfPointTuples[i][0], turfPointTuples[i][1], { units: 'kilometers' });
    }
  })
  .add('homemade compute distance', function () {
    let result = 0;
    for (let i = 0; i < LENGTH; i++) {
      result = haversineDistance(nodePointTuples[i][0], nodePointTuples[i][1]);
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
