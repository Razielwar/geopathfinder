const main = async () => {
  // TODO profile visibility graph
  return Promise.resolve();
};

const start = Date.now();
main()
  .then(() => {
    console.log(`Profiling visibility graph COMPLETE`);
    console.log(`time elapsed ${Date.now() - start} ms`);
  })
  .catch((e) => console.error(`Profiling failed caused by ${e}`));
