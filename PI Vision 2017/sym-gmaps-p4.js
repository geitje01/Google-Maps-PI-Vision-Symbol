(function (PV) {

    function symbolVis() { }
    PV.deriveVisualizationFromBase(symbolVis);

    var definition = {
        typeName: 'gmaps-p4',
        datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Multiple,
        iconUrl: 'Images/google-maps.svg',
        inject: ['piwebapi'],
        getDefaultConfig: function () {
            return {
                DataShape: 'Table',
                Height: 600,
                Width: 400,
                MarkerColor: 'rgb(255,0,0)',
                LatName: 'Latitude',
                LngName: 'Longitude',
                HistoricalMode: false,
                OpenInfoBox: true,
                ZoomLevel: 8,
                DisableDefaultUI: false,
                ZoomControl: true,
                ScaleControl: true,
                StreetViewControl: true,
                MapTypeControl: true,
                MapTypeId: 'ROADMAP',
                FitBounds: true,
                ElementsList: {}
            };
        },
        visObjectType: symbolVis,
        configOptions: function () {
            return [{
                title: 'Format Symbol',
                mode: 'format'
            }];
        }
    };



    window.gMapsCallback = function () {
        $(window).trigger('gMapsLoaded');
    }

    function loadGoogleMaps() {
        if (window.google == undefined) {
            if (window.googleRequested) {
                setTimeout(function () {
                    window.gMapsCallback();
                }, 3000);

            }
            else {
                var script_tag = document.createElement('script');
                script_tag.setAttribute("type", "text/javascript");
                script_tag.setAttribute("src", "http://maps.google.com/maps/api/js?key=AIzaSyDUQhTeNplK37EX-mXdAB-zVuYDutE5c2w&callback=gMapsCallback");
                (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
                window.googleRequested = true;
            }
        }
        else {
            window.gMapsCallback();
        }
    }



    symbolVis.prototype.init = function init(scope, elem, piwebapi) {
		
		piwebapi.ConfigureInstance("https://marc-web-sql.marc.net/piwebapi", true); 
		
        this.onDataUpdate = dataUpdate;
        this.onConfigChange = configChanged;
        this.onResize = resize;
        scope.clearMapTrigger = false;
        scope.lastDataWithPath = null;
        scope.markersList = [];
        scope.infoWindowList = [];
        scope.rangeMax = 300;

        var container = elem.find('#container')[0];
        var id = "gmaps_" + Math.random().toString(36).substr(2, 16);
        container.id = id;
        scope.id = id;

        function configChanged(config, oldConfig) {
            if (scope.map != undefined) {
                scope.map.setOptions({
                    disableDefaultUI: config.DisableDefaultUI,
                    zoomControl: config.ZoomControl,
                    scaleControl: config.ScaleControl,
                    streetViewControl: config.StreetViewControl,
                    mapTypeControl: config.MapTypeControl,
                    mapTypeId: scope.getMapTypeId(config.MapTypeId)
                });
                if ((config.FitBounds == false) || ((scope.markersList) && (scope.markersList.length == 1))) {
                    scope.map.setOptions({
                        zoom: parseInt(config.ZoomLevel)
                    });
                }
            }

            for (var i = 0; i < scope.markersList.length; i++) {
                var marker = scope.markersList[i];
                scope.updateMarkersSettings(marker, scope.infoWindowList[i], scope.getInfowindowContent(i), config);
            }

            if ((config.HistoricalMode != undefined) && (oldConfig != null) && (oldConfig.HistoricalMode != config.HistoricalMode)) {
                scope.clearMapTrigger = true;
            }
        };

        scope.startGoogleMaps = function () {
            if (scope.map == undefined) {
                scope.map = new window.google.maps.Map(document.getElementById(scope.id), {
                    center: { lat: 0, lng: 0 },
                    zoom: 1
                });
            }
            configChanged(scope.config);
        };

        scope.getMapTypeId = function (mapTypeIdString) {
            if (mapTypeIdString == 'HYBRID') {
                return google.maps.MapTypeId.HYBRID;
            }
            else if (mapTypeIdString == 'ROADMAP') {
                return google.maps.MapTypeId.ROADMAP;
            }
            else if (mapTypeIdString == 'SATELLITE') {
                return google.maps.MapTypeId.SATELLITE;
            }
            else if (mapTypeIdString == 'TERRAIN') {
                return google.maps.MapTypeId.TERRAIN
            }
            else {
                return null;
            }
        }

        scope.getInfowindowContent = function (i) {
            for (var key in scope.config.ElementsList) {
                var currentElement = scope.config.ElementsList[key];
                if (currentElement.MarkerIndex == i) {
                    return key;
                }
            }
            return null;
        }

        function resize(width, height) {
            if (scope.map != undefined) {
                google.maps.event.trigger(scope.map, "resize");
            }
        }

        scope.createMarkers = function (data, useConfigData) {
            if (useConfigData == false) {
                for (var i = 0; i < data.Rows.length; i++) {
                    var splitResult = data.Rows[i].Label.split('|');
                    if ((splitResult[1] == scope.config.LatName) || (splitResult[1] == scope.config.LngName)) {
                        if (scope.config.ElementsList[splitResult[0]] == undefined) {
                            scope.config.ElementsList[splitResult[0]] = new Object();
                            scope.config.ElementsList[splitResult[0]].MarkerCreated = false;
                            scope.config.ElementsList[splitResult[0]].MarkerIndex = -1;
                            scope.config.ElementsList[splitResult[0]].LatIndex = null;
                            scope.config.ElementsList[splitResult[0]].LngIndex = null;
                        }
                        if (splitResult[1] == scope.config.LatName) {
                            scope.config.ElementsList[splitResult[0]].LatIndex = i;
                        }

                        if (splitResult[1] == scope.config.LngName) {
                            scope.config.ElementsList[splitResult[0]].LngIndex = i;
                        }
                    }
                }
            }

            for (var key in scope.config.ElementsList) {
                var currentElement = scope.config.ElementsList[key];
                if ((currentElement.MarkerCreated == false) || (scope.markersList[currentElement.MarkerIndex] == undefined)) {
                    if ((currentElement.LatIndex != null) && (currentElement.LngIndex != null)) {
                        var marker = new google.maps.Marker({
                            position: { lat: parseFloat(data.Rows[currentElement.LatIndex].Value), lng: parseFloat(data.Rows[currentElement.LngIndex].Value) },
                            map: scope.map,
                            title: key
                        });
                        var infowindow = new google.maps.InfoWindow();
                        scope.markersList.push(marker);
                        scope.infoWindowList.push(infowindow);
                        scope.updateMarkersSettings(marker, infowindow, key, scope.config);
                        currentElement.MarkerCreated = true;
                        currentElement.MarkerIndex = scope.markersList.length - 1;
                    }
                    else {
                        alert('Could not find the latitude and longitude attributes');
                    }
                }
            }
        }

        function updateMarkerColor(marker, config) {
            if (config.MarkerColor != 'rgb(255,0,0)') {
                marker.setIcon('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + config.MarkerColor.substr(1));
            }
        }

        scope.updateMarkersSettings = function (marker, infowindow, infowindowContent, config) {
            updateMarkerColor(marker, config);

            infowindow.close();
            google.maps.event.addListener(marker, 'mouseover', (function (marker) {
                return function () {
                    if ((scope.config.OpenInfoBox == true) && (infowindowContent != null)) {
                        infowindow.setContent(infowindowContent);
                        infowindow.open(scope.map, marker);
                    }
                }
            })(marker));
        }

        scope.updateMarkersLocation = function (data) {

            if ((scope.markersList == null) || (scope.markersList == undefined) || (scope.markersList.length == 0)) {
                return;
            }

            var markersCount = 0;
            var currentLatLng = null;
            for (var key in scope.config.ElementsList) {
                var currentElement = scope.config.ElementsList[key];
                if (currentElement.MarkerCreated == true) {
                    currentLatLng = { lat: parseFloat(data.Rows[currentElement.LatIndex].Value), lng: parseFloat(data.Rows[currentElement.LngIndex].Value) };
                    var marker = scope.markersList[parseInt(currentElement.MarkerIndex)];
                    marker.setPosition(currentLatLng);
                    markersCount++;
                }
            }
            if (markersCount == 1) {
                scope.map.setCenter(currentLatLng);
            }
            if (markersCount > 1) {
                var latlngbounds = new google.maps.LatLngBounds();
                for (var i = 0; i < scope.markersList.length; i++) {
                    latlngbounds.extend(scope.markersList[i].getPosition());
                }
                if (scope.config.FitBounds == true) {
                    scope.map.fitBounds(latlngbounds);
                }
            }
        }

        scope.updateActivity = function (activity) {
            if ((scope.marker != null) && (scope.marker != undefined)) {
                scope.marker.setMap(null);

            }
            if ((scope.routePath != null) && (scope.routePath != undefined)) {
                scope.routePath.setMap(null);
            }

            scope.selectedActivity = activity;
            scope.loadingGeolocation = true;
            var elementWebId = scope.selectedActivity.RefElementWebIds[0];
            piwebapi.element.getAttributes(elementWebId).then(function (response) {
                scope.attributes = response.data.Items;
                var webIds = new Array(scope.attributes.length);
                for (var i = 0; i < scope.attributes.length; i++) {
                    webIds[i] = scope.attributes[i].WebId;
                }

                piwebapi.streamSet.getInterpolatedAdHoc(webIds, activity.EndTime, null, true, "30s", null, activity.StartTime).then(function (response) {
                    for (var i = 0; i < response.data.Items.length; i++) {
                        var currentItem = response.data.Items[i];
                        if (currentItem.Name == scope.config.LatName) {
                            scope.latitudeTrack = currentItem.Items;
                        }
                        if (currentItem.Name == scope.config.LngName) {
                            scope.longitudeTrack = currentItem.Items;
                        }
                    }

                    var bounds = new google.maps.LatLngBounds();
                    var routeCoordinates = [];
                    for (var i = 0; i < scope.latitudeTrack.length; i++) {
                        if ((scope.latitudeTrack[i].Good == true) && (scope.longitudeTrack[i].Good == true)) {
                            var pos = { lat: scope.latitudeTrack[i].Value, lng: scope.longitudeTrack[i].Value };
                            routeCoordinates.push(pos);
                            var point = new google.maps.LatLng(pos.lat, pos.lng);
                            bounds.extend(point);
                        }
                    }
                    scope.rangeMax = routeCoordinates.length;

                    scope.routePath = new google.maps.Polyline({
                        path: routeCoordinates,
                        geodesic: true,
                        strokeColor: '#FF0000',
                        strokeOpacity: 1.0,
                        strokeWeight: 2
                    });

                    scope.routePath.setMap(scope.map);
                    scope.map.fitBounds(bounds);

                    scope.marker = new google.maps.Marker({
                        position: routeCoordinates[0],
                        map: scope.map
                    });

                    updateMarkerColor(scope.marker, scope.config);

                    $('input[type="range"]').rangeslider({
                        polyfill: false,
                        onSlide: function (position, value) {
                            x = Math.round(position);
                            var geoPosition = routeCoordinates[x];
                            scope.marker.setPosition(geoPosition);
                        }
                    });
                });
            });
        };

        scope.forceFirstUpdate = true;

        scope.clearMap = function () {
            if (scope.clearMapTrigger == false) {
                return;
            }

            if ((scope.marker != null) && (scope.marker != undefined)) {
                scope.marker.setMap(null);

            }
            if ((scope.routePath != null) && (scope.routePath != undefined)) {
                scope.routePath.setMap(null);
            }

            for (var i = 0; i < scope.markersList.length; i++) {
                scope.markersList[i].setMap(null);
            }
            scope.clearMapTrigger = false;
            scope.activitiesList = undefined;
            scope.routePath = undefined;
            scope.marker = undefined;
            scope.markersList = [];

            scope.map.setOptions({
                zoom: parseInt(scope.config.ZoomLevel)
            });

        }

        function dataUpdate(data) {
            if ((data == null) || (data.Rows.length == 0)) {
                return;
            }
            scope.clearMap();

            if (data.Rows[0].Path) {
                scope.lastDataWithPath = data;
            }

            if ((scope.elementName == undefined) && (scope.lastDataWithPath.Rows[0].Path.substring(0, 3) == "af:")) {
                var elementPath = (data.Rows[0].Path.split("|")[0]).substring(3);
                var stringData = elementPath.substring(2).split("\\");
                scope.databasePath = "\\\\" + stringData[0] + "\\" + stringData[1];
                scope.elementName = stringData[2];
            }

            if (scope.map != undefined) {
                if (scope.config.HistoricalMode == false) {
                    if ((scope.forceFirstUpdate == true) && (Object.keys(scope.config.ElementsList).length > 0)) {
                        scope.forceFirstUpdate = false;
                        scope.createMarkers(data, true);
                    }
                    if (scope.lastDataWithPath != null) {
                        scope.createMarkers(scope.lastDataWithPath, false);
                    }
                    scope.updateMarkersLocation(data);
                }
                else {
                    if (scope.activitiesList == undefined) {
                        piwebapi.assetDatabase.getByPath(scope.databasePath, null, null).then(function (response) {
                            var webId = response.data.WebId;
                            piwebapi.assetDatabase.getEventFrames(webId, null, null, "*", null, 100, null, scope.elementName, "UserTemplate", true, null, null, null, null, null, null, "*-3000d").then(function (response) {
                                scope.activitiesList = response.data.Items;
                                scope.selectedActivity = response.data.Items[0];
                                scope.updateActivity(scope.selectedActivity);
                            });
                        });
                    }
                }
            }
        }

        $(window).bind('gMapsLoaded', scope.startGoogleMaps);
        loadGoogleMaps();
    }

    PV.symbolCatalog.register(definition);
})(window.PIVisualization);
