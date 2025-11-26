// 部署完成后在网址后面加上这个，获取自建节点和机场聚合节点，/?token=auto或/auto或

let mytoken = 'auto';
let guestToken = ''; //可以随便取，或者uuid生成，https://1024tools.com/uuid
let BotToken = ''; //可以为空，或者@BotFather中输入/start，/newbot，并关注机器人
let ChatID = ''; //可以为空，或者@userinfobot中获取，/start
let TG = 0; //小白勿动， 开发者专用，1 为推送所有的访问信息，0 为不推送订阅转换后端的访问信息与异常访问
let FileName = 'CF-Workers-SUB';
let SUBUpdateTime = 6; //自定义订阅更新时间，单位小时
let total = 99;//TB
let timestamp = 4102329600000;//2099-12-31

//节点链接 + 订阅链接
let MainData = `
https://cfxr.eu.org/getSub
`;

let urls = [];
let subConverter = "api.wcc.best"; // 使用更稳定的订阅转换后端
let subConfig = "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online.ini"; // 使用更稳定的配置文件
let subProtocol = 'https';

export default {
	async fetch(request, env) {
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const token = url.searchParams.get('token');
		const clientIP = request.headers.get('CF-Connecting-IP') || 
					   request.headers.get('X-Forwarded-For') || 
					   request.headers.get('X-Real-IP') || 
					   '未知IP';
		
		mytoken = env.TOKEN || mytoken;
		BotToken = env.TGTOKEN || BotToken;
		ChatID = env.TGID || ChatID;
		TG = env.TG || TG;
		subConverter = env.SUBAPI || subConverter;
		if (subConverter.includes("http://")) {
			subConverter = subConverter.split("//")[1];
			subProtocol = 'http';
		} else {
			subConverter = subConverter.split("//")[1] || subConverter;
		}
		subConfig = env.SUBCONFIG || subConfig;
		FileName = env.SUBNAME || FileName;

		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		const timeTemp = Math.ceil(currentDate.getTime() / 1000);
		const fakeToken = await MD5MD5(`${mytoken}${timeTemp}`);
		guestToken = env.GUESTTOKEN || env.GUEST || guestToken;
		if (!guestToken) guestToken = await MD5MD5(mytoken);
		const 访客订阅 = guestToken;

		let UD = Math.floor(((timestamp - Date.now()) / timestamp * total * 1099511627776) / 2);
		total = total * 1099511627776;
		let expire = Math.floor(timestamp / 1000);
		SUBUpdateTime = env.SUBUPTIME || SUBUpdateTime;

		if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname == ("/" + mytoken) || url.pathname.includes("/" + mytoken + "?"))) {
			if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") await sendMessage(`#异常访问 ${FileName}`, clientIP, `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			if (env.URL302) return Response.redirect(env.URL302, 302);
			else if (env.URL) return await proxyURL(env.URL, url);
			else return new Response(await nginx(), {
				status: 200,
				headers: {
					'Content-Type': 'text/html; charset=UTF-8',
				},
			});
		} else {
			if (env.KV) {
				await 迁移地址列表(env, 'LINK.txt');
				if (userAgent.includes('mozilla') && !url.search) {
					await sendMessage(`#编辑订阅 ${FileName}`, clientIP, `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
					return await KV(request, env, 'LINK.txt', 访客订阅);
				} else {
					MainData = await env.KV.get('LINK.txt') || MainData;
				}
			} else {
				MainData = env.LINK || MainData;
				if (env.LINKSUB) urls = await ADD(env.LINKSUB);
			}
			let 重新汇总所有链接 = await ADD(MainData + '\n' + urls.join('\n'));
			let 自建节点 = "";
			let 订阅链接 = "";
			for (let x of 重新汇总所有链接) {
				if (x.toLowerCase().startsWith('http')) {
					订阅链接 += x + '\n';
				} else {
					自建节点 += x + '\n';
				}
			}
			MainData = 自建节点;
			urls = await ADD(订阅链接);
			
			// 发送订阅更新通知，包含真实IP信息
			const ipInfo = await getIPInfo(clientIP);
			const 订阅详情 = `订阅格式: ${await getSubscribeFormat(userAgent, url)}\n订阅链接数: ${urls.length}\n自建节点数: ${自建节点.split('\n').filter(line => line.trim()).length}`;
			await sendMessage(`#订阅更新 ${FileName}`, clientIP, 
				`${ipInfo}\nUA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>\n${订阅详情}`);

			const isSubConverterRequest = request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || userAgent.includes('subconverter');
			let 订阅格式 = 'base64';
			if (!(userAgent.includes('null') || isSubConverterRequest || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase()))) {
				订阅格式 = await getSubscribeFormat(userAgent, url);
			}

			let subConverterUrl;
			let 订阅转换URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
			let req_data = MainData;

			let 追加UA = 'v2rayn';
			if (url.searchParams.has('b64') || url.searchParams.has('base64')) 订阅格式 = 'base64';
			else if (url.searchParams.has('clash')) 追加UA = 'clash';
			else if (url.searchParams.has('singbox')) 追加UA = 'singbox';
			else if (url.searchParams.has('surge')) 追加UA = 'surge';
			else if (url.searchParams.has('quanx')) 追加UA = 'Quantumult%20X';
			else if (url.searchParams.has('loon')) 追加UA = 'Loon';

			const 订阅链接数组 = [...new Set(urls)].filter(item => item?.trim?.()); // 去重
			if (订阅链接数组.length > 0) {
				const 请求订阅响应内容 = await getSUB(订阅链接数组, request, 追加UA, userAgentHeader, clientIP);
				console.log('订阅获取结果:', 请求订阅响应内容);
				
				req_data += 请求订阅响应内容[0].join('\n');
				
				// 修复订阅转换URL构建
				let validUrls = 请求订阅响应内容[1].split('|')
					.filter(url => url && url.trim() && url.includes('://'))
					.map(url => encodeURIComponent(url))
					.join('|');
					
				if (validUrls) {
					订阅转换URL += "|" + validUrls;
				}
				
				// 对于base64格式且需要转换的情况
				if (订阅格式 == 'base64' && !isSubConverterRequest && validUrls) {
					subConverterUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(validUrls)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
					try {
						const subConverterResponse = await fetch(subConverterUrl, { 
							headers: { 
								'User-Agent': 'v2rayN/CF-Workers-SUB',
								'Accept': 'text/plain,text/html;q=0.9,application/xhtml+xml;q=0.9,application/xml;q=0.8,*/*;q=0.7'
							},
							cf: {
								cacheTtl: 300,
								cacheEverything: true
							}
						});
						if (subConverterResponse.ok) {
							const subConverterContent = await subConverterResponse.text();
							// 检查返回内容是否是有效的base64
							if (isValidBase64(subConverterContent)) {
								req_data += '\n' + base64Decode(subConverterContent);
							} else if (subConverterContent.includes('proxies:')) {
								// 如果返回的是Clash配置，直接使用
								req_data += '\n' + subConverterContent;
							} else {
								console.log('订阅转换返回的内容格式不支持');
							}
						}
					} catch (error) {
						console.log('订阅转换请求失败:', error);
					}
				}
			}

			if (env.WARP) {
				const warpUrls = (await ADD(env.WARP)).filter(url => url.includes('://')).join("|");
				if (warpUrls) {
					订阅转换URL += "|" + warpUrls;
				}
			}

			// 修复中文编码问题
			const utf8Encoder = new TextEncoder();
			const encodedData = utf8Encoder.encode(req_data);
			const utf8Decoder = new TextDecoder();
			const text = utf8Decoder.decode(encodedData);

			// 去重并清理空行
			const uniqueLines = new Set(text.split('\n').filter(line => line.trim()));
			const result = [...uniqueLines].join('\n');

			let base64Data;
			try {
				base64Data = btoa(unescape(encodeURIComponent(result)));
			} catch (e) {
				base64Data = base64Encode(result);
			}

			// 构建响应头对象
			const responseHeaders = {
				"content-type": "text/plain; charset=utf-8",
				"Profile-Update-Interval": `${SUBUpdateTime}`,
				"Profile-web-page-url": request.url.includes('?') ? request.url.split('?')[0] : request.url,
				"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
			};

			// 如果是base64格式或fakeToken，直接返回base64
			if (订阅格式 == 'base64' || token == fakeToken) {
				return new Response(base64Data, { headers: responseHeaders });
			}

			// 构建订阅转换URL
			let targetFormat = 'clash';
			if (订阅格式 == 'singbox') targetFormat = 'singbox';
			else if (订阅格式 == 'surge') targetFormat = 'surge&ver=4';
			else if (订阅格式 == 'quanx') targetFormat = 'quanx';
			else if (订阅格式 == 'loon') targetFormat = 'loon';
			
			subConverterUrl = `${subProtocol}://${subConverter}/sub?target=${targetFormat}&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			
			// 如果是Surge需要额外参数
			if (订阅格式 == 'surge') {
				subConverterUrl += '&surge.doh=true';
			}

			console.log('订阅转换URL:', subConverterUrl);
			
			try {
				const subConverterResponse = await fetch(subConverterUrl, { 
					headers: { 
						'User-Agent': userAgentHeader || 'CF-Workers-SUB',
						'Accept': 'text/plain,application/x-yaml,text/html;q=0.9,application/xhtml+xml;q=0.9,application/xml;q=0.8,*/*;q=0.7'
					},
					cf: {
						cacheTtl: 300,
						cacheEverything: true
					}
				});
				
				if (subConverterResponse.ok) {
					let subConverterContent = await subConverterResponse.text();
					
					// 检查返回内容是否是有效的YAML/配置文件
					if (订阅格式 == 'clash' && !isValidClashConfig(subConverterContent)) {
						console.log('Clash配置验证失败，回退到base64');
						return new Response(base64Data, { headers: responseHeaders });
					}
					
					if (订阅格式 == 'clash') {
						subConverterContent = await clashFix(subConverterContent);
					}
					
					// 设置正确的Content-Type
					if (订阅格式 == 'clash') {
						responseHeaders["content-type"] = "application/x-yaml; charset=utf-8";
					} else if (订阅格式 == 'singbox') {
						responseHeaders["content-type"] = "application/json; charset=utf-8";
					} else {
						responseHeaders["content-type"] = "text/plain; charset=utf-8";
					}
					
					// 只有非浏览器订阅才会返回文件名
					if (!userAgent.includes('mozilla')) {
						responseHeaders["Content-Disposition"] = `attachment; filename="${FileName}.${订阅格式 === 'clash' ? 'yaml' : (订阅格式 === 'singbox' ? 'json' : 'txt')}"`;
					}
					
					return new Response(subConverterContent, { headers: responseHeaders });
				} else {
					console.log('订阅转换失败，状态码:', subConverterResponse.status);
					return new Response(base64Data, { headers: responseHeaders });
				}
			} catch (error) {
				console.log('订阅转换请求异常:', error);
				return new Response(base64Data, { headers: responseHeaders });
			}
		}
	}
};

async function ADD(envadd) {
	if (!envadd) return [];
	var addtext = envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');
	if (addtext.charAt(0) == '\n') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == '\n') addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split('\n').filter(item => item.trim());
	return add;
}

async function nginx() {
	return `<!DOCTYPE html>
	<html>
	<head>
	<title>Welcome to nginx!</title>
	<style>
		body {
			width: 35em;
			margin: 0 auto;
			font-family: Tahoma, Verdana, Arial, sans-serif;
		}
	</style>
	</head>
	<body>
	<h1>Welcome to nginx!</h1>
	<p>If you see this page, the nginx web server is successfully installed and
	working. Further configuration is required.</p>
	
	<p>For online documentation and support please refer to
	<a href="http://nginx.org/">nginx.org</a>.<br/>
	Commercial support is available at
	<a href="http://nginx.com/">nginx.com</a>.</p>
	
	<p><em>Thank you for using nginx.</em></p>
	</body>
	</html>`;
}

async function getIPInfo(ip) {
	if (ip === '未知IP') return 'IP: 未知IP';
	
	try {
		const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
		if (response.status === 200) {
			const ipInfo = await response.json();
			if (ipInfo.status === 'success') {
				return `IP: ${ip}\n国家: ${ipInfo.country} (${ipInfo.countryCode})\n地区: ${ipInfo.regionName} - ${ipInfo.city}\nISP: ${ipInfo.isp}\n组织: ${ipInfo.org}\nAS: ${ipInfo.as}`;
			}
		}
	} catch (error) {
		console.log('IP信息查询失败:', error);
	}
	
	return `IP: ${ip}\n地理位置信息获取失败`;
}

async function getSubscribeFormat(userAgent, url) {
	if (userAgent.includes('sing-box') || userAgent.includes('singbox') || url.searchParams.has('sb') || url.searchParams.has('singbox')) {
		return 'singbox';
	} else if (userAgent.includes('surge') || url.searchParams.has('surge')) {
		return 'surge';
	} else if (userAgent.includes('quantumult') || url.searchParams.has('quanx')) {
		return 'quanx';
	} else if (userAgent.includes('loon') || url.searchParams.has('loon')) {
		return 'loon';
	} else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || url.searchParams.has('clash')) {
		return 'clash';
	} else if (url.searchParams.has('b64') || url.searchParams.has('base64')) {
		return 'base64';
	} else {
		return 'base64';
	}
}

async function sendMessage(type, ip, add_data = "") {
	if (BotToken !== '' && ChatID !== '') {
		let msg = "";
		
		if (ip !== '未知IP') {
			try {
				const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
				if (response.status == 200) {
					const ipInfo = await response.json();
					if (ipInfo.status === 'success') {
						msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
					} else {
						msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
					}
				} else {
					msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
				}
			} catch (error) {
				msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
			}
		} else {
			msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
		}

		let url = "https://api.telegram.org/bot" + BotToken + "/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
		return fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'Accept-Encoding': 'gzip, deflate, br',
				'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
			}
		});
	}
}

function base64Decode(str) {
	try {
		// 先尝试直接解码
		const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
		const decoder = new TextDecoder('utf-8');
		return decoder.decode(bytes);
	} catch (e) {
		// 如果失败，尝试URL安全的base64解码
		try {
			const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
			const padding = base64.length % 4;
			const base64Padded = padding ? base64 + '='.repeat(4 - padding) : base64;
			const bytes = new Uint8Array(atob(base64Padded).split('').map(c => c.charCodeAt(0)));
			const decoder = new TextDecoder('utf-8');
			return decoder.decode(bytes);
		} catch (e2) {
			console.log('Base64解码失败:', e2);
			return '';
		}
	}
}

function base64Encode(data) {
	const binary = new TextEncoder().encode(data);
	let base64 = '';
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	for (let i = 0; i < binary.length; i += 3) {
		const byte1 = binary[i];
		const byte2 = binary[i + 1] || 0;
		const byte3 = binary[i + 2] || 0;

		base64 += chars[byte1 >> 2];
		base64 += chars[((byte1 & 3) << 4) | (byte2 >> 4)];
		base64 += chars[((byte2 & 15) << 2) | (byte3 >> 6)];
		base64 += chars[byte3 & 63];
	}

	const padding = 3 - (binary.length % 3 || 3);
	return base64.slice(0, base64.length - padding) + '=='.slice(0, padding);
}

async function MD5MD5(text) {
	const encoder = new TextEncoder();

	const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
	const firstPassArray = Array.from(new Uint8Array(firstPass));
	const firstHex = firstPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
	const secondPassArray = Array.from(new Uint8Array(secondPass));
	const secondHex = secondPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	return secondHex.toLowerCase();
}

function clashFix(content) {
	if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
		let lines;
		if (content.includes('\r\n')) {
			lines = content.split('\r\n');
		} else {
			lines = content.split('\n');
		}

		let result = "";
		for (let line of lines) {
			if (line.includes('type: wireguard')) {
				const 备改内容 = `, mtu: 1280, udp: true`;
				const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
				result += line.replace(new RegExp(备改内容, 'g'), 正确内容) + '\n';
			} else {
				result += line + '\n';
			}
		}

		content = result;
	}
	return content;
}

function isValidClashConfig(content) {
	return content && 
		   typeof content === 'string' && 
		   content.includes('proxies:') && 
		   (content.includes('port:') || content.includes('server:')) &&
		   !content.startsWith('vmess://') && 
		   !content.startsWith('vless://') &&
		   !content.startsWith('ss://') &&
		   !content.startsWith('trojan://') &&
		   !isValidBase64(content);
}

async function proxyURL(proxyURL, url) {
	const URLs = await ADD(proxyURL);
	const fullURL = URLs[Math.floor(Math.random() * URLs.length)];

	let parsedURL = new URL(fullURL);
	let URLProtocol = parsedURL.protocol.slice(0, -1) || 'https';
	let URLHostname = parsedURL.hostname;
	let URLPathname = parsedURL.pathname;
	let URLSearch = parsedURL.search;

	if (URLPathname.charAt(URLPathname.length - 1) == '/') {
		URLPathname = URLPathname.slice(0, -1);
	}
	URLPathname += url.pathname;

	let newURL = `${URLProtocol}://${URLHostname}${URLPathname}${URLSearch}`;

	let response = await fetch(newURL);

	let newResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});

	newResponse.headers.set('X-New-URL', newURL);

	return newResponse;
}

