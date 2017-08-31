(function (PV) {

    function symbolVis() { }
    PV.deriveVisualizationFromBase(symbolVis);

    var definition = {
        typeName: 'gmaps-p1',
        datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Multiple,
		iconUrl: 'Images/google-maps.svg',
        getDefaultConfig: function () {
            return {
                DataShape: 'Table',
                Height: 600,
                Width: 400           
            };
        },
        visObjectType: symbolVis
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
     

        var container = elem.find('#container')[0];
        var id = "gmaps_" + Math.random().toString(36).substr(2, 16);
        container.id = id;
        scope.id = id;

        function configChanged(config, oldConfig) {

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


        function resize(width, height) {

        }  

       
        function dataUpdate(data) {
            if ((data == null) || (data.Rows.length == 0)) {
                return;
            }
        }

        $(window).bind('gMapsLoaded', scope.startGoogleMaps);
        loadGoogleMaps();
    }

    PV.symbolCatalog.register(definition);
})(window.PIVisualization);