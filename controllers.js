var myApp = angular.module('myApp', [ 'ngRoute' ]);
var poly;
var path;
var map;
var markers = [];
var drawingManager;
var selectedShape;
var old_shap = [];
var new_shape;

//MyApp router define
myApp.config(function($routeProvider) {
    $routeProvider.when('/nadir-grid-mission', {
        templateUrl : 'nadir-grid-mission.html',
        controller : 'MapController'
    })
    
    $routeProvider.when('/mission-waypoint', {
        templateUrl : 'mission-waypoint.html',
        controller : 'MissionWaypointController'
    })
    
    $routeProvider.when('/mission-stats', {
        templateUrl : 'mission-stats.html',
        controller : 'MissionStatsController'
    })
    
    $routeProvider.when('/settings', {
        templateUrl : 'settings.html',
        controller : 'SettingsController'
    })
    
    $routeProvider.when('/help', {
        templateUrl : 'help.html',
        controller : 'HelpController'
    })
    
    $routeProvider.when('/profile', {
        templateUrl : 'profile.html',
        controller : 'ProfileController'
    })
    
    .otherwise({
    	redirectTo : '/'
    });
});

//Main controller define
myApp.controller('MainController',
    function($scope, $location) {
		$scope.nadirGridMissionPage = function() {
			$location.path('/nadir-grid-mission');
		}
		
		$scope.missionWayPaintPage = function() {
			$location.path('/mission-waypoint');
		}
		
		$scope.missionStatsPage = function() {
			$location.path('/mission-stats');
		}
		
		$scope.settingsPage = function() {
			$location.path('/settings');
		}
		
		$scope.helpPage = function() {
			$location.path('/help');
		}
		
		$scope.profilePage = function() {
			$location.path('/profile');
		}
		
		$scope.getClass = function(path) {
		    if ($location.path().substr(0, path.length) == path) {
		      return "active"
		    } else {
		      return ""
		    }
		}
    }
);

