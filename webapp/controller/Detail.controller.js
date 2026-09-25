sap.ui.define([
    "com/nhpc/zhrinsrtf8apprs1/controller/BaseController",
    "com/nhpc/zhrinsrtf8apprs1/util/messenger",
    "com/nhpc/zhrinsrtf8apprs1/util/formatter",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/Fragment",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"

], function (BaseController, messenger, formatter, BusyIndicator, Fragment, Sorter, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("com.nhpc.zhrinsrtf8apprs1.controller.Detail", {

        formatter: formatter,
        onInit: function () {

            this.getRouter().getRoute("RouteDetail").attachPatternMatched(this._onRoutePatternMatched, this);

        },
        onAfterRendering: function () {
            this.getView().addStyleClass("sapUiSizeCompact");

        },
        _onRoutePatternMatched:async function (oEvent) {
            this.getModel().refresh();
            var oViewModel = this.getModel("viewModel");

            var sPernr = oEvent.getParameter("arguments").Pernr
            var Userid = oEvent.getParameter("arguments").UserName
            var sInternalID = oEvent.getParameter("arguments").InternalID
            oViewModel.setProperty("/InternalID", sInternalID);
            await this._getEmployeeDetails(Userid);
            if (sPernr === "NEW") {
                oViewModel.setProperty("/mode", "Create");
                // this._initializeCreateData();
                this._loadPreviewData();
            } else {
                oViewModel.setProperty("/mode", "Display");
                this._loadData(sPernr,sInternalID); 
                this._getHistoryWithRemarksData(sPernr,sInternalID);
            }
            this._getEmployeeDetails(Userid);


        },
        _loadPreviewData: function () {

            var oModel = this.getModel();
            var oViewModel = this.getModel("viewModel");

            BusyIndicator.show();

            oModel.read("/Form8HeadSet", {

                filters: [
                    new Filter("Preview",
                        FilterOperator.EQ,
                        "X")
                ],

                success: function (oData) {

                    BusyIndicator.hide();

                    if (!oData.results.length) {
                        return;
                    }

                    var oHeader = oData.results[0];
                    // Set New status for Create mode
                    oHeader.Status = "New";

                    oViewModel.setProperty(
                        "/Header",
                        oHeader
                    );

                    oViewModel.setProperty(
                        "/SelfDetails",
                        []
                    );

                    oViewModel.setProperty(
                        "/RelativeDetails",
                        []
                    );

                    oViewModel.setProperty(
                        "/editable",
                        true
                    );

                }.bind(this),

                error: function (oError) {

                    BusyIndicator.hide();

                    messenger.error("Unable to load data");

                }

            });

        },
        _loadData: function (sPernr, sInternalID) {
            var oViewModel = this.getModel("viewModel");
            var oModel = this.getModel();

            BusyIndicator.show();
            oModel.read("/Form8HeadSet", {
                filters: [
                    new Filter("Pernr", FilterOperator.EQ, sPernr),
                    new Filter("InternalID", FilterOperator.EQ, sInternalID)
                ],
                urlParameters: {
                    "$expand": "SELF_RECORDS,RELATIVE_RECORDS"
                },
                success: function (oData) {
                    BusyIndicator.hide();
                    if (!oData.results.length) {
                        return;
                    }

                    var oHeader = oData.results[0];
                    oViewModel.setProperty("/Header", oHeader);
                    oViewModel.setProperty("/EmpDetails/DESIG", oHeader.Designation);
                    oViewModel.setProperty("/EmpDetails/DEP", oHeader.Department);

                    var aSelfDetails = oHeader.SELF_RECORDS.results || [];
                    aSelfDetails.forEach(function (oItem, iIndex) {
                        oItem.SelfNo = String(iIndex + 1);
                    });
                    oViewModel.setProperty("/SelfDetails", aSelfDetails);
                    // oViewModel.setProperty("/RelativeDetails", oHeader.RELATIVE_RECORDS.results || []);
                    var aRelativeDetails = oHeader.RELATIVE_RECORDS.results || [];

                    aRelativeDetails.forEach(function (oItem, iIndex) {
                        oItem.SlNo = String(iIndex + 1);
                    });
                    oViewModel.setProperty("/RelativeDetails", aRelativeDetails);

                    oViewModel.setProperty("/editable", false);

                }.bind(this),
                error: function (oError) {
                    BusyIndicator.hide();
                    if (oError.statusCode == "500") {
                        let xmlDoc = new DOMParser().parseFromString(oError.responseText, "application/xml");
                        messenger.error(xmlDoc.getElementsByTagName("message")[0].textContent);
                    } else {
                        messenger.error(JSON.parse(oError.responseText).error.message.value);
                    }

                }.bind(this)

            })
        },
        _getHistoryWithRemarksData: function (Pernr,sInternalID) {
            var oModel = this.getOwnerComponent().getModel();
            var oVM = this.getModel("viewModel");

            var aFilters = [
                new Filter("Pernr", FilterOperator.EQ, Pernr),
                new Filter("ApplicationNo", FilterOperator.EQ, sInternalID),
                new Filter("FormNo", FilterOperator.EQ, "FORM8")
            ];
            BusyIndicator.show();
            oModel.read("/RemarkHistorySet", {
                filters: aFilters,
                success: function (oData) {
                    BusyIndicator.hide();
                    oVM.setProperty("/History", oData.results);
                    // console.log("History Data", oData.results);
                }.bind(this),

                error: function (oError) {

                    BusyIndicator.hide();

                    if (oError.statusCode === "500") {
                        var xmlDoc = new DOMParser().parseFromString(oError.responseText, "application/xml");
                        messenger.error(xmlDoc.getElementsByTagName("message")[0].textContent);
                    } else {
                        messenger.error(JSON.parse(oError.responseText).error.message.value);
                    }

                }.bind(this)
            });
        },
       _getEmployeeDetails: async function (Userid) {
            var oModel = this.getOwnerComponent().getModel();
            var oVM = this.getModel("viewModel");
            var aFilters = [];

            if (Userid) {
                aFilters.push(
                    new Filter( "USRID", FilterOperator.EQ, Userid)
                );
            } else {
                aFilters.push(
                    new Filter( "DFLT", FilterOperator.EQ, "X")
                );
            }
            BusyIndicator.show();
            return new Promise((resolve, reject) => {
                oModel.read("/ZFI_GH_USER_F4", {
                    filters: aFilters,
                    success: function (oData) {
                        BusyIndicator.hide();

                        if (oData.results.length > 0) {

                            var oEmp = oData.results[0];

                            oVM.setProperty("/EmpDetails", oEmp);
                            // console.log("Employee Details", oEmp);
                            if(Userid){
                                oVM.setProperty("/EmpDetails/DESIG", "");
                                oVM.setProperty("/EmpDetails/DEP", "");
                            }

                        }
                        resolve()
                    }.bind(this),

                    error: function (oError) {

                        BusyIndicator.hide();

                        if (oError.statusCode === "500") {
                            var xmlDoc = new DOMParser().parseFromString(oError.responseText, "application/xml");
                            messenger.error(xmlDoc.getElementsByTagName("message")[0].textContent);
                        } else {
                            messenger.error(JSON.parse(oError.responseText).error.message.value);
                        }

                    }.bind(this)
                });
            })
        },
        _initializeCreateData: function () {
            var oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/editable", true);
            oViewModel.setProperty("/Header", {
                DPClientID: "",
                DateOfJoiningDP: "",
                NoOfSecuritiesheld: "",
                Status: "New"
            });
            oViewModel.setProperty("/RelativeDetails", []);
        },
        onManageRelativeTableUpdateFinish(oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                iCount = oEvent.getParameter("total");
            var sTitle = oResourceBundle.getText("ManageRelativeTableTitle") + " (" + iCount + ")";
            this.byId("idRelativeTableTitles").setText(sTitle);
        },

        handlePostBtnPress: function (oEvent) {
            var sBtnId = oEvent.getSource().getId();

            if (sBtnId.indexOf("idSaveBtn") > -1) {
                this.sActionFlag = "Draft"
            } else if (sBtnId.indexOf("idSubmitBtn") > -1) {
                this.sActionFlag = "Confirmed"
            }

            //madatory validations
            if (!this.validateMandatoryFields()) {
                return;
            }

            var sConfirmMessage = this.sActionFlag === "Draft" ? this.getText("beforeSaveSuccessMsg") : this.getText("confirmationMessage");

            messenger.confirm(this.getText("confirmationTitle"), sConfirmMessage, this.getText("cnfBtnTxt"), this.getText("cancelBtn"),
                function () {

                    this._saveData(this.sActionFlag);

                }.bind(this)
            );

        },
        _saveData: function (sActionFlag) {

            var oViewModel = this.getModel("viewModel");
            var oModel = this.getModel();

            var oHeader = oViewModel.getProperty("/Header");
            var aRelative = oViewModel.getProperty("/RelativeDetails") || [];
            var aSelfDetails = oViewModel.getProperty("/SelfDetails") || [];

            var aSelfPayload = aSelfDetails.map(function (oItem) {

                return {
                    Pernr: oHeader.Pernr,
                    DPClientID: oItem.DPClientID,
                    NoOfSecuritiesheld: oItem.NoOfSecuritiesheld,
                    InternalID: oHeader.InternalID
                };

            });
            // var aRelativePayload = aRelative.map(function (oItem) {

            //     return Object.assign({}, oItem, {
            //         Pernr: oHeader.Pernr
            //     });

            // });
            var aRelativePayload = aRelative.map(function (oItem) {

                var oPayloadItem = Object.assign({}, oItem, {
                    Pernr: oHeader.Pernr,
                    InternalID: oHeader.InternalID
                });

                delete oPayloadItem.SlNo;

                return oPayloadItem;

            });


            // var oPayload = {
            //     DPClientID: oHeader.DPClientID,
            //     // DateOfJoiningDP: oHeader.DateOfJoiningDP,
            //     NoOfSecuritiesheld: oHeader.NoOfSecuritiesheld,
            //     Institution: oHeader.Institution,
            //     PastEmployer: oHeader.PastEmployer,
            //     Status: sActionFlag,

            //     RELATIVE_RECORDS: aRelative
            // };

            var oPayload = {

                Institution: oHeader.Institution,
                PastEmployer: oHeader.PastEmployer,
                Status: sActionFlag,
                DateOfJoiningDP: oHeader.DateOfJoiningDP,

                SELF_RECORDS: aSelfPayload,

                RELATIVE_RECORDS: aRelativePayload

            };
            if(oHeader.InternalID){
                oPayload.InternalID = oHeader.InternalID
            }
            console.log("Payload For Create", oPayload);

            BusyIndicator.show();

            oModel.create("/Form8HeadSet", oPayload, {

                success: function (oData) {
                    // console.log("odata", oData)

                    BusyIndicator.hide();
                    var sDPClientID = oData.DPClientID;
                    var sMessage = sActionFlag === "Draft" ? this.getText("saveSuccessMessage") : this.getText("submitSuccessMessage");
                    // var sMessage = sActionFlag === "Draft" ? this.getText("saveSuccessMessage", [sDPClientID]) : this.getText("submitSuccessMessage", [sDPClientID]);

                    messenger.success(sMessage,
                        function () {
                            this.onNavBack();
                        }.bind(this)
                    );

                }.bind(this),

                error: function (oError) {

                    BusyIndicator.hide();

                    if (oError.statusCode === "500") {
                        var xmlDoc = new DOMParser().parseFromString(oError.responseText, "application/xml");
                        messenger.error(xmlDoc.getElementsByTagName("message")[0].textContent);
                    } else {
                        messenger.error(JSON.parse(oError.responseText).error.message.value);
                    }

                }.bind(this)

            });

        },

        onAddRelative: function () {
            var oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/relativePopupUI", {
                RelationOfImmediateRelativeEditable: false,
                OthersEditable: false,
                FinancialGuideEditable: false
            });

            if (!this._addRelativeDialog) {
                this._addRelativeDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "com.nhpc.zhrinsrtf8apprs1.fragments.AddRelativePopup",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    oDialog.addStyleClass("sapUiSizeCompact");

                    return oDialog;
                }.bind(this));
            }

            this._addRelativeDialog.then(function (oDialog) {
                oViewModel.setProperty("/popupMode", "Create");
                oViewModel.setProperty("/selectedRelativeIndex", -1);
                oViewModel.setProperty("/RelativePopup", this._getEmptyRelativePopupData());
                this.resetRelativePopupValidation();
                oDialog.open();
            }.bind(this));
        },
        onRelativePopupSubmit: function () {
            //mandatory check
            if (!this.validateRelativePopupFields()) {
                return;
            }

            var oViewModel = this.getModel("viewModel");
            var oRelativeData = Object.assign({}, oViewModel.getProperty("/RelativePopup"));
            var aRelativesDetails = oViewModel.getProperty("/RelativeDetails");

            if (oViewModel.getProperty("/popupMode") === "Edit") {

                var iIndex = oViewModel.getProperty("/selectedRelativeIndex");

                aRelativesDetails[iIndex] = oRelativeData;


            } else {
                oRelativeData.SlNo = String(aRelativesDetails.length + 1);

                aRelativesDetails.push(oRelativeData);
            }

            oViewModel.setProperty("/RelativeDetails", aRelativesDetails);
            oViewModel.setProperty("/RelativePopup", this._getEmptyRelativePopupData());
            this.removeTableSelection()
            //close the popup
            this._addRelativeDialog.then(function (oDialog) {
                oDialog.close();
            });


        },
        onRelativePopupClose: function () {

            if (this._addRelativeDialog) {
                this._addRelativeDialog.then(function (oDialog) {

                    oDialog.close();

                });
            }
        },
        _getEmptyRelativePopupData: function () {
            return {
                RelativeType: "",

                PanNoSelf: "",
                EmailIdSelf: "",
                MobileNo: "",
                MaritalStatus: "",

                NameOfImmediateRelatives: "",
                RelationOfImmediateRelative: "",
                Relation: "",
                Others: "",

                PhoneNoOfImmediateRelative: "",
                PanOfImmediateRelative: "",

                NameOfFinancialGuide: "",
                PhoneNoOfFinancialGuide: "",
                PanOfOfFinancialGuide: "",

                NoOfSecuritiesheld: "",
                DPClientID: ""
            };
        },
        onEditRelative: function () {
            var oViewModel = this.getModel("viewModel");
            var aSelectedItems = this._getSelectedRelativeItems();

            if (aSelectedItems.length !== 1) {
                messenger.error(this.getText("selectRecordToEdit"));
                return;
            }

            var oSelectedItem = aSelectedItems[0];
            var oContext = oSelectedItem.getBindingContext("viewModel");
            var oRelativeData = Object.assign({}, oContext.getObject());
            var iIndex = parseInt(oContext.getPath().split("/").pop(), 10)

            oViewModel.setProperty("/popupMode", "Edit");
            oViewModel.setProperty("/selectedRelativeIndex", iIndex);
            oViewModel.setProperty("/RelativePopup", oRelativeData);
            this._addRelativeDialog.then(function (oDialog) {
                oDialog.open();
            });
        },
        onDeleteRelative: function () {
            var oViewModel = this.getModel("viewModel");
            var aSelectedItems = this._getSelectedRelativeItems();

            if (!aSelectedItems.length) {
                messenger.error(this.getText("selectRecordToDeleteMsg"));
                return;
            }
            messenger.confirm(this.getText("confirmationTitle"), this.getText("deleteRelativeConfirmationMsg"), this.getText("delete"), this.getText("cancelBtn"),
                function () {
                    var aRelativeDetails = oViewModel.getProperty("/RelativeDetails");
                    var aIndexes = aSelectedItems.map(function (oItem) {
                        return parseInt(oItem.getBindingContext("viewModel").getPath().split("/").pop(), 10);
                    });
                    aIndexes.sort(function (a, b) {
                        return b - a;
                    });
                    aIndexes.forEach(function (iIndex) {
                        aRelativeDetails.splice(iIndex, 1)
                    });
                    aRelativeDetails.forEach(function (oRow, iIndex) {
                        oRow.SlNo = String(iIndex + 1);
                    });
                    oViewModel.setProperty("/RelativeDetails", aRelativeDetails);
                    this.removeTableSelection();

                    messenger.success(this.getText("deleteSuccessMsg"));
                }.bind(this))
        },
        _getSelectedRelativeItems: function () {
            return this.byId("idrelativeDetailsTables").getSelectedItems();
        },
        removeTableSelection: function () {
            this.byId("idrelativeDetailsTables").removeSelections(true);
        },
        validateMandatoryFields: function () {

            var oViewModel = this.getModel("viewModel");
            var oHeader = oViewModel.getProperty("/Header");
            var aSelfDetails =
                oViewModel.getProperty("/SelfDetails") || [];

            var bValid = true;

            this.resetMandatoryFields();

            // DOJ

            if (!oHeader.DateOfJoiningDP) {

                bValid = false;

                oViewModel.setProperty(
                    "/validation/DateOfJoiningDPState",
                    "Error"
                );

                oViewModel.setProperty(
                    "/validation/DateOfJoiningDPStateText",
                    this.getText("dateOfJoiningMandatoryMsg")
                );

            }

            // Institution

            if (!oHeader.Institution) {

                bValid = false;

                oViewModel.setProperty(
                    "/validation/InstitutionState",
                    "Error"
                );

                oViewModel.setProperty(
                    "/validation/InstitutionStateText",
                    this.getText("institutionMandatoryMsg")
                );

            }

            // Past Employer

            if (!oHeader.PastEmployer) {

                bValid = false;

                oViewModel.setProperty(
                    "/validation/PastEmployerState",
                    "Error"
                );

                oViewModel.setProperty(
                    "/validation/PastEmployerStateText",
                    this.getText("pastEmployerMandatoryMsg")
                );

            }

            // Header validation failed

            if (!bValid) {

                messenger.error(
                    this.getText("mandatoryFieldErrorMsgForAll")
                );

                return false;

            }

            // Self Detail table validation

            if (aSelfDetails.length === 0) {

                messenger.error(
                    this.getText("selfDetailsMandatoryMsg")
                );

                return false;

            }

            return true;

        },
        resetMandatoryFields: function () {

            var oViewModel = this.getModel("viewModel");

            oViewModel.setProperty(
                "/validation/DateOfJoiningDPState",
                "None"
            );

            oViewModel.setProperty(
                "/validation/DateOfJoiningDPStateText",
                ""
            );

            oViewModel.setProperty(
                "/validation/InstitutionState",
                "None"
            );

            oViewModel.setProperty(
                "/validation/InstitutionStateText",
                ""
            );

            oViewModel.setProperty(
                "/validation/PastEmployerState",
                "None"
            );

            oViewModel.setProperty(
                "/validation/PastEmployerStateText",
                ""
            );

        },
        onManageRelativeTableUpdateFinish(oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                iCount = oEvent.getParameter("total");
            var sTitle = oResourceBundle.getText("ManageRelativeTableTitle") + " (" + iCount + ")";
            this.byId("idRelativeTableTitles").setText(sTitle);
        },

        // onImmediateRelativeChange: function (oEvent) {
        //     var oViewModel = this.getModel("viewModel");
        //     var oSelectedItem = oEvent.getSource().getSelectedItem();

        //     if (!oSelectedItem) {
        //         return;
        //     }

        //     var oRelativeData = oSelectedItem.getBindingContext().getObject();

        //     if (oRelativeData.RelativeName === "Others") {

        //         oViewModel.setProperty("/relativePopupUI/OthersEditable", true);
        //         oViewModel.setProperty("/relativePopupUI/RelationOfImmediateRelativeEditable", true);
        //         oViewModel.setProperty("/relativePopupUI/PhoneNoOfImmediateRelativeEditable", true);
        //         oViewModel.setProperty("/relativePopupUI/PanOfImmediateRelativeEditable", true);
        //         oViewModel.setProperty(
        //             "/RelativePopup/RelationOfImmediateRelative",
        //             ""
        //         );

        //     } else if (oRelativeData.RelativeName === "Nil") {

        //         oViewModel.setProperty("/relativePopupUI/OthersEditable", false);
        //         oViewModel.setProperty("/relativePopupUI/RelationOfImmediateRelativeEditable", false);
        //         oViewModel.setProperty("/relativePopupUI/PhoneNoOfImmediateRelativeEditable", false);
        //         oViewModel.setProperty("/relativePopupUI/PanOfImmediateRelativeEditable", false);
        //         oViewModel.setProperty("/RelativePopup/Others", "");
        //         oViewModel.setProperty(
        //             "/RelativePopup/RelationOfImmediateRelative",
        //             ""
        //         );
        //         oViewModel.setProperty("/RelativePopup/PhoneNoOfImmediateRelative", "");
        //         oViewModel.setProperty("/RelativePopup/PanOfImmediateRelative", "");
        //         oViewModel.setProperty("/RelativePopup/RelationOfImmediateRelative", "");

        //     } else {

        //         oViewModel.setProperty(
        //             "/relativePopupUI/OthersEditable",
        //             false
        //         );

        //         oViewModel.setProperty(
        //             "/RelativePopup/Others",
        //             ""
        //         );

        //         // Value
        //         oViewModel.setProperty(
        //             "/RelativePopup/Relation",
        //             oRelativeData.RelativeType
        //         );

        //         // Text
        //         oViewModel.setProperty(
        //             "/RelativePopup/RelationOfImmediateRelative",
        //             oRelativeData.RelativeText
        //         );

        //         oViewModel.setProperty(
        //             "/relativePopupUI/PhoneNoOfImmediateRelativeEditable",
        //             true
        //         );

        //         oViewModel.setProperty(
        //             "/relativePopupUI/PanOfImmediateRelativeEditable",
        //             true
        //         );
        //     }


        // },
        onImmediateRelativeChange: function (oEvent) {

            var oViewModel = this.getModel("viewModel");
            var oSelectedItem = oEvent.getSource().getSelectedItem();

            if (!oSelectedItem) {
                return;
            }

            var oRelativeData = oSelectedItem.getBindingContext().getObject();

            if (oRelativeData.RelativeName === "Others") {

                oViewModel.setProperty(
                    "/relativePopupUI/OthersEditable",
                    true
                );

                oViewModel.setProperty(
                    "/relativePopupUI/RelationOfImmediateRelativeEditable",
                    true
                );

                oViewModel.setProperty(
                    "/relativePopupUI/PhoneNoOfImmediateRelativeEditable",
                    true
                );

                oViewModel.setProperty(
                    "/relativePopupUI/PanOfImmediateRelativeEditable",
                    true
                );

                // Send RelativeType = Others
                oViewModel.setProperty(
                    "/RelativePopup/RelativeType",
                    oRelativeData.RelativeType
                );

                // User will enter relationship manually
                oViewModel.setProperty(
                    "/RelativePopup/Relation",
                    ""
                );

                oViewModel.setProperty(
                    "/RelativePopup/RelationOfImmediateRelative",
                    ""
                );

            } else if (oRelativeData.RelativeName === "Nil") {

                oViewModel.setProperty(
                    "/relativePopupUI/OthersEditable",
                    false
                );

                oViewModel.setProperty(
                    "/relativePopupUI/RelationOfImmediateRelativeEditable",
                    false
                );

                oViewModel.setProperty(
                    "/relativePopupUI/PhoneNoOfImmediateRelativeEditable",
                    false
                );

                oViewModel.setProperty(
                    "/relativePopupUI/PanOfImmediateRelativeEditable",
                    false
                );

                oViewModel.setProperty(
                    "/RelativePopup/Others",
                    ""
                );

                // Send RelativeType = Nil
                oViewModel.setProperty(
                    "/RelativePopup/RelativeType",
                    oRelativeData.RelativeType
                );

                oViewModel.setProperty(
                    "/RelativePopup/Relation",
                    ""
                );

                oViewModel.setProperty(
                    "/RelativePopup/RelationOfImmediateRelative",
                    ""
                );

                oViewModel.setProperty(
                    "/RelativePopup/PhoneNoOfImmediateRelative",
                    ""
                );

                oViewModel.setProperty(
                    "/RelativePopup/PanOfImmediateRelative",
                    ""
                );

            } else {

                oViewModel.setProperty(
                    "/relativePopupUI/OthersEditable",
                    false
                );

                oViewModel.setProperty(
                    "/relativePopupUI/RelationOfImmediateRelativeEditable",
                    false
                );

                oViewModel.setProperty(
                    "/RelativePopup/Others",
                    ""
                );

                // Send backend code
                oViewModel.setProperty(
                    "/RelativePopup/RelativeType",
                    oRelativeData.RelativeType
                );

                // Show text in Relation Of Immediate Relative
                oViewModel.setProperty(
                    "/RelativePopup/RelationOfImmediateRelative",
                    oRelativeData.RelativeText
                );

                // Relationship field remains blank
                oViewModel.setProperty(
                    "/RelativePopup/Relation",
                    ""
                );

                oViewModel.setProperty(
                    "/relativePopupUI/PhoneNoOfImmediateRelativeEditable",
                    true
                );

                oViewModel.setProperty(
                    "/relativePopupUI/PanOfImmediateRelativeEditable",
                    true
                );
            }
        },
        onMaterialFinancialGuideChange: function (oEvent) {

            var oViewModel = this.getModel("viewModel");
            var sSelectedKey = oEvent.getSource().getSelectedKey();

            if (sSelectedKey === "Yes") {

                oViewModel.setProperty("/relativePopupUI/FinancialGuideEditable", true);

            } else {

                oViewModel.setProperty("/relativePopupUI/FinancialGuideEditable", false);

                oViewModel.setProperty("/RelativePopup/NameOfFinancialGuide", "");

                oViewModel.setProperty("/RelativePopup/PhoneNoOfFinancialGuide", "");

                oViewModel.setProperty("/RelativePopup/PanOfOfFinancialGuide", "");
            }
        },
        validateRelativePopupFields: function () {

            var oViewModel = this.getModel("viewModel");
            var oPopup = oViewModel.getProperty("/RelativePopup");

            var bValid = true;

            this.resetRelativePopupValidation();

            // Always Mandatory

            if (!oPopup.PanNoSelf) {
                bValid = false;
                oViewModel.setProperty("/relativePopupValidation/PanNoSelfState", "Error");
                oViewModel.setProperty("/relativePopupValidation/PanNoSelfStateText", this.getText("panNoSelfMandatoryMsg"));
            }

            if (!oPopup.MobileNo) {
                bValid = false;
                oViewModel.setProperty("/relativePopupValidation/MobileNoState", "Error");
                oViewModel.setProperty("/relativePopupValidation/MobileNoStateText", this.getText("mobileNoSelfMandatoryMsg"));
            }

            if (!oPopup.EmailIdSelf) {
                bValid = false;
                oViewModel.setProperty("/relativePopupValidation/EmailIdSelfState", "Error");
                oViewModel.setProperty("/relativePopupValidation/EmailIdSelfStateText", this.getText("emailIdSelfMandatoryMsg"));
            }

            if (!oPopup.MaritalStatus) {
                bValid = false;
                oViewModel.setProperty("/relativePopupValidation/MaritalStatusState", "Error");
                oViewModel.setProperty("/relativePopupValidation/MaritalStatusStateText", this.getText("maritalStatusMandatoryMsg"));
            }

            if (!oPopup.NameOfImmediateRelatives) {
                bValid = false;
                oViewModel.setProperty("/relativePopupValidation/NameOfImmediateRelativesState", "Error");
                oViewModel.setProperty("/relativePopupValidation/NameOfImmediateRelativesStateText", this.getText("immediateRelativeMandatoryMsg"));
            }

            if (!oPopup.MaterialFinancialRelationship) {
                bValid = false;
                oViewModel.setProperty("/relativePopupValidation/MaterialFinancialRelationshipState", "Error");
                oViewModel.setProperty("/relativePopupValidation/MaterialFinancialRelationshipStateText", this.getText("materialFinancialGuideMandatoryMsg"));
            }

            if (!oPopup.NoOfSecuritiesheld) {
                bValid = false;
                oViewModel.setProperty("/relativePopupValidation/NoOfSecuritiesheldState", "Error");
                oViewModel.setProperty("/relativePopupValidation/NoOfSecuritiesheldStateText", this.getText("noOfSecuritiesMandatoryMsg"));
            }

            if (!oPopup.DPClientID) {
                bValid = false;
                oViewModel.setProperty("/relativePopupValidation/DPClientIDState", "Error");
                oViewModel.setProperty("/relativePopupValidation/DPClientIDStateText", this.getText("dpClientIdMandatoryMsg"));
            }

            // Others Case

            if (oPopup.NameOfImmediateRelatives === "Others") {

                if (!oPopup.Others) {
                    bValid = false;
                    oViewModel.setProperty("/relativePopupValidation/OthersState", "Error");
                    oViewModel.setProperty("/relativePopupValidation/OthersStateText", this.getText("othersMandatoryMsg"));
                }

                if (!oPopup.Relation) {
                    bValid = false;
                    oViewModel.setProperty(
                        "/relativePopupValidation/RelationState",
                        "Error"
                    );
                    oViewModel.setProperty(
                        "/relativePopupValidation/RelationStateText",
                        this.getText("relationshipMandatoryMsg")
                    );
                }

                if (!oPopup.PhoneNoOfImmediateRelative) {
                    bValid = false;
                    oViewModel.setProperty("/relativePopupValidation/PhoneNoOfImmediateRelativeState", "Error");
                    oViewModel.setProperty("/relativePopupValidation/PhoneNoOfImmediateRelativeStateText", this.getText("phoneNoImmediateRelativeMandatoryMsg"));
                }

                if (!oPopup.PanOfImmediateRelative) {
                    bValid = false;
                    oViewModel.setProperty("/relativePopupValidation/PanOfImmediateRelativeState", "Error");
                    oViewModel.setProperty("/relativePopupValidation/PanOfImmediateRelativeStateText", this.getText("panOfImmediateRelativeMandatoryMsg"));
                }

            }
            // Nil Case
            else if (oPopup.NameOfImmediateRelatives !== "Nil") {

                if (!oPopup.PhoneNoOfImmediateRelative) {
                    bValid = false;
                    oViewModel.setProperty("/relativePopupValidation/PhoneNoOfImmediateRelativeState", "Error");
                    oViewModel.setProperty("/relativePopupValidation/PhoneNoOfImmediateRelativeStateText", this.getText("phoneNoImmediateRelativeMandatoryMsg"));
                }

                if (!oPopup.PanOfImmediateRelative) {
                    bValid = false;
                    oViewModel.setProperty("/relativePopupValidation/PanOfImmediateRelativeState", "Error");
                    oViewModel.setProperty("/relativePopupValidation/PanOfImmediateRelativeStateText", this.getText("panOfImmediateRelativeMandatoryMsg"));
                }

            }

            // Financial Guide = Yes

            if (oPopup.MaterialFinancialRelationship === "Yes") {

                if (!oPopup.NameOfFinancialGuide) {
                    bValid = false;
                    oViewModel.setProperty("/relativePopupValidation/NameOfFinancialGuideState", "Error");
                    oViewModel.setProperty("/relativePopupValidation/NameOfFinancialGuideStateText", this.getText("nameOfFinancialGuideMandatoryMsg"));
                }

                if (!oPopup.PhoneNoOfFinancialGuide) {
                    bValid = false;
                    oViewModel.setProperty("/relativePopupValidation/PhoneNoOfFinancialGuideState", "Error");
                    oViewModel.setProperty("/relativePopupValidation/PhoneNoOfFinancialGuideStateText", this.getText("phoneNoFinancialGuideMandatoryMsg"));
                }

                if (!oPopup.PanOfOfFinancialGuide) {
                    bValid = false;
                    oViewModel.setProperty("/relativePopupValidation/PanOfOfFinancialGuideState", "Error");
                    oViewModel.setProperty("/relativePopupValidation/PanOfOfFinancialGuideStateText", this.getText("panOfFinancialGuideMandatoryMsg"));
                }
            }

            if (!bValid) {
                messenger.error(this.getText("mandatoryFieldErrorMsgForAll"));
                return false;
            }

            return true;
        },
        resetRelativePopupValidation: function () {

            var oViewModel = this.getModel("viewModel");

            oViewModel.setProperty("/relativePopupValidation", {

                PanNoSelfState: "None",
                PanNoSelfStateText: "",

                MobileNoState: "None",
                MobileNoStateText: "",

                EmailIdSelfState: "None",
                EmailIdSelfStateText: "",

                MaritalStatusState: "None",
                MaritalStatusStateText: "",

                NameOfImmediateRelativesState: "None",
                NameOfImmediateRelativesStateText: "",

                OthersState: "None",
                OthersStateText: "",

                RelationOfImmediateRelativeState: "None",
                RelationOfImmediateRelativeStateText: "",

                PhoneNoOfImmediateRelativeState: "None",
                PhoneNoOfImmediateRelativeStateText: "",

                PanOfImmediateRelativeState: "None",
                PanOfImmediateRelativeStateText: "",

                MaterialFinancialRelationshipState: "None",
                MaterialFinancialRelationshipStateText: "",

                NameOfFinancialGuideState: "None",
                NameOfFinancialGuideStateText: "",

                PhoneNoOfFinancialGuideState: "None",
                PhoneNoOfFinancialGuideStateText: "",

                PanOfOfFinancialGuideState: "None",
                PanOfOfFinancialGuideStateText: "",

                NoOfSecuritiesheldState: "None",
                NoOfSecuritiesheldStateText: "",

                DPClientIDState: "None",
                DPClientIDStateText: "",
                RelationState: "None",
                RelationStateText: "",

            });

        },


        // added for new design
        onAddSelf: function () {

            var oViewModel = this.getModel("viewModel");
            this.resetSelfPopupValidation();

            if (!this._addSelfDialog) {

                this._addSelfDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "com.nhpc.zhrinsrtf8apprs1.fragments.AddSelfPopup",
                    controller: this
                }).then(function (oDialog) {

                    this.getView().addDependent(oDialog);
                    oDialog.addStyleClass("sapUiSizeCompact");

                    return oDialog;

                }.bind(this));
            }

            this._addSelfDialog.then(function (oDialog) {

                oViewModel.setProperty("/selfPopupMode", "Create");
                oViewModel.setProperty("/selectedSelfIndex", -1);

                oViewModel.setProperty("/SelfPopup", {
                    SelfNo: "",
                    NoOfSecuritiesheld: "",
                    DPClientID: "",
                });

                oDialog.open();

            });
        },
        onSelfPopupSubmit: function () {

            var oViewModel = this.getModel("viewModel");
            if (!this.validateSelfPopupFields()) {
                return;
            }

            var oSelfData = Object.assign({},
                oViewModel.getProperty("/SelfPopup")
            );

            var aSelfDetails =
                oViewModel.getProperty("/SelfDetails") || [];

            if (oViewModel.getProperty("/selfPopupMode") === "Edit") {

                var iIndex =
                    oViewModel.getProperty("/selectedSelfIndex");

                aSelfDetails[iIndex] = oSelfData;

            } else {

                oSelfData.SelfNo =
                    String(aSelfDetails.length + 1);

                aSelfDetails.push(oSelfData);
            }

            oViewModel.setProperty(
                "/SelfDetails",
                aSelfDetails
            );

            this.removeSelfTableSelection();

            this._addSelfDialog.then(function (oDialog) {
                oDialog.close();
            });

        },
        onSelfPopupClose: function () {

            if (this._addSelfDialog) {

                this._addSelfDialog.then(function (oDialog) {
                    oDialog.close();
                });
                this.removeSelfTableSelection();

            }
        },
        removeSelfTableSelection: function () {

            this.byId("idSelfDetailsTables")
                .removeSelections(true);

        },
        _getSelectedSelfItems: function () {

            return this.byId("idSelfDetailsTables")
                .getSelectedItems();

        },
        onEditSelf: function () {

            var oViewModel = this.getModel("viewModel");

            var aSelectedItems =
                this._getSelectedSelfItems();

            if (aSelectedItems.length !== 1) {

                messenger.error(
                    this.getText("selectRecordToEdit")
                );

                return;
            }

            var oSelectedItem = aSelectedItems[0];

            var oContext =
                oSelectedItem.getBindingContext("viewModel");

            var oSelfData =
                Object.assign({}, oContext.getObject());

            var iIndex =
                parseInt(
                    oContext.getPath().split("/").pop(),
                    10
                );

            oViewModel.setProperty(
                "/selfPopupMode",
                "Edit"
            );

            oViewModel.setProperty(
                "/selectedSelfIndex",
                iIndex
            );

            oViewModel.setProperty(
                "/SelfPopup",
                oSelfData
            );
            this.resetSelfPopupValidation();

            this._getSelfDialog().then(function (oDialog) {
                oDialog.open();
            });

        },
        onDeleteSelf: function () {

            var oViewModel = this.getModel("viewModel");

            var aSelectedItems =
                this._getSelectedSelfItems();

            if (!aSelectedItems.length) {

                messenger.error(
                    this.getText("selectRecordToDeleteMsg")
                );

                return;
            }

            messenger.confirm(
                this.getText("confirmationTitle"),
                this.getText("deleteRelativeConfirmationMsg"),
                this.getText("delete"),
                this.getText("cancelBtn"),

                function () {

                    var aSelfDetails =
                        oViewModel.getProperty("/SelfDetails");

                    var aIndexes =
                        aSelectedItems.map(function (oItem) {

                            return parseInt(
                                oItem.getBindingContext("viewModel")
                                    .getPath()
                                    .split("/")
                                    .pop(),
                                10
                            );

                        });

                    aIndexes.sort(function (a, b) {
                        return b - a;
                    });

                    aIndexes.forEach(function (iIndex) {

                        aSelfDetails.splice(iIndex, 1);

                    });

                    aSelfDetails.forEach(function (oRow, iIndex) {

                        oRow.SelfNo = String(iIndex + 1);

                    });

                    oViewModel.setProperty(
                        "/SelfDetails",
                        aSelfDetails
                    );

                    this.removeSelfTableSelection();

                    messenger.success(
                        this.getText("deleteSuccessMsg")
                    );

                }.bind(this)

            );

        },
        _getSelfDialog: function () {

            if (!this._addSelfDialog) {

                this._addSelfDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "com.nhpc.zhrinsrtf8apprs1.fragments.AddSelfPopup",
                    controller: this
                }).then(function (oDialog) {

                    this.getView().addDependent(oDialog);
                    oDialog.addStyleClass("sapUiSizeCompact");

                    return oDialog;

                }.bind(this));
            }

            return this._addSelfDialog;
        },
        onManageSelfTableUpdateFinish: function (oEvent) {

            var oResourceBundle =
                this.getResourceBundle();

            var iCount =
                oEvent.getParameter("total");

            var sTitle =
                oResourceBundle.getText(
                    "ManageSelfTableTitle"
                ) + " (" + iCount + ")";

            this.byId("idSelfTableTitles")
                .setText(sTitle);

        },
        resetSelfPopupValidation: function () {

            var oViewModel = this.getModel("viewModel");

            oViewModel.setProperty("/selfPopupValidation", {

                NoOfSecuritiesheldState: "None",
                NoOfSecuritiesheldStateText: "",

                DPClientIDState: "None",
                DPClientIDStateText: ""

            });

        },
        validateSelfPopupFields: function () {

            var oViewModel = this.getModel("viewModel");
            var oSelfPopup = oViewModel.getProperty("/SelfPopup");

            var bValid = true;

            this.resetSelfPopupValidation();

            if (!oSelfPopup.NoOfSecuritiesheld) {

                bValid = false;

                oViewModel.setProperty("/selfPopupValidation/NoOfSecuritiesheldState", "Error");
                oViewModel.setProperty("/selfPopupValidation/NoOfSecuritiesheldStateText", this.getText("noOfSecuritiesMandatoryMsg"));
            }

            if (!oSelfPopup.DPClientID) {

                bValid = false;

                oViewModel.setProperty("/selfPopupValidation/DPClientIDState", "Error");
                oViewModel.setProperty("/selfPopupValidation/DPClientIDStateText", this.getText("dpClientIdMandatoryMsg"));
            }
            if (!bValid) {
                messenger.error(this.getText("mandatoryFieldErrorMsgForAll"));
                return false;
            }

            return true;
        },
        //preview
        onPreview: function () {

            if (!this._pPreviewDialog) {

                this._pPreviewDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "com.nhpc.zhrinsrtf8apprs1.fragments.Form8Preview",
                    controller: this
                }).then(function (oDialog) {

                    this.getView().addDependent(oDialog);

                    oDialog.addStyleClass("sapUiSizeCompact");

                    return oDialog;

                }.bind(this));
            }

            this._pPreviewDialog.then(function (oDialog) {
                oDialog.open();
            });
        },
        onPreviewClose: function () {

            this._pPreviewDialog.then(function (oDialog) {
                oDialog.close();
            });

        },


        //approval app
        onActionBtnPress: function () {
            var oView = this.getView();
            var oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/Header/RejectionRemarks", "");

            if (!this._oDecisionDialog) {
                this._oDecisionDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.nhpc.zhrinsrtf8apprs1.fragments.DecisionDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._oDecisionDialog.then(function (oDialog) {
                oDialog.open();
            });
        },
        onCommentLiveChange(oEvent) {
            if (oEvent.getParameter("value")) {
                this.byId("idSubmitDecisionBtn").setEnabled(true);
            } else {
                this.byId("idSubmitDecisionBtn").setEnabled(false);
            }
        },
        //  onDecisionDialogAfterOpen() {
        //     // this.byId("idComments").setValue("");
        //     var oViewModel = this.getModel("viewModel");
        //     oViewModel.setProperty("/Header/RejectionRemarks", "");
        // },
        handleActionPerfomedCancel: function () {
            this.byId("idDecisionDialog").close();
        },
        handleActionPerfomedConfirm: function () {
            this.handleActionPerfomedCancel();
            this._returnData();

            // messenger.confirm(
            //     this.getText("confirmationTitle"),
            //     this.getText("returnConfirmationMsg"),
            //     this.getText("yes"),
            //     this.getText("cancelBtn"),
            //     function () {
            //         this._returnData();
            //     }.bind(this)
            // );
        },
        _returnData: function () {

            var oViewModel = this.getModel("viewModel");
            var oModel = this.getModel();

            var oHeader = oViewModel.getProperty("/Header");
            // console.log("Return Header", oHeader);
            var aSelfDetails = oViewModel.getProperty("/SelfDetails") || [];
            var aRelativeDetails = oViewModel.getProperty("/RelativeDetails") || [];
            // var RejectionRemarks = oHeader.RejectionRemarks;
            // if(!RejectionRemarks){
            //     messenger.error( this.getText("rejectionRemarksMandatoryMsg") );
            //     return;
            // }

            var aSelfPayload = aSelfDetails.map(function (oItem) {

                return {
                    Pernr: oHeader.Pernr,
                    DPClientID: oItem.DPClientID,
                    NoOfSecuritiesheld: oItem.NoOfSecuritiesheld
                };

            });

            var aRelativePayload = aRelativeDetails.map(function (oItem) {

                var oPayloadItem = Object.assign({}, oItem, {
                    Pernr: oHeader.Pernr
                });

                delete oPayloadItem.SlNo;

                return oPayloadItem;

            });

            var oPayload = {

                Pernr: oHeader.Pernr,
                Status: "Returned",

                Institution: oHeader.Institution,
                PastEmployer: oHeader.PastEmployer,
                DateOfJoiningDP: oHeader.DateOfJoiningDP,
                RejectionRemarks: oHeader.RejectionRemarks,

                EmployeeName: oHeader.EmployeeName,
                LocationId: oHeader.LocationId,
                CreatedOn: oHeader.CreatedOn,
                ConfirmedOn: oHeader.ConfirmedOn,
                ApproverMailId: oHeader.ApproverMailId,
                Designation: oHeader.Designation,
                Department: oHeader.Department,
                Userid: oHeader.Userid,
                ApprovalFlag:'8',


                SELF_RECORDS: [],

                RELATIVE_RECORDS: []

            };
            if(oHeader.InternalID){
                oPayload.InternalID = oHeader.InternalID
            }

            // console.log("Return Payload", oPayload);

            BusyIndicator.show();

            oModel.create("/Form8HeadSet", oPayload, {

                success: function () {

                    BusyIndicator.hide();

                    messenger.success(
                        this.getText("returnSuccessMessage"),
                        function () {
                            this.onNavBack();
                        }.bind(this)
                    );

                }.bind(this),

                error: function (oError) {

                    BusyIndicator.hide();

                    if (oError.statusCode === "500") {

                        var xmlDoc = new DOMParser().parseFromString(
                            oError.responseText,
                            "application/xml"
                        );

                        messenger.error(
                            xmlDoc.getElementsByTagName("message")[0].textContent
                        );

                    } else {

                        messenger.error(
                            JSON.parse(oError.responseText).error.message.value
                        );
                    }

                }.bind(this)

            });

        },


    });
});


