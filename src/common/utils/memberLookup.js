// src/common/utils/memberLookup.js

import { apiFunction } from "../../Api/ApiFunction";
import { endPointURLs } from "../../Api/endPoints";

/**
 * Lookup a member by ID (used by table row click) and update table and form state.
 * Mirrors the logic in NewEntryTable's debouncedFetchMember (id based).
 */
export const memberLookupById = async (
  rowIndex,
  memberId,
  setTableDatas,
  setValues,
  currentValues
) => {
  if (!memberId) return;
  try {
    // Debug logs for row click lookup
    console.log("ROW INDEX:", rowIndex, "MEMBER ID:", memberId);
    const res = await apiFunction(endPointURLs.getOneMember, "POST", { id: memberId });
    console.log("API RESPONSE:", res);
    if (res?.data?.message === "success") {
      console.log("VALUES BEFORE:", currentValues);
      let currentPm = "cash";
      setTableDatas((prev) => {
        const updated = [...prev];
        updated[rowIndex]["hideIsNotACust"] = false;
        updated[rowIndex]["ரசீது தொகை"] = res.data.data.emi_amount;
        updated[rowIndex]["hideMemberId"] = res.data.data.id;
          updated[rowIndex]["hideMemberName"] = res.data.data["Customer Name"];
          updated[rowIndex]["hideMemberPlace"] = res.data.data.place;
          // Additional hidden fields mirroring NewEntryLeft logic
          updated[rowIndex]["hideLoanAmount"] = res.data.data["Loan Amount"];
          updated[rowIndex]["hideBalanceAmount"] = res.data.data["Balance Amount"];
          updated[rowIndex]["hideEmiID"] = res.data.data["emi_id"];
          updated[rowIndex]["ரசீது தொகை"] = res.data.data.emi_amount;
        return updated;
      });
      const updatedValues = {
        ...currentValues,
        activeIndex: rowIndex,
        loan: res.data.data["Balance Amount"],
        name: res.data.data["Customer Name"],
        date: localStorage.getItem("new_entry_date"),
        place: res.data.data.place,
        payment_method: currentPm,
      };
      console.log("VALUES AFTER:", updatedValues);
      setValues(updatedValues);
    } else {
      console.log("VALUES BEFORE (failure):", currentValues);
      setTableDatas((prev) => {
        const updated = [...prev];
        updated[rowIndex]["hideIsNotACust"] = true;
        updated[rowIndex]["hideMemberId"] = "";
        updated[rowIndex]["ரசீது தொகை"] = "";
        updated[rowIndex]["hideMemberName"] = "";
        updated[rowIndex]["hideMemberPlace"] = "";
        updated[rowIndex]["payment_method"] = "cash";
        return updated;
      });
      const clearedValues = {
        ...currentValues,
        activeIndex: rowIndex,
        loan: "",
        name: "",
        date: localStorage.getItem("new_entry_date"),
        place: "",
        payment_method: "cash",
      };
      console.log("VALUES AFTER (failure):", clearedValues);
      setValues(clearedValues);
    }
    return;
  } catch (e) {
    console.error("memberLookupById error", e);
  }
};

/**
 * Lookup a member by name (and optional emi_amount) – mirrors NewEntryLeft logic.
 */
export const memberLookupByName = async (
  rowIndex,
  name,
  emiAmount,
  setTableDatas,
  setValues,
  currentValues
) => {
  if (!name) return;
  try {
    const payload = { name };
    if (emiAmount) payload.emi_amount = emiAmount;
    const res = await apiFunction(endPointURLs.getOneMember, "POST", payload);
    if (res?.data?.message === "success") {
      let currentPm = "cash";
      setTableDatas((prev) => {
        const updated = [...prev];
        updated[rowIndex]["hideIsNotACust"] = false;
        updated[rowIndex]["ரசீது தொகை"] = res.data.data.emi_amount;
        updated[rowIndex]["hideMemberId"] = res.data.data.id;
        updated[rowIndex]["hideMemberName"] = res.data.data["Customer Name"];
        updated[rowIndex]["hideMemberPlace"] = res.data.data.place;
        currentPm = updated[rowIndex]["payment_method"] || "cash";
        return updated;
      });
      setValues({
        ...currentValues,
        activeIndex: rowIndex,
        loan: res.data.data["Balance Amount"],
        name: res.data.data["Customer Name"],
        date: localStorage.getItem("new_entry_date"),
        place: res.data.data.place,
        payment_method: currentPm,
      });
    } else {
      setTableDatas((prev) => {
        const updated = [...prev];
        updated[rowIndex]["hideIsNotACust"] = true;
        updated[rowIndex]["hideMemberId"] = "";
        updated[rowIndex]["ரசீது தொகை"] = "";
        updated[rowIndex]["hideMemberName"] = "";
        updated[rowIndex]["hideMemberPlace"] = "";
        return updated;
      });
      setValues({
        ...currentValues,
        activeIndex: rowIndex,
        loan: "",
        name: "",
        date: localStorage.getItem("new_entry_date"),
        place: "",
        payment_method: "cash",
      });
    }
  } catch (e) {
    console.error("memberLookupByName error", e);
  }
};
