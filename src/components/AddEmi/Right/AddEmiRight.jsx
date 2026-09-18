import React, { useEffect, useState } from 'react'
import TableContainer from '../../CommonTableContainer/TableContainer'
import { tableFectchApi } from '../../../utils/TableFunctions/tableFetchApi';
import { apiFunction } from '../../../Api/ApiFunction';
import BouncingDots from '../../../common/Loader/BouncingDots';
import { endPointURLs } from '../../../Api/endPoints';
import { getCredintials } from '../../../utils/locatStorage/getCerditials';

const AddEmiRight = ({values, setValues=()=>{}, datas, setDatas, hasMore, setHasMore}) => {
    const [ page, setPage] = useState(0);
    // const [hasMore, setHasMore] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    // const [searchInp, set]
  
    const openFun = async()=>{
      let currentAgent = values.agent;
      if(!currentAgent){
        const res = await apiFunction(endPointURLs.getParticularAgent,"POST",{email_id : getCredintials().email});
        if(res.data.message == "success" && res.data.data.length){
          currentAgent = res.data.data[0]['Agent Name'];
          setValues({...values, agentId : res.data.data[0]['id'], agent : currentAgent});
        } else if(getCredintials().isSuperAdmin == "true") {
          currentAgent = "All";
          setValues({...values, agentId : 0, agent : "All"});
        }
      }
      const filters = {
        "agent_name" : currentAgent || "All"
      }
      const res = await tableFectchApi( {data : datas, setData : setDatas, filters : {...filters, is_finished : 1}, setHasMore : setHasMore, URL : endPointURLs.getEmiFinishedMembers, method : "POST"});
      setLoaded(true);
    }
  
    useEffect(()=>{
      openFun();
    },[])
  
    const scrollFunction = async(filters={})=>{
      let agentName = values.agent;
      if(!agentName){
        const res = await apiFunction(endPointURLs.getParticularAgent,"POST",{email_id : getCredintials().email});
        if(res.data.message == "success" && res.data.data.length){
          agentName = res.data.data[0]['Agent Name'];
        } else if(getCredintials().isSuperAdmin == "true") {
          agentName = "All";
        }
      }
      const cleanFilters = { ...filters };
      delete cleanFilters.limit;
      delete cleanFilters.offset;
      await tableFectchApi({data : datas, setData:setDatas , filters : {...cleanFilters, agent_name : values.agent || agentName || "All", is_finished : 1}, setHasMore : setHasMore,URL : endPointURLs.getEmiFinishedMembers, method : "POST"})
      setLoaded(true);
      setTableLoading(false);
    }
  
    const onTableClick = async(row)=>{
      console.log(row)
      setValues({
        id : row['id'],
        agent : row['Agent Name'],
        area : row["Area"],
        customerName : row["Customer Name"],
        contactNumber : row["Contact Number"],
        place : row["Place"],
        agentId : row['hideAgentId'],
      });
    //   const afterApi = await apiFunction(endPointURLs.getAfterMembers,"POST",{agent_id : row['hideAgentId']});
    //       if(afterApi.data.message == "success"){
    //         setCustDetailArrState(custDetailArrState.map((val)=>val.name == "addAfter" ? {...val,dataList : afterApi.data.data.map((val)=>val['Customer Name'])} : val));
    //         setAfterMembers(afterApi.data.data);
    //       }
    //   setButtons(buttons.map((btns)=>(btns.name != "Add New" ? {...btns,isDisable : false} : {...btns, isDisable : true})));
      
    }
  return (
    <div className='table-right' id='table-right-entry'>
    {
      loaded ?
      <div className="table-conatainer-search">
      {/* <NormalTable/> */}
      <TableContainer selectedRow={values} setSelectedRow={setValues}  scrollFunction={scrollFunction}  page={page} setPage={setPage} loading={tableLoading} setLoading={setTableLoading} datas={datas} hasMore={hasMore} title='Emi Available Members' tableOnClick={onTableClick}/>
    </div> : <BouncingDots/>
    }
  </div>
  )
}

export default AddEmiRight