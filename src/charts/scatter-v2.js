const createClickForTooltip = require("./c3-click-for-tooltip");

function scatterV2(selector, layer) {
    const { data } = layer;

    let xCol = data["x"];
    let yCol = data["y"];

    if (typeof xCol[0] === "number") xCol[0] = "x";
    if (typeof yCol[0] === "number") yCol[0] = "y";

    const xName = xCol[0];
    const yName = yCol[0];

    const xs = {};
    xs[yName] = xName;

    const columns = [xCol, yCol];

    const axis = {
      x: {
          label: xName,
          tick: {
              fit: false,
          },
      },
      y: {
        label: yName,
      }
    };

    let chart = c3.generate({
        bindto: selector,
        data: {
            xs: xs,
            columns: columns,
            type: "scatter",
            onclick: createClickForTooltip(),
        },
        axis,
        point: {
            r: 5,
        },
        tooltip: {
          show: false,
        },
    });

    return chart;
}

// This is the layered approach to a scatterplot
scatterV2.layered = function(selector) {
    const chart = c3.generate({
        bindto: selector,
        data: {
            columns: [],
            type: "scatter",
            onclick: createClickForTooltip(),
        },
        x: { // fixme
            label: "x",
            tick: {
                fit: false,
            },
        },
        tooltip: {
          show: false,
        },
    })

    chart.addLayer = function(layer, index) {
      const { data } = layer;

      const xName = "x"+index;
      const yName = "y"+index;

      let xCol = data["x"];
      let yCol = data["y"];

      if ( xCol && typeof xCol[0] !== "string") {
        xCol = [xName, ...xCol]
      } else {
        xCol = [xName, ...xCol.slice(1)]        
      }
      if ( yCol && typeof yCol[0] !== "string") {
        yCol = [yName, ...yCol]
      }
      else {
        yCol = [yName, ...yCol.slice(1)]
      }

      const xs = {};
      xs[yName] = xName;

      const columns = [xCol, yCol];

      const axis = {
        x: {
            label: xName,
            tick: {
                fit: false,
            },
        },
        y: {
            label: yName,
        }
      };

      chart.load({ columns, xs, axis })
    };

    return chart;
}

module.exports = scatterV2;