//Map controller define 
//********************************
// Map intialize function define
//********************************
myApp.controller('MapController', function($scope, $location, $http) {
	$scope.cameras = [];
	$scope.cameraData = [];
	$scope.preset = [
	                "General Imaging",
	                "Forest and Desnse Vegetation",
	                "Flat terrain with Agricultural Fields",
	                "Custom"
	                ];
	
	$scope.selectedCamera = $scope.cameras[0];
	$scope.selectedPreset = $scope.preset[0];
	
	$scope.selCameraInfo = {
		FocalLength: 0,
        Name: "",
        SensorHeight: 0,
        SensorWidth: 0,
        UserAdded: false,
        createdAt: "",
        objectId: "",
        updatedAt: "",
        xResolution: 0,
        yResolution: 0,
        FrontImgOvr: 0,
        SideImgOvr: 0,
        FlightAlt: 0,
        FlightSpeed: 0
	};
	
	$scope.loadCameraData = function () {
		$("div.dark-overlay").css("display","block");
		
		Parse.initialize("CEi9CqfbVKfK6swWXwMmhn412uKywWD81v050lRS", "QBaRKcWmcRZ6168p2GIuFMgCWbZ6SGXM7YgN2Pxb");
		var camera_data = Parse.Object.extend("Camera");
		
		var query = new Parse.Query(camera_data);
		query.find({
	        success: function(results) {
	        	var temp = [];
	        	for(var i = 0; i < results.length; i++) {
	        		if(results[i].get("UserAdded") == false){
	        			var temp_array = [];
		        		temp_array["FocalLength"] = results[i].get("FocalLength");
		        		temp_array["Name"] = results[i].get("Name");
		        		temp_array["SensorHeight"] = results[i].get("SensorHeight");
		        		temp_array["SensorWidth"] = results[i].get("SensorWidth");
		        		temp_array["UserAdded"] = results[i].get("UserAdded");
		        		temp_array["createdAt"] = results[i].get("createdAt");
		        		temp_array["objectId"] = results[i].get("objectId");
		        		temp_array["updatedAt"] = results[i].get("updatedAt");
		        		temp_array["xResolution"] = results[i].get("xResolution");
		        		temp_array["yResolution"] = results[i].get("yResolution");
		        		
		        		$scope.cameras.push(temp_array["Name"]);
		        		temp.push(temp_array);
	        		}
	        	}
	        	
	        	$scope.cameras.push("Custom");
	        	
	        	$scope.cameraData = temp;
	        	
	        	$scope.selectedCamera = $scope.cameras[0];
	        	
	        	//initialize anglar variables
	        	$scope.onChangeSelect();
	        	$scope.$apply();
	        	
	        	$("div.dark-overlay").css("display","none");
	      	},
	      	error: function(error) {
	      		alert("Service Error!");
	      		
	      		$("div.dark-overlay").css("display","none");
	      	}
	    });
	}
	
	$scope.onChangeSelect = function () {
		for ( var i = 0; i < $scope.cameraData.length; i ++ ) {
			if ( $scope.cameraData[i].Name == $scope.selectedCamera ) {
				$scope.camera_name = $scope.cameraData[i].Name;
				$scope.sensor_width = $scope.cameraData[i].SensorWidth;
				$scope.sensor_height = $scope.cameraData[i].SensorHeight;
				$scope.focal_length = $scope.cameraData[i].FocalLength;
				$scope.horizontal_resolution = $scope.cameraData[i].xResolution;
				$scope.vertical_resolution = $scope.cameraData[i].yResolution;
			}
		}
		
		//check if the camera is custom
		if($scope.selectedCamera == "Custom") {
			$("#mdl_camera_custom").modal("show");
		}
	}
	
	$scope.onChangeOverLapPreset = function() {
		if($scope.selectedPreset == "Custom") {
			$("input[label='overlap']").prop("readonly",false)
			$scope.frontal_image = 0;
			$scope.side_image = 0;
		} else {
			$("input[label='overlap']").prop("readonly",true)
			
			if($scope.selectedPreset == "General Imaging") {
				$scope.frontal_image = 75;
				$scope.side_image = 60;
			} else if($scope.selectedPreset == "Forest and Desnse Vegetation") {
				$scope.frontal_image = 85;
				$scope.side_image = 70;
			} else if($scope.selectedPreset == "Flat terrain with Agricultural Fields") {
				$scope.frontal_image = 85;
				$scope.side_image = 70;
			} 
		}
	}
			
	$scope.initialize = function() {
		  $scope.loadCameraData();
		  $scope.onChangeOverLapPreset();
		  
		  var mapOptions = {
				 zoomControl: true,
				 streetViewControl: true,
				 panControl: false,
				 tilt: 0,
				 zoomControlOptions: {
			        style: google.maps.ZoomControlStyle.LARGE,
			        position: google.maps.ControlPosition.RIGHT_BOTTOM
			    },
		  };
		  
		  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions, {
		    mapTypeId: google.maps.MapTypeId.ROADMAP
		  });
	
		  var defaultBounds = new google.maps.LatLngBounds(
		      new google.maps.LatLng(40.7102, -74.0059),
		      new google.maps.LatLng(40.7174, -74.0031));
		  map.fitBounds(defaultBounds);
	
		  // Create the search box and link it to the UI element.
		  var input = /** @type {HTMLInputElement} */(
		      document.getElementById('pac-input'));
		  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
	
		  var searchBox = new google.maps.places.SearchBox(
				    /** @type {HTMLInputElement} */(input));
	
		  // [START region_getplaces]
		  // Listen for the event fired when the user selects an item from the
		  // pick list. Retrieve the matching places for that item.
		  google.maps.event.addListener(searchBox, 'places_changed', function() {
		    var places = searchBox.getPlaces();
	
		    if (places.length == 0) {
		      return;
		    }
		    for (var i = 0, marker; marker = markers[i]; i++) {
		      marker.setMap(null);
		    }
	
		    // For each place, get the icon, place name, and location.
		    var bounds = new google.maps.LatLngBounds();
		    for (var i = 0, place; place = places[i]; i++) {
		      var image = {
		        url: place.icon,
		        size: new google.maps.Size(18, 18),
		        origin: new google.maps.Point(0, 0),
		        anchor: new google.maps.Point(17, 34),
		        scaledSize: new google.maps.Size(18, 18)
		      };
	
		      // Create a marker for each place.
		      var marker = new google.maps.Marker({
		        map: map,
		        icon: image,
		        title: place.name,
		        position: place.geometry.location
		      });
	
		      markers.push(marker);
	
		      bounds.extend(place.geometry.location);
		    }
	
		    map.fitBounds(bounds);
		    
		    //set map zoom to 18
		    map.setZoom(18);
		  });
		  
		  // Bias the SearchBox results towards places that are within the bounds of the
		  // current map's viewport.
		  google.maps.event.addListener(map, 'bounds_changed', function() {
		    var bounds = map.getBounds();
		    searchBox.setBounds(bounds);
		  });
		  
		  //Add Event to all buttons
		  /*google.maps.event.addListener(map, 'click', drawingNewPolyLine);*/
		  google.maps.event.addDomListener(document.getElementById('inp_draw_clean'), 'click', deleteOldShape);
		  google.maps.event.addDomListener(document.getElementById('inp_draw_polygon'), 'click', drawPolygon);
		  google.maps.event.addDomListener(document.getElementById('inp_draw_rectangle'), 'click', drawRectangle);
		  google.maps.event.addDomListener(document.getElementById('inp_draw_circle'), 'click', drawCircle);
		}
		
		//custom camera add function
		$scope.addCustomCamera = function() {
			//save custom camera info
			if($scope.selectedCamera == "Custom") {
				if($("#mdl_camera_custom").find("#inp_camera_name").val() != "") {
					//modal hide
					$("#mdl_camera_custom").modal("hide");
					
					//save data into parse.com
					var CameraSaveObj = Parse.Object.extend("Camera");
					var camera_save_obj = new CameraSaveObj();
					camera_save_obj.set("FocalLength", parseFloat($("#mdl_camera_custom").find("#inp_focal_length").val()));
					camera_save_obj.set("Name", $("#mdl_camera_custom").find("#inp_camera_name").val());
					camera_save_obj.set("SensorHeight", parseFloat($("#mdl_camera_custom").find("#inp_sensor_height").val()));
					camera_save_obj.set("SensorWidth", parseFloat($("#mdl_camera_custom").find("#inp_sensor_width").val()));
					camera_save_obj.set("UserAdded", true);
					camera_save_obj.set("xResolution", parseFloat($("#mdl_camera_custom").find("#inp_horizontal_resolution").val()));
					camera_save_obj.set("yResolution", parseFloat($("#mdl_camera_custom").find("#inp_vertical_resolution").val()));
					
					camera_save_obj.save(null, {
						success: function(call_back_camera) {
							if(call_back_camera.id != "") {
								console.log(call_back_camera.id);
								var temp_array = [];
				        		temp_array["FocalLength"] = $("#mdl_camera_custom").find("#inp_focal_length").val();
				        		temp_array["Name"] = $("#mdl_camera_custom").find("#inp_camera_name").val();
				        		temp_array["SensorHeight"] = $("#mdl_camera_custom").find("#inp_sensor_height").val();
				        		temp_array["SensorWidth"] = $("#mdl_camera_custom").find("#inp_sensor_width").val();
				        		temp_array["UserAdded"] = true;
				        		temp_array["createdAt"] = "";
				        		temp_array["objectId"] = call_back_camera.id;
				        		temp_array["updatedAt"] = "";
				        		temp_array["xResolution"] = $("#mdl_camera_custom").find("#inp_horizontal_resolution").val();
				        		temp_array["yResolution"] = $("#mdl_camera_custom").find("#inp_vertical_resolution").val();
				        		
				        		$scope.cameras.push(temp_array["Name"]);
				        		
				        		$scope.cameraData.push(temp_array);
					        	
					        	$scope.selectedCamera = temp_array["Name"];
					        	
					        	//fire camera select box change event
					        	$scope.onChangeSelect();
					        	
					        	$scope.$apply();
							}
						},
						error: function(cameara_save_obj, error) {
							alert("Failed to create new object, with error code: " + error.message);
						}
					});
					
				}
			}
		}
		
		//generate function define
		$scope.generate = function() {
			var altitude =  parseFloat($("#inp_flight_altitude").val());
			var horizontal_overlap = parseFloat($("#inp_camera_ft_img").val());
			var vertical_overlap = parseFloat($("#inp_camera_sd_img").val());
			
			// Create new flight path
			var my_flight_path = new FlightPath(new Camera("Canon", 36, 24, 50, 5616, 3744), 100, .6, .75);
			
			//if draw mode is polygon
			if(new_shape.type == "polygon") {
				var returnArrayOfPoints = [];
				my_flight_path.getContextHullPoints(getPolyLinePointLatLng(new_shape), returnArrayOfPoints);
				my_flight_path.calculateFlightPath(map, getBoundsLatLng(new_shape), new_shape);
				
				$("#sp_distance").html(my_flight_path.distance + " km");
				$("#sp_no_strips").html(my_flight_path.num_strips);
				$("#sp_line_distance").html(my_flight_path.line_distance + " m");
				$("#sp_image_distance").html(my_flight_path.image_distance + " m");
				$("#sp_flight_time").html(moment.duration(parseInt(my_flight_path.flight_time), "seconds").format("mm:ss") + " Minutes");
				$("#sp_photo_every").html(my_flight_path.photo_every + " Seconds");
				$("#sp_gsd").html(my_flight_path.gsd + " cm/pixel");
				$("#sp_num_image").html(my_flight_path.photo_count + " ");
				$("#sp_polygon_area").html(my_flight_path.polygon_area + " m<sup>2</sup>");
			}
			
			if(new_shape.type == "rectangle") {
				my_flight_path.calculateFlightPath(map, new_shape.bounds, new_shape);
			}
		}
		
    }
);

