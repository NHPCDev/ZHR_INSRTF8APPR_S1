sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    function (JSONModel, Device) {
        "use strict";

        return {
            /**
             * Provides runtime information for the device the UI5 app is running on as a JSONModel.
             * @returns {sap.ui.model.json.JSONModel} The device model.
             */
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },
            createViewModel: function () {

                var oData = {
                    "filterData": {
                        "empId": "",
                        "Year": "",
                        "Status": "",
                    },

                    mode: "",
                    Header: {

                        Pernr: "",
                        EmployeeName: "",
                        LocationId: "",
                        CreatedOn: "",
                        ConfirmedOn: "",
                        ApprovedOn: "",
                        RejectedOn: "",
                        Status: "",
                        Institution: "",
                        PastEmployer: "",
                        HeaderText: "",
                        UndertakingText: "",
                        RejectionRemarks: ""

                    },
                    RelativeDetails: [],
                    EmpDetails:{},

                    RelativePopup: {
                        RelativeType: "",
                        RelativeNo: "",
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
                        MaterialFinancialRelationship: "Yes",
                        NameOfFinancialGuide: "",
                        PhoneNoOfFinancialGuide: "",
                        PanOfOfFinancialGuide: "",
                        NoOfSecuritiesheld: "",
                        DPClientID: ""

                    },
                    popupMode: "Create",
                    selectedRelativeIndex: -1,
                    validation: {

                        DateOfJoiningDPState: "None",
                        DateOfJoiningDPStateText: "",

                        InstitutionState: "None",
                        InstitutionStateText: "",

                        PastEmployerState: "None",
                        PastEmployerStateText: ""

                    },
                    relativePopupUI: {
                        OthersEditable: false,
                        RelationOfImmediateRelativeEditable: false,
                        PhoneNoOfImmediateRelativeEditable: true,
                        PanOfImmediateRelativeEditable: true,
                        FinancialGuideEditable: false
                    },
                    relativePopupValidation: {

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
                    },



                    SelfDetails: [],
                    SelfPopup: {
                        SelfNo: "",
                        NoOfSecuritiesheld: "",
                        DPClientID: "",
                        createdOn: ""
                    },

                    selectedSelfIndex: -1,
                    selfPopupMode: "Create",
                    selfPopupValidation: {

                        NoOfSecuritiesheldState: "None",
                        NoOfSecuritiesheldStateText: "",

                        DPClientIDState: "None",
                        DPClientIDStateText: ""

                    },
                    CurrentDate: new Date(),

                    FormTitle: "FORM VIII",
                    SubTitle: "INITIAL DISCLOSURE OF SECURITIES HOLDINGS BY DESIGNATED PERSONS AND THEIR IMMEDIATE RELATIVES",
                    HeaderTexts: "I, Designated Person of NHPC Ltd., furnish below the details of initial holding of Securities of NHPC Ltd.",






                }
                var oModel = new JSONModel(oData);
                return oModel;
            },
        };

    });