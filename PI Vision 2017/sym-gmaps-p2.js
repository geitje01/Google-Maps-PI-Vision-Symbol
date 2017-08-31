(function (PV) {

    function symbolVis() { }
    PV.deriveVisualizationFromBase(symbolVis);

    var definition = {
        typeName: 'gmaps-p2',
        datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Multiple,
        iconUrl: 'Images/google-maps.svg',
        getDefaultConfig: function () {
            return {
                DataShape: 'Table',
                Height: 400,
                Width: 400,
                MarkerColor: 'rgb(255,0,0)',
                LatIndex: 1,
                LngIndex: 2,
                ZoomLevel: 8,
                DisableDefaultUI: false,
                ZoomControl: true,
                ScaleControl: true,
                StreetViewControl: true,
                MapTypeControl: true,
                MapTypeId: 'ROADMAP'
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
        scope.marker = null;
        scope.infoWindow = null;

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
                    mapTypeId: scope.getMapTypeId(config.MapTypeId),
                    zoom: parseInt(config.ZoomLevel)
                });
                if (config.MarkerColor != 'rgb(255,0,0)') {
                    scope.marker.setIcon('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + config.MarkerColor.substr(1));
                }
            }
        };

        scope.startGoogleMaps = function () {
            if (scope.map == undefined) {
                scope.map = new window.google.maps.Map(document.getElementById(scope.id), {
                    center: { lat: 0, lng: 0 },
                    zoom: 1
                });
				scope.marker = new google.maps.Marker({
                    position: { lat: 0, lng: 0 },
                    map: scope.map,
                });
						
                scope.infowindow = new google.maps.InfoWindow();
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



        function resize(width, height) {
            if (scope.map != undefined) {
                google.maps.event.trigger(scope.map, "resize");
            }
        }


        function dataUpdate(data) {
            if ((data == null) || (data.Rows.length == 0)) {
                return;
            }
           
            if (scope.map != undefined) {
                var infowindowContent = 'Last timestamp: ' + data.Rows[parseInt(scope.config.LatIndex)].Time;
                var currentLatLng = { lat: parseFloat(data.Rows[parseInt(scope.config.LatIndex)].Value), lng: parseFloat(data.Rows[parseInt(scope.config.LngIndex)].Value) };
                scope.marker.setPosition(currentLatLng);
                scope.map.setCenter(currentLatLng);
                scope.infowindow.close();
                var marker = scope.marker;
                google.maps.event.addListener(marker, 'mouseover', (function (marker) {
                    return function () {							
                        scope.infowindow.setContent(infowindowContent);
                        scope.infowindow.open(scope.map, marker);						
                    }
                })(marker));
            }
        }

        $(window).bind('gMapsLoaded', scope.startGoogleMaps);
        loadGoogleMaps();
    }

    PV.symbolCatalog.register(definition);
})(window.PIVisualization);