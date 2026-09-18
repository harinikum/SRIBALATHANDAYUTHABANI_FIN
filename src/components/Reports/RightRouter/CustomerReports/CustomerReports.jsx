import React, { useEffect, useRef, useState } from "react";
import { customerReportsArr } from "./customerReportsArr";
import LabelAndInput from "../../../../common/Form/LabeAndSelect.jsx/LabelAndInput";
import Button from "../../../../common/Form/Buttton/Button";
import { apiFunction } from "../../../../Api/ApiFunction";
import { endPointURLs } from "../../../../Api/endPoints";
import LabelAndInputSugg from "../../../../common/Form/LabeAndSelect.jsx/LabelAndInputSugg";
import { exportToExcel } from "../../../../utils/Excel/execl_fun";

const CustomerReports = ({datas=[], setDatas=()=>{}, loading, setLoading}) => {
  const [agentList, setAgentsList] = useState([]);
  const [customerList, setcustomerList] = useState([]);

  const [isGenerated, setIsGenerated]  = useState(false);

  const [filters, setFilters] = useState(
    {
      offset : 0
    }
  )

  const [values, setValues] = useState({
    agent : "",
    customerName : "",
    customerId : "",
    agentId : "",
    noteId : ""
  })

  const debounceRef = useRef(null);

  const [totAmount, setTotAmount] = useState(0);
  const openFun = async()=>{
    setLoading(true);
    setValues({...values, agentId : localStorage.getItem('user_id_num'), agent : localStorage.getItem('user_name')});
    setDatas(
      [
        {
          "Due Date":'',
          "Amount":"",
          "Balance":"",
          "Date":"",
          "Collected By":""
        }
      ]
    )
    const res = await apiFunction(endPointURLs.getAgentNamesAndAreas,"POST");
    if(res.data.message == "success"){
      setAgentsList(res.data.data);
    }
    const res2 = await apiFunction(endPointURLs.getMembersNameId,"POST",{limit : 10});
    if(res.data.message == "success"){
      setcustomerList(res2.data.data);
    }
    setLoading(false);
  }

  useEffect(()=>{
    openFun()
  },[])

  // const onChangeHandler = async(e)=>{
  //   let name = e.target.name;
  //   let value = e.target.value;
  //   // console.log(value);
  //   // console.log(name);
    
  //   if(name == "agent"){
  //     // const res = await apiFunction(endPointURLs.getAgentNamesAndAreas,"POST",{limit : 10, search_term : value});
  //     // if(res.data.message == "success"){
  //       // setAgentsList(res.data.data);
  //       let isExists = agentList.find((val)=>val['name'].toLowerCase() == value.toLowerCase())
  //       if(isExists){
  //         setValues({...values, agent : value, agentId : isExists.id});
  //       }
  //       else{
  //         setValues({...values, agent : value, agentId : null})
  //       }
  //     // }
  //     // else{
  //     //   setValues({...values, agent : value, agentId : null})
  //     // }
  //   }
  //   else if(name == "customerName"){
  //     const res = await apiFunction(endPointURLs.getMembersNameId,"POST",{limit : 10, search_term : value});
  //     if(res.data.message == "success"){
  //       setcustomerList(res.data.data);
  //       let isExists = res.data.data.find((val)=>val['name'].toLowerCase() == value.toLowerCase())
  //       if(isExists){
  //         setValues({...values, customerName : value, customerId : isExists.id})
  //       }
  //       else{
  //         setValues({...values, customerName : value, customerId : null})
  //       }
  //     }
  //     else{
  //       setValues({...values, customerName : value, customerId : null})
  //     }
  //   }
  //   else if(e.target.name == "noteId"){
  //     const res = await apiFunction(endPointURLs.getOneMember,"POST",{id : value});
  //     console.log(res)
  //     if(res.data.message == "success"){
  //       // console.log({...values, customerName : res.data.data['customerName'],customerId : res.data.data.id })
  //       setValues({...values, customerName : res.data.data['Customer Name'],customerId : res.data.data.id, noteId : value })
  //     }
  //     else{
  //       setValues({...values, customerName : '',customerId : null})
  //     }
  //   }
  // }
  const onChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;
  
    setValues((prev) => ({ ...prev, [name]: value }));
  
    if (debounceRef.current) clearTimeout(debounceRef.current);
  
    debounceRef.current = setTimeout(async () => {
      if (name === "agent") {
        let isExists = agentList.find((val) => val['name'].toLowerCase() === value.toLowerCase());
        if (isExists) {
          setValues((prev) => ({ ...prev, agent: value, agentId: isExists.id }));
        } else {
          setValues((prev) => ({ ...prev, agent: value, agentId: null }));
        }
      }
  
      else if (name === "customerName") {
        const res = await apiFunction(endPointURLs.getMembersNameId, "POST", { limit: 10, search_term: value });
        if (res.data.message === "success") {
          setcustomerList(res.data.data);
          let isExists = res.data.data.find((val) => val['name'].toLowerCase() === value.toLowerCase());
          if (isExists) {
            setValues((prev) => ({ ...prev, customerName: value, customerId: isExists.id }));
          } else {
            setValues((prev) => ({ ...prev, customerName: value, customerId: null }));
          }
        } else {
          setValues((prev) => ({ ...prev, customerName: value, customerId: null }));
        }
      }
  
      else if (name === "noteId") {
        const res = await apiFunction(endPointURLs.getOneMember, "POST", { id: value });
        if (res.data.message === "success") {
          setValues((prev) => ({
            ...prev,
            customerName: res.data.data['Customer Name'],
            customerId: res.data.data.id,
            noteId: value,
          }));
        } else {
          // Fallback: Check if it's a finished EMI customer
          const finishedRes = await apiFunction(endPointURLs.getEmiFinishedMembers, "POST", { search_term: value });
          if (finishedRes.data.message === "success" && finishedRes.data.data && finishedRes.data.data.length > 0) {
            const exactMatch = finishedRes.data.data.find((m) => String(m["உ.எண்"]) === String(value));
            if (exactMatch) {
              setValues((prev) => ({
                ...prev,
                customerName: exactMatch['Customer Name'],
                customerId: exactMatch.id,
                noteId: value,
              }));
              return;
            }
          }
          setValues((prev) => ({ ...prev, customerName: '', customerId: null }));
        }
      }
    }, 400); // ⏳ debounce delay (ms)
  };

  const onGenerate = async()=>{
    setLoading(true);
    const res = await apiFunction(endPointURLs.customerWiseReports,"POST",{agent_id : values.agentId, customer_id : values.customerId, offset : values.filters})
    if(res.data.message == "success"){
      setDatas(res.data.data)
      setTotAmount(res.data.total);
      setIsGenerated(true);
    }
    setLoading(false);
  }

  const onOffSetChange = async(value)=>{
    if(value>=0){
      setLoading(true);
      const res = await apiFunction(endPointURLs.customerWiseReports,"POST",{agent_id : values.agentId, customer_id : values.customerId, offset : value})
      if(res.data.message == "success"){
        setDatas(res.data.data)
        setTotAmount(res.data.total);
        if(res.data.isNext){
          setFilters({...filters, offset : value})
        }
      }
      setLoading(false);
    }
  }
  return (
    <div className="wise-reports">
      <br />
      <div className="reports-heading">Customer Wise Reports</div>
      <br />
      <div className="customer-reports-inps">
        {/* {customerReportsArr.map((val, ind) => (
          <> */}
            <LabelAndInputSugg
              label={"Agent"}
              name={"agent"}
              listName={"Agent"}
              dataList={agentList}
              setDataList={setAgentsList}
              type={'text'}
              value={values.agent}
              onChangeHandler={onChangeHandler}
            />
            <br />
            <LabelAndInput
              value={values.customerName}
              label={"Customer Name"}
              name={"customerName"}
              dataList={customerList.map((val)=>val.name)}
              listName={"Customer"}
              type={'text'}
              onChangeHandler={onChangeHandler}
            />
            <br />
            <LabelAndInput
              value={values['noteId']}
              label={"உ.எண்"}
              name={"noteId"}
              dataList={[]}
              listName={"noteId"}
              type={'number'}
              onChangeHandler={onChangeHandler}
            />
            <br />
          {/* </>
        ))} */}
      </div>
      <br />
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div>
          <Button className={"primary-btn"} onClick={onGenerate}>Generate</Button>
        </div>
      </div>
      <br />
      <div>
        <LabelAndInput label={'Total Amount'} value={totAmount} disabled={true}/>
      </div>
      <br />
      <div style={{display:"flex",justifyContent:"center"}}>
        <Button onClick={()=>exportToExcel(datas)}>To Excel</Button>
      </div>
      <br />
      {
        isGenerated &&
        <div style={{display:"flex",justifyContent:"space-around",cursor:"pointer"}}>
          <div onClick={()=>onOffSetChange(filters.offset+1)}>{'<'}</div>
          <div onClick={()=>onOffSetChange(filters.offset-1)}>{'>'}</div>
        </div>
      }
    </div>
  );
};

export default CustomerReports;