//MissionWaypointController define
myApp.controller('MissionWaypointController', function($scope, $location, $http) {
	$scope.waypoints = [
	      {no: '1', type: 'Waypoint', latitude: '30.285808', longitude: '-97.765803', altidue: '50'},
	      {no: '2', type: 'Waypoint', latitude: '30.285808', longitude: '-97.765803', altidue: '50'},
	      {no: '3', type: 'Waypoint', latitude: '30.285808', longitude: '-97.765803', altidue: '50'},
	      {no: '4', type: 'Waypoint', latitude: '30.285808', longitude: '-97.765803', altidue: '50'},
	      {no: '5', type: 'Waypoint', latitude: '30.285808', longitude: '-97.765803', altidue: '50'},
	      {no: '6', type: 'Waypoint', latitude: '30.285808', longitude: '-97.765803', altidue: '50'},
	      {no: '7', type: 'Waypoint', latitude: '30.285808', longitude: '-97.765803', altidue: '50'},
	      {no: '8', type: 'Waypoint', latitude: '30.285808', longitude: '-97.765803', altidue: '50'}
    ];
	
	$scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
		
	});
}).directive('onFinishRender', function($timeout) {
	return {
		restrict: 'A',
		link: function (scope, element, attr) {
			if ( scope.$last == true ) {
				$timeout( function() {
					scope.$emit('ngRepeatFinished');
					
					//data-table initialize
					$('#tbl_way_point').DataTable({
				        responsive: true
					});
				});
			}
		}
	};
});