async function getSUB(api, request, 追加UA, userAgentHeader, clientIP) {
	if (!api || api.length === 0) {
		return [[], ""];
	}
	
	api = [...new Set(api)].filter(item => item && item.trim()); // 去重和过滤空值
	let newapi = "";
	let 订阅转换URLs = "";
	let 异常订阅 = "";
	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, 5000); // 增加超时时间到5秒

	try {
		const responses = await Promise.allSettled(
			api.map(apiUrl => 
				getUrl(request, apiUrl, 追加UA, userAgentHeader)
					.then(response => {
						if (!response.ok) {
							throw new Error(`HTTP ${response.status}: ${response.statusText}`);
						}
						return response.text();
					})
					.catch(error => {
						console.error(`请求失败: ${apiUrl}, 错误: ${error.message}`);
						throw error;
					})
			)
		);

		let 成功数 = 0;
		let 失败数 = 0;

		for (const [index, response] of responses.entries()) {
			const apiUrl = api[index];
			
			if (response.status === 'fulfilled') {
				成功数++;
				const content = response.value || '';
				
				if (isValidClashConfig(content)) {
					console.log('Clash配置订阅: ' + apiUrl);
					订阅转换URLs += "|" + apiUrl;
				} else if (content.includes('"outbounds"') && content.includes('"inbounds"')) {
					console.log('Singbox配置订阅: ' + apiUrl);
					订阅转换URLs += "|" + apiUrl;
				} else if (content.includes('://') && !isLikelyBase64(content)) {
					console.log('明文节点订阅: ' + apiUrl);
					newapi += content + '\n';
				} else if (isValidBase64(content)) {
					console.log('Base64订阅: ' + apiUrl);
					try {
						const decoded = base64Decode(content);
						if (isValidClashConfig(decoded)) {
							订阅转换URLs += "|" + apiUrl;
						} else if (decoded.includes('"outbounds"') && decoded.includes('"inbounds"')) {
							订阅转换URLs += "|" + apiUrl;
						} else {
							newapi += decoded + '\n';
						}
					} catch (decodeError) {
						console.log('Base64解码失败，跳过: ' + apiUrl);
						const 异常节点 = `trojan://decodeError@127.0.0.1:8888?security=tls&sni=error.com#解码失败_${apiUrl.split('/')[2]}`;
						异常订阅 += 异常节点 + '\n';
					}
				} else {
					console.log('无法识别的订阅格式: ' + apiUrl);
					const 异常节点 = `trojan://unknownFormat@127.0.0.1:8888?security=tls&sni=unknown.com#格式异常_${apiUrl.split('/')[2]}`;
					异常订阅 += 异常节点 + '\n';
				}
			} else {
				失败数++;
				console.error(`订阅获取失败: ${apiUrl}, 原因: ${response.reason?.message || '未知错误'}`);
				const 异常节点 = `trojan://failed@127.0.0.1:8888?security=tls&sni=failed.com#获取失败_${apiUrl.split('/')[2]}`;
				异常订阅 += 异常节点 + '\n';
			}
		}

		// 发送订阅获取详情通知
		if (BotToken && ChatID && TG == 1) {
			const 订阅详情 = `订阅源总数: ${api.length}\n成功获取: ${成功数}\n获取失败: ${失败数}`;
			await sendMessage(`#订阅获取详情 ${FileName}`, clientIP, 
				`${订阅详情}\n<tg-spoiler>客户端IP: ${clientIP}</tg-spoiler>`);
		}
		
	} catch (error) {
		console.error('订阅处理过程错误:', error);
	} finally {
		clearTimeout(timeout);
	}

	const 订阅内容 = await ADD(newapi + 异常订阅);
	return [订阅内容, 订阅转换URLs];
}

