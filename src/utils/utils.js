import md5 from 'md5';
import { error } from './error';
import store from '../store';


const privatekey = 'B3iYKkRHlmUanQGaNMIJziWOkNN9dECQQD';
const url = 'https://onepayhk.com/api/upnotice/callback';
const pkgurl = 'https://onepayhk.com/api/upnotice/pkg';



export const getSign = (params, key = privatekey) => {
    const sortedParams = Object.fromEntries(Object.entries(params).sort());
    let str = '';
    for (let [paramKey, paramValue] of Object.entries(sortedParams)) {
        str += encodeURIComponent(paramKey) + '=' + encodeURIComponent(paramValue) + '&';
    }
    str += 'key=' + key;

    str = decodeURIComponent(str);
    // console.log(str)

    const res = md5(str).toUpperCase(); // Assuming you have an md5 hashing function
    // console.log(res)
    return res;
}

/**
 * 
 * @returns 
 */
export const getPkgList = async () => {
    try {
        let req = { time: getnow(true) };
        req.sign = getSign(req, privatekey);
        const res = await uni.request({
            url: pkgurl,
            method: 'POST',
            dataType: 'json',
            data: req,
            sslVerify: false,
        });

        return res.data; // 返回请求响应的数据
    } catch (error) {
        throw error; // 抛出错误以供上层处理
    }
}

/**
 * 推送订单
 * @returns 
 */
export const pushorder = async (data) => {
    let text = '';
	let colorType = null;
    text += getnow() + ' ***********************' + '\n'
    text += getnow()+'['+'开始推送]:'+'\n'
    text += getnow()+'['+'请求内容]:'+JSON.stringify(data)+'\n'

    try {
        const req = {
            url: url,
            method: 'POST',
            dataType: 'json',
            data: data,
            sslVerify: false,
        }
        // console.log(data)
        const res = await uni.request(req);
        console.log(res)

        if (res) {
            if (res.data.code == 0) {
                text += getnow()+'['+'推送结果]:true'+'\n'
                text += getnow()+'['+'返回内容]:'+JSON.stringify(res.data)+'}'+'\n'
            } else {
                text += getnow()+'['+'推送结果]:false'+'\n'
                text += getnow()+'['+'返回内容]:'+JSON.stringify(res.data)+'}'+'\n'
				if(res.data.code == 4001){
					colorType = 1;
				}
                // throw error;
            }
        } else {
            throw error[405];
        }
        text += getnow()+' ***********************'+'\n'
        //显示页面log
        modifyList(text,true,colorType)
        return res.data; // 返回请求响应的数据
    } catch (error) {
        throw error; // 抛出错误以供上层处理
    }
}

//根据不同的银行解析内容
export const analyze = (pkglist) => {
    //从vuex中去取msg
    const params = store.state.msg;
    if(params == null){ throw error[404] }

    let { content, pkg } = params;
    // console.log(pkg)
    content = content.replace(/\n/g, "\\n").trim();
    
    // console.log(pkg)
    // console.log(pkglist.data)
    if(pkglist.data == undefined){ throw error[407] }
    //先匹配出来
    const matchingPkg = pkglist.data.find(item => item.pkg === pkg);
    // console.log(matchingPkg)
    if (!matchingPkg || matchingPkg == undefined) {
        //抛出异常，匹配失败
        // throw '未找到匹配的包';
        throw error[401];

        // return false;
    }
    // console.log(matchingPkg)

    const regex = matchingPkg.regex; //确定引用的正则
    let amount;

    try {
        amount = matchAmount(content, regex);
    } catch (e) {
        throw e
    }
    // console.log(amount)
    let cond = {
        time:getnow(true),
        amount:amount,
        pkg:pkg,
        content:content
    };
    cond.sign = getSign(cond, privatekey);
    // console.log(cond)
    //发起推送请求
    let res;
    try {
        res = pushorder(cond);
    } catch (e) {
        throw e
    }

    return res;
}

//vuex修改list
export function modifyList(content,err = false,colorType = null) {
    const list = store.state.list;
    let msg = content;
	// console.log(content)
    if (err == false) { 
        msg = cardmsg(content)
    }
	
	let color = null;
	if(colorType == 1){
		color = 'red';
	}
    
    // console.log(list)
    let listcard = {
        content: msg,
		textColor: color
    }
    //追加内容显示在页面
    store.commit('updateList', [...list, listcard]);
}

//err卡片化
export function cardmsg(msg) {
    const content = store.state.msg;
    let text = '';
    text += getnow() + ' ***********************' + '\n'
    text += getnow()+'['+'开始推送]:'+'\n'
    text += getnow()+'['+'请求内容]:'+JSON.stringify(content)+'\n'

    text += getnow()+'['+'推送结果]:false'+'\n'
    text += getnow() + '[' + '异常记录]:' + msg + '}' + '\n'
    
    text += getnow()+' ***********************'+'\n'
    return text
}

//金额匹配
export const matchAmount = (content, regexString) => {
    let regex;
    try {
        regex = new RegExp(regexString);
    } catch (e) {
        //规则错误
        throw error[403];
    }
    // console.log(regex)
    
    const match = content.match(regex);
    
    if (match) {
        return match[1];
    } else {
        //未找到金额
        throw error[402];
    }
}

//构建推送log内容
export const getnow = (issign = false) => {
    let d = new Date()
    let year = d.getFullYear()
    let month = d.getMonth() + 1
    let day = d.getDate()
    let hour = d.getHours()
    let minute = d.getMinutes()
    let second = d.getSeconds()
    
    if(month < 10){
        month = '0'+month
    }
    if(day < 10){
        day = '0'+day
    }
    if(hour < 10){
        hour = '0'+hour
    }
    if(minute < 10){
        minute = '0'+minute
    }
    if(second < 10){
        second = '0'+second
    }
    
    let now = year+"-"+month+"-"+day+" "+hour+":"+minute+":"+second
    if(issign == false){
        now = '['+now+']'
    }
    
    return now
}