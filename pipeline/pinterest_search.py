import json,sys,urllib.parse,urllib.request,os
q=sys.argv[1]
data={"options":{"applied_unified_filters":None,"article":"","auto_correction_disabled":False,"corpus":None,"customized_rerank_type":None,"filters":None,"query":q,"query_pin_sigs":None,"redux_normalize_feed":True,"rs":"typed","scope":"pins","source_id":None,"page_size":60},"context":{}}
src="/search/pins/?q="+urllib.parse.quote(q)+"&rs=typed"
url="https://www.pinterest.com/resource/BaseSearchResource/get/?"+urllib.parse.urlencode({"source_url":src,"data":json.dumps(data)})
req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36","Accept":"application/json, text/javascript, */*; q=0.01","X-Requested-With":"XMLHttpRequest","X-Pinterest-PWS-Handler":"www/search/[scope].js","X-Pinterest-Source-Url":src,"Referer":"https://www.pinterest.com"+src})
r=urllib.request.urlopen(req,timeout=30).read()
j=json.loads(r)
res=j.get("resource_response",{}).get("data",{}).get("results",[])
out=[]
for x in res:
    im=(x.get("images") or {}).get("474x") or (x.get("images") or {}).get("orig")
    if im: out.append({"id":x.get("id"),"title":(x.get("grid_title") or x.get("title") or "")[:80],"img":im["url"],"saves":(x.get("aggregated_pin_data") or {}).get("aggregated_stats",{}).get("saves",0)})
print(json.dumps(out))
