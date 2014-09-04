/*   
   Copyright 2011-2014 Lukas Vlcek

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

function timeAreaChart() {

    var width = 330,
        height = 150,
        margin = { top: 17, right: 40, bottom :30, left: 7, axes: 0 },
        legend = { caption: "Time area", series1: "series1", series2: "series2", width: 110 },
        svg = undefined,
        initialized = false,
        animate = true,

        time_scale = undefined,
        time_scale_axis = undefined,
        value_scale = undefined,

        xAxis = undefined,
        yAxis = undefined,

        line = undefined,
        path1 = undefined,
        path2 = undefined,
        path3 = undefined,

        area = undefined,
        area1 = undefined,
        area2 = undefined,
        area3 = undefined;

    function chart() {};

    function init() {

        if (!svg || svg.length == 0) throw "svg element must be set";

        var clip_id = svg.attr("clip_id");
        if (!clip_id || clip_id.length == 0) {
            throw "svg element must have 'clip_id' attribute";
        }

        time_scale = d3.time.scale()
            .range([0 + margin.left, width - margin.right]);

        time_scale_axis = d3.time.scale()
            .range([0 + margin.left, width - margin.right]);

        value_scale = d3.scale.linear()
            .range([height - margin.bottom, 0 + margin.top]);

        xAxis = d3.svg.axis().scale(time_scale_axis).orient("bottom").ticks(4).tickSize(6,3,0).tickSubdivide(true);
        yAxis = d3.svg.axis().scale(value_scale).orient("right").ticks(4).tickFormat(d3.format("s"));

        line = d3.svg.line()
//        .interpolate("monotone")
            .x(function(d){return time_scale( new Date(d.timestamp));})
            .y(function(d){return value_scale(d.value);});

        area = d3.svg.area()
//            .interpolate("monotone")
            .x(function(d) { return time_scale( new Date(d.timestamp)); })
            .y0(height)
            .y1(function(d) { return value_scale(d.value); });

        // chart box
        svg.append("rect")
            .attr("width", width)
            .attr("height",height)
            .attr("class","chart_box");

        // plot box
        svg.append("rect")
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", width - margin.left - margin.right)
            .attr("height",height - margin.top - margin.bottom)
            .attr("class","plot_box");

        svg.append("defs").append("clipPath")
            .attr("id", clip_id)
            .append("rect")
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", width - margin.left - margin.right)
            .attr("height",height - margin.top - margin.bottom);

        // areas and paths
        area3 = svg.append("g")
            .attr("clip-path", "url(#"+clip_id+")")
            .append("path");

        path3 = svg.append("g")
            .attr("clip-path", "url(#"+clip_id+")")
            .append("path");

        area2 = svg.append("g")
            .attr("clip-path", "url(#"+clip_id+")")
            .append("path");

        path2 = svg.append("g")
            .attr("clip-path", "url(#"+clip_id+")")
            .append("path");

        area1 = svg.append("g")
            .attr("clip-path", "url(#"+clip_id+")")
            .append("path");

        path1 = svg.append("g")
            .attr("clip-path", "url(#"+clip_id+")")
            .append("path");

        // axes
        svg.append("svg:g")
            .attr("class", "axis x")
            .attr("transform","translate(0,"+ (height - margin.bottom + margin.axes) +")")
            .call(xAxis);

        svg.append("svg:g")
            .attr("class", "axis y")
            .attr("transform","translate("+ (width - margin.right + margin.axes) +",0)")
            .call(yAxis);

        // legend
        var legendSize = { width: legend.width, height: 31 };

        var legendSvg = svg.append("svg:g");

        legendSvg.append("rect")
            .attr("width", legendSize.width)
            .attr("height", legendSize.height)
            .attr("rx", 2)
            .attr("ry", 2)
            .attr("class","legend_background");

        legendSvg.attr("transform","translate("+(margin.left + legend.margin_left)+","+(height -margin.bottom - legendSize.height - legend.margin_bottom)+")");

        var legend1 = legendSvg.append("text").text(legend.series1).attr("class","legend_text");
        var legend2 = legendSvg.append("text").text(legend.series2).attr("class","legend_text");

        legend1.attr("font-size", 10)
            .attr("font-family", "Verdana")
            .attr("transform","translate("+20+","+(legendSize.height - 5)+")");

        legend2.attr("font-size", 10)
            .attr("font-family", "Verdana")
            .attr("transform","translate("+20+","+(legendSize.height - 5 - 14)+")");

        legendSvg.append("circle")
            .attr("r", 3)
            .attr("class", "legend_circle_line1")
            .attr("transform","translate("+10+","+(legendSize.height - 8)+")");

        legendSvg.append("circle")
            .attr("r", 3)
            .attr("class", "legend_circle_line2")
            .attr("transform","translate("+10+","+(legendSize.height - 8 - 14)+")");

        // caption
        if (legend.caption && legend.caption.length > 0) {

            var captionSvg = svg.append("g");
            captionSvg.append("text").text(legend.caption).attr("class","legend_caption");
            captionSvg.attr("transform", "translate("+margin.left+",11)");

        }

        initialized = true;

    };

    // data1 and data2 are mandatory
    // data3 is optional
    chart.update = function(data1, data2, data3) {

        if (!initialized) init();

        if (data3 && data3.length > 0) {
            // we assume data3 (if present) is always max
            value_scale.domain([0,d3.max(data3, function(d){return d.value})]).nice();
        } else {
            value_scale.domain([0,
                d3.max([
                    d3.max(data1, function(d){return d.value}),
                    d3.max(data2, function(d){return d.value})
                ])
            ]).nice();
        }

        if (data1.length > 2)
            time_scale_axis.domain([
                data1[1].timestamp,
                data1[data1.length-1].timestamp
            ]);

        if (!animate) {
            if (data1.length > 2)
                time_scale.domain([
                    data1[1].timestamp,
                    data1[data1.length-1].timestamp
                ]);
        }

        area1.data(data1)
            .attr("class", "area1")
            .attr("d", area(data1));

        path1.data(data1)
            .attr("class", "line1")
            .attr("d", line(data1));

        area2.data(data2)
            .attr("class", "area2")
            .attr("d", area(data2));

        path2.data(data2)
            .attr("class", "line2")
            .attr("d", line(data2));

        if (data3 && data3.length > 0) {
            area3.data(data3)
                .attr("class", "area3")
                .attr("d", area(data3));

            path3.data(data3)
                .attr("class", "line3")
                .attr("d", line(data3));
        }

        if (animate) {
            if (data1.length > 2)
                time_scale.domain([
                    data1[1].timestamp,
                    data1[data1.length-1].timestamp
                ]);
        }

        if (animate) {
            var t = svg.transition()
                .duration(250)
                .ease("linear");

            t.select(".x.axis").call(xAxis);
            t.select(".y.axis").call(yAxis);

            t.select(".area1").attr("d", area(data1));
            t.select(".area2").attr("d", area(data2));
            if (data3 && data3.length > 0) {
                t.select(".area3").attr("d", area(data3));
            }
        } else {
            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);
        }

        if (animate) {
            path1
                .transition().duration(250).ease("linear")
                .attr("d", line(data1));

        } else {
            path1
                .attr("d", line(data1));
        }

        if (animate) {
            path2
              .transition().duration(250).ease("linear")
                .attr("d", line(data2));
        } else {
            path2
                .attr("d", line(data2));
        }

        if (data3 && data3.length > 0) {
            if (animate) {
                path3
                    .transition().duration(250).ease("linear")
                    .attr("d", line(data3));
            } else {
                path3
                    .attr("d", line(data3));
            }
        }

    };

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.svg = function(_) {
        if (!arguments.length) return svg;
        svg = _;
        return chart;
    };

    chart.legend = function(_) {
        if (!arguments.length) return legend;
        legend = _;
        return chart;
    };

    chart.animate = function(_) {
        if (!arguments.length) return animate;
        animate = _;
        return chart;
    }

    return chart;
}


