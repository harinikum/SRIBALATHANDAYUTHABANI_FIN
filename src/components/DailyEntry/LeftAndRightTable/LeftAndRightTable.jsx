import React, { useEffect, useState } from "react";
import DailyEntryLeft from "./Left/DailyEntryLeft";
import DailyEntryRight from "./Right/DailyEntryRight";
import { apiFunction } from "../../../Api/ApiFunction";
import { endPointURLs } from "../../../Api/endPoints";
import BouncingDots from "../../../common/Loader/BouncingDots";
import { getMonthSelection, insertPaymentsHandler } from "../functions";
import SnackbarAlert from "../../../common/Alert/SnackbarAlert/SnackBarAlert";
import { changeDateFormat, changeDateYYMMDD, getCurrentMonth, isValidDate } from "../../../utils/dateFunctions/dateFunctions";
import PopUpAlert from "../../../common/Alert/Popups/PopupAlert";
import { exportToExcel } from "../../../utils/Excel/execl_fun";
import { downloadPDF, generatePDFMonth } from "../../../utils/Pdf/pdfDownload";

const LeftAndRightTable = () => {
  const [datas, setDatas] = useState([]);
  const [orginallDatas, setorginallDatas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isConfirmSave, setIsConfirmSave] = useState(false);

  const [msg, setMsg] = useState("");
  const [isError, setisError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [values, setValues] = useState({
      agent : "",
      collectorName : "",
      agentId : null,
      collectorId : null,
      month : getCurrentMonth()
  });

  const openFun = async()=>{
    setLoading(true);
    let email = localStorage.getItem('user_id');
    let isSuper = getCredintials().isSuperAdmin;
    let agentId = 0;
    let month = null;
    let year = null;
    let currentM = getCurrentMonth();
    if(currentM){
        let yearAndMonth = currentM.split('-');
        year = yearAndMonth[0];
        month = yearAndMonth[1];
    }

    const getAgent = await apiFunction(endPointURLs.getParticularAgent,"POST",{email_id : email})
    if(getAgent?.data?.message == "success" && getAgent?.data?.data?.length > 0){
      agentId = getAgent.data.data[0]['id'];
      setValues({
        agent : getAgent.data.data[0]['Agent Name'],
        collectorName : getAgent.data.data[0]['Agent Name'],
        agentId : getAgent.data.data[0]['id'],
        collectorId : getAgent.data.data[0]['id'],
        month : currentM
      })
    } else if(isSuper == "true") {
      agentId = 0;
      setValues({
        agent : "All",
        collectorName : "All",
        agentId : 0,
        collectorId : 0,
        month : currentM
      })
    }

    const res = await apiFunction(endPointURLs.getPayments, "POST", {agent_id : agentId, month: month, year: year})
    if(res?.data?.message == "success"){
      const apiData = res?.data?.data || [];
      console.log("GET_PAYMENTS_RESPONSE:", apiData);
      console.log("API DATA LENGTH:", apiData.length);
      setDatas(apiData);
      setorginallDatas(apiData);
    }
    setLoading(false);
  }
  useEffect(()=>{
    openFun()
  },[])

  const onGetMonthSelection = async()=>{
    await getMonthSelection({values : values, setLoading : setLoading, tableDatas : datas, setTableDatas : setDatas, orginallDatas : orginallDatas, setorginallDatas : setorginallDatas})
  }

  const onCloseClick = ()=>{
    openFun();
  }

  const onPaymentRegister = async()=>{
    await insertPaymentsHandler({values : values, tableDatas : datas, setTableDatas : setDatas, orginallDatas : orginallDatas, setorginallDatas : setorginallDatas, setIsSuccess : setIsSuccess, setisError : setisError, setMsg : setMsg, setLoading : setLoading, setIsConfirmSave : setIsConfirmSave})
    // await onGetMonthSelection()
  }

  // const onSaClose = async()=>{
  //   let month = null;
  //   let year = null;
  //   if(values.month){
  //       let yearAndMonth = values.month.split('-');
  //       year = yearAndMonth[0]
  //       month = yearAndMonth[1]
  //   }
  //   const res = await apiFunction(endPointURLs.getPayments, "POST", {agent_id : values.agentId, month : month, year : year})
  //   if(res.data.message == "success"){
  //     setDatas(res.data.data);
  //     setorginallDatas(res.data.data);
  //     setLoading(false);
  //   }
  // }

  const onExportToExcel = ()=>{
    let tmpData = [];
    datas.forEach((val)=>{
      let tmpObj = {};
      Object.keys(val).forEach((key)=>{
        if(!key.includes('hide')){
          if(isValidDate(key)){
            tmpObj[changeDateYYMMDD(key)] = val[key]['date']
          }
          else if(key.includes('DATE')){
            tmpObj[key] = changeDateYYMMDD(val[key])
          }
          else{
            tmpObj[key] = val[key]
          }
        }
      })
      tmpData.push(tmpObj)
    });
    exportToExcel(tmpData)
  }

  const onPdfGenerate = ()=>{
    let agentName = values.agent;
    let modifiedDatas = [];
    datas.forEach((data)=>{
      let tempObj = {};
      Object.keys(data).forEach((key)=>{
        if(key!="Agent" && key!="AREA" && key!="Total Collection" && key!="Balance Amount" && key!="LAMT" && key!="DATE" && key!="END DATE")
          if(isValidDate(key)){
            tempObj[changeDateFormat(key)] = data[key]['date']
          }
          else{
            tempObj[key] = data[key]
          }
      })
      modifiedDatas = [...modifiedDatas,tempObj]
    })
    generatePDFMonth({data : modifiedDatas,name : `Agent Name : ${agentName}`})
  }
  
  return (
    <div className='daily-entry-comp'>
      {isSuccess && <SnackbarAlert open={isSuccess} setOpen={setIsSuccess} message={msg}/>}
      {isError && <SnackbarAlert open={isError} setOpen={setisError} severity="error" message={msg}/>}
      {isConfirmSave && <PopUpAlert open={isConfirmSave} setOpen={setIsConfirmSave} message="Are You Confirm to Save" okOnClick={onPaymentRegister}/> }
      {/* {
        !loading ? 
        <> */}
          <DailyEntryLeft onPdfGenerate={onPdfGenerate} onExportToExcel={onExportToExcel} setIsConfirmSave={setIsConfirmSave} loading={loading} setLoading={setLoading} onPaymentRegister={onPaymentRegister} onGetMonthSelection={onGetMonthSelection} values={values} setValues={setValues} onCloseClick={onCloseClick}/>
          <DailyEntryRight loading={loading} setLoading={setLoading} setMsg={setMsg} datas={datas} setDatas={setDatas} open={isSuccess} setOpen={setIsSuccess}/>
        {/* </>
         : <BouncingDots/> */}
      {/* } */}
    </div>
  );
};

export default LeftAndRightTable;