/// <reference path="google.maps.d.ts" />
// Class that has segment specific information including the camera, altitude, picture overlaps
var FlightPath = (function () {
	FlightPath.prototype.num_strips = 0;
	FlightPath.prototype.distance = 0;
	FlightPath.prototype.line_distance = 0;
	FlightPath.prototype.flight_time = 0;
	FlightPath.prototype.image_distance = 0;
	FlightPath.prototype.photo_every = 0;
	FlightPath.prototype.gsd = 0;
	FlightPath.prototype.photo_count = 0;
	FlightPath.prototype.polygon_area = 0;
	
    function FlightPath(_camera, _altitude, _horizontalOverlap, _verticalOverlap) {
        this.camera = _camera;
        this.altitude = _altitude;
        this.horizontalOverlap = _horizontalOverlap;
        this.verticalOverlap = _verticalOverlap;
    }
    // Horizontal Coverage in Meters
    // =2*flightAltitude*TAN(RADIANS(horizontalFOV/2))
    FlightPath.prototype.calculateHorizontalCoverage = function () {
        return (2 * this.altitude * Math.tan(this.toRadians(this.camera.horizontalFOV() / 2)));
    };
    // Vertical Coverage in Meters
    // =2*flightAltitude*TAN(RADIANS(verticalFOV/2))
    FlightPath.prototype.calculateVerticalCoverage = function () {
        return (2 * this.altitude * Math.tan(this.toRadians(this.camera.verticalFOV() / 2)));
    };
    // GSD should be the same for both horizontal and vertical
    // Calculates the GSD for the current flight segment and ensures that both horizontal and vertical calculations match before returning
    // The return value is in centimeters per pixel
    FlightPath.prototype.calculateGSD = function () {
        var xGSD = this.calculateHorizontalCoverage() / this.camera.xResolution;
        return xGSD;
    };
    // Calculates the horizontal overlap coverage in meters
    // This distance is used as the width for each flight path
    // 
    FlightPath.prototype.calculateHorizontalCoverageOverlap = function () {
        var horizontalCoverage = this.calculateHorizontalCoverage();
        return (horizontalCoverage - (this.horizontalOverlap * horizontalCoverage));
    };
    // Calculates the vertical overlap coverage in meters
    // This is the distance from each camera trigger point to the next flying from waypoint to waypoint on the flight path grid
    FlightPath.prototype.calculateVerticalCoverageOverlap = function () {
        var verticalCoverage = this.calculateVerticalCoverage();
        return (verticalCoverage - (this.verticalOverlap * verticalCoverage));
    };
    FlightPath.prototype.toDegrees = function (angle) {
        return angle * (180 / Math.PI);
    };
    FlightPath.prototype.toRadians = function (angle) {
        return angle * (Math.PI / 180);
    };
   
    FlightPath.prototype.calculateFlightPath = function (map, bounds, shape) {
        var points = this.getCameraPointsGrid(bounds, shape);
        var selectedCameraRectangle = new google.maps.Rectangle();
        for (var i = 0; i < points.length; i++) {
            // zoomIcons = [null, icon1, icon2];  // No such thing as zoom level 0. A global variable or define within object.
            // marker.setIcon(zoomIcons[map.getZoom()]);
            var image = {
                url: 'img/camera.png',
                // This marker is 20 pixels wide by 32 pixels tall.
                size: new google.maps.Size(30, 24),
                // The origin for this image is 0,0.
                origin: new google.maps.Point(0, 0),
                // The anchor for this image is the base of the flagpole at 0,32.
                anchor: new google.maps.Point(15, 13)
            };
            var marker = new google.maps.Marker({
                position: points[i],
                map: map,
                title: "Start Point",
                icon: image
            });
            
            var that = this;
            google.maps.event.addListener(marker, 'click', function () {
                selectedCameraRectangle.setMap(null);
                selectedCameraRectangle = new google.maps.Rectangle({
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#FF0000',
                    fillOpacity: 0.1,
                    map: map,
                    bounds: that.createRectangleBounds(this.getPosition())
                });
            });
        };
        var flightPath = new google.maps.Polyline({
            path: points,
            strokeColor: '#0000ff',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        flightPath.setMap(map);
    };
    FlightPath.prototype.getCameraPointsGrid = function (rectangleBounds, shape) {
        // Create array to hold calculated points in rectangle
        var cameraPoints = [];
        // Distance between camera points in vertical plane
        var verticalPointDistance = this.calculateVerticalCoverageOverlap();
        // Distance between camera points from side to side in horizontal plane
        var horizontalPointDistance = this.calculateHorizontalCoverageOverlap();
        
        //distance of line setting
        this.line_distance = parseFloat(horizontalPointDistance).toFixed(2);
        
        //distance of image setting
        this.image_distance = parseFloat(verticalPointDistance).toFixed(2);
        
        //photo every setting
        this.photo_every = parseFloat(verticalPointDistance / 5).toFixed(2);
        
        // Get corners of rectangle
        var ne = rectangleBounds.getNorthEast();
        var sw = rectangleBounds.getSouthWest();
        var nw = new google.maps.LatLng(ne.lat(), sw.lng());
        var se = new google.maps.LatLng(sw.lat(), ne.lng());
        // Compute rectangle side sizes
        var rectangleWidth = google.maps.geometry.spherical.computeDistanceBetween(nw, ne);
        var rectangleHeight = google.maps.geometry.spherical.computeDistanceBetween(nw, sw);
        // Set flag for orientation
        var isWider = ((rectangleWidth >= rectangleHeight) ? true : false);
        var pointCountWidth = rectangleWidth / horizontalPointDistance;
        var pointCountHeight = rectangleHeight / verticalPointDistance;
        
       
        //caculate optimize start point for Mark - frank customization
        var intPointCountWidth = parseInt(pointCountWidth);
        //setting no of strips
        /*this.num_strips = intPointCountWidth;*/
        
        var sx = (rectangleWidth - intPointCountWidth * horizontalPointDistance) / 2;
        
        var bermudaTriangle = new google.maps.Polygon({
            paths: getPolyLinePointLatLng(shape)
        });
        
        //polygon area setting
        this.polygon_area = parseFloat(google.maps.geometry.spherical.computeArea(bermudaTriangle.getPath())).toFixed(2);
        
        // Move starting point over half an image side
        var currentVPoint = sw;
        
        currentVPoint = google.maps.geometry.spherical.computeOffset(currentVPoint, sx, 90);
        
        var headedNorth = true;
        var pointContainer = [];
        
        for (var n = -1; n < pointCountWidth; ++n) {
            // First add overlap camera point
            //pointContainer.push(google.maps.geometry.spherical.computeOffset(currentVPoint, verticalPointDistance, 180));
            // Add starting point
            pointContainer.push(currentVPoint);
            for (var i = 0; i < pointCountHeight; ++i) {
                pointContainer.push(google.maps.geometry.spherical.computeOffset(currentVPoint, (verticalPointDistance * (i + 1)), 0));
            }
            currentVPoint = google.maps.geometry.spherical.computeOffset(currentVPoint, horizontalPointDistance, 90);
            if (headedNorth) {
            	var flag = false;
                for (var u = 0; u < pointContainer.length; u++) {
                	if (google.maps.geometry.poly.containsLocation(pointContainer[u], bermudaTriangle)) {
                		cameraPoints.push(pointContainer[u]);
                		flag = true;
                	}
                }
                
                if(flag) this.num_strips ++;
            }
            else {
            	var flag = false;
                var d = pointContainer.length;
                while (d--) {
                	if (google.maps.geometry.poly.containsLocation(pointContainer[d], bermudaTriangle)) {
                		cameraPoints.push(pointContainer[d]);
                		flag = true;
                	}
                }
                
                if(flag) this.num_strips ++;
            }
            // change direction
            headedNorth = !headedNorth;
            // clear containter
            pointContainer.length = 0;
        }
        
        //distance setting
        for(var i = 0; i < cameraPoints.length; i++) {
        	if (i == cameraPoints.length - 1) continue;
         	this.distance += parseFloat(google.maps.geometry.spherical.computeDistanceBetween (cameraPoints[i], cameraPoints[i + 1]));
         	
         	if(cameraPoints[i].lng() != cameraPoints[i + 1].lng()) {
         		this.flight_time += parseFloat(google.maps.geometry.spherical.computeDistanceBetween (cameraPoints[i], cameraPoints[i + 1])) / 3;
         	} else {
         		this.flight_time += parseFloat(google.maps.geometry.spherical.computeDistanceBetween (cameraPoints[i], cameraPoints[i + 1])) / 5;
         	}
        }
         
        this.distance = parseFloat(this.distance / 1000).toFixed(2);
        this.flight_time = parseFloat(this.flight_time / 1).toFixed(0);
        this.gsd = parseFloat(this.calculateGSD()).toFixed(2);
        this.photo_count = cameraPoints.length;
        
        return cameraPoints;
    };
    FlightPath.prototype.createRectangleBounds = function (center) {
        var n = google.maps.geometry.spherical.computeOffset(center, this.calculateVerticalCoverage() / 2, 0).lat();
        var s = google.maps.geometry.spherical.computeOffset(center, this.calculateVerticalCoverage() / 2, 180).lat();
        var e = google.maps.geometry.spherical.computeOffset(center, this.calculateHorizontalCoverage() / 2, 90).lng();
        var w = google.maps.geometry.spherical.computeOffset(center, this.calculateHorizontalCoverage() / 2, 270).lng();
        return new google.maps.LatLngBounds(new google.maps.LatLng(s, w), new google.maps.LatLng(n, e));
    };
    // Implementation of Andrew's Monotone Chain Algorithm
    //     Input:  Array of LatLng points
    //     Output: Array of LatLng Points
    //     Return: the number of points in H[]
    FlightPath.prototype.getContextHullPoints = function (polygonPoints, hullPoints) {
        var sortedPoints = polygonPoints.slice();
        sortedPoints.sort(this.sortPointY);
        sortedPoints.sort(this.sortPointX);
        var n = sortedPoints.length;
        // the output array H[] will be used as the stack
        var bot = 0, top = (-1); // indices for bottom and top of the stack
        var i; // array scan index
        // Get the indices of points with min x-coord and min|max y-coord
        var minmin = 0, minmax;
        var xmin = sortedPoints[0].lng();
        for (i = 1; i < n; i++) {
            if (sortedPoints[i].lng() != xmin) {
                break;
            }
        }
        minmax = i - 1;
        if (minmax == n - 1) {
            hullPoints[++top] = sortedPoints[minmin];
            if (sortedPoints[minmax].lat() != sortedPoints[minmin].lat())
                hullPoints[++top] = sortedPoints[minmax];
            hullPoints[++top] = sortedPoints[minmin]; // add polygon endpoint
            return top + 1;
        }
        // Get the indices of points with max x-coord and min|max y-coord
        var maxmin, maxmax = n - 1;
        var xmax = sortedPoints[n - 1].lng();
        for (i = n - 2; i >= 0; i--) {
            if (sortedPoints[i].lng() != xmax) {
                break;
            }
        }
        maxmin = i + 1;
        // Compute the lower hull on the stack H
        hullPoints[++top] = sortedPoints[minmin]; // push minmin point onto stack
        i = minmax;
        while (++i <= maxmin) {
            // the lower line joins sortedPoints[minmin] with sortedPoints[maxmin]
            if (this.isLeft(sortedPoints[minmin], sortedPoints[maxmin], sortedPoints[i]) >= 0 && i < maxmin) {
                continue;
            }
            while (top > 0) {
                // test if P[i] is left of the line at the stack top
                if (this.isLeft(hullPoints[top - 1], hullPoints[top], sortedPoints[i]) > 0) {
                    break;
                }
                else {
                    top--; // pop top point off stack
                }
            }
            hullPoints[++top] = sortedPoints[i]; // push sortedPoints[i] onto stack
        }
        // Next, compute the upper hull on the stack H above the bottom hull
        if (maxmax != maxmin) {
            hullPoints[++top] = sortedPoints[maxmax]; // push maxmax point onto stack
        }
        bot = top; // the bottom point of the upper hull stack
        i = maxmin;
        while (--i >= minmax) {
            // the upper line joins sortedPoints[maxmax] with sortedPoints[minmax]
            if (this.isLeft(sortedPoints[maxmax], sortedPoints[minmax], sortedPoints[i]) >= 0 && i > minmax) {
                continue;
            }
            while (top > bot) {
                // test if P[i] is left of the line at the stack top
                if (this.isLeft(hullPoints[top - 1], hullPoints[top], sortedPoints[i]) > 0) {
                    break;
                }
                else {
                    top--; // pop top point off stack
                }
            }
            hullPoints[++top] = sortedPoints[i]; // push P[i] onto stack
        }
        if (minmax != minmin) {
            hullPoints[++top] = sortedPoints[minmin]; // push joining endpoint onto stack
        }
        
        return hullPoints.length + 1;
    };
    FlightPath.prototype.sortPointX = function (a, b) {
        return a.lng() - b.lng();
    };
    FlightPath.prototype.sortPointY = function (a, b) {
        return a.lat() - b.lat();
    };
    FlightPath.prototype.isLeft = function (P0, P1, P2) {
        return (P1.lng() - P0.lng()) * (P2.lat() - P0.lat()) - (P2.lng() - P0.lng()) * (P1.lat() - P0.lat());
    };
    FlightPath.prototype.calculateLongestSideOfRectangle = function (rectPoints) {
        var longestPoint1;
        var longestPoint2;
        var longestDistance = 0;
        for (var i = rectPoints.length - 1; i >= 0; i--) {
            var length = 0;
            if (i == 0) {
                length = google.maps.geometry.spherical.computeDistanceBetween(rectPoints[i], rectPoints[rectPoints.length - 1]);
            }
            else {
                length = google.maps.geometry.spherical.computeDistanceBetween(rectPoints[i], rectPoints[i - 1]);
            }
            if (length >= longestDistance) {
                longestDistance = length;
                longestPoint1 = rectPoints[i];
                if (i == 0) {
                    longestPoint2 = rectPoints[rectPoints.length - 1];
                }
                else {
                    longestPoint2 = rectPoints[i - 1];
                }
            }
        };
        var heading = google.maps.geometry.spherical.computeHeading(longestPoint1, longestPoint2);
        var startingLatLng;
        // Rearrange starting coordinate to keep in heading range
        if (heading >= -90 && heading <= 90) {
            // keep
            startingLatLng = longestPoint1;
        }
        else {
            // swap
            startingLatLng = longestPoint2;
            heading = google.maps.geometry.spherical.computeHeading(longestPoint2, longestPoint1);
        }
    };
    return FlightPath;
})();
// Camera Class
var Camera = (function () {
    function Camera(_name, _sensorWidth, _sensorHeight, _focalLength, _xResolution, _yResolution) {
        this.name = name;
        this.sensorWidth = _sensorWidth;
        this.sensorHeight = _sensorHeight;
        this.focalLength = _focalLength;
        this.xResolution = _xResolution;
        this.yResolution = _yResolution;
    }
    // Degrees(2*ATAN(sensorWidth/(2*focalLength)))
    Camera.prototype.horizontalFOV = function () {
        return this.toDegrees((2 * Math.atan(this.sensorWidth / (2 * this.focalLength))));
    };
    // Degrees(2*ATAN(sensorHeight/(2*focalLength)))
    Camera.prototype.verticalFOV = function () {
        return this.toDegrees((2 * Math.atan(this.sensorHeight / (2 * this.focalLength))));
    };
    Camera.prototype.toDegrees = function (angle) {
        return angle * (180 / Math.PI);
    };
    Camera.prototype.toRadians = function (angle) {
        return angle * (Math.PI / 180);
    };
    return Camera;
})();
// // FlightPlan Class
// class FlightPlan {
// 	name: string;
// 	camera: Camera;
// 	mission: Mission;
// }
// // Extends mission and has Nadir specific features and contains a set of calculated waypoints.
// class NadirMission extends Mission {
// 	gridWidth: number;
// 	gridHeight: number;
// 	altitude: number; // AGL
// 	speed: number;
// 	frontalOverlap: number; // Percentage represented as decimal
// 	sideOverlap: number; // Percentage represented as decimal
// 	constructor(_name: string, _gridWidth: number, _gridHeight: number, _altitude: number, _speed: number){
// 		// Pass to base class from super call
// 		super(_name);
// 		this.gridWidth = _gridWidth;
// 		this.gridHeight = _gridHeight;
// 		this.altitude = _altitude;
// 		this.speed = _speed;
// 	}
// }
// // Extends mission class and has Oblique specific features and contains a set of calcualted waypoints.
// class ObliqueMission extends Mission {
// 	cameraAngle: number; // describes the camera angle in degress relative to nadir being 0
// 	constructor(_name: string, _cameraAngle: number){
// 		super(_name);
// 		this.cameraAngle = _cameraAngle;
// 	}
// }
// // Extends mission class and contains a set of user defined waypoints instead of calculated.
// class WaypointMission extends Mission {
// 	constructor(_name: string){
// 		super(_name);
// 	}
// }
// // TODO - Look into coordinate transformation and different coordinate systems
// // Class to contain location in 3D space for waypoint
// class Waypoint {
// 	latitude: number; // In decimal format
// 	longitude: number; // In decimal format
// 	altitude: number; // MSL in FT.
// 	constructor(_latitude: number, _longitude: number, _altitude: number){
// 		this.latitude = _latitude;
// 		this.longitude = _longitude;
// 		this.altitude = _altitude;
// 	}
// }
// // Flight waypoint contains base classes position in 3D space plus the flight specific properties such as speed
// class FlightWaypoint extends Waypoint {
// 	speed: number; // in Feet Per Second
// 	constructor(_latitude: number, _longitude: number, _altitude: number, _speed: number){
// 		super(_latitude, _longitude, _altitude);
// 		this.speed = _speed;
// 	}
// }
// // Class to describe the position in 3D space that a picture is taken.  It contains the camera used for the picture and the properties of the photo based on the altitude.
// class CameraWaypoint extends Waypoint {
// 	camera: Camera;
// 	orientation: string; // TODO - create enum for this property "Portrait/Landscape"
// 	xDistance: number; // Default is feet - NOTE: This is a theoretical distance assuming ground is same elevation below waypoint altitude.
// 	yDistance: number; // Default is feet
// 	constructor(_latitude: number, _longitude: number, _altitude: number, _camera: Camera, _orientation: string, _xDistance: number, _yDistance: number){
// 		super(_latitude, _longitude, _altitude);
// 		this.camera = _camera;
// 		this.orientation = _orientation;
// 		this.xDistance = _xDistance;
// 		this.yDistance = _yDistance;
// 	}
// } 