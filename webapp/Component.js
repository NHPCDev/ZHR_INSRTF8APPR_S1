sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/nhpc/zhrinsrtf8apprs1/model/models",
    "com/nhpc/zhrinsrtf8apprs1/util/messenger",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (UIComponent, models, messenger, Filter, FilterOperator) => {
    "use strict";

    return UIComponent.extend("com.nhpc.zhrinsrtf8apprs1.Component", {
        metadata: {
            manifestFirst: true,
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            // this.getRouter().initialize();
            this.setModel(models.createViewModel(), "viewModel");
            messenger.init(this);

            this._checkEligibility();
        },
        _checkEligibility: function () {

            var oModel = this.getModel();
            var oViewModel = this.getModel("viewModel");

            var aFilters = [
               new Filter("FormNo", FilterOperator.EQ, "8")
            ];

            oModel.read("/CheckAuthSet", {
                filters: aFilters,

                success: function (oResponse) {

                    var bAuthorized = true;

                    if (oResponse.results && oResponse.results.length > 0 && oResponse.results[0].AuthResponse === "No") {
                        bAuthorized = false;
                    }

                    // Store authorization result globally
                    oViewModel.setProperty("/isAuthorized", bAuthorized);

                    // Initialize router only after authorization check
                    this.getRouter().initialize();

                    if (!bAuthorized) {
                        this.getRouter().navTo("RouteErrorPage", {}, true);
                    }
                }.bind(this),

                error: function () {

                    oViewModel.setProperty("/isAuthorized", false);
                    this.getRouter().initialize();

                    this.getRouter().navTo("RouteErrorPage", {}, true);

                }.bind(this)
            });

        }
    });
});