//MissionStats define
myApp.controller('MissionStatsController', function($scope, $location, $http) {
	$scope.initialize = function() {
		//fligth - power setting
		var data = [{
	        label: "Power 1",
	        data: 10
	    }, {
	        label: "Power 2",
	        data: 20
	    }];

	    var plotObj = $.plot($("#flight_power"), data, {
	        series: {
	            pie: {
	                show: true
	            }
	        },
	        grid: {
	            hoverable: true
	        },
	        tooltip: true,
	        tooltipOpts: {
	            content: "%p.0%, %s", // show percentages, rounding to 2 decimal places
	            shifts: {
	                x: 20,
	                y: 0
	            },
	            defaultTheme: false
	        }
	    });	
	    
	  //fligth - time - 1 setting
		var data = [{
	        label: "Power 1",
	        data: 6
	    }, {
	        label: "Power 2",
	        data: 20
	    }];

	    var plotObj = $.plot($("#flight_time_1"), data, {
	        series: {
	            pie: {
	                show: true
	            }
	        },
	        grid: {
	            hoverable: true
	        },
	        tooltip: true,
	        tooltipOpts: {
	            content: "%p.0%, %s", // show percentages, rounding to 2 decimal places
	            shifts: {
	                x: 20,
	                y: 0
	            },
	            defaultTheme: false
	        }
	    });
	    
	  //fligth - time - 2 setting
		var data = [{
	        label: "Power 1",
	        data: 17
	    }, {
	        label: "Power 2",
	        data: 20
	    }];

	    var plotObj = $.plot($("#flight_time_2"), data, {
	        series: {
	            pie: {
	                show: true
	            }
	        },
	        grid: {
	            hoverable: true
	        },
	        tooltip: true,
	        tooltipOpts: {
	            content: "%p.0%, %s", // show percentages, rounding to 2 decimal places
	            shifts: {
	                x: 20,
	                y: 0
	            },
	            defaultTheme: false
	        }
	    });
	    
	  //image - count setting
		var data = [{
	        label: "Power 1",
	        data: 13
	    }, {
	        label: "Power 2",
	        data: 20
	    }];

	    var plotObj = $.plot($("#image_count"), data, {
	        series: {
	            pie: {
	                show: true
	            }
	        },
	        grid: {
	            hoverable: true
	        },
	        tooltip: true,
	        tooltipOpts: {
	            content: "%p.0%, %s", // show percentages, rounding to 2 decimal places
	            shifts: {
	                x: 20,
	                y: 0
	            },
	            defaultTheme: false
	        }
	    });
	    
	  //image - size setting
		var data = [{
	        label: "Power 1",
	        data: 8
	    }, {
	        label: "Power 2",
	        data: 20
	    }];

	    var plotObj = $.plot($("#image_size"), data, {
	        series: {
	            pie: {
	                show: true
	            }
	        },
	        grid: {
	            hoverable: true
	        },
	        tooltip: true,
	        tooltipOpts: {
	            content: "%p.0%, %s", // show percentages, rounding to 2 decimal places
	            shifts: {
	                x: 20,
	                y: 0
	            },
	            defaultTheme: false
	        }
	    });
	    
	  //filght - time - 3 size setting
		var data = [{
	        label: "Power 1",
	        data: 15
	    }, {
	        label: "Power 2",
	        data: 20
	    }];

	    var plotObj = $.plot($("#flight_time_3"), data, {
	        series: {
	            pie: {
	                show: true
	            }
	        },
	        grid: {
	            hoverable: true
	        },
	        tooltip: true,
	        tooltipOpts: {
	            content: "%p.0%, %s", // show percentages, rounding to 2 decimal places
	            shifts: {
	                x: 20,
	                y: 0
	            },
	            defaultTheme: false
	        }
	    });
	}
});

