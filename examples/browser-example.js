import { VisibilityGraph } from 'geopathfinder';

const start = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [0, 0],
  },
  properties: {},
};

const targets = [
  {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [10, 10],
    },
    properties: {},
  },
];

const obstacles = [
  {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [5, 5],
          [6, 5],
          [6, 6],
          [5, 6],
          [5, 5],
        ],
      ],
    },
    properties: {},
  },
];

const graph = new VisibilityGraph(start, obstacles, targets);

graph.searchAStar(2000).then((path) => {
  console.log(path);
});
