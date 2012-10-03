function chartNotAvailable() {

    var svg = undefined,
        width = undefined,
        height = undefined;

    function chart() {};

    chart.show = function() {

        if (!svg || svg.length == 0) throw "svg element must be set";

        var clip_id = svg.attr("clip_id");
        if (!clip_id || clip_id.length == 0) {
            throw "svg element must have 'clip_id' attribute";
        }

        svg.append("rect")
            .attr("width", width)
            .attr("height",height)
            .attr("class","na_chart_box");

        svg.append("text")
            .text("Chart not available")
            .attr("transform","translate("+((width/2)-70)+","+(height/2)+")")
            .attr("class","na_chart_text");

        return chart;
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

    return chart;
}