//settingsController define
myApp.controller('SettingsController', function($scope, $location, $http) {
	
});

/**
 * Handles click events on a map, and adds a new point to the Polyline.
 * @param {google.maps.MouseEvent} event
 */
function setSelection(shape) {
    selectedShape = shape;
    shape.setEditable(true);
    old_shap.push(shape);
}

function deleteSelectedShape() {
    if(selectedShape) {
      selectedShape.setMap(null);
    }
}

function deleteOldShape() {
	if(old_shap.length > 0) {
		for(var i = 0; i < old_shap.length; i++) {
			old_shap[i].setMap(null);
		}
		
		old_shap = [];
    }
	
	drawingNewPolyLine();
}

function deleteOldShapeWithoutNew() {
	if(old_shap.length > 0) {
		for(var i = 0; i < old_shap.length; i++) {
			old_shap[i].setMap(null);
		}
		
		old_shap = [];
    }
}

function drawingNewPolyLine() {
	var current_draw_type = $("input.option-item.active").attr("draw-type");
	
	if(current_draw_type == "POLYGON") {
	  drawPolygon();
	}else if(current_draw_type == "CIRCLE") {
	  drawCircle();
	}else if(current_draw_type == "RECTANGLE") {
	  drawRectangle();
	}
}


//Sets the map on all markers in the array.
function setAllMap(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}


function getPolyLinePointLatLng(polyline) {
	var lat_lng_array = [];
	for(var i = 0; i < polyline.getPath().getLength(); i++) {
		
		var item = new google.maps.LatLng(polyline.getPath().getAt(i).lat(), polyline.getPath().getAt(i).lng());
		
		lat_lng_array.push(item);
	}
	
	return lat_lng_array;
}

function getBoundsLatLng(polyline) {
	var bounds = new google.maps.LatLngBounds();
	polyline.getPath().forEach(function(element,index){bounds.extend(element)});
	
	return bounds
}

/*remove active class from item*/
function revmoveClassDrawItem() {
	$("div.drawing-option-container").find("input.option-item").each(function() {
		$(this).removeClass("active");
	})
}

/*drawing polygon - check notice*/
function drawPolygon() {
	//remove class from items
	revmoveClassDrawItem();
	//add class to current item
	$("input#inp_draw_polygon").addClass("active");
	
	if(old_shap.length > 0) {
		if(notice_show_flag) {
			noticeShow();
		} else {
			drawPolygonAtNotice();
		}
	}else {
		drawPolygonAtNotice();
	}
	
}

/*drawing polygon - check notice*/
function drawRectangle() {
	//remove class from items
	revmoveClassDrawItem();
	//add class to current item
	$("input#inp_draw_rectangle").addClass("active");

	if(old_shap.length > 0) {
		if(notice_show_flag) {
			noticeShow();
		} else {
			drawRectangleAtNotice();
		}
	}else {
		drawRectangleAtNotice();
	}
}

/*drawing circle - check notice*/
function drawCircle() {
	//remove class from items
	revmoveClassDrawItem();
	//add class to current item
	$("input#inp_draw_circle").addClass("active");
	
	if(old_shap.length > 0) {
		if(notice_show_flag) {
			noticeShow();
		} else {
			drawCircleAtNotice();
		}
	} else {
		drawCircleAtNotice();
	}
}
