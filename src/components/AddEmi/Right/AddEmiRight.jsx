import React, { useEffect, useState } from 'react'
import TableContainer from '../../CommonTableContainer/TableContainer'
import { apiFunction } from '../../../Api/ApiFunction';
import BouncingDots from '../../../common/Loader/BouncingDots';
import { endPointURLs } from '../../../Api/endPoints';
import { getCredintials } from '../../../utils/locatStorage/getCerditials';

const AddEmiRight = ({values, setValues=()=>{}, datas, setDatas, hasMore, setHasMore}) => {
    const [ page, setPage] = useState(0);
    const [tableLoading, setTableLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const parseBal = (val) => {
      if (val === null || val === undefined || val === '') return 1;
      if (typeof val === 'number') return val;
      const cleaned = String(val).replace(/,/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? 1 : num;
    };

    const fetchEmiAvailableMembers = async (agentName, baseFilters = {}) => {
      const cleanFilters = { ...baseFilters };
      delete cleanFilters.limit;
      delete cleanFilters.offset;
      const targetAgent = agentName || values.agent;
      const isSuper = getCredintials().isSuperAdmin === "true";
      const agentFilter = (targetAgent && targetAgent !== "All") ? { agent_name: targetAgent } : {};

      // 1. Primary: getEmiFinishedMembers (backend API)
      const res = await apiFunction(endPointURLs.getEmiFinishedMembers, "POST", {
        ...cleanFilters,
        ...agentFilter,
        is_finished: 1
      });
      let membersList = (res?.data?.message === "success" && Array.isArray(res?.data?.data)) ? [...res.data.data] : [];

      // 2. Secondary/Fallback: getMembers to capture any 0-balance members
      try {
        const allRes = await apiFunction(endPointURLs.getMembers, "POST", {
          ...cleanFilters,
          ...agentFilter,
          limit: 500,
          offset: 0
        });
        if (allRes?.data?.message === "success" && Array.isArray(allRes?.data?.data)) {
          const zeroBalMembers = allRes.data.data.filter(m => {
            const bal = parseBal(m["Balance Amount"] ?? m.balance_amount ?? m.Balance);
            return bal <= 0;
          });

          zeroBalMembers.forEach(zm => {
            const exists = membersList.some(item => 
              (item.id && zm.id && String(item.id) === String(zm.id)) ||
              (item['உ.எண்'] && zm['உ.எண்'] && String(item['உ.எண்']) === String(zm['உ.எண்']))
            );
            if (!exists) {
              membersList.push({
                id: zm.id,
                'உ.எண்': zm['உ.எண்'] ?? zm.note_id,
                'Customer Name': zm['Customer Name'] ?? zm.name,
                'Contact Number': zm['Contact Number'] ?? zm.contact_no,
                'Place': zm['Place'] ?? zm.place,
                'Agent Name': zm['Agent Name'] ?? zm.agent_name,
                'Area': zm['Area'] ?? zm.area,
                'hideAgentId': zm.hideAgentId ?? zm.agentId ?? zm.agent_id,
                'hideEmiID': zm.hideEmiID ?? zm.emiID ?? zm.emi_id
              });
            }
          });
        }
      } catch (e) {
        console.error("Fallback member fetch error:", e);
      }

      // 3. Fallback: If agentFilter was used and yielded nothing, fetch without agentFilter and filter client-side
      if (membersList.length === 0 && targetAgent && targetAgent !== "All") {
        try {
          const broadRes = await apiFunction(endPointURLs.getMembers, "POST", {
            ...cleanFilters,
            limit: 500,
            offset: 0
          });
          if (broadRes?.data?.message === "success" && Array.isArray(broadRes?.data?.data)) {
            const agentLower = targetAgent.toLowerCase();
            const zeroBalMembers = broadRes.data.data.filter(m => {
              const mAgent = (m['Agent Name'] ?? m.agent_name ?? '').toLowerCase();
              if (mAgent && !mAgent.includes(agentLower) && !agentLower.includes(mAgent)) return false;
              const bal = parseBal(m["Balance Amount"] ?? m.balance_amount ?? m.Balance);
              return bal <= 0;
            });

            zeroBalMembers.forEach(zm => {
              membersList.push({
                id: zm.id,
                'உ.எண்': zm['உ.எண்'] ?? zm.note_id,
                'Customer Name': zm['Customer Name'] ?? zm.name,
                'Contact Number': zm['Contact Number'] ?? zm.contact_no,
                'Place': zm['Place'] ?? zm.place,
                'Agent Name': zm['Agent Name'] ?? zm.agent_name,
                'Area': zm['Area'] ?? zm.area,
                'hideAgentId': zm.hideAgentId ?? zm.agentId ?? zm.agent_id,
                'hideEmiID': zm.hideEmiID ?? zm.emiID ?? zm.emi_id
              });
            });
          }
        } catch (e) {
          console.error("Broad fallback error:", e);
        }
      }

      setDatas(membersList);
      setHasMore(false);
      return membersList;
    };
  
    const openFun = async()=>{
      let currentAgent = values.agent;
      if(!currentAgent){
        const res = await apiFunction(endPointURLs.getParticularAgent,"POST",{email_id : getCredintials().email});
        if(res.data.message == "success" && res.data.data.length){
          currentAgent = res.data.data[0]['Agent Name'];
          setValues(prev => ({...prev, agentId : res.data.data[0]['id'], agent : currentAgent}));
        } else if(getCredintials().isSuperAdmin == "true") {
          currentAgent = "All";
          setValues(prev => ({...prev, agentId : 0, agent : "All"}));
        }
      }
      await fetchEmiAvailableMembers(currentAgent);
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
      await fetchEmiAvailableMembers(agentName, filters);
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
    }
  return (
    <div className='table-right' id='table-right-entry'>
    {
      loaded ?
      <div className="table-conatainer-search">
      <TableContainer selectedRow={values} setSelectedRow={setValues}  scrollFunction={scrollFunction}  page={page} setPage={setPage} loading={tableLoading} setLoading={setTableLoading} datas={datas} hasMore={hasMore} title='Emi Available Members' tableOnClick={onTableClick}/>
    </div> : <BouncingDots/>
    }
  </div>
  )
}

export default AddEmiRight
