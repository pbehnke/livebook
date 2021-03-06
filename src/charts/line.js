const createClickForTooltip = require("./c3-click-for-tooltip");
const { parseLayer } = require("./util");

const plotTimeSeries = require("./time-series");

module.exports = plotLine;

function plotLine(selector, layer, { maxWidth }) {
  const { data } = layer;

  let result;

  if (data.x === "id")
    return; // short circuit bad + cached data

  if (data.x && plotTimeSeries.isTimeSeries(data.x.list))
    result = plotTimeSeries(...arguments);
  else
    result = plainOldLine(...arguments);

  d3.select(selector)
    .selectAll(".c3-line")
    .style("stroke-width", "2px");

  return result;
}

function plainOldLine(selector, layer, { maxWidth }) {
  const { xName, yName, color, xs, columns } = parseLayer(layer);

  let chart = c3.generate({
      bindto: selector,
      size: {
        width: maxWidth,
        height: maxWidth / 1.7,
      },
      data: {
        x: xName,
        columns: columns,
        type: "line",
        onclick: createClickForTooltip(),
      },
      transition: {
        duration: 0,
      },
      color,
      axis: {
        x: {
            label: xName,
            tick: {
                fit: false,
                format: (n) => d3.round(n, 2),
            },
        },
        y: {
            label: yName,
            tick: {
              format: d3.format("0,000")
            },
        }
      },
      point: {
        r: 5
      },
      tooltip: {
        show: false,
      },
  });

  chart.addLayer = function(layer, index, layers) {
    const { xs, columns } = parseLayer(layer, index, layers);
    chart.load({ columns, xs })
  };

  return chart;
}
