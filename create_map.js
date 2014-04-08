//Trigger responsive sizing function
d3.select(window)
    		.on("resize", sizeChange);

var map;
var legend;
var infowindow;
var layer1;
var layer2;

//Function to initialize the Google Map layer, called on load
function initialize() {
	//Define map styles
	 var style_array = [
			{
			  stylers: [
				{ hue: "#0F0F0A" },
				{ saturation: -50 }
			  ]
			}];

		//Define map parameters
		var uganda = new google.maps.LatLng(1.35,34.1);
        map = new google.maps.Map(document.getElementById('map-canvas'), {
		center: uganda,
		zoom: 11,
		minZoom: 4,
		styles: style_array,
		mapTypeId: 'roadmap'
		});


        //Get view parameters (population or poverty density)
       	var view = switchViews();
	 	var indicator = view[0];
	 	var breaks = view[1];
	 	colors = view[2];

	 	//Create map layer
	 	layer1 = createLayer();
	
	 	//Set layer on map
		layer1.setMap(map);
		
		createLegend(breaks);

		//Text for page load info window
		var contentString = "<div id='infoWindow'><b>Click on any parish to learn more.</b> <br/> Use the menu on the right to toggle between layers.</div>"
		 
		 //Initialize info window
		 infowindow = new google.maps.InfoWindow({
		 		position: uganda,
      			content: contentString
  			});

		 //Display info window
		  infowindow.open(map);
  }

  	//Initialize map on window load
      google.maps.event.addDomListener(window, 'load', initialize);

//Define responsive sizing function (requires ajax jquery)
function sizeChange() {
		//Resize table containing map
	    d3.select("#map-container").attr("width", $(window).width() + "px").attr("height", $(window).height() + "px");

	    //Resize map according to aspect ratio relative to table
	    d3.select("map-canvas").attr("width", $("#map-container").width()/1.5 + "px").attr("height", $("#map-container").height() + "px");

	    google.maps.event.trigger(map, "resize");
		map.setCenter(new google.maps.LatLng(1.35,34.1));
};

//Function to determine the view parameters from the select dropdown
function switchViews(){
		//Get current value from select dropdown menu
		current = document.getElementById("dropdown");
	  	currentValue = current.options[current.selectedIndex].value;

	  	//Set view parameters based on select value
	  	if(currentValue=="population"){
	  		 var indicator = "pop_dens";
	 		 var breaks = [1.6,13.3,21.1,26.5,39.7];
	 		 var colors = ["#eff3ff","#bdd7e7","#6baed6","#3182bd","#08519c"];
	  	}
	  	else if(currentValue=="poverty"){
	  		var indicator = "pov_dens";
	  		var breaks = [1.3,2.6,2.8,3.0,3.2];
	  		var colors = ["#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"]
	  	}
	  	else{
	  		var indicator= "";
	  		var breaks= [];
	  		var colors = [];
	  	}

	  	//Return view parameters
	  	return [indicator, breaks, colors];
}

//Function to create the chosen google maps engine layer on the map. 
function createLayer(){

	//Get current value from select dropdown menu
		current = document.getElementById("dropdown");
	  	currentValue = current.options[current.selectedIndex].value;

	//Calls the correct map engine layer based on the dropdown selection (empty for base map only option)

	if(currentValue=="poverty"){
			
		layer1 = new google.maps.visualization.MapsEngineLayer({
		    mapId: '03486902076275989899-00161330875310406093',
		    layerKey: 'layer_00001',
		    map: map,
		    clickable: true,
		    suppressInfoWindows: false
  		});
	}
	else if(currentValue=="population"){
		layer1 = new google.maps.visualization.MapsEngineLayer({
		    mapId: '03486902076275989899-00161330875310406093',
		    layerKey: 'layer_00002',
		    map: map,
		    clickable: true,
		    suppressInfoWindows: false
  		});

	}

	 //Add event listener for info window
		google.maps.event.addListener(layer1, 'click', function  (e){

			//Close initial info window
			infowindow.close();

          //Grab info window content from map engine layer info window
          var info = e.infoWindowHtml;
          var infoArray = info.split(",");
          var parish = infoArray[0];
          var poverty_value = parseFloat(infoArray[1]);
		  var house_value = parseFloat(infoArray[2]);

		  //Set custom info window content with number formatting
          e.infoWindowHtml = "<b>" + "Parish: " + "</b>" + parish + "<br>" + "<b>" + "Average Poverty: " + "</b>" + d3.round(poverty_value,1) + "<br>" + "<b>" + "Household Density: " + "</b>" + d3.round(house_value,1);

		});

	return layer1;
}

//Function to change the KML layer based on dropdown menu values. Triggered when select menu is changed.
function changeLayer(){
		//Close initial info window if not closed already
		infowindow.close();

		//Remove current layer
		layer1.setMap(null);

		//Get new view paramters
		var view = switchViews();
	 	var indicator = view[0],
	 	breaks = view[1];
	 	colors = view[2];

	 	//Recreate layer with new parameters
		layer1 = createLayer();

		if(currentValue=="none"){
			//Remove current layer if base map only
				layer1.setMap(null);
		}
		else{
			//Add layer to map
			layer1.setMap(map);
		}


		//Update legend
		updateLegend(breaks, colors);
}

function createLegend(breaks){

	//Create legend list
	legend = d3.select("#legend-container")
  					.append("div")
  					.attr("id", "legend")
  					.append("text")
			  		.append('ul')
			    	.attr('class', 'list-inline');

	//Add data to legend
	var keys = legend.selectAll('li.key')
    						.data(colors)
    						.enter().append('li')
						    .attr('class', 'key')
						    .style('border-top-color', String);

	//Set legend text
	if(currentValue=="poverty"){
			keys.text(function(d, i) {
						if(i==0){
							 return breaks[i] +
							" - " + breaks[i+1] + " out of 5";
						}
						else if (i>0 && i<4){
							return breaks[i] +
							" - " + breaks[i+1] + " out of 5";
						}
						else{
							return breaks[i] + " or more out of 5";
						}
			})

	}
	else if(currentValue=="population"){
		keys.text(function(d, i) {
						if(i==0){
							 return breaks[i] +
							" - " + breaks[i+1] + " households per sq km";
						}
						else if (i>0 && i<4){
							return breaks[i] +
							" - " + breaks[i+1] + " households per sq km";
						}
						else{
							return breaks[i] + " or more households per sq km";
						}
			})
	}
}


function updateLegend(breaks, colors){

	//Remove legend content
	d3.selectAll("li.key").remove();

	//Add new data to legend
	var keys = legend.selectAll('li.key')
    						.data(colors)
    						.enter().append('li')
						    .attr('class', 'key')
						    .style('border-top-color', String);


	//Set legend text
	if(currentValue=="poverty"){
			keys.text(function(d, i) {
						if(i==0){
							 return breaks[i] +
							" - " + breaks[i+1] + " out of 5";
						}
						else if (i>0 && i<4){
							return breaks[i] +
							" - " + breaks[i+1] + " out of 5";
						}
						else{
							return breaks[i] + " or more out of 5";
						}
			})

	}
	else if(currentValue=="population"){
		keys.text(function(d, i) {
						if(i==0){
							 return breaks[i] +
							" - " + breaks[i+1] + " households per sq km";
						}
						else if (i>0 && i<4){
							return breaks[i] +
							" - " + breaks[i+1] + " households per sq km";
						}
						else{
							return breaks[i] + " or more households per sq km";
						}
			})
	}
	else{ //remove legend if base map only
		d3.selectAll("li.key").remove();
	}
}
