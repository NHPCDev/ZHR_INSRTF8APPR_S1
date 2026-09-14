sap.ui.define([
    "sap/ui/core/format/DateFormat"

], function (DateFormat) {
    "use strict";

    return {

        formatDate: function (sValue) {

            if (!sValue) {
                return "";
            }

            // YYYY-MM-DD
            if (typeof sValue === "string" && sValue.indexOf("-") > -1) {

                var aParts = sValue.split("-");

                return aParts[2] + "." +
                    aParts[1] + "." +
                    aParts[0];
            }

            // YYYYMMDD
            if (typeof sValue === "string" && sValue.length === 8) {

                return sValue.substring(6, 8) + "." +
                    sValue.substring(4, 6) + "." +
                    sValue.substring(0, 4);
            }

            // Date Object
            if (sValue instanceof Date) {

                var dd = String(sValue.getDate()).padStart(2, "0");
                var mm = String(sValue.getMonth() + 1).padStart(2, "0");
                var yyyy = sValue.getFullYear();

                return dd + "." + mm + "." + yyyy;
            }

            return sValue;
        },
        formatBlankValue: function (value) {
            if (!value) {
                return "-";
            } else {
                return value;
            }
        },

        formatAttachmentIcon: function (sMimeType) {

            if (!sMimeType) {
                return "sap-icon://document";
            }

            sMimeType = sMimeType.toLowerCase();

            if (sMimeType.indexOf("pdf") > -1) {
                return "sap-icon://pdf-attachment";
            }

            if (
                sMimeType.indexOf("jpg") > -1 ||
                sMimeType.indexOf("jpeg") > -1 ||
                sMimeType.indexOf("png") > -1 ||
                sMimeType.indexOf("image") > -1
            ) {
                return "sap-icon://attachment-photo";
            }

            return "sap-icon://document";
        },

        formatAmount: function (sValue) {
            if (!sValue) {
                return "";
            }
            var iRoundedValue = Math.ceil(parseFloat(sValue));
            return iRoundedValue.toString();
        },



        formatObjectPageTitle: function (sAppNo) {
            const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            const sText = oResourceBundle.getText("ObjectPageTitle")
            return sAppNo
                ? `${sText} - ${sAppNo}`
                : `Create ${sText}`;
        },

        formatStatusText: function (sStatus) {

            if (!sStatus) {
                return "";
            }

            switch (sStatus.toUpperCase()) {

                case "NEW":
                    return "New";

                case "DRAFT":
                    return "Draft";

                case "SAVED":
                    return "Saved";

                case "SUBMIT":
                case "SUBMITTED":
                    return "Submitted";

                case "CONFIRM":
                case "CONFIRMED":
                    return "Confirmed"

                case "APPROVE":
                case "APPROVED":
                    return "Approved"

                case "RETURN":
                case "RETURNED":
                    return "Returned"

                default:
                    return sStatus;
            }
        },

        formatStatusState: function (sStatus) {

            if (!sStatus) {
                return "None";
            }

            switch (sStatus.toUpperCase()) {

                case "NEW":
                case "CONFIRM":
                case "CONFIRMED":
                    return "Information";

                case "DRAFT":
                case "PENDING":
                    return "Warning";

                case "SUBMIT":
                case "SUBMITTED":
                case "APPROVE":
                case "APPROVED":
                    return "Success";

                case "REJECT":
                case "REJECTED":
                    return "Error";


                case "RETURN":
                case "RETURNED":
                    return "Warning";

                default:
                    return "Information";
            }
        },

        formatDateReverse: function (inputDate) {
            var parts = inputDate.split(".");
            var dateObject = new Date(parts[2], parts[1] - 1, parts[0]);
            var dateFormatter = DateFormat.getDateInstance({ pattern: "yyyyMMdd" });
            return dateFormatter.format(dateObject);
        },

        formatHistoryDateTime: function (oDate, oTime) {

            if (!oDate || !oTime) {
                return "";
            }

            var year = oDate.substring(0, 4);
            var month = oDate.substring(4, 6);
            var day = oDate.substring(6, 8);

            var sDate = day + "." + month + "." + year;

            var iHours = 0,
                iMinutes = 0,
                iSeconds = 0;

            if (typeof oTime === "string") {

                if (/^\d{6}$/.test(oTime)) {
                    iHours = parseInt(oTime.substring(0, 2), 10);
                    iMinutes = parseInt(oTime.substring(2, 4), 10);
                    iSeconds = parseInt(oTime.substring(4, 6), 10);
                }

                else {
                    var match = oTime.match(/PT(\d+)H(\d+)M(\d+)S/);

                    if (match) {
                        iHours = parseInt(match[1], 10);
                        iMinutes = parseInt(match[2], 10);
                        iSeconds = parseInt(match[3], 10);
                    }
                }
            }

            var sTime =
                String(iHours).padStart(2, "0") + ":" +
                String(iMinutes).padStart(2, "0") + ":" +
                String(iSeconds).padStart(2, "0");

            return sDate + " " + sTime;
        },
        formatTextWithBreaks: function (sText) {

            if (!sText) {
                return "";
            }

            return sText.replace(/\n/g, "<br/>");

        },
        formatUndertakingText: function (sText) {

            if (!sText) {
                return "";
            }

            return sText
                .replace(/\nb\)/g, "<br/><br/>b)");
        }

    };
});