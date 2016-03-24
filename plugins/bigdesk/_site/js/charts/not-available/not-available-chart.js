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
