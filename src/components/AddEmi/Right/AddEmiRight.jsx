import React, { useEffect, useState } from 'react';
import TableContainer from '../../CommonTableContainer/TableContainer';
import { apiFunction } from '../../../Api/ApiFunction';
import BouncingDots from '../../../common/Loader/BouncingDots';
import { endPointURLs } from '../../../Api/endPoints';
import { getCredintials } from '../../../utils/locatStorage/getCerditials';

const AddEmiRight = ({ values = {}, setValues = () => {}, datas = [], setDatas = () => {}, hasMore, setHasMore = () => {} }) => {
  const [page, setPage] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchEmiAvailableMembers = async (agentName, baseFilters = {}) => {
    try {
      const cleanFilters = { ...baseFilters };
      delete cleanFilters.limit;
      delete cleanFilters.offset;

      const targetAgent = agentName || values.agent;
      const agentFilter = (targetAgent && targetAgent !== 'All') ? { agent_name: targetAgent } : {};

      // 1. Primary: fetch finished EMI members from backend API
      const res = await apiFunction(endPointURLs.getEmiFinishedMembers, 'POST', {
        ...cleanFilters,
        ...agentFilter,
        is_finished: 1
      });

      let membersList = (res?.data?.message === 'success' && Array.isArray(res?.data?.data)) ? [...res.data.data] : [];

      // 2. Fallback: If agentFilter was applied but returned no records, fetch all finished members
      if (membersList.length === 0 && targetAgent && targetAgent !== 'All') {
        const broadRes = await apiFunction(endPointURLs.getEmiFinishedMembers, 'POST', {
          ...cleanFilters,
          is_finished: 1
        });
        if (broadRes?.data?.message === 'success' && Array.isArray(broadRes?.data?.data)) {
          membersList = broadRes.data.data;
        }
      }

      setDatas(membersList);
      setHasMore(false);
      return membersList;
    } catch (err) {
      console.error('Error fetching EMI finished members:', err);
      setDatas([]);
      setHasMore(false);
      return [];
    }
  };

  const openFun = async () => {
    const creds = getCredintials();
    const isSuper = creds.isSuperAdmin === 'true' || creds.isSuperAdmin === '1' || creds.isSuperAdmin === 1 || creds.isSuperAdmin === true;

    let currentAgent = values.agent;
    if (!currentAgent) {
      if (isSuper) {
        currentAgent = 'All';
        setValues(prev => ({ ...prev, agentId: 0, agent: 'All' }));
      } else {
        const res = await apiFunction(endPointURLs.getParticularAgent, 'POST', { email_id: creds.email });
        if (res?.data?.message === 'success' && res?.data?.data?.length) {
          currentAgent = res.data.data[0]['Agent Name'];
          setValues(prev => ({ ...prev, agentId: res.data.data[0]['id'], agent: currentAgent }));
        } else {
          currentAgent = 'All';
        }
      }
    }
    await fetchEmiAvailableMembers(currentAgent);
    setLoaded(true);
  };

  useEffect(() => {
    openFun();
  }, []);

  const scrollFunction = async (filters = {}) => {
    let agentName = values.agent;
    if (!agentName) {
      const creds = getCredintials();
      const isSuper = creds.isSuperAdmin === 'true' || creds.isSuperAdmin === '1' || creds.isSuperAdmin === 1 || creds.isSuperAdmin === true;
      if (isSuper) {
        agentName = 'All';
      } else {
        const res = await apiFunction(endPointURLs.getParticularAgent, 'POST', { email_id: creds.email });
        if (res?.data?.message === 'success' && res?.data?.data?.length) {
          agentName = res.data.data[0]['Agent Name'];
        } else {
          agentName = 'All';
        }
      }
    }
    await fetchEmiAvailableMembers(agentName, filters);
    setLoaded(true);
    setTableLoading(false);
  };

  const onTableClick = async (row) => {
    setValues(prev => ({
      ...prev,
      id: row['id'],
      noteId: row['உ.எண்'] ?? row['note_id'] ?? '',
      agent: row['Agent Name'] ?? prev.agent ?? '',
      area: row['Area'] ?? '',
      customerName: row['Customer Name'] ?? '',
      contactNumber: row['Contact Number'] ?? '',
      place: row['Place'] ?? '',
      agentId: row['hideAgentId'] ?? row['agent_id'] ?? prev.agentId ?? '',
    }));
  };

  return (
    <div className='table-right' id='table-right-entry'>
      {loaded ? (
        <div className='table-conatainer-search'>
          <TableContainer
            selectedRow={values}
            setSelectedRow={setValues}
            scrollFunction={scrollFunction}
            page={page}
            setPage={setPage}
            loading={tableLoading}
            setLoading={setTableLoading}
            datas={datas}
            hasMore={hasMore}
            title='Emi Available Members'
            tableOnClick={onTableClick}
          />
        </div>
      ) : (
        <BouncingDots />
      )}
    </div>
  );
};

export default AddEmiRight;
