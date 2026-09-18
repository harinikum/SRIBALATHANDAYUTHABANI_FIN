import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import BouncingDots from "../../../common/Loader/BouncingDots";
import NewEntryTable from "../../../common/Table/NewEntryTable";
import Button from "../../../common/Form/Buttton/Button";
import { getCurrentDate } from "../../../utils/dateFunctions/dateFunctions";
import { apiFunction } from "../../../Api/ApiFunction";
import { endPointURLs } from "../../../Api/endPoints";
import SnackbarAlert from "../../../common/Alert/SnackbarAlert/SnackBarAlert";


const NewEntryRight = ({ values, setValues, date, setDate, datas, setDatas }) => {
  const [isPopUp, setIsPopUp] = useState(false);
  const [isErr, setIsErr] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const openFun = async () => {
    console.log("***** openFun called *****");
    const res = await apiFunction(endPointURLs.getNewEntryPayments, "POST", {
      date: localStorage.getItem('new_entry_date'),
    });
    console.log("***** API response *****", res.data);
    // console.log(res);
    if (res.data.message == "success") {
      // Compute next S.No based on fetched data
      const dataArray = res.data.data || [];
      // Retrieve persisted rows (if any) from localStorage
      let persistedRows = [];
      try {
        const stored = localStorage.getItem('new_entry_datas');
        if (stored) persistedRows = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse persisted entries', e);
      }
      // Create a clean empty row matching the data structure
      const emptyRow = {};
      const sourceArray = dataArray.length > 0 ? dataArray : persistedRows;
      if (sourceArray.length > 0) {
        Object.keys(sourceArray[0]).forEach(key => {
          if (key === "payment_method") {
            emptyRow[key] = "cash";
          } else {
            emptyRow[key] = "";
          }
        });
      } else {
        emptyRow["payment_method"] = "cash";
      }
      const finalData = [...sourceArray, emptyRow];
      console.log("***** finalData *****", finalData);
      // setDatas(finalData);
      setDatas(sourceArray);
      console.log("***** setDatas(finalData) executed *****");
      setDate(localStorage.getItem('new_entry_date'));
      setValues({ ...values, name: "", loan: "", date: localStorage.getItem('new_entry_date') });
    }
  };

  // Load data on component mount and when route changes
  const location = useLocation();
  useEffect(() => {
    openFun();
  }, [location.pathname]);



  const onSubmitHandler = async (e) => {
    e.preventDefault();
    // console.log(datas);
    // let filtered = datas.filter((val)=>(!val.hideIsNotEdit && (val['உ.எண்'] != "" && val['ரசீது தொகை']!='')));
    // console.log(filtered);
    let filtered = [];
    let duppCheck = [];
    let isDupp = false;
    datas.forEach((val) => {
      if (val["உ.எண்"] != "") {
        filtered.push(val);
      }
      if (duppCheck.includes(Number(val["உ.எண்"]))) {
        isDupp = true;
      } else {
        duppCheck.push(Number(val["உ.எண்"]));
      }
    });
    if (isDupp) {
      alert("Duplicate values not allowed");
      return;
    }
    // console.log(duppCheck);
    // console.log(isDupp);
    if (filtered.length > 0) {
      let errs = filtered.find(
        (val) => {
          console.log(val)
          return (val.hideIsNotACust ||
            !val["உ.எண்"] ||
            val["உ.எண்"] == 0 ||
            val["ரசீது தொகை"] == "")
        });
      if (!errs) {
        setLoading(true)
        // Debug logs for payment method and payload
        console.log('Selected Payment Method:', values.payment_method);
        const payload = {
          agent_id: localStorage.getItem("user_id_num"),
          date: date,
          payments: filtered
        };
        console.log(
  "Submitting Payments",
  JSON.parse(JSON.stringify(filtered))
);
        console.log('Payload:', payload);
        const res = await apiFunction(
          endPointURLs.insertAndUpdatePayments,
          "POST",
          payload
        );
        // console.log(res);
        if (res.data.message == "success") {
          // Show success feedback and refresh data from server
          setIsPopUp(true);
          setMsg("Successfully Registered");
          await openFun();
          // Append a new empty row for next entry
          // setDatas(prev => {
          //   const emptyRow = {};
          //   if (prev.length > 0) {
          //     Object.keys(prev[0]).forEach(key => {
          //       if (key === "payment_method") {
          //         emptyRow[key] = "cash";
          //       } else {
          //         emptyRow[key] = "";
          //       }
          //     });
          //   } else {
          //     emptyRow["payment_method"] = "cash";
          //   }
          //   return [...prev, emptyRow];
          // });
        } else {
          if (res.data.message == "Some Inserted Not All") {
            openFun();
          }
          setIsErr(true);
          setMsg(res.data.message);
        }
        setLoading(false)
        console.log(filtered)
      } else {
        alert("Properly Give Datas");
      }
    } else {
      alert("Give Proper Datas 95");
    }
  };
  const onOverallOk = async () => {
    const res = await apiFunction(endPointURLs.insert_not_gived, "POST", {
      date: date,
    });
    console.log(res);
  };

  return (
    <div className="table-right" id="table-right-entry">
      {/* {
        loaded ? */}
      {/* <form onSubmit={onSubmitHandler}> */}
      {isPopUp && (
        <SnackbarAlert open={isPopUp} setOpen={setIsPopUp} message={msg} />
      )}
      {isErr && (
        <SnackbarAlert
          open={isErr}
          setOpen={setIsErr}
          message={msg}
          severity="error"
        />
      )}
      <div className="new-entry-container">
        <NewEntryTable
          date={date}
          tableDatas={datas}
          setTableDatas={setDatas}
          values={values}
          setValues={setValues}
        />
      </div>
      <div
        style={{ display: "flex", justifyContent: "end", paddingTop: "10px", alignItems: "center", gap: "20px" }}
      >
        <Button
          onClick={onSubmitHandler}
          type="submit"
          className={"pop-cancel-btn"}
          disabled={loading}
        >
          Submit
        </Button>
      </div>
      {/* </form> */}
      {/* : <BouncingDots/>
      } */}
    </div>
  );
};

export default NewEntryRight;