(function (PV) {

    function symbolVis() { }
    PV.deriveVisualizationFromBase(symbolVis);

    var definition = {
        typeName: 'gmaps-p3',
        datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Multiple,
        iconUrl: 'Images/google-maps.svg',
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



    symbolVis.prototype.init = function init(scope, elem) {



        this.onDataUpdate = dataUpdate;
        this.onConfigChange = configChanged;
        this.onResize = resize;
        scope.markersList = [];
        scope.infoWindowList = [];

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


        scope.updateMarkersSettings = function (marker, infowindow, infowindowContent, config) {
			
            if (config.MarkerColor != 'rgb(255,0,0)') {
                marker.setIcon('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + config.MarkerColor.substr(1));
            }

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

        scope.forceFirstUpdate = true;

         
        function dataUpdate(data) {
            if ((data == null) || (data.Rows.length == 0)) {
                return;
            }

            if (scope.map != undefined) {
                if ((scope.forceFirstUpdate == true) && (Object.keys(scope.config.ElementsList).length > 0)) {
                    scope.forceFirstUpdate = false;
                    scope.createMarkers(data, true);
                }
                if (data.Rows[0].Path) {
                    scope.createMarkers(data, false);
                }
                scope.updateMarkersLocation(data);
            }            
        }

        $(window).bind('gMapsLoaded', scope.startGoogleMaps);
        loadGoogleMaps();
    }

    PV.symbolCatalog.register(definition);
})(window.PIVisualization);