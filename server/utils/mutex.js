// Tiny in-process FIFO lock. Used around stock reservation as a second line of defence:
//  1) PRIMARY guard  : MongoDB's atomic conditional update  { stock: { $gte: qty } } + $inc  (works across many servers)
//  2) SECONDARY guard: this lock serialises reservations inside ONE Node process.
// If you ever run several server instances, rely on (1) – which real MongoDB/Atlas guarantees.
let tail = Promise.resolve();
module.exports = (fn) => {
  const run = tail.then(fn, fn);
  tail = run.catch(() => {});
  return run;
};