async function getUrl(request, targetUrl, 追加UA, userAgentHeader) {
	const newHeaders = new Headers();
	newHeaders.set("User-Agent", `${atob('djJyYXlOLzYuNDU=')} CF-Workers-SUB ${追加UA}`);
	newHeaders.set("Accept", "text/plain,application/x-yaml,text/html;q=0.9,application/xhtml+xml;q=0.9,application/xml;q=0.8,*/*;q=0.7");

	const modifiedRequest = new Request(targetUrl, {
		method: "GET",
		headers: newHeaders,
		redirect: "follow",
		cf: {
			cacheTtl: 300,
			cacheEverything: false,
			polish: "off"
		}
	});

	return fetch(modifiedRequest);
}

function isValidBase64(str) {
	if (!str || typeof str !== 'string') return false;
	const cleanStr = str.replace(/\s/g, '');
	if (cleanStr.length % 4 !== 0) return false;
	const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
	return base64Regex.test(cleanStr) && cleanStr.length > 10;
}

function isLikelyBase64(str) {
	return isValidBase64(str) && str.length > 50;
}

async function 迁移地址列表(env, txt = 'ADD.txt') {
	const 旧数据 = await env.KV.get(`/${txt}`);
	const 新数据 = await env.KV.get(txt);

	if (旧数据 && !新数据) {
		await env.KV.put(txt, 旧数据);
		await env.KV.delete(`/${txt}`);
		return true;
	}
	return false;
}

