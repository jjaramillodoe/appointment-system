// plotly.js-dist-min ships the full Plotly bundle without types; reuse @types/plotly.js
declare module 'plotly.js-dist-min' {
  import Plotly from 'plotly.js';
  export default Plotly;
}
