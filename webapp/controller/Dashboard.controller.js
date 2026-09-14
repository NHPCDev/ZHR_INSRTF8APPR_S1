sap.ui.define([
    "com/nhpc/zhrinsrtf8apprs1/controller/BaseController",
    "sap/m/MessageToast",
    "com/nhpc/zhrinsrtf8apprs1/util/messenger",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "sap/ui/export/Spreadsheet",
    "com/nhpc/zhrinsrtf8apprs1/util/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/SearchField",
    "sap/ui/export/library",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox",
    "sap/ui/table/Column",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/Label",
    "sap/m/ColumnListItem"
], function (
    BaseController,
    MessageToast,
    messenger,
    Fragment,
    ValueState,
    Spreadsheet,
    formatter,
    Filter,
    FilterOperator,
    JSONModel,
    SearchField,
    exportLibrary,
    BusyIndicator, MessageBox, UIColumn, MColumn, Text, Label, ColumnListItem
) {
    "use strict";

    const EdmType = exportLibrary.EdmType;

    return BaseController.extend(
        "com.nhpc.zhrinsrtf8apprs1.controller.Dashboard",
        {
            formatter: formatter,
            onInit: function () {
                this.getRouter().getRoute("RouteDashboard").attachPatternMatched(this._onRoutePatternMatched, this);
            },

            _onRoutePatternMatched: function () {
                var oViewModel = this.getModel("viewModel");
                var bAuthorized = oViewModel.getProperty("/isAuthorized");

                // Block unauthorized users from loading Dashboard
                if (bAuthorized !== true) {
                    this.getRouter().navTo("RouteErrorPage", {}, true);
                    return;
                }
                this.getModel().refresh();
                this.oEmployeeModel = new JSONModel(sap.ui.require.toUrl("com/nhpc/zhrinsrtf8apprs1/model") + "/employeeVH.json");


            },

            onAfterRendering: function () {
                this.getView().addStyleClass("sapUiSizeCompact");
            },

            onExport: function () {

                var oTable = this.byId("idDashboardTable");
                var aContexts = oTable.getBinding("items").getContexts();

                var aExportData = aContexts.map(function (oContext) {

                    var oItem = oContext.getObject();
                    return {
                        EmployeeName: oItem.EmployeeName,
                        Pernr: oItem.Pernr,
                        // LocationId: oItem.LocationId,
                        // Division: oItem.Division,
                        // Year: oItem.Fyear,
                        // Period: oItem.Period,
                        // CreatedOn: this.formatter.formatDate(oItem.CreatedOn),
                        ConfirmedOn: this.formatter.formatDate(oItem.ConfirmedOn),
                        // ApprovedOn: this.formatter.formatDate(oItem.ApprovedOn),
                        RejectedOn: this.formatter.formatDate(oItem.RejectedOn),
                        // To: this.formatter.formatDate(oItem.DateTo),
                        // CreatedBy: oItem.CreatedBy,
                        // RecommendedBy: oItem.RecommendedBy,
                        // ApprovedBy: oItem.ApprovedBy,
                        // AuthorizedBy: oItem.AuthorizedBy,
                        Status: this.formatter.formatStatusText(oItem.Status)
                    };

                }.bind(this));

                var sFileName = this.getResourceBundle().getText("excelTitle") + ".xlsx";

                var oSettings = {
                    workbook: {
                        columns: this.createColumnConfig()
                    },
                    dataSource: aExportData,
                    fileName: sFileName
                };

                var oSheet = new Spreadsheet(oSettings);

                oSheet.build().finally(function () {
                    oSheet.destroy();
                });
            },
            createColumnConfig: function () {

                var oResourceBundle = this.getResourceBundle();

                return [
                    {
                        label: oResourceBundle.getText("employeeIdLabel"),
                        property: "EmployeeName"
                    },
                    {
                        label: oResourceBundle.getText("EmployeeNameLabel"),
                        property: "Pernr"
                    },
                    // {
                    //     label: oResourceBundle.getText("LocationId"),
                    //     property: "LocationId"
                    // },
                    // {
                    //     label: oResourceBundle.getText("createdOnLabel"),
                    //     property: "CreatedOn"
                    // },
                    {
                        label: oResourceBundle.getText("ConfirmedOn"),
                        property: "ConfirmedOn"
                    },
                    // {
                    //     label: oResourceBundle.getText("ApprovedOn"),
                    //     property: "ApprovedOn"
                    // },
                    {
                        label: oResourceBundle.getText("RejectedOn"),
                        property: "RejectedOn"
                    },
                    // {
                    //     label: oResourceBundle.getText("year"),
                    //     property: "Year"
                    // },
                    // {
                    //     label: oResourceBundle.getText("period"),
                    //     property: "Period"
                    // },
                    // {
                    //     label: oResourceBundle.getText("from"),
                    //     property: "From"
                    // },
                    // {
                    //     label: oResourceBundle.getText("to"),
                    //     property: "To"
                    // },
                    // {
                    //     label: oResourceBundle.getText("createdBy"),
                    //     property: "CreatedBy"
                    // },
                    // {
                    //     label: oResourceBundle.getText("recommendedBy"),
                    //     property: "RecommendedBy"
                    // },
                    // {
                    //     label: oResourceBundle.getText("approvedBy"),
                    //     property: "ApprovedBy"
                    // },
                    // {
                    //     label: oResourceBundle.getText("authorizedBy"),
                    //     property: "AuthorizedBy"
                    // },
                    {
                        label: oResourceBundle.getText("status"),
                        property: "Status"
                    }
                ];

            },

            onFilterClear: function () {
                // added by rudra
                var oViewModel = this.getModel("viewModel");

                // Reset filter values
                oViewModel.setProperty("/filterData", {
                    RequestNumber: "",
                    Year: "",
                    Quarter: "",
                    Status: "",
                });

                // Clear table filters
                var oTable = this.byId("idDashboardTable");
                oTable.getBinding("items").filter([]);
            },

            onManageTaskTableUpdateFinish(oEvent) {
                var oResourceBundle = this.getResourceBundle(),
                    iCount = oEvent.getParameter("total");
                var sTitle = oResourceBundle.getText("compliancedashboardTitle") + " (" + iCount + ")";
                this.byId("idDashboardTitle").setText(sTitle);
            },

            onDashboardFilterSearch() {
                var oTable = this.byId("idDashboardTable"),
                    oFilterData = this._getTableFilters();

                if (oFilterData.aFilters[0].aFilters.length) {
                    oTable.getBinding("items").filter(oFilterData.aFilters);
                } else {
                    oTable.getBinding("items").filter([]);
                }

            },
            _getTableFilters() {
                var oViewModel = this.getModel("viewModel"),
                    oFilterData = oViewModel.getProperty("/filterData"),
                    aSearchFilter = [];

                // Request Number
                if (oFilterData.empId) {
                    aSearchFilter.push(this.createFilter("Pernr", "Contains", oFilterData.empId));
                };
                // Financial Year
                // if (oFilterData.Year) {
                //     aSearchFilter.push(this.createFilter("Fyear", "EQ", oFilterData.Year));
                // };
                // // Quarter
                // if (oFilterData.Quarter && oFilterData.Quarter !== "ALL") {
                //     aSearchFilter.push(this.createFilter("Period", "EQ", oFilterData.Quarter));
                // };
                // Status
                if (oFilterData.Status) {
                    aSearchFilter.push(this.createFilter("Status", "EQ", oFilterData.Status));
                }

                return {
                    aFilters: [
                        new Filter({
                            filters: aSearchFilter,
                            and: true
                        })
                    ]
                };
            },


            handleCreateBtnPress: function () {
                var oViewModel = this.getModel("viewModel");

                this.getRouter().navTo("RouteDetail", {
                    Pernr: "NEW"
                })
            },
            handleOnItemPress: function (oEvent) {
                var oContext = oEvent.getSource().getBindingContext();
                var Pernr = oContext.getProperty("Pernr");
                var UserName = oContext.getProperty("Userid");
                this.getRouter().navTo("RouteDetail", {
                    Pernr: Pernr,
                    UserName: UserName,
                    InternalID: oContext.getProperty("InternalID")
                })
            },
            // onValueHelpRequest: async function (oEvent) {
            //     this._oInput = oEvent.getSource();
            //     if (!this._oValueHelpDialog) {
            //         this._oValueHelpDialog = await Fragment.load({
            //             id: this.getView().getId(),
            //             name: "com.nhpc.zhrinsrtf8apprs1.fragments.EmployeeValueHelp",
            //             controller: this
            //         });
            //         this.getView().addDependent(this._oValueHelpDialog);
            //     }
            //     this._oValueHelpDialog.open();
            // },
            // onValueHelpSearch: function (oEvent) {
            //     var sValue = oEvent.getParameter("value");

            //     var oFilter = new Filter(
            //         "Empid",
            //         FilterOperator.Contains,
            //         sValue
            //     );

            //     var oFilter2 = new Filter(
            //         "FullName",
            //         FilterOperator.Contains,
            //         sValue
            //     );

            //     var oCombinedFilter = new Filter({
            //         filters: [oFilter, oFilter2],
            //         and: false
            //     });

            //     oEvent.getSource()
            //         .getBinding("items")
            //         .filter([oCombinedFilter]);
            // },
            // onValueHelpClose: function (oEvent) {
            //     var oSelectedItem = oEvent.getParameter("selectedItem");
            //     if (oSelectedItem) {
            //         // this._oInput.setValue(oSelectedItem.getTitle());
            //         // this.getModel("viewModel").setProperty("/filterData/Pernr", oSelectedItem.getTitle());
            //         var sEmpId = oSelectedItem.getTitle();
            //         this.getModel("viewModel").setProperty("/filterData/empId", sEmpId);
            //     }
            // },
            onInputChange: function (oEvent) {
                var oSrc = oEvent.getSource(),
                    sValue = oEvent.getParameter("value");
                if (sValue) {
                    oSrc.setValueState(ValueState.None);
                    oSrc.setValueStateText(null);
                }
            },
            //new value help logic
            //for value help for employee id
            fnGetValueHelpDetails: function (sValueHelp) {
                var oValueHelp = {};
                var sPath = "com.nhpc.zhrinsrtf8apprs1.";
                var sMultiInputValueHelpFragmentPath = "fragments.MultiInputValueHelp";

                if (sValueHelp === "EmployeeFilterInput") {
                    oValueHelp = {
                        model: this.oEmployeeModel,
                        ValueHelpFragmentPath: sPath + sMultiInputValueHelpFragmentPath,
                        bindingpath: "/ZHR_CDS_IT_EMPLOYEE_F4H",
                        input: this._currSource,
                        maxLength: 20
                    };
                }

                return oValueHelp;
            },
            _configureEmployeeVH: function (oDialog) {
                oDialog.setTitle(this.getText("employeeIdVHTitle"));
                oDialog.setKey("Empid");
                oDialog.setDescriptionKey("FullName");
                oDialog.setSupportMultiselect(false);
                oDialog.setSupportRanges(false);
            },
            onFilterBarSearch: function () {
                var sSearch = this._oBasicSearchField.getValue();
                this._performVHSearch(sSearch);
            },
            _performVHSearch: function (sValue) {

                var oFilter = new Filter({
                    filters: [
                        new Filter(
                            "Empid",
                            FilterOperator.Contains,
                            sValue
                        ),
                        new Filter(
                            "FullName",
                            FilterOperator.Contains,
                            sValue
                        )
                    ],
                    and: false
                });

                this._filterTable(oFilter);
            },
            _filterTable: function (oFilter) {

                var oDialog = this._oValueHelpDialog;

                oDialog.getTableAsync().then(function (oTable) {

                    if (oTable.bindRows) {

                        var oBinding = oTable.getBinding("rows");

                        if (oBinding) {
                            oBinding.filter(oFilter);
                        }
                    }

                    if (oTable.bindItems) {

                        var oItemBinding = oTable.getBinding("items");

                        if (oItemBinding) {
                            oItemBinding.filter(oFilter);
                        }
                    }

                    oDialog.update();

                });
            },
            onValueHelpCancelPress: function () {
                this._oValueHelpDialog.close();
            },
            onValueHelpAfterClose: function () {
                this._oValueHelpDialog.destroy();
                this._oValueHelpDialog = null;
            },
            onValueHelpRequest: function (oEvent) {

                var oSource = oEvent.getSource();
                this._currSource = oSource;
                var sValueHelpName = oSource.data("valuehelp");
                var oValueHelp = this.fnGetValueHelpDetails(sValueHelpName);
                var aCols = oValueHelp.model.getData().cols;
                this._oBasicSearchField = new SearchField();

                Fragment.load({
                    id: this.getView().getId(),
                    name: oValueHelp.ValueHelpFragmentPath,
                    controller: this
                }).then(function (oDialog) {

                    this._oValueHelpDialog = oDialog;
                    this.getView().addDependent(this._oValueHelpDialog);
                    this._configureEmployeeVH(this._oValueHelpDialog);
                    var oFilterBar = this._oValueHelpDialog.getFilterBar();
                    oFilterBar.setFilterBarExpanded(false);
                    oFilterBar.setBasicSearch(this._oBasicSearchField);

                    this._oBasicSearchField.attachSearch(function () {
                        this.onFilterBarSearch();
                    }.bind(this));

                    this._oBasicSearchField.setMaxLength(oValueHelp.maxLength);

                    this._oValueHelpDialog.getTableAsync().then(function (oTable) {

                        oTable.setModel(this.getModel());

                        // if (oTable.bindRows) {

                        //     oTable.bindAggregation("rows", {
                        //         path: oValueHelp.bindingpath
                        //     });

                        //     aCols.forEach(function (oCol) {

                        //         var oColumn = new UIColumn({
                        //             label: new Label({
                        //                 text: oCol.label
                        //             }),
                        //             template: new Text({
                        //                 text: "{" + oCol.template + "}"
                        //             })
                        //         });

                        //         oTable.addColumn(oColumn);
                        //     });
                        // }
                        if (oTable.bindRows) {

                            oTable.bindAggregation("rows", {
                                path: oValueHelp.bindingpath
                            });

                            var oRowBinding = oTable.getBinding("rows");

                            if (oRowBinding) {

                                oRowBinding.attachChange(function () {

                                    this._updateValueHelpCount();

                                }.bind(this));

                            }

                            aCols.forEach(function (oCol) {

                                var oColumn = new UIColumn({
                                    label: new Label({
                                        text: oCol.label
                                    }),
                                    template: new Text({
                                        text: "{" + oCol.template + "}"
                                    })
                                });

                                oTable.addColumn(oColumn);
                            });
                        }

                        if (oTable.bindItems) {

                            oTable.bindAggregation("items", {
                                path: oValueHelp.bindingpath,
                                template: new ColumnListItem({
                                    cells: aCols.map(function (oCol) {
                                        return new Label({
                                            text: "{" + oCol.template + "}"
                                        });
                                    })
                                })
                            });

                            aCols.forEach(function (oCol) {

                                oTable.addColumn(
                                    new MColumn({
                                        header: new Label({
                                            text: oCol.label
                                        })
                                    })
                                );
                            });
                        }

                        this._oValueHelpDialog.update();

                        setTimeout(function () {
                            this._updateValueHelpCount();
                        }.bind(this), 0);

                    }.bind(this));

                    this._oValueHelpDialog.open();

                }.bind(this));
            },
            onValueHelpOkPress: function (oEvent) {

                var aTokens = oEvent.getParameter("tokens");

                if (aTokens && aTokens.length) {

                    var oSelectedData = aTokens[0].getCustomData()[0].getValue();

                    this.getModel("viewModel").setProperty("/filterData/empId", oSelectedData.Empid);
                }

                this._oValueHelpDialog.close();
            },
            onValueHelpChange: function (oEvent) {

                var sEmpId = oEvent.getParameter("value");
                var oInput = oEvent.getSource();

                if (!sEmpId) {
                    this.getModel("viewModel").setProperty("/filterData/empId", "");
                    return;
                }
                if (!/^\d+$/.test(sEmpId)) {
                    oInput.setValue("");
                    this.getModel("viewModel").setProperty("/filterData/empId", "");
                    return;
                }

                this.getModel().read("/ZHR_CDS_IT_EMPLOYEE_F4H", {
                    filters: [
                        new Filter(
                            "Empid",
                            FilterOperator.EQ,
                            sEmpId
                        )
                    ],

                    success: function (oData) {

                        if (oData.results.length > 0) {

                            this.getModel("viewModel")
                                .setProperty("/filterData/empId", oData.results[0].Empid);

                        } else {

                            oInput.setValue("");

                            this.getModel("viewModel")
                                .setProperty("/filterData/empId", "");

                        }

                    }.bind(this),

                    error: function () {

                        oInput.setValue("");

                        this.getModel("viewModel")
                            .setProperty("/filterData/empId", "");

                    }.bind(this)

                });

            },

            // added for count in emp f4
            _updateValueHelpCount: function () {

                var oDialog = this._oValueHelpDialog;

                if (!oDialog) {
                    return;
                }

                oDialog.getTableAsync().then(function (oTable) {

                    var oBinding = oTable.getBinding("rows");

                    if (!oBinding) {
                        return;
                    }

                    var iCount = oBinding.getLength();

                    var aControls = oDialog.findAggregatedObjects(true, function (oControl) {

                        return (
                            (oControl.isA("sap.m.Title") ||
                                oControl.isA("sap.m.Text")) &&
                            oControl.getText &&
                            oControl.getText().indexOf("Items") === 0
                        );

                    });

                    if (aControls.length > 0) {

                        aControls[0].setText("Items (" + iCount + ")");

                    }

                });
            },




        });
});