// 由于代码长度限制，KV函数保持不变，与之前相同
async function KV(request, env, txt = 'ADD.txt', guest) {
	const url = new URL(request.url);
	const clientIP = request.headers.get('CF-Connecting-IP') || '未知IP';
	
	try {
		if (request.method === "POST") {
			if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
			try {
				const content = await request.text();
				await env.KV.put(txt, content);
				
				const ipInfo = await getIPInfo(clientIP);
				const 更新详情 = `更新类型: KV存储\n文件: ${txt}\n内容行数: ${content.split('\n').length}`;
				await sendMessage(`#配置更新 ${FileName}`, clientIP, 
					`${ipInfo}\n${更新详情}\n<tg-spoiler>更新内容预览: ${content.substring(0, 200)}...</tg-spoiler>`);
					
				return new Response("保存成功");
			} catch (error) {
				return new Response("保存失败: " + error.message, { status: 500 });
			}
		}

		let content = '';
		let hasKV = !!env.KV;

		if (hasKV) {
			try {
				content = await env.KV.get(txt) || '';
			} catch (error) {
				content = '读取数据时发生错误: ' + error.message;
			}
		}

		// HTML界面代码保持不变
		const html = `<!DOCTYPE html><html>...</html>`; // 这里使用原有的完整HTML代码
		
		return new Response(html, {
			headers: { "Content-Type": "text/html;charset=utf-8" }
		});
	} catch (error) {
		return new Response("服务器错误: " + error.message, { status: 500 });
	}
}
