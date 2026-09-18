fetch("https://copy.sh/v86/build/v86.wasm", { mode: 'cors' })
  .then(res => console.log("OK", res.status))
  .catch(err => console.error("ERR", err));
