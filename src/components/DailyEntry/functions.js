import { apiFunction } from "../../Api/ApiFunction";
import { endPointURLs } from "../../Api/endPoints";
import { getCurrentMonth } from "../../utils/dateFunctions/dateFunctions";
import { getCredintials } from "../../utils/locatStorage/getCerditials";

export const filterActiveMembers = (data) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    // Identify total row (either DATE === 'Total' or the last row with no member name/note_id)
    const totalRow = data.find(item => item?.DATE === 'Total' || item?.DATE === 'total') 
        || (data.length > 0 && !data[data.length - 1]?.['CNAME'] && !data[data.length - 1]?.['உ.எண்'] && !data[data.length - 1]?.['hideMemberId'] ? data[data.length - 1] : null);
    
    const parseBal = (val) => {
        if (val === null || val === undefined || val === '') return 0;
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/,/g, '').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    };

    const activeRows = data.filter((item) => {
        if (item === totalRow || item?.DATE === 'Total' || item?.DATE === 'total') return false;
        
        const balance = parseBal(item['Balance Amount'] ?? item.balance_amount ?? item.Balance);
        const isFinished = Number(item.hideIsFinished ?? item.is_finished ?? 0);
        
        // Exclude customer if balance is 0 or less, or flagged finished
        if (balance <= 0 || isFinished === 1) {
            return false;
        }
        return true;
    });

    if (totalRow) {
        const dateKeys = Object.keys(totalRow).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k));
        const updatedTotalRow = { ...totalRow };
        
        dateKeys.forEach(dateKey => {
            let dayTotal = 0;
            activeRows.forEach(row => {
                const cellVal = row[dateKey];
                const amt = typeof cellVal === 'object' ? Number(cellVal?.date || 0) : Number(cellVal || 0);
                dayTotal += amt;
            });
            updatedTotalRow[dateKey] = {
                ...(typeof totalRow[dateKey] === 'object' ? totalRow[dateKey] : {}),
                date: dayTotal
            };
        });

        let totalBalance = 0;
        let totalCollection = 0;
        activeRows.forEach(row => {
            totalBalance += parseBal(row['Balance Amount'] || 0);
            totalCollection += parseBal(row['Total Collection'] || 0);
        });
        updatedTotalRow['Balance Amount'] = totalBalance;
        updatedTotalRow['Total Collection'] = totalCollection;

        return [...activeRows, updatedTotalRow];
    }

    return activeRows;
};

export const getMonthSelection = async({values={}, setValues=()=>{}, setLoading=()=>{}, setMsg=()=>{}, setIsSuccess=()=>{}, setisError=()=>{}, tableDatas=[], setTableDatas = ()=>{}, orginallDatas=[], setorginallDatas=()=>{}})=>{
    setLoading(true);
    let month = null;
    let year = null;
    if(values.month){
        let yearAndMonth = values.month.split('-');
        year = yearAndMonth[0];
        month = yearAndMonth[1];
    }
    
    const payload = {
        month: month,
        year: year
    };
    if (values.agentId && values.agentId !== 0 && values.agentId !== "0" && values.agent !== "All") {
        payload.agent_id = values.agentId;
    }
    if (values.collectorId && values.collectorId !== 0 && values.collectorId !== "0" && values.collectorName !== "All") {
        payload.collector_id = values.collectorId;
    }

    const onGenerate = await apiFunction(
        endPointURLs.getPayments,
        "POST",
        payload
    );

    if(onGenerate?.data?.message == "success"){
        let data = onGenerate?.data?.data || [];
        const filtered = filterActiveMembers(data);
        console.log("GET_PAYMENTS_RESPONSE (FILTERED):", filtered);
        setTableDatas(filtered);
        setorginallDatas(filtered);
    }
    
    setLoading(false);
}

export const insertPaymentsHandler = async({values={}, setValues=()=>{}, setLoading=()=>{}, setMsg=()=>{}, setIsSuccess=()=>{}, setisError=()=>{}, tableDatas=[], setTableDatas = ()=>{}, orginallDatas=[], setorginallDatas=()=>{}, setIsConfirmSave = ()=>{}})=>{
    if(values.agentId){
        const keys = Object.keys(values);
        let isEmpty = keys.find((val)=>values[val]=='')
        if(isEmpty){
            alert('Fill All Values')
            setLoading(false)
            return;
        }
        setLoading(true);
        let changedInputs = [];
        let collecterId = values.collectorId;

        const changedDate = new Date();
        let formattedChangedDate = changedDate.toISOString().split('T')[0];

        if(tableDatas[0] && tableDatas[0]['hideLastPayDate']){
            const nxtDate = new Date(tableDatas[0]['hideLastPayDate']);
            nxtDate.setDate(nxtDate.getDate() + 1); // Add one day
            formattedChangedDate = nxtDate.toISOString().split('T')[0];
        }

        let isChanged = tableDatas.find((val)=>val[formattedChangedDate] && (val[formattedChangedDate]['date'] != 0 || val[formattedChangedDate]['date'] != ""));

        if(isChanged){
            tableDatas.forEach((val,ind)=>{
                if(ind != tableDatas.length-1){
                    if(values.collectorId && values.collectorId !== 0 && values.collectorId !== "0"){
                        changedInputs.push(
                            {
                                emi_id : val['hideEmiId'],
                                agent_id : val['hideAgentId'],
                                member_id : val['hideMemberId'],
                                collector_id : collecterId ? collecterId : val['hideAgentId'],
                                amount : val[formattedChangedDate] ? val[formattedChangedDate]['date'] : 0,
                                is_not_paid : (!val[formattedChangedDate] || !val[formattedChangedDate]['date'] || val[formattedChangedDate]['date'] == 0) ? 1 : 0,
                                date : formattedChangedDate
                            }
                        )
                    }
                    else{
                        changedInputs.push(
                            {
                                emi_id : val['hideEmiId'],
                                agent_id : val['hideAgentId'],
                                member_id : val['hideMemberId'],
                                collector_id : collecterId ? collecterId : val['hideAgentId'],
                                amount : val[formattedChangedDate] ? val[formattedChangedDate]['date'] : 0,
                                is_not_paid : (!val[formattedChangedDate] || !val[formattedChangedDate]['date'] || val[formattedChangedDate]['date'] == 0) ? 1 : 0,
                                date : formattedChangedDate
                            }
                        )
                    }
                }
            })
            // console.log(changedInputs);
            
            const res = await apiFunction(endPointURLs.insertPayments,"POST",changedInputs);
            if(res.data.message == "Successfull"){
                setIsSuccess(true);
                setIsConfirmSave(false);
            }
            else{
                setisError(true);
                setIsConfirmSave(false);
            }
            setMsg(res.data.message);
            let email = localStorage.getItem('user_id');

            let month = null;
            let year = null;
            if(values.month){
                let yearAndMonth = values.month.split('-');
                year = yearAndMonth[0]
                month = yearAndMonth[1]
            }
            const res1 = await apiFunction(endPointURLs.getPayments, "POST", {agent_id : values.agentId, month : month, year : year})
            if(res1.data.message == "success"){
                const filtered = filterActiveMembers(res1.data.data);
                setTableDatas(filtered);
                setorginallDatas(filtered);
            }
        }
        else{
            setisError(true)
            setMsg("Check All Fields Once");
            setIsConfirmSave(false);
        }
        setLoading(false);
    }
    else{
        alert("Select All Details")
    }
}
