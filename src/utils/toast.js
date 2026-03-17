let _addToast = () => {};

export function setAddToast(fn) {
  _addToast = fn;
}

export function addToast(opts) {
  _addToast(opts);
}
