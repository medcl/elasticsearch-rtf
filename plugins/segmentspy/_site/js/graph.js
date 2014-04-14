$(function(){
    google.load("visualization", "1", {packages:["corechart"]});;
});

function getGrapher() {

	var grapher =  {
//vAxis: {logScale: false},
		options : {
			title: 'Segments',
			hAxis: {title: 'Segments', titleTextStyle: {color: 'red'}},
			
			isStacked: true,
			vAxes: {0: {logScale: true},
					1: {logScale: true, maxValue:1000000}},
			series:[{color: '#0008FF'}, {color: '#0099FF'},{color: 'orange'}, {color: 'red'}],
			bar: {groupWidth: "90%"},
			chartArea: {left:100,top:10,width:"800px"},
			
		},
		
		drawChart : function () {
			this.chart.draw(this.segments, this.options);
		},
		
		init :  function(divId) {
			this.chart = new google.visualization.ColumnChart(document.getElementById(divId));
			
		},
		
		setData : function(data) {
			this.segments = google.visualization.arrayToDataTable(data);	
		}		
		
	};
	
	
	return grapher;
		
};